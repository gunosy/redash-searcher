import "instantsearch.css/themes/satellite-min.css";
import "../styles.css";
import "@elastic/eui/dist/eui_theme_light.css";

import { EuiProvider } from "@elastic/eui";

export default function App({ Component, pageProps }: any): JSX.Element {
  return (
    <EuiProvider colorMode="light">
      <Component {...pageProps} />
    </EuiProvider>
  );
}
