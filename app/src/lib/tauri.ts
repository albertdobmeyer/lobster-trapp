import { invoke } from "@tauri-apps/api/core";
import type {
  DiscoveredComponent,
  CommandResult,
  ComponentStatus,
} from "./types";

export async function listComponents(): Promise<DiscoveredComponent[]> {
  return invoke<DiscoveredComponent[]>("list_components");
}

export async function setMonorepoRoot(
  path: string,
): Promise<DiscoveredComponent[]> {
  return invoke<DiscoveredComponent[]>("set_monorepo_root", { path });
}

export async function getComponent(
  componentId: string,
): Promise<DiscoveredComponent> {
  return invoke<DiscoveredComponent>("get_component", {
    componentId,
  });
}

export async function runCommand(
  componentId: string,
  commandId: string,
  args: Record<string, string> = {},
): Promise<CommandResult> {
  return invoke<CommandResult>("run_command", {
    componentId,
    commandId,
    args,
  });
}

export async function loadOptions(
  componentId: string,
  commandString: string,
  timeoutSeconds: number = 5,
): Promise<string[]> {
  return invoke<string[]>("load_options", {
    componentId,
    commandString,
    timeoutSeconds,
  });
}

export async function startStream(
  componentId: string,
  commandId: string,
  args: Record<string, string> = {},
): Promise<void> {
  return invoke("start_stream", {
    componentId,
    commandId,
    args,
  });
}

export async function stopStream(
  componentId: string,
  commandId: string,
): Promise<void> {
  return invoke("stop_stream", {
    componentId,
    commandId,
  });
}

export async function readConfig(
  componentId: string,
  configPath: string,
): Promise<string> {
  return invoke<string>("read_config", {
    componentId,
    configPath,
  });
}

export async function writeConfig(
  componentId: string,
  configPath: string,
  content: string,
): Promise<void> {
  return invoke("write_config", {
    componentId,
    configPath,
    content,
  });
}

export async function runHealthProbe(
  componentId: string,
  probeCommand: string,
  timeoutSeconds: number = 10,
): Promise<{ probe_id: string; stdout: string; stderr: string; exit_code: number }> {
  return invoke("run_health_probe", {
    componentId,
    probeCommand,
    timeoutSeconds,
  });
}

export async function getStatus(
  componentId: string,
): Promise<ComponentStatus> {
  return invoke<ComponentStatus>("get_status", {
    componentId,
  });
}

export interface PrerequisiteReport {
  container_runtime: {
    found: boolean;
    name: string | null;
    version: string | null;
  };
  submodules: Array<{
    id: string;
    name: string;
    cloned: boolean;
    has_manifest: boolean;
  }>;
  components: Array<{
    component_id: string;
    component_name: string;
    needs_container_runtime: boolean;
    missing_config_files: Array<{
      path: string;
      template: string | null;
      description: string | null;
    }>;
    check_passed: boolean | null;
  }>;
}

export async function checkPrerequisites(): Promise<PrerequisiteReport> {
  return invoke<PrerequisiteReport>("check_prerequisites");
}

export async function initSubmodules(): Promise<string> {
  return invoke<string>("init_submodules");
}

export async function createConfigFromTemplate(
  componentId: string,
  configPath: string,
  templatePath: string,
): Promise<void> {
  return invoke("create_config_from_template", {
    componentId,
    configPath,
    templatePath,
  });
}
