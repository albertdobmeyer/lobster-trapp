import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ComponentCard from "./ComponentCard";
import type { DiscoveredComponent } from "@/lib/types";

// Mock useComponentStatus to avoid polling in tests
vi.mock("@/hooks/useComponentStatus", () => ({
  useComponentStatus: () => ({ status: null, loading: false, refresh: vi.fn() }),
}));

// Mock DynamicIcon to avoid lucide-react dynamic import complexity
vi.mock("./DynamicIcon", () => ({
  DynamicIcon: () => <span data-testid="dynamic-icon" />,
}));

// Mock StatusBadge
vi.mock("./StatusBadge", () => ({
  default: () => <span data-testid="status-badge" />,
}));

const placeholderComponent: DiscoveredComponent = {
  manifest: {
    identity: {
      id: "moltbook-pioneer",
      name: "MoltBook Pioneer",
      version: "0.0.1",
      description: "Agent social network",
      role: "placeholder",
      icon: "Users",
      color: "#8B5CF6",
    },
    commands: [],
    configs: [],
    health: [],
    workflows: [],
  },
  component_dir: "/fake/path",
};

const activeComponent: DiscoveredComponent = {
  manifest: {
    identity: {
      id: "openclaw-vault",
      name: "OpenClaw Vault",
      version: "0.1.0",
      description: "Hardened container sandbox",
      role: "runtime",
      icon: "Shield",
      color: "#10B981",
    },
    commands: [],
    configs: [],
    health: [],
    workflows: [],
  },
  component_dir: "/fake/path",
};

describe("ComponentCard", () => {
  test("placeholder renders 'Coming Soon' and is not a link", () => {
    render(
      <MemoryRouter>
        <ComponentCard component={placeholderComponent} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
    expect(screen.getByText("MoltBook Pioneer")).toBeInTheDocument();
    // Should not have a link wrapping the card
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  test("active component renders identity.name as a link", () => {
    render(
      <MemoryRouter>
        <ComponentCard component={activeComponent} />
      </MemoryRouter>,
    );

    expect(screen.getByText("OpenClaw Vault")).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/component/openclaw-vault");
  });

  test("active component shows role", () => {
    render(
      <MemoryRouter>
        <ComponentCard component={activeComponent} />
      </MemoryRouter>,
    );

    expect(screen.getByText("runtime")).toBeInTheDocument();
  });
});
