use anyhow::Result;
use opensearch::BulkParts;
use opensearch::{http::request::JsonBody, OpenSearch};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::configs::Configs;
use crate::redash::{self, RedashClient};

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
    url: String,
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

    // TODO: sync only updated queries
    pub async fn sync(&self) -> Result<()> {
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
            let doc = RedashDocument {
                id: query.id,
                name: query.name,
                query: query.query,
                updated_at: query.updated_at,
                created_at: query.created_at,
                data_source_id: query.data_source_id,
                tags: query.tags,
                url: format!("{}/queries/{}", self.configs.redash.url, query.id),
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
