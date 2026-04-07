import { render, screen } from "@testing-library/react";
import CardGridRenderer from "./CardGridRenderer";

describe("CardGridRenderer", () => {
  test("JSON array renders grid of cards with titles from name key", () => {
    const content = JSON.stringify([
      { name: "Alpha", version: "1.0", status: "ok" },
      { name: "Beta", version: "2.0", status: "error" },
    ]);
    render(<CardGridRenderer content={content} exitCode={0} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText(/1\.0/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0/)).toBeInTheDocument();
  });

  test("JSON object with array extracts the array correctly", () => {
    const content = JSON.stringify({
      skills: [
        { name: "read_file", risk: "low" },
        { name: "write_file", risk: "medium" },
      ],
    });
    render(<CardGridRenderer content={content} exitCode={0} />);
    expect(screen.getByText("read_file")).toBeInTheDocument();
    expect(screen.getByText("write_file")).toBeInTheDocument();
    expect(screen.getByText(/low/)).toBeInTheDocument();
    expect(screen.getByText(/medium/)).toBeInTheDocument();
  });

  test("JSONL renders each line as a card", () => {
    const content = '{"id":"t1","value":"one"}\n{"id":"t2","value":"two"}';
    render(<CardGridRenderer content={content} exitCode={0} />);
    expect(screen.getByText("t1")).toBeInTheDocument();
    expect(screen.getByText("t2")).toBeInTheDocument();
    expect(screen.getByText(/one/)).toBeInTheDocument();
    expect(screen.getByText(/two/)).toBeInTheDocument();
  });

  test("section-header fallback splits non-JSON content by headers", () => {
    const content = "intro text\n## Summary\nfirst section\n## Details\nsecond section";
    render(<CardGridRenderer content={content} exitCode={0} />);
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  test("title resolution tries name, id, title, skill, tool in order then falls back", () => {
    // Only "skill" key present
    const withSkill = JSON.stringify([{ skill: "scan", level: 3 }]);
    const { unmount } = render(
      <CardGridRenderer content={withSkill} exitCode={0} />,
    );
    expect(screen.getByText("scan")).toBeInTheDocument();
    unmount();

    // Only "tool" key present
    const withTool = JSON.stringify([{ tool: "grep", flags: "-r" }]);
    render(<CardGridRenderer content={withTool} exitCode={0} />);
    expect(screen.getByText("grep")).toBeInTheDocument();
  });

  test("title falls back to Card N when no title key found", () => {
    const content = JSON.stringify([{ count: 5, active: true }]);
    render(<CardGridRenderer content={content} exitCode={0} />);
    expect(screen.getByText("Card 1")).toBeInTheDocument();
  });

  test("status badge green for certified", () => {
    const content = JSON.stringify([{ name: "A", status: "certified" }]);
    render(<CardGridRenderer content={content} exitCode={0} />);
    const badge = screen.getByText("certified");
    expect(badge.className).toContain("text-green-300");
  });

  test("status badge red for error", () => {
    const content = JSON.stringify([{ name: "B", status: "error" }]);
    render(<CardGridRenderer content={content} exitCode={1} />);
    const badge = screen.getByText("error");
    expect(badge.className).toContain("text-red-300");
  });

  test("status badge yellow for pending", () => {
    const content = JSON.stringify([{ name: "C", status: "pending" }]);
    render(<CardGridRenderer content={content} exitCode={0} />);
    const badge = screen.getByText("pending");
    expect(badge.className).toContain("text-yellow-300");
  });

  test("boolean values show checkmark for true and X for false", () => {
    const content = JSON.stringify([{ name: "flags", enabled: true, locked: false }]);
    render(<CardGridRenderer content={content} exitCode={0} />);
    // Check mark (U+2713) for true, X mark (U+2717) for false
    expect(screen.getByText("\u2713")).toBeInTheDocument();
    expect(screen.getByText("\u2717")).toBeInTheDocument();
  });

  test("empty content renders gracefully with exit code", () => {
    render(<CardGridRenderer content="" exitCode={0} />);
    expect(screen.getByText("Exit code: 0")).toBeInTheDocument();
  });

  test("malformed JSON falls back to section-header parsing", () => {
    const content = "{ broken json\n## Report\nSome findings here";
    render(<CardGridRenderer content={content} exitCode={1} />);
    expect(screen.getByText("Report")).toBeInTheDocument();
    expect(screen.getByText("Exit code: 1")).toBeInTheDocument();
  });
});
