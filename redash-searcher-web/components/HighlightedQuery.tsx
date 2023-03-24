import { EuiButtonIcon, EuiCallOut } from "@elastic/eui";
import { useState } from "react";
import { connectHighlight } from "react-instantsearch-dom";

const HighlightQueryInner = ({ highlight, attribute, hit }: any) => {
  const parsedHit = highlight({
    highlightProperty: "_highlightResult",
    attribute,
    hit,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const callOutStyle = isExpanded
    ? {}
    : { maxHeight: "250px", overflow: "auto" };

  return (
    <>
      <EuiCallOut
        style={{
          whiteSpace: "pre-wrap",
          maxWidth: "1000px",
          ...callOutStyle,
        }}
        color={"success"}
      >
        <span
          className="ais-Highlight"
          style={{ maxHeight: "10px", overflow: "auto" }}
        >
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
      {isExpanded && (
        <EuiButtonIcon
          display="empty"
          aria-label="collapse"
          iconType={"arrowUp"}
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ margin: "10px auto", display: "block" }}
        />
      )}
      {!isExpanded && (
        <EuiButtonIcon
          display="empty"
          aria-label="expand"
          iconType={"arrowDown"}
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ margin: "10px auto", display: "block" }}
        />
      )}
    </>
  );
};

const HighlightedQuery = connectHighlight(HighlightQueryInner);

export default HighlightedQuery;
