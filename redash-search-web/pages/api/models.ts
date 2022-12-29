export interface IResultField {
  name: string;
  query: string;
  url: string;
}

export interface IResultHitItem {
  id: string;
  fields: IResultField;
}
