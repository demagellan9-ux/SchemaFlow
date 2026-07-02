// Mirrors FastAPI MappingResponse, AutoMapResponse

export type MappingEntry = {
  source_col: string;
  dest_col: string | null;  // null = explicitly unmapped
  confidence: number;       // 0–100
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

export type AutoMapSuggestion = {
  source_col: string;
  dest_col: string;
  confidence: number;
};

export type AutoMapResponse = {
  upload_id: string;
  schema_id: string;
  suggestions: AutoMapSuggestion[];
  unmatched_sources: string[];
  unmatched_destinations: string[];
};

export type SaveMappingRequest = {
  upload_id: string;
  schema_id: string;
  entries: Array<{
    source_col: string;
    dest_col: string | null;
    user_confirmed: boolean;
  }>;
};
