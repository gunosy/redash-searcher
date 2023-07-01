//! This module is created by modifying the program at the following link: https://github.com/getredash/redash-toolbelt/blob/f6d2c40881fcacb411665c75f3afbe570533539d/redash_toolbelt/examples/find_table_names.py
//!
//! Copyright (c) 2020, Redash
//! All rights reserved.
//! About license, see: https://github.com/getredash/redash-toolbelt/blob/f6d2c40881fcacb411665c75f3afbe570533539d/LICENSE

/// Format query.
fn format_query(query: &str) -> String {
    let stage1 = query.replace('\n', " ");
    let re = regex::Regex::new(r"\s+").unwrap();
    let stage2 = re.replace_all(&stage1, " ");
    let re = regex::Regex::new(r"(\s*,\s*)").unwrap();
    let stage3 = re.replace_all(&stage2, ",");

    stage3.to_string()
}

/// Get all references from query.
///
/// e.g. `SELECT * FROM table1 JOIN table2 ON table1.id = table2.id`
///     -> `["table1", "table2"]`
pub fn parse_references_from_query(query: &str) -> Vec<String> {
    let formatted_query = format_query(query);
    println!("formatted_query: {}", formatted_query);

    let re1 = regex::Regex::new(r"(?:FROM|JOIN)(?:\s+)([^\s\(\)]+)").unwrap();
    let mut matches = vec![];
    for cap in re1.captures_iter(&formatted_query) {
        let table_name = cap.get(1).unwrap().as_str().to_string();
        matches.push(table_name);
    }
    println!("matches: {:?}", matches);

    // expand any comma-delimited matches
    // e.g. `SELECT * FROM table1, table2` -> `["table1", "table2"]`
    let mut split_matches = vec![];
    for match_ in matches {
        let split_match = match_
            .split(',')
            .map(|s| s.to_string())
            .collect::<Vec<String>>();
        split_matches.push(split_match);
    }
    let flattened_split_matches: Vec<String> = split_matches.into_iter().flatten().collect();

    // expand aliased comma-delimited matches
    //   1. Find all text between FROM->WHERE and FROM->JOIN keywords
    //   2. Replace any commas with `FROM` keywords
    //   3. Apply the same PATTERN match used above which ignores aliases
    // e.g. `SELECT * FROM table1 as t1, table2 as t2` -> `["table1", "table2"]`
    let re2 = regex::Regex::new(r"(?:FROM)(.*)(?:WHERE|JOIN)").unwrap();
    let mut sub_matches = vec![];
    for cap in re2.captures_iter(&formatted_query) {
        let sub_match = cap.get(1).unwrap().as_str().to_string();
        sub_matches.push(sub_match);
    }
    let mut sub_regex_matches = vec![];
    for sub_match in sub_matches {
        // replace any commas with `FROM` keywords: `table1 as t1, table2 as t2` -> `table1 as t1 FROM table2 as t2`
        let tmp = sub_match.replace(',', " FROM ");

        for cap in re1.captures_iter(&format_query(&tmp)) {
            let sub_regex_match = cap.get(1).unwrap().as_str().to_string();
            sub_regex_matches.push(sub_regex_match);
        }
    }
    let flattened_sub_matches: Vec<String> = sub_regex_matches
        .into_iter()
        .filter(|s| !flattened_split_matches.contains(s))
        .collect();

    let mut matches = vec![flattened_split_matches, flattened_sub_matches]
        .into_iter()
        .flatten()
        .collect::<Vec<String>>();
    matches.sort();
    matches
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_references_from_query_1() {
        let query = "SELECT field FROM table0 as a LEFT JOIN table1 as b ON a.field = b.field";

        let expected = vec!["table0".to_string(), "table1".to_string()];
        let actual = parse_references_from_query(query);
        assert_eq!(actual, expected);
    }

    #[test]
    fn test_parse_references_from_query_2() {
        let query = "SELECT field FROM table0 as a LEFT JOIN table1 as b ON a.field = b.field";
        let expected = vec!["table0".to_string(), "table1".to_string()];
        let actual = parse_references_from_query(query);
        assert_eq!(actual, expected);
    }

    #[test]
    fn test_parse_references_from_query_3() {
        let query = "SELECT field FROM table0 a LEFT JOIN table1 b ON a.field = b.field";

        let expected = vec!["table0".to_string(), "table1".to_string()];
        let actual = parse_references_from_query(query);
        assert_eq!(actual, expected);
    }

    #[test]
    fn test_parse_references_from_query_4() {
        let query =
            "SELECT field FROM schema.table0 a LEFT JOIN schema.table1 b ON a.field = b.field";
        let expected = vec!["schema.table0".to_string(), "schema.table1".to_string()];
        let actual = parse_references_from_query(query);
        assert_eq!(actual, expected);
    }

    #[test]
    fn test_parse_references_from_query_5() {
        let query = "SELECT field\n    FROM\n        table0\n    LEFT JOIN\n        table1";

        let expected = vec!["table0".to_string(), "table1".to_string()];
        let actual = parse_references_from_query(query);
        assert_eq!(actual, expected);
    }

    #[test]
    fn test_parse_references_from_query_6() {
        let query = "SELECT field FROM table1,table2, table3 ,table4 , table5\n            , table6\n    WHERE table0.field = table1.field";

        let expected = vec![
            "table1".to_string(),
            "table2".to_string(),
            "table3".to_string(),
            "table4".to_string(),
            "table5".to_string(),
            "table6".to_string(),
        ];
        let actual = parse_references_from_query(query);
        assert_eq!(actual, expected);
    }

    #[test]
    fn test_parse_references_from_query_7() {
        let query =
            "SELECT field FROM [table0] LEFT JOIN [table1] ON [table0].field = [table1].field";

        let expected = vec!["[table0]".to_string(), "[table1]".to_string()];
        let actual = parse_references_from_query(query);
        assert_eq!(actual, expected);
    }

    #[test]
    fn test_parse_references_from_query_8() {
        let query = "SELECT field FROM table1 AS t1, table2 AS t2, table3 t3, table4 t4 WHERE t1.field = 'value'";

        let expected = vec![
            "table1".to_string(),
            "table2".to_string(),
            "table3".to_string(),
            "table4".to_string(),
        ];
        let actual = parse_references_from_query(query);
        assert_eq!(actual, expected);
    }

    #[test]
    fn test_parse_references_from_query_9() {
        let query = "SELECT field FROM table1 AS t1, table2 AS t2, table3 t3, table4 t4\n    LEFT JOIN table5 ON t1.field = table5.field\n    WHERE t1.field = t2.field AND t2.field = t3.field AND t3.field=t4.field";

        let expected = vec![
            "table1".to_string(),
            "table2".to_string(),
            "table3".to_string(),
            "table4".to_string(),
            "table5".to_string(),
        ];
        let actual = parse_references_from_query(query);
        assert_eq!(actual, expected);
    }
}
