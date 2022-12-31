use std::collections::HashMap;

use anyhow::Result;
use async_trait::async_trait;

use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};

#[async_trait]
pub trait RedashClient {
    async fn get_queries(&self, req: GetQueriesRequest) -> Result<GetQueriesResponse>;
    async fn get_data_sources(&self) -> Result<GetDataSourcesResponse>;
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
    pub description: Option<String>,
    pub user: RedashUser,
    pub query: String,
    pub query_hash: String,
    pub is_archived: bool,
    pub is_draft: bool,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
    pub data_source_id: i32,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct RedashUser {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub is_disabled: bool,
    pub is_invitation_pending: bool,
    pub updated_at: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct GetQueriesResponse {
    pub count: i32,
    pub page: i32,
    pub page_size: i32,
    pub results: Vec<RedashQuery>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct RedashDataSource {
    pub id: i32,
    pub name: String,
    pub r#type: String,
    pub syntax: String,
    pub paused: i32,
    pub pause_reason: Option<String>,
    pub supports_auto_limit: bool,
    pub view_only: bool,
}

type GetDataSourcesResponse = HashMap<i32, RedashDataSource>;

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
            // TODO: sometimes status is 200 but response shows error
            //       e.g. "{"took":6,"errors":true, ...}"
            //       so we need to handle this case
            let data = res.json().await?;
            tracing::debug!(data = serde_json::to_string(&data).unwrap(), "Got queries");
            Ok(data)
        } else {
            let data = res.text().await.unwrap();
            tracing::error!(data = data, "Failed to get queries");
            Err(anyhow::anyhow!("Failed to get queries"))
        }
    }

    async fn get_data_sources(&self) -> Result<GetDataSourcesResponse> {
        let client = reqwest::Client::new();
        let req = client
            .get(format!("{}/api/data_sources", self.base_url))
            .header("Authorization", format!("Key {}", self.api_key));

        let res = req.send().await?;
        if res.status().is_success() {
            let data = res.json::<Vec<RedashDataSource>>().await?;
            tracing::debug!(
                data = serde_json::to_string(&data).unwrap(),
                "Got data sources"
            );
            let data = data
                .into_iter()
                .map(|ds| (ds.id, ds))
                .collect::<GetDataSourcesResponse>();
            Ok(data)
        } else {
            let data = res.text().await.unwrap();
            tracing::error!(data = data, "Failed to get data sources");
            Err(anyhow::anyhow!("Failed to get data sources"))
        }
    }
}
