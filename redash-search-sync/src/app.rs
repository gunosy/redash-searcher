use anyhow::Result;
use chrono::{DateTime, Local};
use once_cell::sync::Lazy;
use opensearch::BulkParts;
use opensearch::{http::request::JsonBody, OpenSearch};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::configs::Configs;
use crate::redash::{self, RedashClient};

const REDASH_INDEX_NAME: &str = "redash";

static INDEX_CONFIG: Lazy<Value> = Lazy::new(|| {
    json!({
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
                        "pattern": "[\\.]",
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
                },
                "created_at": {
                    "type": "date",
                    "format": "date_time"
                },
                "updated_at": {
                    "type": "date",
                    "format": "date_time"
                },
            }
        }
    })
});

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct RedashDocument {
    id: i32,
    name: String,
    query: String,
    user_name: String,
    user_email: String,
    created_at: DateTime<Local>,
    updated_at: DateTime<Local>,
    data_source_id: i32,
    data_source_name: String,
    data_source_type: String,
    tags: Vec<String>,
}

pub struct App {
    redash_client: Box<dyn RedashClient>,
    open_search_client: OpenSearch,
    configs: Configs,
}

impl App {
    pub fn new(
        redash_client: Box<dyn RedashClient>,
        open_search_client: OpenSearch,
        configs: Configs,
    ) -> Self {
        Self {
            redash_client,
            open_search_client,
            configs,
        }
    }
    pub async fn create_redash_index_if_not_exists(&self) -> Result<()> {
        {
            let res = self
                .open_search_client
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
            let res = self
                .open_search_client
                .indices()
                .create(opensearch::indices::IndicesCreateParts::Index(
                    REDASH_INDEX_NAME,
                ))
                .body(INDEX_CONFIG.clone())
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

    // TODO: sync only updated queries
    pub async fn sync(&self) -> Result<()> {
        let data_sources = self.redash_client.get_data_sources().await?;
        let res = self
            .redash_client
            .get_queries(redash::GetQueriesRequest {
                page: 1,
                page_size: 10,
                order: None,
            })
            .await?;
        let mut body: Vec<JsonBody<_>> = Vec::new();
        for query in res.results {
            let data_source = data_sources.get(&query.data_source_id).unwrap();
            let doc = RedashDocument {
                id: query.id,
                name: query.name,
                query: query.query,
                user_name: query.user.name,
                user_email: query.user.email,
                created_at: query.created_at,
                updated_at: query.updated_at,
                data_source_id: query.data_source_id,
                data_source_name: data_source.name.clone(),
                data_source_type: data_source.r#type.clone(),
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

        let res = self
            .open_search_client
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
        Ok(())
    }
}
