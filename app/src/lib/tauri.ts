import { invoke } from "@tauri-apps/api/core";
import type {
  DiscoveredComponent,
  CommandResult,
  ComponentStatus,
} from "./types";

export async function listComponents(): Promise<DiscoveredComponent[]> {
  return invoke<DiscoveredComponent[]>("list_components");
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
