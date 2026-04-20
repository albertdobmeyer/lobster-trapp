import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import type { DiscoveredComponent } from "@/lib/types";

// Mock hooks used by Dashboard's sub-components
vi.mock("@/hooks/useComponentStatus", () => ({
  useComponentStatus: () => ({ status: null, loading: false, refresh: vi.fn() }),
}));

vi.mock("@/components/DynamicIcon", () => ({
  DynamicIcon: () => <span data-testid="dynamic-icon" />,
}));

vi.mock("@/components/StatusBadge", () => ({
  default: () => <span data-testid="status-badge" />,
}));

const makeComponent = (
  id: string,
  name: string,
  role: "runtime" | "toolchain" | "placeholder",
): DiscoveredComponent => ({
  manifest: {
    identity: {
      id,
      name,
      version: "0.1.0",
      description: `${name} description`,
      role,
      icon: "Shield",
      color: "#10B981",
    },
    commands: [],
    configs: [],
    health: [],
    workflows: [],
  },
  component_dir: `/fake/${id}`,
});

describe("Dashboard", () => {
  test("shows skeleton cards while loading with no data", () => {
    const { container } = render(
      <MemoryRouter>
        <Dashboard components={[]} loading={true} onRefresh={vi.fn()} />
      </MemoryRouter>,
    );

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("shows empty state when not loading and no components", () => {
    render(
      <MemoryRouter>
        <Dashboard components={[]} loading={false} onRefresh={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("No assistant detected")).toBeInTheDocument();
  });

  test("renders assistant card for runtime component", () => {
    const components = [
      makeComponent("openclaw-vault", "OpenClaw Vault", "runtime"),
      makeComponent("clawhub-forge", "ClawHub Forge", "toolchain"),
    ];

    render(
      <MemoryRouter>
        <Dashboard components={components} loading={false} onRefresh={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Your AI Assistant")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
  });

  test("shows Dashboard heading", () => {
    render(
      <MemoryRouter>
        <Dashboard components={[]} loading={false} onRefresh={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });
});
