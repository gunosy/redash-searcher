import { ApolloProvider } from "@apollo/client";
import "@elastic/eui/dist/eui_theme_light.css";
import type { AppProps } from "next/app";
import { useApollo } from "../lib/apolloClient";
import { EuiProvider } from "@elastic/eui";

export default function App({ Component, pageProps }: AppProps) {
  const apolloClient = useApollo(pageProps.initialApolloState);

  return (
    <EuiProvider>
      <ApolloProvider client={apolloClient}>
        <Component {...pageProps} />
      </ApolloProvider>
    </EuiProvider>
  );
}
