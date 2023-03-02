export interface IResultHitField {
  id: number;
  name: string;
  description: string;
  query: string;
  url: string;
  user_name: string;
  user_email: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  data_source_name: string;
  data_source_type: string;
}

export interface IResultHitHighlight {
  name: string[];
  query: string[];
}
