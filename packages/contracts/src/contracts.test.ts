import { describe, expect, it } from "vitest";
import {
  ENV_BINDING_NAMES,
  isAllowedSdlcTransition,
  McpToolNameSchema,
  PersonaSchema,
  RoleSchema,
  SdlcStateSchema,
  SdlcTransitionSchema,
  SessionContextSchema,
  SessionScopeSchema,
  WorkflowRegistrySchema,
} from "./index.js";

describe("shared contracts", () => {
  it("defines the planned roles and specialist personas", () => {
    expect(RoleSchema.parse("MAINTENANCE_ADMIN")).toBe("MAINTENANCE_ADMIN");
    expect(PersonaSchema.parse("SOLUTION_ARCHITECT")).toBe(
      "SOLUTION_ARCHITECT",
    );
    expect(RoleSchema.safeParse("UNKNOWN").success).toBe(false);
    expect(PersonaSchema.safeParse("UNKNOWN").success).toBe(false);
  });

  it("validates a scoped session context", () => {
    const session = {
      userId: "user-1",
      teamId: "team-1",
      repo: "octo/project",
      persona: "DEVELOPER",
      sdlcState: "DEVELOPMENT",
    };

    expect(SessionScopeSchema.parse(session)).toEqual({
      teamId: "team-1",
      repo: "octo/project",
    });
    expect(SessionContextSchema.parse(session)).toEqual(session);
    expect(
      SessionContextSchema.safeParse({ ...session, repo: "not-a-repo" })
        .success,
    ).toBe(false);
  });

  it("allows only declared SDLC transitions", () => {
    expect(SdlcStateSchema.parse("QA")).toBe("QA");
    expect(isAllowedSdlcTransition("QA", "DEVELOPMENT")).toBe(true);
    expect(isAllowedSdlcTransition("COMPLETE", "DEVELOPMENT")).toBe(false);
    expect(
      SdlcTransitionSchema.safeParse({ from: "COMPLETE", to: "DEVELOPMENT" })
        .success,
    ).toBe(false);
  });

  it("validates namespaced MCP tools and workflow registries", () => {
    expect(McpToolNameSchema.parse("cloudflare.deploy_preview")).toBe(
      "cloudflare.deploy_preview",
    );
    expect(McpToolNameSchema.safeParse("deploy preview").success).toBe(false);
    expect(
      WorkflowRegistrySchema.safeParse({
        version: 1,
        workflows: [
          {
            id: "sdlc",
            initialState: "BACKLOG",
            transitions: [
              {
                from: "BACKLOG",
                to: "BUSINESS_ANALYSIS",
                approvalRequired: false,
              },
              {
                from: "BUSINESS_ANALYSIS",
                to: "SOLUTION_ARCHITECTURE",
                approvalRequired: true,
              },
            ],
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      WorkflowRegistrySchema.safeParse({
        version: 1,
        workflows: [
          {
            id: "sdlc",
            initialState: "BACKLOG",
            transitions: [
              {
                from: "COMPLETE",
                to: "DEVELOPMENT",
                approvalRequired: false,
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("publishes stable Cloudflare binding names", () => {
    expect(Object.values(ENV_BINDING_NAMES)).toEqual([
      "ANALYTICS_DB",
      "AUTH_DB",
      "ARTIFACTS_BUCKET",
      "POLICIES_BUCKET",
      "MCP_GATEWAY",
      "FACTORY_WORKFLOWS",
      "AI",
      "USAGE_QUEUE",
    ]);
  });
});
