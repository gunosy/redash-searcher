import Client from "@searchkit/api";
import {
  ConfigConnection,
  ElasticsearchQuery,
  SearchAttribute,
  SearchSettingsConfig,
} from "searchkit";
import { NextApiRequest, NextApiResponse } from "next";

const getOpenSearchConnection = (): ConfigConnection => {
  const openSearchURL = process.env.OPEN_SEARCH__URL || "http://localhost:9200";
  const openSearchUsername = process.env.OPEN_SEARCH__USERNAME;
  const openSearchPassword = process.env.OPEN_SEARCH__PASSWORD;

  if (!(openSearchUsername && openSearchPassword)) {
    return {
      host: openSearchURL,
    };
  }
  return {
    host: openSearchURL,
    auth: {
      username: openSearchUsername,
      password: openSearchPassword,
    },
  };
};

const client = Client({
  connection: getOpenSearchConnection(),
  search_settings: {
    highlight_attributes: ["name", "query"],
    search_attributes: ["name", "query"],
    result_attributes: [
      "id",
      "name",
      "query",
      "user_name",
      "user_email",
      "description",
      "tags",
      "created_at",
      "updated_at",
      "retrieved_at",
      "data_source_name",
      "data_source_type",
    ],
    facet_attributes: [
      {
        attribute: "data_source_type",
        field: "data_source_type.keyword",
        type: "string",
      },
      {
        attribute: "data_source_name",
        field: "data_source_name.keyword",
        type: "string",
      },
      { attribute: "user_name", field: "user_name.keyword", type: "string" },
      { attribute: "user_email", field: "user_email.keyword", type: "string" },
      { attribute: "tags", field: "tags.keyword", type: "string" },
    ],
    filter_attributes: [
      {
        attribute: "created_at",
        field: "created_at",
        type: "date",
      },
      {
        attribute: "updated_at",
        field: "updated_at",
        type: "date",
      },
      {
        attribute: "retrieved_at",
        field: "retrieved_at",
        type: "date",
      },
    ],
    sorting: {
      default: {
        field: "_score",
        order: "desc",
      },
      created_at_desc: {
        field: "created_at",
        order: "desc",
      },
      updated_at_desc: {
        field: "updated_at",
        order: "desc",
      },
      retrieved_at_desc: {
        field: "retrieved_at",
        order: "desc",
      },
    },
  },
});

export const tokenizeSearchQuery = (query: string): string[] => {
  const regexMatch = query.match(/\b(?:AND|OR)|\(|\)|[^\s()]+/g);
  return regexMatch ? regexMatch.map((item) => item.toString()) : [];
};

export const getQuery = (
  query: string,
  searchAttributes: SearchAttribute[],
  config: SearchSettingsConfig
): ElasticsearchQuery | ElasticsearchQuery[] => {
  const buildQuery = (tokens: string[]): ElasticsearchQuery => {
    const queryClauses: ElasticsearchQuery[] = [];
    let currentAndClauses: ElasticsearchQuery[] = [];

    const processAndClauses = () => {
      if (currentAndClauses.length > 0) {
        queryClauses.push({
          bool: { must: currentAndClauses },
        });
        currentAndClauses = [];
      }
    };

    while (tokens.length > 0) {
      const token = tokens.shift();

      if (token === "AND") {
        continue;
      } else if (token === "OR") {
        processAndClauses();
      } else if (token === "(") {
        const subQuery = buildQuery(tokens);
        currentAndClauses.push(subQuery);
      } else if (token === ")") {
        processAndClauses();
        break;
      } else {
        const termQuery: ElasticsearchQuery = {
          multi_match: {
            query: token,
            fields: searchAttributes.map((attr) =>
              typeof attr === "string" ? attr : attr.field
            ),
            fuzziness: "AUTO:4,8",
          },
        };
        currentAndClauses.push(termQuery);
      }
    }

    processAndClauses();
    if (queryClauses.length === 1) {
      return queryClauses[0];
    } else {
      return { bool: { should: queryClauses, minimum_should_match: 1 } };
    }
  };

  const tokens = tokenizeSearchQuery(query);
  return buildQuery(tokens);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const results = await client.handleRequest(req.body, {
    getQuery: getQuery,
  });
  res.send(results);
}
