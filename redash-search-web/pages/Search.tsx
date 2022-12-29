import { useQuery, gql, useLazyQuery } from "@apollo/client";
import {
  useSearchkit,
  useSearchkitQueryValue,
  useSearchkitVariables,
} from "@searchkit/client";
import {
  FacetsList,
  SearchBar,
  Pagination,
  ResetSearchButton,
  SelectedFilters,
  SortingSelector,
} from "@searchkit/elastic-ui";
import { useEffect, useState } from "react";
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeaderSection,
  EuiTitle,
  EuiHorizontalRule,
  EuiButtonGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageTemplate,
  EuiSearchBar,
} from "@elastic/eui";
import { initializeApollo } from "../lib/apolloClient";
import HitsList from "../components/HitList";
import { EXPORT_MARKER } from "next/dist/shared/lib/constants";

export const RESULT_SET_QUERY = gql`
  query resultSet(
    $query: String
    $filters: [SKFiltersSet]
    $page: SKPageInput
    $sortBy: String
  ) {
    results(query: $query, filters: $filters) {
      summary {
        total
      }
      hits(page: $page, sortBy: $sortBy) {
        page {
          total
          totalPages
          pageNumber
          from
          size
        }
        sortedBy
        items {
          ... on ResultHit {
            id
            fields {
              name
              query
              url
            }
          }
        }
      }
      facets {
        identifier
        type
        label
        display
        entries {
          label
          count
        }
      }
    }
  }
`;

const Search = () => {
  const variables = useSearchkitVariables();
  const { data, loading } = useQuery(RESULT_SET_QUERY, { variables });
  const Facets = FacetsList([]);
  return (
    <EuiPageTemplate>
      <EuiPageTemplate.Sidebar>
        <SearchBar loading={loading} />
        <EuiHorizontalRule margin="m" />
        <Facets data={data?.results || { facets: [] }} loading={loading} />
      </EuiPageTemplate.Sidebar>
      <EuiPageBody component="div">
        <EuiPageTemplate.Header>
          {/* <EuiPageHeaderSection>
            <EuiTitle size="l">
              <SelectedFilters data={data?.results} loading={loading} />
            </EuiTitle>
          </EuiPageHeaderSection> */}
          <EuiPageHeaderSection>
            <ResetSearchButton loading={loading} />
          </EuiPageHeaderSection>
        </EuiPageTemplate.Header>
        <EuiPageTemplate.Section>
          <EuiTitle size="s">
            <h2>{data?.results.summary.total} Results</h2>
          </EuiTitle>
        </EuiPageTemplate.Section>
        <HitsList hitItems={data?.results.hits.items || []} />
        <EuiFlexGroup justifyContent="spaceAround">
          <Pagination data={data?.results} />
        </EuiFlexGroup>
      </EuiPageBody>
    </EuiPageTemplate>
  );
};

export default Search;

export async function getStaticProps() {
  const apolloClient = initializeApollo();
  const variables = useSearchkitVariables();
  await apolloClient.query({
    query: RESULT_SET_QUERY,
    variables,
  });
  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  };
}
