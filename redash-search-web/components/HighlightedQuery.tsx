import { EuiCallOut, EuiText } from "@elastic/eui";
import dompurify from "dompurify";

export interface HighlightedQueryProps {
  query: string;
}

export const HighlightedQuery: React.FC<HighlightedQueryProps> = ({
  query,
}: HighlightedQueryProps) => {
  const sanitizer = dompurify.sanitize;
  return (
    <EuiCallOut>
      <p
        style={{ whiteSpace: "pre-wrap" }}
        dangerouslySetInnerHTML={{
          __html: sanitizer(query),
        }}
      />
    </EuiCallOut>
  );
};
