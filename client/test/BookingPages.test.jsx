import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentBookingCreatePage } from "../src/pages/agent/AgentBookingCreatePage";
import { AgentQueuePage } from "../src/pages/agent/AgentQueuePage";
import { renderWithProviders } from "./test-utils";

const mockCreateBookingMutation = vi.fn();
const mockQueueQuery = vi.fn();
const mockRetryMutation = vi.fn();

vi.mock("../src/hooks/mutations/useBookingMutations", () => ({
  useCreateBookingMutation: () => mockCreateBookingMutation(),
  useRetryAssignmentMutation: () => mockRetryMutation(),
}));

vi.mock("../src/hooks/queries/useBookingQueries", () => ({
  useQueueQuery: () => mockQueueQuery(),
}));

describe("booking pages", () => {
  beforeEach(() => {
    mockCreateBookingMutation.mockReset();
    mockQueueQuery.mockReset();
    mockRetryMutation.mockReset();
  });

  it("renders booking create loading, error, and success states", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockCreateBookingMutation.mockReturnValue({
      mutate,
      isPending: true,
      isError: true,
      isSuccess: true,
      error: { response: { data: { message: "Dispatch failed" } } },
    });

    renderWithProviders(<AgentBookingCreatePage />, {
      preloadedState: {
        auth: {
          token: "token",
          user: { role: "AGENT", fullName: "Ari Fleet", email: "agent@taxify.local" },
          status: "authenticated",
        },
      },
    });

    expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
    expect(screen.getByText("Dispatch failed")).toBeInTheDocument();
    expect(screen.getByText(/booking created and dispatched/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/customer name/i), "Nora Kent");
    expect(screen.getByDisplayValue("Nora Kent")).toBeInTheDocument();
  });

  it("renders queue empty, loading, and error states", () => {
    mockRetryMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });

    mockQueueQuery.mockReturnValueOnce({
      data: [],
      isLoading: true,
      isError: false,
    });
    const loadingView = renderWithProviders(<AgentQueuePage />, {
      preloadedState: {
        auth: {
          token: "token",
          user: { role: "AGENT", fullName: "Ari Fleet", email: "agent@taxify.local" },
          status: "authenticated",
        },
      },
    });
    expect(loadingView.container.querySelector(".animate-pulse")).toBeTruthy();
    loadingView.unmount();

    mockQueueQuery.mockReturnValueOnce({
      data: [],
      isLoading: false,
      isError: true,
    });
    renderWithProviders(<AgentQueuePage />, {
      preloadedState: {
        auth: {
          token: "token",
          user: { role: "AGENT", fullName: "Ari Fleet", email: "agent@taxify.local" },
          status: "authenticated",
        },
      },
    });
    expect(screen.getByText(/failed to load queue/i)).toBeInTheDocument();

    mockQueueQuery.mockReturnValueOnce({
      data: [],
      isLoading: false,
      isError: false,
    });
    renderWithProviders(<AgentQueuePage />, {
      preloadedState: {
        auth: {
          token: "token",
          user: { role: "AGENT", fullName: "Ari Fleet", email: "agent@taxify.local" },
          status: "authenticated",
        },
      },
    });
    expect(screen.getByText(/queue is clear - no bookings waiting/i)).toBeInTheDocument();
  });
});
