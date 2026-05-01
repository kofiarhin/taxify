import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { AdminOverviewPage } from "../src/pages/admin/AdminOverviewPage";
import { renderWithProviders } from "./test-utils";

const mockDashboardQuery = vi.fn();

vi.mock("../src/hooks/queries/useDashboardSummaryQuery", () => ({
  useDashboardSummaryQuery: () => mockDashboardQuery(),
}));

describe("AdminOverviewPage", () => {
  it("renders dashboard metrics", () => {
    mockDashboardQuery.mockReturnValue({
      data: {
        bookingsToday: 14,
        activeTrips: 5,
        completedToday: 11,
        queueCount: 2,
        cashCollectedToday: 480.5,
        commissionDueThisMonth: 61.2,
        suspendedDrivers: 1,
        openComplaints: 3,
        activeDrivers: 8,
        driverAcceptanceRate: 82,
        driverRejectionRate: 18,
        avgQueueWaitMinutes: 6,
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<AdminOverviewPage />, {
      preloadedState: {
        auth: {
          token: "token",
          user: { role: "ADMIN", fullName: "Mara Ellison", email: "admin@taxify.local" },
          status: "authenticated",
        },
      },
    });

    expect(screen.getByText(/operations overview/i)).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText(/ghs 480.50/i)).toBeInTheDocument();
    expect(screen.getByText(/acceptance rate/i)).toBeInTheDocument();
  });
});
