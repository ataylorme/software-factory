export const ENV_BINDING_NAMES = {
  analyticsDatabase: "ANALYTICS_DB",
  authenticationDatabase: "AUTH_DB",
  artifactsBucket: "ARTIFACTS_BUCKET",
  policiesBucket: "POLICIES_BUCKET",
  mcpGateway: "MCP_GATEWAY",
  factoryWorkflows: "FACTORY_WORKFLOWS",
  ai: "AI",
  usageQueue: "USAGE_QUEUE",
} as const;

export type EnvBindingName =
  (typeof ENV_BINDING_NAMES)[keyof typeof ENV_BINDING_NAMES];

export interface Env<
  AnalyticsDatabase = unknown,
  AuthenticationDatabase = unknown,
  ArtifactsBucket = unknown,
  PoliciesBucket = unknown,
  McpGateway = unknown,
  FactoryWorkflows = unknown,
  Ai = unknown,
  UsageQueue = unknown,
> {
  ANALYTICS_DB: AnalyticsDatabase;
  AUTH_DB: AuthenticationDatabase;
  ARTIFACTS_BUCKET: ArtifactsBucket;
  POLICIES_BUCKET: PoliciesBucket;
  MCP_GATEWAY: McpGateway;
  FACTORY_WORKFLOWS: FactoryWorkflows;
  AI: Ai;
  USAGE_QUEUE: UsageQueue;
}
