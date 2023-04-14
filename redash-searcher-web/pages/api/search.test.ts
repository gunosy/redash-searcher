// utils.test.ts
import { ElasticsearchQuery, SearchSettingsConfig } from "searchkit";
import { tokenizeSearchQuery, getQuery } from "./search";

describe("tokenizeSearchQuery", () => {
  it("should tokenize a search query with operators and parentheses", () => {
    const query = "foo AND (bar OR baz) AND qux";
    const tokens = tokenizeSearchQuery(query);
    expect(tokens).toEqual([
      "foo",
      "AND",
      "(",
      "bar",
      "OR",
      "baz",
      ")",
      "AND",
      "qux",
    ]);
  });
  it("should tokenize a search query without operators", () => {
    const query = "foo bar baz";
    const tokens = tokenizeSearchQuery(query);
    expect(tokens).toEqual(["foo", "bar", "baz"]);
  });
});

describe("getQuery", () => {
  const searchAttributes = [
    { field: "field1", weight: 1 },
    { field: "field2", weight: 1 },
  ];

  const config: SearchSettingsConfig = {
    search_attributes: searchAttributes,
    result_attributes: ["field1", "field2"],
  };

  test("foo AND bar OR baz", () => {
    const query = "foo AND bar OR baz";
    const result = getQuery(query, searchAttributes, config);

    const expectedResult: ElasticsearchQuery = {
      bool: {
        should: [
          {
            bool: {
              must: [
                {
                  multi_match: {
                    query: "foo",
                    fields: ["field1", "field2"],
                    fuzziness: "AUTO:4,8",
                  },
                },
                {
                  multi_match: {
                    query: "bar",
                    fields: ["field1", "field2"],
                    fuzziness: "AUTO:4,8",
                  },
                },
              ],
            },
          },
          {
            bool: {
              must: [
                {
                  multi_match: {
                    query: "baz",
                    fields: ["field1", "field2"],
                    fuzziness: "AUTO:4,8",
                  },
                },
              ],
            },
          },
        ],
        minimum_should_match: 1,
      },
    };

    expect(result).toEqual(expectedResult);
  });

  test("foo AND (bar OR baz)", () => {
    const query = "foo AND (bar OR baz)";
    const result = getQuery(query, searchAttributes, config);

    const expectedResult: ElasticsearchQuery = {
      bool: {
        must: [
          {
            multi_match: {
              query: "foo",
              fields: ["field1", "field2"],
              fuzziness: "AUTO:4,8",
            },
          },
          {
            bool: {
              should: [
                {
                  bool: {
                    must: [
                      {
                        multi_match: {
                          query: "bar",
                          fields: ["field1", "field2"],
                          fuzziness: "AUTO:4,8",
                        },
                      },
                    ],
                  },
                },
                {
                  bool: {
                    must: [
                      {
                        multi_match: {
                          query: "baz",
                          fields: ["field1", "field2"],
                          fuzziness: "AUTO:4,8",
                        },
                      },
                    ],
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
        ],
      },
    };

    expect(result).toEqual(expectedResult);
  });

  test("foo bar baz", () => {
    const query = "foo bar baz";
    const result = getQuery(query, searchAttributes, config);

    const expectedResult: ElasticsearchQuery = {
      bool: {
        must: [
          {
            multi_match: {
              query: "foo",
              fields: ["field1", "field2"],
              fuzziness: "AUTO:4,8",
            },
          },
          {
            multi_match: {
              query: "bar",
              fields: ["field1", "field2"],
              fuzziness: "AUTO:4,8",
            },
          },
          {
            multi_match: {
              query: "baz",
              fields: ["field1", "field2"],
              fuzziness: "AUTO:4,8",
            },
          },
        ],
      },
    };

    expect(result).toEqual(expectedResult);
  });
});
