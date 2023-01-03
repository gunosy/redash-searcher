use std::str::FromStr;

use opensearch::http::transport::{SingleNodeConnectionPool, TransportBuilder};
use opensearch::OpenSearch;
use redash_searcher_sync::app::App;
use redash_searcher_sync::configs::Configs;
use redash_searcher_sync::redash::DefaultRedashClient;
use tracing::Level;

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
    if !(config.open_search.username.is_none() || config.open_search.password.is_none()) {
        builder = builder.auth(opensearch::auth::Credentials::Basic(
            config.open_search.username.clone().unwrap(),
            config.open_search.password.clone().unwrap(),
        ));
    }
    let transport = builder.build().expect("failed to build transport");
    let client = OpenSearch::new(transport);

    let app = App::new(redash_client, client);
    app.create_redash_index_if_not_exists().await.unwrap();
    loop {
        tracing::info!("start sync");
        app.sync().await.unwrap();
        tokio::time::sleep(std::time::Duration::from_secs(60)).await;
    }
}
