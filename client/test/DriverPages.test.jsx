import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { DriverWorkspacePage } from "../src/pages/driver/DriverWorkspacePage";
import { DriverCommissionsPage } from "../src/pages/driver/DriverCommissionsPage";
import { renderWithProviders } from "./test-utils";

const mockAssignmentQuery = vi.fn();
const mockTripMutation = vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false }));
const mockCommissionQuery = vi.fn();
const mockUploadMutation = vi.fn();

vi.mock("../src/hooks/queries/useTripQueries", () => ({
  useMyAssignmentQuery: () => mockAssignmentQuery(),
}));

vi.mock("../src/hooks/mutations/useTripMutations", () => ({
  useAcceptAssignmentMutation: () => mockTripMutation(),
  useRejectAssignmentMutation: () => mockTripMutation(),
  useStartTripMutation: () => mockTripMutation(),
  useEndTripMutation: () => mockTripMutation(),
  useConfirmPaymentMutation: () => mockTripMutation(),
}));

vi.mock("../src/hooks/queries/useCommissionQueries", () => ({
  useDriverCommissionsQuery: () => mockCommissionQuery(),
}));

vi.mock("../src/hooks/mutations/useCommissionMutations", () => ({
  useSubmitReceiptMutation: () => mockUploadMutation(),
}));

function authState() {
  return {
    auth: {
      token: "token",
      user: { role: "DRIVER", fullName: "Dana Vale", email: "driver@taxify.local" },
      status: "authenticated",
    },
  };
}

describe("driver pages", () => {
  beforeEach(() => {
    mockAssignmentQuery.mockReset();
    mockCommissionQuery.mockReset();
    mockUploadMutation.mockReset();
  });

  it("renders accept and reject controls for assigned bookings", () => {
    mockAssignmentQuery.mockReturnValue({
      data: {
        booking: {
          _id: "booking-1",
          bookingReference: "TXF-20260501-AB123",
          customerName: "Nora Kent",
          customerPhone: "+1 (415) 882-1093",
          pickupAddress: "12 Market Road",
          dropoffAddress: "88 Bishopsgate",
          status: "ASSIGNED",
        },
        attempt: {
          _id: "attempt-1",
          expiresAt: new Date().toISOString(),
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<DriverWorkspacePage />, { preloadedState: authState() });

    expect(screen.getByRole("button", { name: /accept job/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("renders trip controls for accepted, in-progress, and payment-pending states", () => {
    mockAssignmentQuery.mockReturnValueOnce({
      data: {
        booking: {
          _id: "booking-2",
          bookingReference: "TXF-20260501-AC123",
          customerName: "Milo Hart",
          customerPhone: "+1 (212) 445-7732",
          pickupAddress: "City Hall",
          dropoffAddress: "River Wharf",
          status: "ACCEPTED",
        },
        attempt: null,
      },
      isLoading: false,
      isError: false,
    });
    const acceptedView = renderWithProviders(<DriverWorkspacePage />, { preloadedState: authState() });
    expect(screen.getByRole("button", { name: /start trip/i })).toBeInTheDocument();
    acceptedView.unmount();

    mockAssignmentQuery.mockReturnValueOnce({
      data: {
        booking: {
          _id: "booking-3",
          bookingReference: "TXF-20260501-AD123",
          customerName: "Milo Hart",
          customerPhone: "+1 (212) 445-7732",
          pickupAddress: "City Hall",
          dropoffAddress: "River Wharf",
          status: "IN_PROGRESS",
        },
        attempt: null,
      },
      isLoading: false,
      isError: false,
    });
    const progressView = renderWithProviders(<DriverWorkspacePage />, { preloadedState: authState() });
    expect(screen.getByRole("button", { name: /end trip/i })).toBeInTheDocument();
    progressView.unmount();

    mockAssignmentQuery.mockReturnValueOnce({
      data: {
        booking: {
          _id: "booking-4",
          bookingReference: "TXF-20260501-AE123",
          customerName: "Milo Hart",
          customerPhone: "+1 (212) 445-7732",
          pickupAddress: "City Hall",
          dropoffAddress: "River Wharf",
          status: "PAYMENT_PENDING",
          finalFare: 42,
        },
        attempt: null,
      },
      isLoading: false,
      isError: false,
    });
    renderWithProviders(<DriverWorkspacePage />, { preloadedState: authState() });
    expect(screen.getByRole("button", { name: /confirm cash collected/i })).toBeInTheDocument();
  });

  it("renders commission submission UI for due statements", () => {
    mockCommissionQuery.mockReturnValue({
      data: {
        statements: [
          {
            _id: "statement-1",
            periodMonth: 5,
            periodYear: 2026,
            grossTripRevenue: 320,
            commissionTotal: 32,
            balanceDue: 32,
            status: "DUE",
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
    mockUploadMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      variables: null,
    });

    renderWithProviders(<DriverCommissionsPage />, { preloadedState: authState() });

    expect(screen.getByText(/total outstanding/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload payment receipt/i })).toBeInTheDocument();
  });
});
