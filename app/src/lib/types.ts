// Types matching the component.yml manifest schema and Rust structs

export type Role = "runtime" | "toolchain" | "network" | "placeholder";
export type CommandGroup = "lifecycle" | "operations" | "monitoring" | "maintenance";
export type CommandType = "action" | "query" | "stream";
export type Danger = "safe" | "caution" | "destructive";
export type OutputFormat = "text" | "ansi" | "json" | "jsonl" | "sarif";
export type OutputDisplay =
  | "log"
  | "table"
  | "badge"
  | "checklist"
  | "card-grid"
  | "terminal"
  | "report";
export type ConfigFormat = "yaml" | "json" | "json5" | "env" | "line-list";
export type ParseType = "regex" | "json_path" | "line_count" | "exit_code";

export interface Identity {
  id: string;
  name: string;
  version: string;
  description: string;
  role: Role;
  icon?: string;
  color?: string;
  repo?: string;
}

export interface StateDefinition {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

export interface ProbeRule {
  exit_code?: number;
  stdout_contains?: string;
  stdout_regex?: string;
  state: string;
}

export interface StatusProbe {
  command: string;
  interval_seconds: number;
  timeout_seconds: number;
  rules: ProbeRule[];
}

export interface StatusConfig {
  states: StateDefinition[];
  probes: StatusProbe[];
  default_state?: string;
}

export interface OptionsFrom {
  command: string;
  timeout_seconds: number;
}

export interface Arg {
  id: string;
  name: string;
  description?: string;
  type: "string" | "enum" | "boolean" | "number";
  required: boolean;
  default?: unknown;
  options: string[];
  options_from?: OptionsFrom;
}

export interface Output {
  format: OutputFormat;
  display: OutputDisplay;
}

export interface Command {
  id: string;
  name: string;
  description?: string;
  group: CommandGroup;
  type: CommandType;
  danger: Danger;
  command: string;
  args: Arg[];
  output?: Output;
  available_when: string[];
  sort_order: number;
  timeout_seconds: number;
}

export interface LineListMeta {
  item_label?: string;
  pattern?: string;
  example?: string;
}

export interface Config {
  path: string;
  name?: string;
  description?: string;
  format: ConfigFormat;
  editable: boolean;
  danger: Danger;
  schema?: Record<string, unknown>;
  line_list?: LineListMeta;
  restart_required: boolean;
  restart_command?: string;
}

export interface HealthParse {
  type: ParseType;
  expression?: string;
  format?: string;
}

export interface HealthThresholds {
  green?: string;
  yellow?: string;
  red?: string;
}

export interface HealthProbe {
  id: string;
  name: string;
  command: string;
  interval_seconds: number;
  timeout_seconds: number;
  parse: HealthParse;
  thresholds?: HealthThresholds;
}

export interface PrereqConfigFile {
  path: string;
  template?: string;
  description?: string;
}

export interface Prerequisites {
  container_runtime: boolean;
  setup_command?: string;
  config_files: PrereqConfigFile[];
  check_command?: string;
}

export interface Manifest {
  identity: Identity;
  status?: StatusConfig;
  commands: Command[];
  configs: Config[];
  health: HealthProbe[];
  prerequisites?: Prerequisites;
}

export interface DiscoveredComponent {
  manifest: Manifest;
  component_dir: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_ms: number;
}

export interface ComponentStatus {
  component_id: string;
  state_id: string;
}

export interface StreamLine {
  component_id: string;
  command_id: string;
  line: string;
  stream: "stdout" | "stderr";
}

export interface StreamEnd {
  component_id: string;
  command_id: string;
  exit_code: number;
}

// Group commands by their group field
export const COMMAND_GROUP_ORDER: CommandGroup[] = [
  "lifecycle",
  "operations",
  "monitoring",
  "maintenance",
];

export const COMMAND_GROUP_LABELS: Record<CommandGroup, string> = {
  lifecycle: "Lifecycle",
  operations: "Operations",
  monitoring: "Monitoring",
  maintenance: "Maintenance",
};

export const DANGER_STYLES: Record<Danger, string> = {
  safe: "btn-safe",
  caution: "btn-caution",
  destructive: "btn-destructive",
};
