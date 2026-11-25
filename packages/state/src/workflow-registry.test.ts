import { WorkflowRegistrySchema } from "@software-factory/contracts";
import { expect, it } from "vitest";
import registry from "../_platform/workflow_registry.json" with {
  type: "json",
};

it("keeps the seeded SDLC registry aligned with the shared contract", () => {
  expect(WorkflowRegistrySchema.parse(registry).workflows).toHaveLength(1);
});
