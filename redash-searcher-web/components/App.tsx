import { DateRangePicker } from "@algolia/react-instantsearch-widget-date-range-picker";
import { EuiHorizontalRule, EuiPageTemplate, EuiTitle } from "@elastic/eui";
import React from "react";
import {
  RefinementList,
  SearchBox,
  InstantSearch,
  CurrentRefinements,
  Stats,
  InfiniteHits,
  InstantSearchProps,
  RangeSlider,
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
            <RangeSlider attribute="updated_at" />
            <EuiHorizontalRule margin="xs" />
            <EuiTitle size="xs">
              <h4>Tags</h4>
            </EuiTitle>
            <RefinementList attribute="tags" searchable={true} limit={10} />
          </EuiPageTemplate.Sidebar>
          <EuiPageTemplate.Section>
            <SearchBox />
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
