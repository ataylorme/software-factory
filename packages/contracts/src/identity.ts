import { z } from "zod";
import { SdlcStateSchema } from "./sdlc.js";

export const RoleSchema = z.enum([
  "MAINTENANCE_ADMIN",
  "TEAM_ADMIN",
  "REPOSITORY_ADMIN",
  "CONTRIBUTOR",
  "READER",
]);
export type Role = z.infer<typeof RoleSchema>;

export const PersonaSchema = z.enum([
  "BUSINESS_ANALYST",
  "SOLUTION_ARCHITECT",
  "DEVELOPER",
  "QA",
  "DEVOPS",
]);
export type Persona = z.infer<typeof PersonaSchema>;

export const RepositoryNameSchema = z
  .string()
  .regex(/^[^/\s]+\/[^/\s]+$/, "Expected a repository in owner/name format");

export const SessionScopeSchema = z.object({
  teamId: z.string().trim().min(1),
  repo: RepositoryNameSchema,
});
export type SessionScope = z.infer<typeof SessionScopeSchema>;

export const SessionContextSchema = SessionScopeSchema.extend({
  userId: z.string().trim().min(1),
  persona: PersonaSchema,
  sdlcState: SdlcStateSchema,
});
export type SessionContext = z.infer<typeof SessionContextSchema>;
