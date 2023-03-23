use std::collections::HashMap;

use anyhow::{anyhow, Result};
use chrono::{DateTime, Local};
use once_cell::sync::Lazy;
use opensearch::BulkParts;
use opensearch::{http::request::JsonBody, OpenSearch};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::redash::{self, RedashClient, RedashDataSource};

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
                    "format": "date_time||epoch_millis"
                },
                "updated_at": {
                    "type": "date",
                    "format": "date_time||epoch_millis"
                },
                "retrieved_at": {
                    "type": "date",
                    "format": "date_time||epoch_millis"
                }
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
    retrieved_at: Option<DateTime<Local>>,
    data_source_id: i32,
    data_source_name: String,
    data_source_type: String,
    tags: Vec<String>,
}

pub struct App {
    redash_client: Box<dyn RedashClient>,
    open_search_client: OpenSearch,
}

impl App {
    pub fn new(redash_client: Box<dyn RedashClient>, open_search_client: OpenSearch) -> Self {
        Self {
            redash_client,
            open_search_client,
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

    async fn get_latest_updated_at(&self) -> Result<DateTime<Local>> {
        let res = self
            .open_search_client
            .search(opensearch::SearchParts::Index(&[REDASH_INDEX_NAME]))
            .body(json!({
                "size": 1,
                "sort": [
                    {
                        "updated_at": {
                            "order": "desc"
                        }
                    }
                ]
            }))
            .send()
            .await?;
        if !res.status_code().is_success() {
            tracing::error!(
                response = res.text().await.unwrap(),
                "failed to get latest updated_at"
            );
            Err(anyhow!("failed to get latest updated_at"))
        } else {
            let res: Value = res.json().await?;
            let hits = res["hits"]["hits"].as_array().unwrap();
            if hits.is_empty() {
                Ok(DateTime::<Local>::MIN_UTC.into())
            } else {
                let updated_at = hits[0]["_source"]["updated_at"].as_str().unwrap();
                Ok(DateTime::parse_from_rfc3339(updated_at).unwrap().into())
            }
        }
    }

    pub async fn sync_once(
        &self,
        page_num: u32,
        data_sources: &HashMap<i32, RedashDataSource>,
    ) -> Result<DateTime<Local>> {
        let res = self
            .redash_client
            .get_queries(redash::GetQueriesRequest {
                page: page_num,
                page_size: 100,
                order: Some("-updated_at".to_string()),
            })
            .await?;
        let mut body: Vec<JsonBody<_>> = Vec::new();
        let mut oldest_updated_at = DateTime::<Local>::MAX_UTC;
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
                retrieved_at: query.retrieved_at,
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
            oldest_updated_at = oldest_updated_at.min(query.updated_at.into());
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
            Err(anyhow!("failed to bulk create"))
        } else {
            tracing::debug!(response = res.text().await.unwrap(), "bulk create success");
            Ok(oldest_updated_at.into())
        }
    }

    pub async fn sync(&self, full_refresh: bool) -> Result<()> {
        let data_sources = self.redash_client.get_data_sources().await?;
        let latest_updated_at = self.get_latest_updated_at().await?;
        tracing::info!(oldest_updated_at = ?latest_updated_at, "update queries to this time");

        let mut page_num = 1;
        loop {
            tracing::info!(page_num, "sync page");
            let updated_at = self.sync_once(page_num, &data_sources).await?;
            if updated_at <= latest_updated_at && !full_refresh {
                tracing::info!(updated_at = ?updated_at, "sync page done");
                break;
            }
            if page_num > 10000 {
                tracing::warn!("too many pages");
                break;
            }
            page_num += 1;
        }
        Ok(())
    }
}
