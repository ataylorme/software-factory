import { z } from "zod";

export const SdlcStateSchema = z.enum([
  "BACKLOG",
  "BUSINESS_ANALYSIS",
  "SOLUTION_ARCHITECTURE",
  "DEVELOPMENT",
  "QA",
  "DEVOPS",
  "COMPLETE",
]);
export type SdlcState = z.infer<typeof SdlcStateSchema>;

export const SDLC_TRANSITIONS = [
  ["BACKLOG", "BUSINESS_ANALYSIS"],
  ["BUSINESS_ANALYSIS", "SOLUTION_ARCHITECTURE"],
  ["SOLUTION_ARCHITECTURE", "DEVELOPMENT"],
  ["DEVELOPMENT", "QA"],
  ["QA", "DEVELOPMENT"],
  ["QA", "DEVOPS"],
  ["DEVOPS", "COMPLETE"],
] as const satisfies readonly (readonly [SdlcState, SdlcState])[];

export function isAllowedSdlcTransition(
  from: SdlcState,
  to: SdlcState,
): boolean {
  return SDLC_TRANSITIONS.some(
    ([source, destination]) => source === from && destination === to,
  );
}

const SdlcTransitionShape = z.object({
  from: SdlcStateSchema,
  to: SdlcStateSchema,
});

export const SdlcTransitionSchema = SdlcTransitionShape.refine(
  ({ from, to }) => isAllowedSdlcTransition(from, to),
  { message: "Transition is not allowed by the SDLC state machine" },
);
export type SdlcTransition = z.infer<typeof SdlcTransitionSchema>;

export const WorkflowTransitionSchema = SdlcTransitionShape.extend({
  approvalRequired: z.boolean(),
}).refine(({ from, to }) => isAllowedSdlcTransition(from, to), {
  message: "Transition is not allowed by the SDLC state machine",
});
export type WorkflowTransition = z.infer<typeof WorkflowTransitionSchema>;
