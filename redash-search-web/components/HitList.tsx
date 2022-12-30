import React from "react";
import {
  EuiFlexGrid,
  EuiFlexItem,
  EuiCard,
  EuiFlexGroup,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiButtonEmpty,
  EuiButton,
  EuiLink,
} from "@elastic/eui";
import { IResultHitItem } from "../pages/api/models";
import { HighlightedQuery } from "./HighlightedQuery";

export interface HitListProps {
  hitItems: IResultHitItem[];
}

const HitsList: React.FC<HitListProps> = ({ hitItems }) => {
  return (
    <EuiFlexGrid gutterSize="xl">
      {hitItems.map((hit) => (
        <EuiFlexItem key={hit.id} grow={false}>
          <EuiCard
            layout="horizontal"
            title={hit.fields.name}
            href={hit.fields.url}
          >
            {hit.highlight.query && (
              <>
                <EuiSpacer />
                <HighlightedQuery
                  query={hit.highlight.query
                    .reduce((acc, cur) => acc + "\n...\n" + cur)
                    .replaceAll("\n", "<br/>")}
                />
              </>
            )}
          </EuiCard>
        </EuiFlexItem>
      ))}
    </EuiFlexGrid>
  );
};

export default HitsList;
