import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Command, StreamLine } from "@/lib/types";
import { useCommandStream } from "@/hooks/useCommandStream";
import { useCommand } from "@/hooks/useCommand";
import StreamOutput from "./StreamOutput";
import CommandPanel from "./CommandPanel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockStart = vi.fn();
const mockStop = vi.fn();

vi.mock("@/hooks/useCommandStream", () => ({
  useCommandStream: vi.fn(() => ({
    lines: [] as StreamLine[],
    streaming: false,
    exitCode: null,
    start: mockStart,
    stop: mockStop,
  })),
}));

const mockExecute = vi.fn().mockResolvedValue(undefined);
const mockClear = vi.fn();

vi.mock("@/hooks/useCommand", () => ({
  useCommand: vi.fn(() => ({
    result: null,
    running: false,
    error: null,
    execute: mockExecute,
    clear: mockClear,
  })),
}));

vi.mock("./renderers/AnsiLine", () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock("./CommandButton", () => ({
  default: ({
    command,
    disabled,
    running,
    onClick,
  }: {
    command: Command;
    disabled?: boolean;
    running?: boolean;
    onClick: () => void;
  }) => (
    <button
      data-testid={`cmd-${command.id}`}
      disabled={disabled}
      data-running={running}
      onClick={onClick}
    >
      {command.name}
    </button>
  ),
}));

vi.mock("./ArgumentForm", () => ({
  default: ({
    onSubmit,
    onCancel,
  }: {
    onSubmit: (args: Record<string, string>) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="arg-form">
      <button onClick={() => onSubmit({})}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("./ConfirmDialog", () => ({
  default: ({
    open,
    onConfirm,
    onCancel,
    title,
  }: {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
  }) =>
    open ? (
      <div data-testid="confirm-dialog">
        <span>{title}</span>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock("./OutputRenderer", () => ({
  default: ({
    result,
    display,
  }: {
    result: { stdout: string };
    display: string;
  }) => (
    <div data-testid="output-renderer" data-display={display}>
      {result.stdout}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCommand(overrides: Partial<Command> = {}): Command {
  return {
    id: "test-cmd",
    name: "Test Command",
    description: "A test command",
    group: "operations",
    type: "action",
    danger: "safe",
    command: "echo test",
    args: [],
    output: { format: "text", display: "log" },
    available_when: [],
    sort_order: 0,
    tier: "user",
    timeout_seconds: 30,
    ...overrides,
  };
}

function makeLine(text: string, stream: "stdout" | "stderr" = "stdout"): StreamLine {
  return {
    component_id: "vault",
    command_id: "logs",
    line: text,
    stream,
  };
}

// ---------------------------------------------------------------------------
// StreamOutput tests
// ---------------------------------------------------------------------------

describe("StreamOutput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("calls start(args) on mount", () => {
    vi.mocked(useCommandStream).mockReturnValue({
      lines: [],
      streaming: true,
      exitCode: null,
      start: mockStart,
      stop: mockStop,
    });

    const args = { level: "debug" };
    render(
      <StreamOutput
        componentId="vault"
        commandId="logs"
        args={args}
        onStop={vi.fn()}
      />,
    );

    expect(mockStart).toHaveBeenCalledWith(args);
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  test("shows 'Waiting for output...' when streaming with no lines", () => {
    vi.mocked(useCommandStream).mockReturnValue({
      lines: [],
      streaming: true,
      exitCode: null,
      start: mockStart,
      stop: mockStop,
    });

    render(
      <StreamOutput
        componentId="vault"
        commandId="logs"
        args={{}}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByText("Waiting for output...")).toBeInTheDocument();
  });

  test("renders lines when provided", () => {
    vi.mocked(useCommandStream).mockReturnValue({
      lines: [
        makeLine("line one"),
        makeLine("line two"),
        makeLine("error line", "stderr"),
      ],
      streaming: true,
      exitCode: null,
      start: mockStart,
      stop: mockStop,
    });

    render(
      <StreamOutput
        componentId="vault"
        commandId="logs"
        args={{}}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByText("line one")).toBeInTheDocument();
    expect(screen.getByText("line two")).toBeInTheDocument();
    expect(screen.getByText("error line")).toBeInTheDocument();
    // "Waiting for output..." should NOT appear when lines exist
    expect(screen.queryByText("Waiting for output...")).not.toBeInTheDocument();
  });

  test("shows Stop button while streaming", () => {
    vi.mocked(useCommandStream).mockReturnValue({
      lines: [],
      streaming: true,
      exitCode: null,
      start: mockStart,
      stop: mockStop,
    });

    render(
      <StreamOutput
        componentId="vault"
        commandId="logs"
        args={{}}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByText("Stop")).toBeInTheDocument();
    expect(screen.queryByText("Close")).not.toBeInTheDocument();
  });

  test("shows Close button when not streaming", () => {
    vi.mocked(useCommandStream).mockReturnValue({
      lines: [makeLine("done")],
      streaming: false,
      exitCode: 0,
      start: mockStart,
      stop: mockStop,
    });

    render(
      <StreamOutput
        componentId="vault"
        commandId="logs"
        args={{}}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByText("Close")).toBeInTheDocument();
    expect(screen.queryByText("Stop")).not.toBeInTheDocument();
  });

  test("shows exit code when available (green for 0)", () => {
    vi.mocked(useCommandStream).mockReturnValue({
      lines: [],
      streaming: false,
      exitCode: 0,
      start: mockStart,
      stop: mockStop,
    });

    render(
      <StreamOutput
        componentId="vault"
        commandId="logs"
        args={{}}
        onStop={vi.fn()}
      />,
    );

    const badge = screen.getByText("exit 0");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-green-500");
  });

  test("shows exit code when available (red for non-zero)", () => {
    vi.mocked(useCommandStream).mockReturnValue({
      lines: [],
      streaming: false,
      exitCode: 1,
      start: mockStart,
      stop: mockStop,
    });

    render(
      <StreamOutput
        componentId="vault"
        commandId="logs"
        args={{}}
        onStop={vi.fn()}
      />,
    );

    const badge = screen.getByText("exit 1");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-red-400");
  });

  test("calls stop() and onStop() when Stop is clicked", async () => {
    mockStop.mockResolvedValue(undefined);
    const onStop = vi.fn();

    vi.mocked(useCommandStream).mockReturnValue({
      lines: [],
      streaming: true,
      exitCode: null,
      start: mockStart,
      stop: mockStop,
    });

    render(
      <StreamOutput
        componentId="vault"
        commandId="logs"
        args={{}}
        onStop={onStop}
      />,
    );

    fireEvent.click(screen.getByText("Stop"));

    // stop() is async, so we wait for the onStop callback
    await vi.waitFor(() => {
      expect(mockStop).toHaveBeenCalledTimes(1);
      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  test("shows 'Stream ended' text when not streaming", () => {
    vi.mocked(useCommandStream).mockReturnValue({
      lines: [makeLine("done")],
      streaming: false,
      exitCode: 0,
      start: mockStart,
      stop: mockStop,
    });

    render(
      <StreamOutput
        componentId="vault"
        commandId="logs"
        args={{}}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByText(/Stream ended/)).toBeInTheDocument();
  });

  test("shows 'Streaming' text when streaming", () => {
    vi.mocked(useCommandStream).mockReturnValue({
      lines: [],
      streaming: true,
      exitCode: null,
      start: mockStart,
      stop: mockStop,
    });

    render(
      <StreamOutput
        componentId="vault"
        commandId="logs"
        args={{}}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByText(/Streaming/)).toBeInTheDocument();
  });

  test("calls onStop directly when Close is clicked (not stop())", () => {
    const onStop = vi.fn();

    vi.mocked(useCommandStream).mockReturnValue({
      lines: [],
      streaming: false,
      exitCode: 0,
      start: mockStart,
      stop: mockStop,
    });

    render(
      <StreamOutput
        componentId="vault"
        commandId="logs"
        args={{}}
        onStop={onStop}
      />,
    );

    fireEvent.click(screen.getByText("Close"));

    // Close calls onStop directly, not stop()
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(mockStop).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// CommandPanel tests
// ---------------------------------------------------------------------------

describe("CommandPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders commands grouped by group", () => {
    const commands = [
      makeCommand({ id: "start", name: "Start", group: "lifecycle", sort_order: 0 }),
      makeCommand({ id: "stop", name: "Stop", group: "lifecycle", sort_order: 1 }),
      makeCommand({ id: "verify", name: "Verify", group: "monitoring", sort_order: 0 }),
      makeCommand({ id: "rotate", name: "Rotate", group: "maintenance", sort_order: 0 }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState="running" />,
    );

    expect(screen.getByText("Lifecycle")).toBeInTheDocument();
    expect(screen.getByText("Monitoring")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    // Operations group has no commands, so it should not render
    expect(screen.queryByText("Operations")).not.toBeInTheDocument();
  });

  test("disables commands when currentState not in available_when", () => {
    const commands = [
      makeCommand({
        id: "stop-cmd",
        name: "Stop",
        group: "lifecycle",
        available_when: ["running"],
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState="stopped" />,
    );

    const btn = screen.getByTestId("cmd-stop-cmd");
    expect(btn).toBeDisabled();
  });

  test("enables commands when currentState is in available_when", () => {
    const commands = [
      makeCommand({
        id: "stop-cmd",
        name: "Stop",
        group: "lifecycle",
        available_when: ["running"],
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState="running" />,
    );

    const btn = screen.getByTestId("cmd-stop-cmd");
    expect(btn).not.toBeDisabled();
  });

  test("enables commands when available_when is empty (always available)", () => {
    const commands = [
      makeCommand({
        id: "info-cmd",
        name: "Info",
        group: "operations",
        available_when: [],
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState="stopped" />,
    );

    const btn = screen.getByTestId("cmd-info-cmd");
    expect(btn).not.toBeDisabled();
  });

  test("shows ArgumentForm when command with args is clicked", () => {
    const commands = [
      makeCommand({
        id: "deploy",
        name: "Deploy",
        group: "operations",
        args: [
          {
            id: "env",
            name: "Environment",
            type: "string",
            required: true,
            options: [],
          },
        ],
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState={null} />,
    );

    fireEvent.click(screen.getByTestId("cmd-deploy"));
    expect(screen.getByTestId("arg-form")).toBeInTheDocument();
  });

  test("shows ConfirmDialog when destructive command (no args) is clicked", () => {
    const commands = [
      makeCommand({
        id: "nuke",
        name: "Nuclear Kill",
        group: "lifecycle",
        danger: "destructive",
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState={null} />,
    );

    fireEvent.click(screen.getByTestId("cmd-nuke"));
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(screen.getByText('Run "Nuclear Kill"?')).toBeInTheDocument();
  });

  test("shows ConfirmDialog when caution command (no args) is clicked", () => {
    const commands = [
      makeCommand({
        id: "setup",
        name: "Setup",
        group: "lifecycle",
        danger: "caution",
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState={null} />,
    );

    fireEvent.click(screen.getByTestId("cmd-setup"));
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
  });

  test("executes safe command immediately on click", async () => {
    const commands = [
      makeCommand({
        id: "verify",
        name: "Verify",
        group: "monitoring",
        danger: "safe",
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState={null} />,
    );

    fireEvent.click(screen.getByTestId("cmd-verify"));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith("vault", "verify", {});
    });

    // No arg form or confirm dialog
    expect(screen.queryByTestId("arg-form")).not.toBeInTheDocument();
    expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
  });

  test("routes stream-type command to StreamOutput", () => {
    // When a stream command is dispatched, CommandPanel renders StreamOutput
    vi.mocked(useCommandStream).mockReturnValue({
      lines: [],
      streaming: true,
      exitCode: null,
      start: mockStart,
      stop: mockStop,
    });

    const commands = [
      makeCommand({
        id: "logs",
        name: "Logs",
        group: "monitoring",
        type: "stream",
        danger: "safe",
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState={null} />,
    );

    fireEvent.click(screen.getByTestId("cmd-logs"));

    // Stream command should NOT call execute
    expect(mockExecute).not.toHaveBeenCalled();
    // StreamOutput should render (shows Streaming text and Stop button)
    expect(screen.getByText(/Streaming/)).toBeInTheDocument();
    expect(screen.getByText("Stop")).toBeInTheDocument();
  });

  test("confirms destructive command then executes", async () => {
    const commands = [
      makeCommand({
        id: "nuke",
        name: "Nuclear Kill",
        group: "lifecycle",
        danger: "destructive",
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState={null} />,
    );

    // Click the command
    fireEvent.click(screen.getByTestId("cmd-nuke"));
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();

    // Click confirm
    fireEvent.click(screen.getByText("Confirm"));

    // Should now execute
    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith("vault", "nuke", {});
    });
  });

  test("cancelling confirm dialog does not execute", () => {
    const commands = [
      makeCommand({
        id: "nuke",
        name: "Nuclear Kill",
        group: "lifecycle",
        danger: "destructive",
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState={null} />,
    );

    fireEvent.click(screen.getByTestId("cmd-nuke"));
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
  });

  test("arg form submit leads to confirm for dangerous commands", async () => {
    const commands = [
      makeCommand({
        id: "deploy",
        name: "Deploy",
        group: "operations",
        danger: "caution",
        args: [
          {
            id: "env",
            name: "Environment",
            type: "string",
            required: true,
            options: [],
          },
        ],
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState={null} />,
    );

    // Click opens arg form
    fireEvent.click(screen.getByTestId("cmd-deploy"));
    expect(screen.getByTestId("arg-form")).toBeInTheDocument();

    // Submit args
    fireEvent.click(screen.getByText("Submit"));

    // Should now show confirm dialog (danger = caution)
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(mockExecute).not.toHaveBeenCalled();

    // Confirm executes
    fireEvent.click(screen.getByText("Confirm"));
    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith("vault", "deploy", {});
    });
  });

  test("displays output after blocking command completes", () => {
    vi.mocked(useCommand).mockReturnValue({
      result: { stdout: "all good", stderr: "", exit_code: 0, duration_ms: 123 },
      running: false,
      error: null,
      execute: mockExecute,
      clear: mockClear,
    });

    const commands = [
      makeCommand({
        id: "verify",
        name: "Verify",
        group: "monitoring",
        danger: "safe",
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState={null} />,
    );

    expect(screen.getByTestId("output-renderer")).toBeInTheDocument();
    expect(screen.getByText("all good")).toBeInTheDocument();
    expect(screen.getByText("123ms")).toBeInTheDocument();
  });

  test("displays error after blocking command fails", () => {
    vi.mocked(useCommand).mockReturnValue({
      result: null,
      running: false,
      error: "Connection refused",
      execute: mockExecute,
      clear: mockClear,
    });

    const commands = [
      makeCommand({
        id: "verify",
        name: "Verify",
        group: "monitoring",
      }),
    ];

    render(
      <CommandPanel commands={commands} componentId="vault" currentState={null} />,
    );

    expect(screen.getByText("Connection refused")).toBeInTheDocument();
  });
});
