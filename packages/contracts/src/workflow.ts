import { z } from "zod";
import { SdlcStateSchema, WorkflowTransitionSchema } from "./sdlc.js";

export const WorkflowDefinitionSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    initialState: SdlcStateSchema,
    transitions: z.array(WorkflowTransitionSchema).min(1),
  })
  .superRefine(({ initialState, transitions }, context) => {
    const seen = new Set<string>();

    for (const [index, transition] of transitions.entries()) {
      const key = `${transition.from}:${transition.to}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate transition: ${key}`,
          path: ["transitions", index],
        });
      }
      seen.add(key);
    }

    if (!transitions.some(({ from }) => from === initialState)) {
      context.addIssue({
        code: "custom",
        message: "The initial state must have an outgoing transition",
        path: ["initialState"],
      });
    }
  });
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

export const WorkflowRegistrySchema = z
  .object({
    version: z.literal(1),
    workflows: z.array(WorkflowDefinitionSchema).min(1),
  })
  .superRefine(({ workflows }, context) => {
    const seen = new Set<string>();

    for (const [index, workflow] of workflows.entries()) {
      if (seen.has(workflow.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate workflow id: ${workflow.id}`,
          path: ["workflows", index, "id"],
        });
      }
      seen.add(workflow.id);
    }
  });
export type WorkflowRegistry = z.infer<typeof WorkflowRegistrySchema>;
