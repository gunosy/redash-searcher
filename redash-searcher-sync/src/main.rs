use std::str::FromStr;

use anyhow::{Context, Error};
use chrono::Duration;
use opensearch::http::transport::{SingleNodeConnectionPool, TransportBuilder};
use opensearch::OpenSearch;
use redash_searcher_sync::app::App;
use redash_searcher_sync::configs::Configs;
use redash_searcher_sync::redash::DefaultRedashClient;
use tracing::Level;

async fn ping_opensearch(
    client: &OpenSearch,
    max_retry_count: i8,
    ping_interval: Duration,
) -> Result<(), Error> {
    let mut retry_count = 0;
    loop {
        let ping_result = client.ping().send().await;
        match ping_result {
            Ok(_) => {
                return Ok(());
            }
            Err(err) => {
                retry_count += 1;
                if retry_count == max_retry_count {
                    return Err(err).context("ping opensearch");
                }
                tracing::warn!(
                    err = err.to_string(),
                    "failed to ping opensearch, retrying..."
                );
                tokio::time::sleep(ping_interval.to_std().unwrap()).await;
            }
        }
    }
}

#[tokio::main]
async fn main() {
    let config = &Configs::load_configs().unwrap();
    tracing_subscriber::fmt()
        .with_max_level(Level::from_str(&config.log_level).unwrap())
        .with_level(true)
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .json()
        .init();
    let redash_client =
        Box::new(DefaultRedashClient::new(&config.redash.url, &config.redash.api_key).unwrap());
    let conn_pool = SingleNodeConnectionPool::new((&config.open_search.url).parse().unwrap());
    let mut builder = TransportBuilder::new(conn_pool);
    if config.open_search.username.is_some() && config.open_search.password.is_some() {
        builder = builder.auth(opensearch::auth::Credentials::Basic(
            config.open_search.username.clone().unwrap(),
            config.open_search.password.clone().unwrap(),
        ));
    }
    let transport = builder.build().expect("failed to build transport");
    let client = OpenSearch::new(transport);
    ping_opensearch(
        &client,
        config.open_search.max_retry_count_on_ping,
        config.open_search.ping_interval,
    )
    .await
    .unwrap();

    let app = App::new(redash_client, client);
    app.create_redash_index_if_not_exists().await.unwrap();
    loop {
        tracing::info!("start sync");
        _ = app.sync().await.map_err(|err| {
            tracing::error!(err = err.to_string(), "failed to sync");
        });
        tokio::time::sleep(std::time::Duration::from_secs(60)).await;
    }
}
