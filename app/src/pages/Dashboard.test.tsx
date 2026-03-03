import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import type { DiscoveredComponent } from "@/lib/types";

// Mock ComponentCard to isolate Dashboard logic
vi.mock("@/components/ComponentCard", () => ({
  default: ({ component }: { component: DiscoveredComponent }) => (
    <div data-testid="component-card">{component.manifest.identity.name}</div>
  ),
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
    },
    commands: [],
    configs: [],
    health: [],
  },
  component_dir: `/fake/${id}`,
});

describe("Dashboard", () => {
  test("shows 'Discovering components...' while loading with no data", () => {
    render(
      <MemoryRouter>
        <Dashboard components={[]} loading={true} onRefresh={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Discovering components...")).toBeInTheDocument();
  });

  test("shows 'No components found' when not loading and empty", () => {
    render(
      <MemoryRouter>
        <Dashboard components={[]} loading={false} onRefresh={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("No components found")).toBeInTheDocument();
  });

  test("renders correct number of cards when components provided", () => {
    const components = [
      makeComponent("openclaw-vault", "OpenClaw Vault", "runtime"),
      makeComponent("clawhub-forge", "ClawHub Forge", "toolchain"),
      makeComponent("moltbook-pioneer", "MoltBook Pioneer", "placeholder"),
    ];

    render(
      <MemoryRouter>
        <Dashboard components={components} loading={false} onRefresh={vi.fn()} />
      </MemoryRouter>,
    );

    const cards = screen.getAllByTestId("component-card");
    expect(cards).toHaveLength(3);
  });

  test("sorts placeholders last", () => {
    const components = [
      makeComponent("moltbook-pioneer", "MoltBook Pioneer", "placeholder"),
      makeComponent("openclaw-vault", "OpenClaw Vault", "runtime"),
    ];

    render(
      <MemoryRouter>
        <Dashboard components={components} loading={false} onRefresh={vi.fn()} />
      </MemoryRouter>,
    );

    const cards = screen.getAllByTestId("component-card");
    expect(cards[0]).toHaveTextContent("OpenClaw Vault");
    expect(cards[1]).toHaveTextContent("MoltBook Pioneer");
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
