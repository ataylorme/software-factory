import { z } from "zod";

export const McpToolNameSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+$/,
    "Expected a namespaced MCP tool name such as cloudflare.deploy_preview",
  );
export type McpToolName = z.infer<typeof McpToolNameSchema>;
