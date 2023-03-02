import React from "react";
import {
  EuiFlexGrid,
  EuiFlexItem,
  EuiCard,
  EuiSpacer,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiAvatar,
} from "@elastic/eui";
import { IResultHitItem } from "../pages/api/models";
import { HighlightedQuery } from "./HighlightedQuery";

export interface HitListProps {
  hitItems: IResultHitItem[];
}

const REDASH_URL = (process.env.NEXT_PUBLIC_REDASH__URL || "").replace(
  /\/$/,
  ""
);

const HitsList: React.FC<HitListProps> = ({ hitItems }) => {
  return (
    <EuiFlexGrid gutterSize="xl">
      {hitItems.map((hit) => (
        <EuiFlexItem key={hit.id} grow={false}>
          <EuiCard
            layout="horizontal"
            icon={
              <EuiAvatar
                name={`logo-${hit.fields.data_source_type}`}
                size="l"
                imageUrl={`${REDASH_URL}/static/images/db-logos/${hit.fields.data_source_type}.png`}
                color="#e0e5ee"
              />
            }
            title={hit.fields.name}
            href={`${REDASH_URL}/queries/${hit.id}/source`}
            description={hit.fields.description}
          >
            <EuiFlexGrid gutterSize="xl">
              <EuiFlexGroup>
                <EuiFlexItem grow={5}>
                  <EuiDescriptionList
                    textStyle="reverse"
                    listItems={[
                      {
                        title: "Data Source Type",
                        description: hit.fields.data_source_type,
                      },
                      {
                        title: "Author",
                        description: hit.fields.user_name,
                      },
                      {
                        title: "Tags",
                        description: hit.fields.tags.join(", ") || "No Tags",
                      },
                    ]}
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={5}>
                  <EuiDescriptionList
                    textStyle="reverse"
                    listItems={[
                      {
                        title: "Data Source Name",
                        description: hit.fields.data_source_name,
                      },
                      {
                        title: "Created At",
                        description: hit.fields.created_at,
                      },
                      {
                        title: "Updated At",
                        description: hit.fields.updated_at,
                      },
                    ]}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexGrid>
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
