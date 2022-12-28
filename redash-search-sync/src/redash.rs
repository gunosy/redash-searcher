use anyhow::Result;
use async_trait::async_trait;

use serde::{Deserialize, Serialize};

#[async_trait]
pub trait RedashClient {
    async fn get_queries(&self, req: GetQueriesRequest) -> Result<GetQueriesResponse>;
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct GetQueriesRequest {
    pub page: u32,
    pub page_size: u32,
    pub order: Option<String>,
}

// NOTE: some fields are omitted
#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct RedashQuery {
    pub id: i32,
    pub name: String,
    pub query: String,
    pub query_hash: String,
    pub is_archived: bool,
    pub is_draft: bool,
    pub updated_at: String,
    pub created_at: String,
    pub data_source_id: i32,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct GetQueriesResponse {
    pub count: i32,
    pub page: i32,
    pub page_size: i32,
    pub results: Vec<RedashQuery>,
}

/// This is a default implementation of RedashClient
/// NOTE: some fields are omitted for simplicity
///
/// API reference: https:
/// https://redash.io/help/user-guide/integrations-and-api/api
pub struct DefaultRedashClient {
    base_url: String,
    api_key: String,
}

impl DefaultRedashClient {
    pub fn new(base_url: &str, api_key: &str) -> Result<Self> {
        Ok(Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            api_key: api_key.to_string(),
        })
    }
}

#[async_trait]
impl RedashClient for DefaultRedashClient {
    async fn get_queries(&self, req: GetQueriesRequest) -> Result<GetQueriesResponse> {
        let client = reqwest::Client::new();
        let req = client
            .get(format!(
                "{}/api/queries?page={}&page_size={}&order_by={}",
                self.base_url,
                req.page,
                req.page_size,
                req.order.unwrap_or_else(|| "-updated_at".to_string())
            ))
            .header("Authorization", format!("Key {}", self.api_key));

        let res = req.send().await?;
        if res.status().is_success() {
            Ok(res.json().await?)
        } else {
            let data = res.text().await.unwrap();
            tracing::error!(data = data, "Failed to get queries");
            Err(anyhow::anyhow!("Failed to get queries"))
        }
    }
}
