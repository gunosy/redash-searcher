use opensearch::http::transport::{SingleNodeConnectionPool, TransportBuilder};
use opensearch::OpenSearch;
use redash_search_sync::app::App;
use redash_search_sync::configs::Configs;
use redash_search_sync::redash::DefaultRedashClient;
use tracing::Level;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(Level::DEBUG)
        .with_level(true)
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .json()
        .init();

    let config = &Configs::load_configs().unwrap();
    let redash_client =
        Box::new(DefaultRedashClient::new(&config.redash.url, &config.redash.api_key).unwrap());
    let conn_pool = SingleNodeConnectionPool::new((&config.open_search.url).parse().unwrap());
    let transport = TransportBuilder::new(conn_pool)
        .auth(opensearch::auth::Credentials::Basic(
            (&config.open_search.username).clone(),
            (&config.open_search.password).clone(),
        ))
        .build()
        .expect("failed to build transport");
    let client = OpenSearch::new(transport);

    let app = App::new(redash_client, client, config.clone());
    app.create_redash_index_if_not_exists().await.unwrap();
    app.sync().await.unwrap();
}
