pub mod duration {
    use chrono::Duration;
    use serde::{de, Deserialize, Deserializer};

    use humantime;

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Duration, D::Error>
    where
        D: Deserializer<'de>,
    {
        let std_dur = humantime::parse_duration(&String::deserialize(deserializer)?)
            .map_err(de::Error::custom)?;
        Duration::from_std(std_dur).map_err(de::Error::custom)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;
    use serde::Deserialize;

    #[test]
    fn test_duration_deserialize() {
        #[derive(Deserialize, Debug, PartialEq)]
        struct TestStruct {
            #[serde(with = "duration")]
            duration: Duration,
        }
        let test_struct = TestStruct {
            duration: Duration::seconds(3600),
        };
        let test_struct_str = format!("{{\"duration\":\"1h\"}}");
        let test_struct_deserialized: TestStruct = serde_json::from_str(&test_struct_str).unwrap();
        assert_eq!(test_struct, test_struct_deserialized);
    }
}
