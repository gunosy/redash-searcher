use anyhow::{Context, Result};
use config::{Config, Environment};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct RedashConfig {
    pub api_base_url: String,
    pub api_key: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Configs {
    pub redash: RedashConfig,
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
