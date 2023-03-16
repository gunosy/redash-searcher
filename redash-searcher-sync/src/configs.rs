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
    pub username: Option<String>,
    pub password: Option<String>,
    pub url: String,
    pub max_retry_count_on_ping: i8,
    #[serde(with = "custom_serde::duration")]
    pub ping_interval: Duration,
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
            .build()
            .unwrap();
        c.try_deserialize().context("Failed to load configs")
    }
}
