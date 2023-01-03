import { ApolloServer, gql } from "apollo-server-micro";
import Cors from "micro-cors";

import {
  MultiMatchQuery,
  RefinementSelectFacet,
  SearchkitSchema,
} from "@searchkit/schema";

const getOpenSearchURI = () => {
  const openSearchURL = process.env.OPEN_SEARCH__URL || "http://localhost:9200";
  const openSearchUsername = process.env.OPEN_SEARCH__USERNAME;
  const openSearchPassword = process.env.OPEN_SEARCH__PASSWORD;
  if (!(openSearchUsername && openSearchPassword)) {
    return openSearchURL;
  }
  return openSearchURL.replace(
    "://",
    `://${openSearchUsername}:${openSearchPassword}@`
  );
};

const searchkitConfig = {
  host: getOpenSearchURI(),
  credential: {},
  index: "redash",
  hits: {
    fields: [
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
    highlightedFields: [
      "name",
      {
        field: "query",
        config: {
          pre_tags: ['<mark class="highlight-inline">'],
          post_tags: ["</mark>"],
        },
      },
    ],
  },
  sortOptions: [
    {
      id: "relevance",
      label: "Relevance",
      field: [{ _score: "desc" }],
      defaultOption: true,
    },
  ],
  query: new MultiMatchQuery({ fields: ["name", "query"] }),
  facets: [
    new RefinementSelectFacet({
      field: "data_source_type.keyword",
      identifier: "data_source_type",
      label: "DataSourceType",
      multipleSelect: true,
    }),
    new RefinementSelectFacet({
      field: "data_source_name.keyword",
      identifier: "data_source_name",
      label: "DataSourceName",
      multipleSelect: true,
    }),
    new RefinementSelectFacet({
      field: "user_name.keyword",
      identifier: "user_name",
      label: "UserName",
      multipleSelect: true,
    }),
    new RefinementSelectFacet({
      field: "user_email.keyword",
      identifier: "user_email",
      label: "UserEmail",
      multipleSelect: true,
    }),
    new RefinementSelectFacet({
      field: "tags.keyword",
      identifier: "tags",
      label: "Tag",
      multipleSelect: true,
    }),
  ],
};

const { typeDefs, withSearchkitResolvers, context } = SearchkitSchema({
  config: searchkitConfig,
  typeName: "ResultSet",
  hitTypeName: "ResultHit",
  addToQueryType: true,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const server = new ApolloServer({
  typeDefs: [
    gql`
      type Query {
        root: String
      }

      type HitFields {
        name: String
        description: String
        query: String
        user_name: String
        user_email: String
        created_at: String
        updated_at: String
        crated_date: String
        updated_date: String
        tags: [String]
        data_source_name: String
        data_source_type: String
      }

      type HitHighlight {
        name: [String]
        query: [String]
      }

      type ResultHit implements SKHit {
        id: ID!
        fields: HitFields
        highlight: HitHighlight
      }
    `,
    ...typeDefs,
  ],
  resolvers: withSearchkitResolvers({}),
  cache: "bounded",
  introspection: true,
  context: {
    ...context,
  },
});

const startServer = server.start();
const cors = Cors();

export default cors(async (req: any, res: any): Promise<false | undefined> => {
  if (req.method === "OPTIONS") {
    res.end();
    return false;
  }

  await startServer;
  await server.createHandler({ path: "/api/graphql" })(req, res);
});
