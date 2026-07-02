export type MappingEntry = {
  source_col: string;
  dest_col: string | null;
  confidence: number;
  user_confirmed: boolean;
};

export type MappingData = {
  version: number;
  entries: MappingEntry[];
};

export type Mapping = {
  id: string;
  upload_id: string;
  schema_id: string;
  user_id: string;
  mapping_data: MappingData;
  created_at: string;
  updated_at: string;
};
