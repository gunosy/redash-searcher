use anyhow::{Context, Result};
use config::{Config, Environment};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Clone)]
pub struct RedashConfig {
    pub url: String,
    pub api_key: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Clone)]
pub struct OpenSearchConfig {
    pub username: Option<String>,
    pub password: Option<String>,
    pub url: String,
    pub max_retry_count_on_ping: i8,
    pub ping_interval: u64,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Clone)]
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
            .set_default("open_search.ping_interval", 10)?
            .build()
            .unwrap();
        c.try_deserialize().context("Failed to load configs")
    }
}
