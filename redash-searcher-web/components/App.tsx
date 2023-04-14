import {
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiPageTemplate,
  EuiTitle,
  EuiToolTip,
} from "@elastic/eui";
import { DateRangePicker } from "@algolia/react-instantsearch-widget-date-range-picker";
import React from "react";
import {
  RefinementList,
  SearchBox,
  InstantSearch,
  CurrentRefinements,
  Stats,
  InfiniteHits,
  InstantSearchProps,
  SortBy,
} from "react-instantsearch-dom";
import Hit from "../components/Hit";

interface CurrentRefinementItem {
  id: string;
  index: string;
  attribute: string;
  label: string;
  currentRefinement: string[];
}

const reduceDuplicateRefinement = (items: CurrentRefinementItem[]) => {
  const seen = new Set();
  return items.filter((item: any) => {
    if (seen.has(item.label)) {
      return false;
    } else {
      seen.add(item.label);
      return true;
    }
  });
};

export default function App(props: InstantSearchProps) {
  return (
    <div className="ais-InstantSearch">
      <InstantSearch {...props}>
        <EuiPageTemplate panelled={true}>
          <EuiPageTemplate.Sidebar>
            <EuiTitle size="l">
              <h1>Redash Searcher</h1>
            </EuiTitle>
            <EuiHorizontalRule margin="m" />
            <EuiTitle size="xs">
              <h4>Sorted By</h4>
            </EuiTitle>
            <SortBy
              defaultRefinement="default"
              items={[
                { label: "Relevance", value: "default" },
                { label: "Created At (desc)", value: "created_at_desc" },
                { label: "Updated At (desc)", value: "updated_at_desc" },
                {
                  label: "Last Retrieved At (desc)",
                  value: "retrieved_at_desc",
                },
              ]}
            />
            <EuiHorizontalRule margin="xs" />
            <EuiTitle size="xs">
              <h4>Data Source</h4>
            </EuiTitle>
            <RefinementList
              attribute="data_source_type"
              searchable={true}
              limit={10}
            />
            <EuiHorizontalRule margin="xs" />
            <EuiTitle size="xs">
              <h4>User Name</h4>
            </EuiTitle>
            <RefinementList
              attribute="user_name"
              searchable={true}
              limit={10}
            />
            <EuiHorizontalRule margin="xs" />
            <EuiTitle size="xs">
              <h4>Created At</h4>
            </EuiTitle>
            <DateRangePicker attribute="created_at" />
            <EuiHorizontalRule margin="xs" />
            <EuiTitle size="xs">
              <h4>Updated At</h4>
            </EuiTitle>
            <DateRangePicker attribute="updated_at" />
            <EuiHorizontalRule margin="xs" />
            <EuiTitle size="xs">
              <h4>Last Retrieved At</h4>
            </EuiTitle>
            <DateRangePicker attribute="retrieved_at" />
            <EuiHorizontalRule margin="xs" />
            <EuiTitle size="xs">
              <h4>Tags</h4>
            </EuiTitle>
            <RefinementList attribute="tags" searchable={true} limit={10} />
          </EuiPageTemplate.Sidebar>
          <EuiPageTemplate.Section>
            <EuiFlexGroup gutterSize="s" alignItems="center">
              <EuiFlexItem grow={true}>
                <EuiToolTip
                  content=<span>
                    You can use <EuiCode>AND</EuiCode>, <EuiCode>OR</EuiCode>,
                    and parentheses <EuiCode>()</EuiCode> in your search query
                    to refine your search results. Separated by space,
                    <EuiCode>AND</EuiCode> is the default.
                  </span>
                >
                  <SearchBox />
                </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGroup>
            <Stats />
            <div style={{ margin: "1rem 0" }}>
              <CurrentRefinements transformItems={reduceDuplicateRefinement} />
            </div>
            <InfiniteHits hitComponent={Hit} />
          </EuiPageTemplate.Section>
        </EuiPageTemplate>
      </InstantSearch>
    </div>
  );
}
