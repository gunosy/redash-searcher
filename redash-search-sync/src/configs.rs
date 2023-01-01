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
    pub username: String,
    pub password: String,
    pub url: String,
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
            .build()
            .unwrap();
        c.try_deserialize().context("Failed to load configs")
    }
}
