import { z } from "zod";

export const columnTypeSchema = z.enum(["string", "integer", "float", "date", "boolean"]);

export const destinationColumnSchema = z.object({
  name: z.string().min(1),
  display_name: z.string().optional(),
  type: columnTypeSchema,
  nullable: z.boolean(),
  date_format: z.string().optional(),
});

export const createSchemaSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  columns: z.array(destinationColumnSchema).min(1, "At least one column is required"),
});

export type DestinationColumn = z.infer<typeof destinationColumnSchema>;
export type CreateSchemaInput = z.infer<typeof createSchemaSchema>;

export type Schema = {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  definition: {
    version: number;
    columns: DestinationColumn[];
  };
  created_at: string;
  updated_at: string;
};
