import Client from "@searchkit/api";
import { ConfigConnection } from "searchkit";
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
    sorting: {
      default: {
        field: "_score",
        order: "desc",
      },
    },
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const results = await client.handleRequest(req.body);
  res.send(results);
}
