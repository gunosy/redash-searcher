export interface IResultHitField {
  name: string;
  query: string;
  url: string;
}

export interface IResultHitHighlight {
  name: string[];
  query: string[];
}

export interface IResultHitItem {
  id: string;
  fields: IResultHitField;
  highlight: IResultHitHighlight;
}
