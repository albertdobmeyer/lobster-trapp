import { invoke } from "@tauri-apps/api/core";
import {
  listComponents,
  getComponent,
  runCommand,
  loadOptions,
  startStream,
  stopStream,
  readConfig,
  writeConfig,
  runHealthProbe,
  getStatus,
} from "./tauri";

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  mockInvoke.mockReset();
});

describe("IPC contract: each function calls invoke with correct command and args", () => {
  test("listComponents calls list_components", async () => {
    mockInvoke.mockResolvedValue([]);
    await listComponents();
    expect(mockInvoke).toHaveBeenCalledWith("list_components");
  });

  test("getComponent calls get_component with componentId", async () => {
    mockInvoke.mockResolvedValue({});
    await getComponent("openclaw-vault");
    expect(mockInvoke).toHaveBeenCalledWith("get_component", {
      componentId: "openclaw-vault",
    });
  });

  test("runCommand calls run_command with componentId, commandId, args", async () => {
    mockInvoke.mockResolvedValue({});
    await runCommand("openclaw-vault", "start", { env: "prod" });
    expect(mockInvoke).toHaveBeenCalledWith("run_command", {
      componentId: "openclaw-vault",
      commandId: "start",
      args: { env: "prod" },
    });
  });

  test("runCommand defaults args to empty object", async () => {
    mockInvoke.mockResolvedValue({});
    await runCommand("openclaw-vault", "start");
    expect(mockInvoke).toHaveBeenCalledWith("run_command", {
      componentId: "openclaw-vault",
      commandId: "start",
      args: {},
    });
  });

  test("loadOptions calls load_options with timeout", async () => {
    mockInvoke.mockResolvedValue([]);
    await loadOptions("openclaw-vault", "docker ps", 10);
    expect(mockInvoke).toHaveBeenCalledWith("load_options", {
      componentId: "openclaw-vault",
      commandString: "docker ps",
      timeoutSeconds: 10,
    });
  });

  test("loadOptions defaults timeout to 5", async () => {
    mockInvoke.mockResolvedValue([]);
    await loadOptions("openclaw-vault", "docker ps");
    expect(mockInvoke).toHaveBeenCalledWith("load_options", {
      componentId: "openclaw-vault",
      commandString: "docker ps",
      timeoutSeconds: 5,
    });
  });

  test("startStream calls start_stream", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await startStream("openclaw-vault", "logs", { tail: "100" });
    expect(mockInvoke).toHaveBeenCalledWith("start_stream", {
      componentId: "openclaw-vault",
      commandId: "logs",
      args: { tail: "100" },
    });
  });

  test("stopStream calls stop_stream", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await stopStream("openclaw-vault", "logs");
    expect(mockInvoke).toHaveBeenCalledWith("stop_stream", {
      componentId: "openclaw-vault",
      commandId: "logs",
    });
  });

  test("readConfig calls read_config", async () => {
    mockInvoke.mockResolvedValue("content");
    await readConfig("openclaw-vault", "config.yml");
    expect(mockInvoke).toHaveBeenCalledWith("read_config", {
      componentId: "openclaw-vault",
      configPath: "config.yml",
    });
  });

  test("writeConfig calls write_config", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await writeConfig("openclaw-vault", "config.yml", "new content");
    expect(mockInvoke).toHaveBeenCalledWith("write_config", {
      componentId: "openclaw-vault",
      configPath: "config.yml",
      content: "new content",
    });
  });

  test("runHealthProbe calls run_health_probe with default timeout", async () => {
    mockInvoke.mockResolvedValue({});
    await runHealthProbe("openclaw-vault", "docker ps");
    expect(mockInvoke).toHaveBeenCalledWith("run_health_probe", {
      componentId: "openclaw-vault",
      probeCommand: "docker ps",
      timeoutSeconds: 10,
    });
  });

  test("getStatus calls get_status", async () => {
    mockInvoke.mockResolvedValue({});
    await getStatus("openclaw-vault");
    expect(mockInvoke).toHaveBeenCalledWith("get_status", {
      componentId: "openclaw-vault",
    });
  });
});
