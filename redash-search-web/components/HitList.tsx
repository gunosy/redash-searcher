import React from "react";
import {
  EuiFlexGrid,
  EuiFlexItem,
  EuiCard,
  EuiFlexGroup,
  EuiTitle,
  EuiText,
} from "@elastic/eui";
import { IResultHitItem } from "../pages/api/models";

export interface HitListProps {
  hitItems: IResultHitItem[];
}

const HitsList: React.FC<HitListProps> = ({ hitItems }) => {
  return (
    <EuiFlexGrid>
      {hitItems.map((hit) => (
        <EuiFlexItem key={hit.id}>
          <EuiFlexGroup gutterSize="xl">
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem grow={6}>
                  <EuiTitle size="xs">
                    <h6>{hit.fields.name}</h6>
                  </EuiTitle>
                  <EuiText grow={false}>
                    <p>{hit.fields.query}</p>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      ))}
    </EuiFlexGrid>
  );
};

export default HitsList;
