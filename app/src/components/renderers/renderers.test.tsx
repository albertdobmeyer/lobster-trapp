import { render, screen } from "@testing-library/react";
import LogRenderer from "./LogRenderer";
import TerminalRenderer from "./TerminalRenderer";
import ChecklistRenderer from "./ChecklistRenderer";
import TableRenderer from "./TableRenderer";
import BadgeRenderer from "./BadgeRenderer";
import ReportRenderer from "./ReportRenderer";

// Mock AnsiLine since it depends on ANSI parsing internals
vi.mock("./AnsiLine", () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));

// Mock lucide-react for ChecklistRenderer icons
vi.mock("lucide-react", () => ({
  Check: () => <span data-testid="check-icon" />,
  X: () => <span data-testid="x-icon" />,
  Minus: () => <span data-testid="minus-icon" />,
}));

describe("LogRenderer", () => {
  test("renders each line of content", () => {
    render(<LogRenderer content={"line one\nline two\nline three"} />);
    expect(screen.getByText("line one")).toBeInTheDocument();
    expect(screen.getByText("line two")).toBeInTheDocument();
    expect(screen.getByText("line three")).toBeInTheDocument();
  });

  test("handles empty content", () => {
    const { container } = render(<LogRenderer content="" />);
    // Should render without crashing; the single empty-string line produces a div
    expect(container.querySelector(".font-mono")).toBeInTheDocument();
  });
});

describe("TerminalRenderer", () => {
  test("renders content lines", () => {
    render(<TerminalRenderer content={"hello\nworld"} />);
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("world")).toBeInTheDocument();
  });

  test("shows exit code when provided", () => {
    render(<TerminalRenderer content="done" exitCode={0} />);
    expect(
      screen.getByText("Process exited with code 0"),
    ).toBeInTheDocument();
  });

  test("shows streaming indicator when streaming", () => {
    render(<TerminalRenderer content="running" streaming={true} />);
    expect(
      screen.getByText(/waiting for output/),
    ).toBeInTheDocument();
  });

  test("does not show exit code while streaming", () => {
    render(
      <TerminalRenderer content="running" exitCode={0} streaming={true} />,
    );
    expect(
      screen.queryByText("Process exited with code 0"),
    ).not.toBeInTheDocument();
  });

  test("exit code 0 styled green", () => {
    render(<TerminalRenderer content="ok" exitCode={0} />);
    const exitDiv = screen.getByText("Process exited with code 0");
    expect(exitDiv.className).toContain("text-green-400");
  });

  test("non-zero exit code styled red", () => {
    render(<TerminalRenderer content="fail" exitCode={1} />);
    const exitDiv = screen.getByText("Process exited with code 1");
    expect(exitDiv.className).toContain("text-red-400");
  });
});

describe("ChecklistRenderer", () => {
  test("lines with PASS get check icon", () => {
    render(<ChecklistRenderer content="PASS: dns check" exitCode={0} />);
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
  });

  test("lines with FAIL get X icon", () => {
    render(<ChecklistRenderer content="FAIL: proxy check" exitCode={1} />);
    expect(screen.getByTestId("x-icon")).toBeInTheDocument();
  });

  test("lines with OK get check icon", () => {
    render(<ChecklistRenderer content="OK: verified" exitCode={0} />);
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
  });

  test("other lines get minus icon", () => {
    render(
      <ChecklistRenderer content="Running checks..." exitCode={0} />,
    );
    expect(screen.getByTestId("minus-icon")).toBeInTheDocument();
  });

  test("shows 'All checks passed' when exitCode is 0", () => {
    render(
      <ChecklistRenderer content="PASS: all good" exitCode={0} />,
    );
    expect(screen.getByText("All checks passed")).toBeInTheDocument();
  });

  test("shows 'Exited with code 1' when exitCode is 1", () => {
    render(
      <ChecklistRenderer content="FAIL: something broke" exitCode={1} />,
    );
    expect(screen.getByText("Exited with code 1")).toBeInTheDocument();
  });

  test("multiple lines get correct icons", () => {
    render(
      <ChecklistRenderer
        content={"PASS: first\nFAIL: second\ninfo line"}
        exitCode={1}
      />,
    );
    expect(screen.getAllByTestId("check-icon")).toHaveLength(1);
    expect(screen.getAllByTestId("x-icon")).toHaveLength(1);
    expect(screen.getAllByTestId("minus-icon")).toHaveLength(1);
  });
});

describe("TableRenderer", () => {
  test("pipe-separated content renders as HTML table with headers", () => {
    const content = "Name | Status | Count\nAlpha | Running | 5\nBeta | Stopped | 0";
    render(<TableRenderer content={content} />);
    // Headers
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Count")).toBeInTheDocument();
    // Body cells
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    // Should render as a table element
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  test("pipe-separated content skips separator rows", () => {
    const content = "Name | Status\n----|----\nAlpha | Running";
    render(<TableRenderer content={content} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  test("non-pipe content renders as preformatted text", () => {
    const content = "just some text\nno pipes here";
    render(<TableRenderer content={content} />);
    // Multiline content is rendered inside a <pre> tag
    const pre = screen.getByText((_text, element) => {
      return element?.tagName === "PRE" && element.textContent === content;
    });
    expect(pre).toBeInTheDocument();
  });

  test("empty content shows 'No data'", () => {
    render(<TableRenderer content="" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  test("whitespace-only lines are filtered, leaving non-pipe fallback", () => {
    // TableRenderer strips ANSI then splits on newlines and filters blanks.
    // Whitespace-only lines get filtered out, but the check uses the
    // filtered array. With only spaces, lines=[] so it shows "No data".
    render(<TableRenderer content={"   \n   \n   "} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});

describe("BadgeRenderer", () => {
  test("renders trimmed content value", () => {
    render(<BadgeRenderer content="  healthy  " />);
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  test("renders as inline span", () => {
    render(<BadgeRenderer content="running" />);
    const badge = screen.getByText("running");
    expect(badge.tagName).toBe("SPAN");
  });

  test("strips ANSI codes from content", () => {
    render(<BadgeRenderer content={"\x1b[32mgreen status\x1b[0m"} />);
    expect(screen.getByText("green status")).toBeInTheDocument();
  });
});

describe("ReportRenderer", () => {
  test("renders simple content", () => {
    render(
      <ReportRenderer content="line one\nline two" exitCode={0} />,
    );
    expect(screen.getByText(/line one/)).toBeInTheDocument();
    expect(screen.getByText(/line two/)).toBeInTheDocument();
  });

  test("shows exit code", () => {
    render(<ReportRenderer content="report body" exitCode={0} />);
    expect(screen.getByText("Exit code: 0")).toBeInTheDocument();
  });

  test("shows non-zero exit code", () => {
    render(<ReportRenderer content="report body" exitCode={2} />);
    expect(screen.getByText("Exit code: 2")).toBeInTheDocument();
  });

  test("groups content by section headers starting with ##", () => {
    const content = "intro text\n## Summary\nfirst section\n## Details\nsecond section";
    render(<ReportRenderer content={content} exitCode={0} />);
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  test("groups content by section headers starting with ===", () => {
    const content = "intro text\n=== Overview\nsection body";
    render(<ReportRenderer content={content} exitCode={0} />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });

  test("strips ANSI codes from report content", () => {
    render(
      <ReportRenderer
        content={"\x1b[31mred error\x1b[0m"}
        exitCode={1}
      />,
    );
    expect(screen.getByText(/red error/)).toBeInTheDocument();
  });
});
