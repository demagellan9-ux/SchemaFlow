import { z } from "zod";

export const transformationRuleSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  params: z.record(z.unknown()),
  order: z.number().int().,min(0),
});

export const saveTransformationSchema = z.object({
  schema_id: z.string().uuid(),
  dest_column: z.string().min(1),
  rules: z.array(transformationRuleSchema),
});

export type TransformationRule = z.infer<typeof transformationRuleSchema>;
export type SaveTransformationRequest = z.infer<typeof saveTransformationSchema>;

export type TransformationRuleSet = {
  version: number;
  rules: TransformationRule[];
};

export type Transformation = {
  id: string;
  schema_id: string;
  dest_column: string;
  rules: TransformationRuleSet;
  created_at: string;
  updated_at: string;
};

export type RegistryEntry = {
  type: string;
  label: string;
  description: string;
  params_schema: Record<string, unknown>;
};

export type TransformationRegistryResponse = {
  registry: RegistryEntry[];
};

export type TransformationListResponse = {
  items: Transformation[];
  next_cursor: string | null;
};
