import { stripAnsi, parseAnsi } from "./ansi";

describe("stripAnsi", () => {
  test("strips basic color codes", () => {
    expect(stripAnsi("\x1b[31mred\x1b[0m")).toBe("red");
  });

  test("strips multiple color codes", () => {
    expect(stripAnsi("\x1b[1m\x1b[32mbold green\x1b[0m")).toBe("bold green");
  });

  test("returns plain text unchanged", () => {
    expect(stripAnsi("hello world")).toBe("hello world");
  });

  test("handles empty string", () => {
    expect(stripAnsi("")).toBe("");
  });
});

describe("parseAnsi", () => {
  test("plain text returns single span with no styling", () => {
    const result = parseAnsi("hello");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("hello");
    // Plain text path still produces a full span object (no styling set)
    expect(result[0].fg).toBeUndefined();
    expect(result[0].bg).toBeUndefined();
    expect(result[0].bold).toBeFalsy();
  });

  test("empty string returns empty array", () => {
    const result = parseAnsi("");
    expect(result).toHaveLength(0);
  });

  test("bold \\x1b[1m sets bold: true", () => {
    const result = parseAnsi("\x1b[1mbold text\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("bold text");
    expect(result[0].bold).toBe(true);
  });

  test("dim \\x1b[2m sets dim: true", () => {
    const result = parseAnsi("\x1b[2mdim text\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("dim text");
    expect(result[0].dim).toBe(true);
  });

  test("italic \\x1b[3m sets italic: true", () => {
    const result = parseAnsi("\x1b[3mitalic text\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("italic text");
    expect(result[0].italic).toBe(true);
  });

  test("underline \\x1b[4m sets underline: true", () => {
    const result = parseAnsi("\x1b[4munderlined\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("underlined");
    expect(result[0].underline).toBe(true);
  });

  test("standard color \\x1b[31m produces red foreground", () => {
    const result = parseAnsi("\x1b[31mred text\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("red text");
    expect(result[0].fg).toBe("#ef4444");
  });

  test("standard green \\x1b[32m produces green foreground", () => {
    const result = parseAnsi("\x1b[32mgreen text\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].fg).toBe("#22c55e");
  });

  test("standard background \\x1b[41m produces red background", () => {
    const result = parseAnsi("\x1b[41mred bg\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].bg).toBe("#ef4444");
  });

  test("bright color \\x1b[91m produces bright red foreground", () => {
    const result = parseAnsi("\x1b[91mbright red\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].fg).toBe("#f87171");
  });

  test("bright background \\x1b[101m produces bright red background", () => {
    const result = parseAnsi("\x1b[101mbright red bg\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].bg).toBe("#f87171");
  });

  test("256-color \\x1b[38;5;196m produces a color", () => {
    const result = parseAnsi("\x1b[38;5;196mcolor256\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("color256");
    // 196 is in the 6x6x6 cube: idx=180, r=5,g=0,b=0 => #ff0000
    expect(result[0].fg).toBe("#ff0000");
  });

  test("256-color background \\x1b[48;5;21m produces a color", () => {
    const result = parseAnsi("\x1b[48;5;21mbg256\x1b[0m");
    expect(result).toHaveLength(1);
    // 21 is in the 6x6x6 cube: idx=5, r=0,g=0,b=5 => #0000ff
    expect(result[0].bg).toBe("#0000ff");
  });

  test("256-color standard palette \\x1b[38;5;1m maps to normal red", () => {
    const result = parseAnsi("\x1b[38;5;1mstd palette\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].fg).toBe("#ef4444");
  });

  test("256-color bright palette \\x1b[38;5;9m maps to bright red", () => {
    const result = parseAnsi("\x1b[38;5;9mbright palette\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].fg).toBe("#f87171");
  });

  test("256-color grayscale \\x1b[38;5;240m produces gray", () => {
    const result = parseAnsi("\x1b[38;5;240mgray\x1b[0m");
    expect(result).toHaveLength(1);
    // 240: grayscale index 8, value = 8 + (240-232)*10 = 88 => hex 58
    expect(result[0].fg).toBe("#585858");
  });

  test("truecolor RGB \\x1b[38;2;255;128;0m produces exact hex", () => {
    const result = parseAnsi("\x1b[38;2;255;128;0mtruecolor\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("truecolor");
    expect(result[0].fg).toBe("#ff8000");
  });

  test("truecolor RGB background \\x1b[48;2;0;128;255m produces exact hex", () => {
    const result = parseAnsi("\x1b[48;2;0;128;255mtruecolor bg\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].bg).toBe("#0080ff");
  });

  test("reset \\x1b[0m clears all attributes", () => {
    const result = parseAnsi(
      "\x1b[1m\x1b[31mbold red\x1b[0mnormal",
    );
    expect(result).toHaveLength(2);
    expect(result[0].bold).toBe(true);
    expect(result[0].fg).toBe("#ef4444");
    expect(result[1].text).toBe("normal");
    expect(result[1].bold).toBe(false);
    expect(result[1].fg).toBeUndefined();
  });

  test("multiple segments produce correct colored spans", () => {
    const result = parseAnsi("\x1b[31mred\x1b[32mgreen\x1b[0m");
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("red");
    expect(result[0].fg).toBe("#ef4444");
    expect(result[1].text).toBe("green");
    expect(result[1].fg).toBe("#22c55e");
  });

  test("combined attributes in single sequence", () => {
    const result = parseAnsi("\x1b[1;31mbold red\x1b[0m");
    expect(result).toHaveLength(1);
    expect(result[0].bold).toBe(true);
    expect(result[0].fg).toBe("#ef4444");
  });

  test("reset individual attributes with SGR 22/23/24", () => {
    const result = parseAnsi(
      "\x1b[1m\x1b[3m\x1b[4mbold-italic-underline\x1b[22mnot-bold\x1b[23mnot-italic\x1b[24mplain\x1b[0m",
    );
    expect(result).toHaveLength(4);
    expect(result[0].bold).toBe(true);
    expect(result[0].italic).toBe(true);
    expect(result[0].underline).toBe(true);
    // After \x1b[22m: bold=false, dim=false
    expect(result[1].bold).toBe(false);
    expect(result[1].italic).toBe(true);
    expect(result[1].underline).toBe(true);
    // After \x1b[23m: italic=false
    expect(result[2].italic).toBe(false);
    expect(result[2].underline).toBe(true);
    // After \x1b[24m: underline=false
    expect(result[3].underline).toBe(false);
  });

  test("default foreground \\x1b[39m resets fg", () => {
    const result = parseAnsi("\x1b[31mred\x1b[39mdefault\x1b[0m");
    expect(result).toHaveLength(2);
    expect(result[0].fg).toBe("#ef4444");
    expect(result[1].fg).toBeUndefined();
  });

  test("default background \\x1b[49m resets bg", () => {
    const result = parseAnsi("\x1b[41mred bg\x1b[49mdefault bg\x1b[0m");
    expect(result).toHaveLength(2);
    expect(result[0].bg).toBe("#ef4444");
    expect(result[1].bg).toBeUndefined();
  });

  test("text with no ANSI after codes is captured", () => {
    const result = parseAnsi("\x1b[31mred\x1b[0m trailing");
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("red");
    expect(result[1].text).toBe(" trailing");
  });
});
