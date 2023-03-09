import { EuiCallOut } from "@elastic/eui";
import { connectHighlight } from "react-instantsearch-dom";

const HighlightQueryInner = ({ highlight, attribute, hit }: any) => {
  const parsedHit = highlight({
    highlightProperty: "_highlightResult",
    attribute,
    hit,
  });
  return (
    <EuiCallOut
      style={{ whiteSpace: "pre-wrap", maxWidth: "1000px" }}
      color={"success"}
    >
      <span className="ais-Highlight">
        <span>
          {parsedHit.map((part: any, index: number) =>
            part.isHighlighted ? (
              <mark className="ais-Highlight-highlighted" key={index}>
                {part.value}
              </mark>
            ) : (
              <span className="ais-Highlight-nonHighlighted" key={index}>
                {part.value}
              </span>
            )
          )}
        </span>
      </span>
    </EuiCallOut>
  );
};

const HighlightedQuery = connectHighlight(HighlightQueryInner);

export default HighlightedQuery;
