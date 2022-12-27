use anyhow::Result;
use hyper::client::conn;
use opensearch::http::request::JsonBody;
use opensearch::http::transport::{SingleNodeConnectionPool, Transport, TransportBuilder};
use opensearch::{BulkParts, OpenSearch};
use redash_search_api::configs::Configs;
use redash_search_api::redash::{self, RedashClient};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::Level;

const REDASH_INDEX_NAME: &str = "redash";

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct RedashDocument {
    id: i32,
    name: String,
    query: String,
    updated_at: String,
    created_at: String,
    data_source_id: i32,
    tags: Vec<String>,
}

async fn create_redash_index_if_not_exists(client: &OpenSearch) -> Result<()> {
    {
        let res = client
            .indices()
            .exists(opensearch::indices::IndicesExistsParts::Index(&[
                REDASH_INDEX_NAME,
            ]))
            .send()
            .await?;

        if res.status_code().is_success() {
            tracing::info!("index already exists");
            return Ok(());
        }
    }

    {
        let res = client
            .indices()
            .create(opensearch::indices::IndicesCreateParts::Index(
                REDASH_INDEX_NAME,
            ))
            .body(json!({
                "settings": {
                    "analysis": {
                        "analyzer": {
                            "sql_analyzer": {
                                "type": "custom",
                                "tokenizer": "standard",
                                "filter": [
                                    "lowercase"
                                ],
                                "char_filter": [
                                  "sql_char_filter"
                                ]
                            }
                        },
                        "char_filter": {
                            "sql_char_filter": {
                                "type": "pattern_replace",
                                "pattern": "[\\._]",
                                "replacement": " "
                            }
                        }
                    }
                },
                "mappings": {
                    "properties": {
                        "query": {
                            "type": "text",
                            "analyzer": "sql_analyzer"
                        }
                    }
                }
            }))
            .send()
            .await?;

        if !res.status_code().is_success() {
            tracing::error!(
                response = res.text().await.unwrap(),
                "failed to create index"
            );
            panic!("failed to create index")
        } else {
            tracing::info!(response = res.text().await.unwrap(), "create index success");
        }
    }
    Ok(())
}

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

    let config = &Configs::load_configs().unwrap();
    let redash_client =
        redash::DefaultRedashClient::new(&config.redash.api_base_url, &config.redash.api_key)
            .unwrap();

    let res = redash_client
        .get_queries(redash::GetQueriesRequest {
            page: 1,
            page_size: 10,
            order: None,
        })
        .await
        .unwrap();
    let conn_pool = SingleNodeConnectionPool::new((&config.open_search.url).parse().unwrap());
    let transport = TransportBuilder::new(conn_pool)
        .auth(opensearch::auth::Credentials::Basic(
            (&config.open_search.username).clone(),
            (&config.open_search.password).clone(),
        ))
        .build()
        .expect("failed to build transport");
    let client = OpenSearch::new(transport);

    create_redash_index_if_not_exists(&client).await.unwrap();

    let mut body: Vec<JsonBody<_>> = Vec::new();
    for query in res.results {
        let doc = RedashDocument {
            id: query.id,
            name: query.name,
            query: query.query,
            updated_at: query.updated_at,
            created_at: query.created_at,
            data_source_id: query.data_source_id,
            tags: query.tags,
        };
        body.push(
            json!({
                "index": {
                    "_id": doc.id,
                }
            })
            .into(),
        );
        body.push(serde_json::to_value(&doc).unwrap().into());
    }

    let res = client
        .bulk(BulkParts::Index(REDASH_INDEX_NAME))
        .body(body)
        .send()
        .await
        .unwrap();
    if !res.status_code().is_success() {
        tracing::error!(
            response = res.text().await.unwrap(),
            "failed to bulk create"
        );
        panic!("failed to bulk index")
    } else {
        tracing::info!(response = res.text().await.unwrap(), "bulk create success");
    }
}
