import { z } from "zod";

// ── Zod schemas ───────────────────────────────────────────────────────────────

export const columnTypeSchema = z.enum(["string", "integer", "float", "date", "boolean"]);

export const validationRuleSchema = z.object({
  type: z.enum(["required", "regex_match", "range", "allowed_values", "type_check"]),
  params: z.record(z.unknown()).default({}),
});

export const destinationColumnSchema = z.object({
  name: z.string().min(1, "Column name is required"),
  display_name: z.string().optional(),
  type: columnTypeSchema,
  nullable: z.boolean(),
  date_format: z.string().optional(),
  validation_rules: z.array(validationRuleSchema).default([]),
});

export const createSchemaSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  columns: z.array(destinationColumnSchema).min(1, "At least one column is required"),
});

export type ColumnType = z.infer<typeof columnTypeSchema>;
export type ValidationRule = z.infer<typeof validationRuleSchema>;
export type DestinationColumn = z.infer<typeof destinationColumnSchema>;
export type CreateSchemaInput = z.infer<typeof createSchemaSchema>;

// ── API response types (mirror FastAPI SchemaResponse) ────────────────────────

export type SchemaDefinition = {
  version: number;
  columns: DestinationColumn[];
};

export type Schema = {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  definition: SchemaDefinition;
  created_at: string;
  updated_at: string;
};

export type SchemaListResponse = {
  items: Schema[];
  next_cursor: string | null;
};
