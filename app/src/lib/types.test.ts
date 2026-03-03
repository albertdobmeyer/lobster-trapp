import {
  COMMAND_GROUP_ORDER,
  COMMAND_GROUP_LABELS,
  DANGER_STYLES,
  type CommandGroup,
  type Danger,
} from "./types";

describe("COMMAND_GROUP_ORDER covers all CommandGroup values", () => {
  const expectedGroups: CommandGroup[] = [
    "lifecycle",
    "operations",
    "monitoring",
    "maintenance",
  ];

  test("contains all expected groups", () => {
    for (const group of expectedGroups) {
      expect(COMMAND_GROUP_ORDER).toContain(group);
    }
  });

  test("has no extra groups", () => {
    expect(COMMAND_GROUP_ORDER).toHaveLength(expectedGroups.length);
  });
});

describe("COMMAND_GROUP_LABELS covers all groups", () => {
  test("every group in COMMAND_GROUP_ORDER has a label", () => {
    for (const group of COMMAND_GROUP_ORDER) {
      expect(COMMAND_GROUP_LABELS[group]).toBeDefined();
      expect(typeof COMMAND_GROUP_LABELS[group]).toBe("string");
    }
  });
});

describe("DANGER_STYLES covers all Danger values", () => {
  const expectedDangers: Danger[] = ["safe", "caution", "destructive"];

  test("every danger level has a style", () => {
    for (const danger of expectedDangers) {
      expect(DANGER_STYLES[danger]).toBeDefined();
      expect(typeof DANGER_STYLES[danger]).toBe("string");
    }
  });

  test("has no extra danger keys", () => {
    expect(Object.keys(DANGER_STYLES)).toHaveLength(expectedDangers.length);
  });
});
