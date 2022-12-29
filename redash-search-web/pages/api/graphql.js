import { ApolloServer, gql } from "apollo-server-micro";
import cors from "micro-cors";

import {
  MultiMatchQuery,
  RefinementSelectFacet,
  RangeFacet,
  SearchkitSchema,
  DateRangeFacet,
  SearchkitResolver,
  GeoBoundingBoxFilter,
  HierarchicalMenuFacet,
} from "@searchkit/schema";

const searchkitConfig = {
  host: "http://localhost:9200",
  index: "redash",
  hits: {
    fields: ["name", "query", "url", "tags"],
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
      field: "tags",
      identifier: "type",
      label: "Tag",
      multipleSelect: true,
    }),
  ],
};

const { typeDefs, withSearchkitResolvers, context } = SearchkitSchema([
  {
    config: searchkitConfig,
    typeName: "ResultSet",
    hitTypeName: "ResultHit",
    addToQueryType: true,
  },
]);

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
        query: String
        url: String
      }

      type ResultHit implements SKHit {
        id: ID!
        fields: HitFields
      }
    `,
    ...typeDefs,
  ],
  resolvers: withSearchkitResolvers({}),
  introspection: true,
  playground: true,
  context: {
    ...context,
  },
});

const handler = server.createHandler({ path: "/api/graphql" });

export default cors()((req, res) =>
  req.method === "OPTIONS" ? res.end() : handler(req, res)
);
