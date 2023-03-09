import { Hit as HitCore } from "react-instantsearch-core";
import { IResultHitField } from "../pages/api/models";
import {
  EuiFlexGrid,
  EuiFlexItem,
  EuiCard,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiAvatar,
} from "@elastic/eui";
import HighlightedQuery from "./HighlightedQuery";

export interface HitProps {
  hit: HitCore<IResultHitField>;
}

const REDASH_URL = (process.env.NEXT_PUBLIC_REDASH__URL || "").replace(
  /\/$/,
  ""
);

const Hit: React.FC<HitProps> = ({ hit }: HitProps) => {
  return (
    <EuiCard
      layout="horizontal"
      icon={
        <EuiAvatar
          name={`logo-${hit.data_source_type}`}
          size="l"
          imageUrl={`${REDASH_URL}/static/images/db-logos/${hit.data_source_type}.png`}
          color="#e0e5ee"
        />
      }
      title={hit.name}
      href={`${REDASH_URL}/queries/${hit.id}/source`}
      description={hit.description}
    >
      <EuiFlexGrid gutterSize="xl">
        <EuiFlexGroup>
          <EuiFlexItem grow={5}>
            <EuiDescriptionList
              textStyle="reverse"
              listItems={[
                {
                  title: "Data Source Type",
                  description: hit.data_source_type,
                },
                {
                  title: "Author",
                  description: hit.user_name,
                },
                {
                  title: "Tags",
                  description: hit.tags.join(", ") || "No Tags",
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
                  description: hit.data_source_name,
                },
                {
                  title: "Created At",
                  description: hit.created_at,
                },
                {
                  title: "Updated At",
                  description: hit.updated_at,
                },
              ]}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        {hit._highlightResult.query?.matchedWords.length !== 0 && (
          <EuiFlexGroup>
            <EuiFlexItem grow={5}>
              <HighlightedQuery hit={hit} attribute="query"></HighlightedQuery>
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </EuiFlexGrid>
    </EuiCard>
  );
};

export default Hit;
