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
  SelectedFilters,
  SortingSelector,
  ResetSearchButton,
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
  EuiHeader,
  EuiHeaderSection,
  EuiPageSection,
  EuiSpacer,
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
        appliedFilters {
          id
          identifier
          display
          label
          ... on DateRangeSelectedFilter {
            dateMin
            dateMax
          }

          ... on NumericRangeSelectedFilter {
            min
            max
          }

          ... on ValueSelectedFilter {
            value
          }
        }
        sortOptions {
          id
          label
        }
        query
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
            highlight {
              name
              query
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
  const [loadResultSet, { called, loading, data }] = useLazyQuery(
    RESULT_SET_QUERY,
    {
      variables,
    }
  );
  useEffect(() => {
    loadResultSet();
  }, []);
  if (loading) {
    return <div></div>;
  }
  const Facets = FacetsList([]);
  return (
    <EuiPageTemplate panelled={true}>
      <EuiPageTemplate.Sidebar>
        <SearchBar loading={loading} />
        <EuiHorizontalRule margin="l" />
        <Facets data={data?.results || { facets: [] }} loading={loading} />
      </EuiPageTemplate.Sidebar>
      <EuiPageTemplate.Header>
        <EuiPageHeaderSection>
          <EuiTitle size="l">
            <h1>Redash Search</h1>
          </EuiTitle>
        </EuiPageHeaderSection>
        <EuiPageHeaderSection>
          <ResetSearchButton loading={loading} />
        </EuiPageHeaderSection>
      </EuiPageTemplate.Header>
      <EuiPageTemplate.Section>
        <EuiTitle size="s">
          <h2>{data?.results.summary.total} Results</h2>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiTitle size="s">
          <SelectedFilters
            data={data?.results || { filters: [] }}
            loading={loading}
          />
        </EuiTitle>
      </EuiPageTemplate.Section>
      <EuiPageTemplate.Section>
        <HitsList hitItems={data?.results.hits.items || []} />
        <EuiFlexGroup justifyContent="spaceAround">
          <Pagination data={data?.results} />
        </EuiFlexGroup>
      </EuiPageTemplate.Section>
    </EuiPageTemplate>
  );
};

export default Search;
