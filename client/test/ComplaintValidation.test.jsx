import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentComplaintsPage } from "../src/pages/agent/AgentComplaintsPage";
import { renderWithProviders } from "./test-utils";

const mockComplaintsQuery = vi.fn();
const mockCreateComplaintMutation = vi.fn();

vi.mock("../src/hooks/queries/useComplaintQueries", () => ({
  useAgentComplaintsQuery: () => mockComplaintsQuery(),
}));

vi.mock("../src/hooks/mutations/useComplaintMutations", () => ({
  useCreateComplaintMutation: () => mockCreateComplaintMutation(),
}));

describe("AgentComplaintsPage", () => {
  beforeEach(() => {
    mockComplaintsQuery.mockReset();
    mockCreateComplaintMutation.mockReset();
  });

  it("validates complaint form inputs", async () => {
    const user = userEvent.setup();
    mockComplaintsQuery.mockReturnValue({
      data: { complaints: [] },
      isLoading: false,
      isError: false,
    });
    mockCreateComplaintMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    });

    renderWithProviders(<AgentComplaintsPage />, {
      preloadedState: {
        auth: {
          token: "token",
          user: { role: "AGENT", fullName: "Ari Fleet", email: "agent@taxify.local" },
          status: "authenticated",
        },
      },
    });

    await user.click(screen.getByRole("button", { name: /\+ log complaint/i }));
    await user.click(screen.getByRole("button", { name: /submit complaint/i }));

    expect((await screen.findAllByText("Required")).length).toBeGreaterThanOrEqual(1);

    await user.type(screen.getByLabelText(/description/i), "short");
    await user.click(screen.getByRole("button", { name: /submit complaint/i }));
    expect(await screen.findByText(/min 10 characters/i)).toBeInTheDocument();
  });
});
