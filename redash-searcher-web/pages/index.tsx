import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import qs from "qs";
import Client from "@searchkit/instantsearch-client";
import dynamic from "next/dynamic";

const APP_URL = (process.env.NEXT_PUBLIC_APP__URL || "").replace(/\/$/, "");

const searchClient = Client({
  url: `${APP_URL}/api/search`,
});

const urlUpdateAfterMills = 500;

const createURL = (state: any) => `?${qs.stringify(state)}`;

const pathToSearchState = (path: string) =>
  path.includes("?") ? qs.parse(path.substring(path.indexOf("?") + 1)) : {};

interface ISearchState {
  page?: number;
  query?: string;
  refinementList?: {
    [key: string]: string[];
  };
}

const searchStateToURL = (searchState: ISearchState) => {
  // filter empty values from url
  // copy searchState
  searchState = { ...searchState };
  !searchState.page && delete searchState.page;
  !searchState.query && delete searchState.query;
  for (const key in searchState.refinementList) {
    if (!searchState.refinementList[key]) {
      delete searchState.refinementList[key];
    }
  }
  !searchState.refinementList && delete searchState.refinementList;

  return searchState
    ? `${window.location.pathname}?${qs.stringify(searchState)}`
    : "";
};

const App = dynamic(() => import("../components/App"), {
  ssr: false,
});

const DEFAULT_PROPS = {
  searchClient,
  indexName: "redash",
};

export default function Page(props: any) {
  const [searchState, setSearchState] = useState({});
  const router = useRouter();
  const debouncedSetState = useRef<any>();

  useEffect(() => {
    if (router) {
      setSearchState(pathToSearchState(router.asPath));
    }
  }, [router]);

  return (
    <div>
      <App
        {...DEFAULT_PROPS}
        searchState={searchState}
        resultsState={props.resultsState}
        onSearchStateChange={(nextSearchState: any) => {
          clearTimeout(debouncedSetState.current);
          debouncedSetState.current = setTimeout(() => {
            const href = searchStateToURL(nextSearchState);

            router.push(href, href, { shallow: true });
          }, urlUpdateAfterMills);
          setSearchState(nextSearchState);
        }}
        createURL={createURL}
      />
    </div>
  );
}
