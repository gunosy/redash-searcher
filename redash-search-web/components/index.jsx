import { useQuery, gql } from "@apollo/client";
import {
  withSearchkit,
  useSearchkitVariables,
  withSearchkitRouting,
  useSearchkitQueryValue,
  useSearchkit,
  FilterLink,
  PaginationLink,
} from "@searchkit/client";
import withApollo from "../hocs/withApollo";
import { getDataFromTree } from "@apollo/client/react/ssr";
import { useState } from "react";
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiPageSideBar,
  EuiTitle,
  EuiHorizontalRule,
  EuiButtonGroup,
  EuiFlexGroup,
  EuiFlexItem,
} from "@elastic/eui";
import exp from "constants";

function SearchBar() {
  const [query, setQuery] = useSearchkitQueryValue();
  const api = useSearchkit();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        api.setQuery(query);
        api.search();
      }}
    >
      <input
        type="search"
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
        }}
      />
    </form>
  );
}

const App = () => {
  const query = gql`
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
      }
    }
  `;
  const variables = useSearchkitVariables();
  const { previousData, data = previousData } = useQuery(query, {
    variables,
  });
  const [viewType, setViewType] = useState("list");
  const Facets = FacetsList([]);
  return (
    <EuiPage>
      <EuiPageSideBar>
        <SearchBar loading={loading} />
        <EuiHorizontalRule margin="m" />
        <Facets data={data?.results} loading={loading} />
      </EuiPageSideBar>
      <EuiPageBody component="div">
        <EuiPageHeader>
          <EuiPageHeaderSection>
            <EuiTitle size="l">
              <SelectedFilters data={data?.results} loading={loading} />
            </EuiTitle>
          </EuiPageHeaderSection>
          <EuiPageHeaderSection>
            <ResetSearchButton loading={loading} />
          </EuiPageHeaderSection>
        </EuiPageHeader>
        <EuiPageContent>
          <EuiPageContentHeader>
            <EuiPageContentHeaderSection>
              <EuiTitle size="s">
                <h2>{data?.results.summary.total} Results</h2>
              </EuiTitle>
            </EuiPageContentHeaderSection>
            <EuiPageContentHeaderSection>
              <EuiFlexGroup>
                <EuiFlexItem grow={1}>
                  <SortingSelector data={data?.results} loading={loading} />
                </EuiFlexItem>
                <EuiFlexItem grow={2}>
                  <EuiButtonGroup
                    legend=""
                    options={[
                      {
                        id: `grid`,
                        label: "Grid",
                      },
                      {
                        id: `list`,
                        label: "List",
                      },
                    ]}
                    idSelected={viewType}
                    onChange={(id) => setViewType(id)}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPageContentHeaderSection>
          </EuiPageContentHeader>
          <EuiPageContentBody>
            {viewType === "grid" ? (
              <HitsGrid data={data} />
            ) : (
              <HitsList data={data} />
            )}
            <EuiFlexGroup justifyContent="spaceAround">
              <Pagination data={data?.results} />
            </EuiFlexGroup>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default App;
