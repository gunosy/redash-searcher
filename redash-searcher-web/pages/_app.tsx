import "instantsearch.css/themes/satellite-min.css";
import "../styles.css";
import "@elastic/eui/dist/eui_theme_light.css";
import { defineCustomElements } from "@duetds/date-picker/dist/loader";
import { EuiProvider } from "@elastic/eui";
import { useEffect } from "react";

export default function App({ Component, pageProps }: any): JSX.Element {
  useEffect(() => {
    defineCustomElements();
  }, []);
  return (
    <EuiProvider colorMode="light">
      <Component {...pageProps} />
    </EuiProvider>
  );
}
