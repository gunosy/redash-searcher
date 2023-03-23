use crate::serde as custom_serde;
use anyhow::{Context, Result};
use chrono::Duration;
use config::{Config, Environment};
use serde::Deserialize;

#[derive(Debug, Deserialize, PartialEq, Eq, Clone)]
pub struct RedashConfig {
    pub url: String,
    pub api_key: String,
}

#[derive(Debug, Deserialize, PartialEq, Eq, Clone)]
pub struct OpenSearchConfig {
    /// The username of the OpenSearch server.
    pub username: Option<String>,
    /// The password of the OpenSearch server.
    pub password: Option<String>,
    /// The url of the OpenSearch server.
    pub url: String,
    /// The maximum number of retries to ping the OpenSearch server.
    pub max_retry_count_on_ping: i8,
    /// The interval to ping the OpenSearch server.
    #[serde(with = "custom_serde::duration")]
    pub ping_interval: Duration,
    /// If true, the first time the app runs, it will refresh all the data from redash.
    pub first_full_refresh: bool,
}

#[derive(Debug, Deserialize, PartialEq, Eq, Clone)]
pub struct Configs {
    pub log_level: String,
    pub redash: RedashConfig,
    pub open_search: OpenSearchConfig,
}

impl Configs {
    pub fn load_configs() -> Result<Self> {
        let c = Config::builder()
            .add_source(Environment::default().try_parsing(true).separator("__"))
            .set_default("open_search.max_retry_count_on_ping", 6)?
            .set_default("open_search.ping_interval", "10s")?
            .set_default("open_search.first_full_refresh", false)?
            .build()
            .unwrap();
        c.try_deserialize().context("Failed to load configs")
    }
}
