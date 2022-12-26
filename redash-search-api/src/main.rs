use redash_search_api::configs::Configs;
use redash_search_api::redash::{self, RedashClient};
use tracing::Level;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .with_level(true)
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .json()
        .init();

    let config = Configs::load_configs().unwrap();
    let redash_client = redash::DefaultRedashClient::new(
        config.redash.api_base_url.parse().unwrap(),
        config.redash.api_key,
    );

    let res = redash_client
        .get_queries(redash::GetQueriesRequest {
            page: 1,
            page_size: 10,
            order: None,
        })
        .await
        .unwrap();
    tracing::info!("res: {:#?}", res.results)
}
