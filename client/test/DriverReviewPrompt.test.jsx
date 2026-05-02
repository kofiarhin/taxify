import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DriverReviewPrompt } from "../src/components/client/DriverReviewPrompt";
import { renderWithProviders } from "./test-utils";

const mockSubmitReviewMutation = vi.fn();

vi.mock("../src/hooks/mutations/useDriverReviewMutations", () => ({
  useSubmitDriverReviewMutation: () => mockSubmitReviewMutation(),
}));

describe("DriverReviewPrompt", () => {
  beforeEach(() => {
    mockSubmitReviewMutation.mockReset();
    mockSubmitReviewMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      data: null,
    });
  });

  it("requires a selected rating before submit", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mockSubmitReviewMutation.mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      data: null,
    });

    renderWithProviders(
      <DriverReviewPrompt
        bookingId="booking-1"
        driverName="Ruben Vale"
        driverVehicle="Toyota Camry"
        review={{ eligible: true, submitted: false, rating: null }}
      />
    );

    expect(screen.getByRole("button", { name: /submit driver review/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /rate driver 5 out of 5/i }));
    expect(screen.getByRole("button", { name: /rate driver 5 out of 5/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /submit driver review/i })).toBeEnabled();

    await user.type(screen.getByLabelText(/comment/i), "Clear pickup and careful driving.");
    await user.click(screen.getByRole("button", { name: /submit driver review/i }));

    expect(mutate).toHaveBeenCalledWith({
      bookingId: "booking-1",
      rating: 5,
      comment: "Clear pickup and careful driving.",
    });
  });

  it("shows submitted confirmation", () => {
    renderWithProviders(
      <DriverReviewPrompt
        bookingId="booking-1"
        driverName="Ruben Vale"
        driverVehicle="Toyota Camry"
        review={{ eligible: false, submitted: true, rating: 4 }}
      />
    );

    expect(screen.getByText(/driver review submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/4 out of 5/i)).toBeInTheDocument();
  });

  it("shows server errors inline", () => {
    mockSubmitReviewMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      isSuccess: false,
      data: null,
      error: { message: "This trip has already been reviewed." },
    });

    renderWithProviders(
      <DriverReviewPrompt
        bookingId="booking-1"
        driverName="Ruben Vale"
        driverVehicle="Toyota Camry"
        review={{ eligible: true, submitted: false, rating: null }}
      />
    );

    expect(screen.getByText(/already been reviewed/i)).toBeInTheDocument();
  });
});
