import type { Role } from "./types";

/** User-facing label for sidebar/cards/dashboard (e.g. "My Assistant") */
export function getUserLabel(role: Role | string): string {
  switch (role) {
    case "runtime":
      return "My Assistant";
    case "toolchain":
      return "Skills";
    case "network":
      return "Network";
    default:
      return role;
  }
}

/** User-facing label for setup wizard steps (e.g. "Your AI Assistant") */
export function getSetupLabel(role: Role | string): string {
  switch (role) {
    case "runtime":
      return "Your AI Assistant";
    case "toolchain":
      return "Skill Scanner";
    case "network":
      return "Network Monitor";
    default:
      return role;
  }
}

/** Detail page heading (e.g. "Your AI Assistant") */
export function getDetailLabel(role: Role | string): string {
  switch (role) {
    case "runtime":
      return "Your AI Assistant";
    case "toolchain":
      return "Skills";
    case "network":
      return "Agent Network";
    default:
      return role;
  }
}
