import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { LoginPage } from "../src/pages/auth/LoginPage";
import { api } from "../src/lib/api";
import { renderWithProviders } from "./test-utils";

vi.mock("../src/lib/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<div>Admin Dashboard</div>} />
      <Route path="/agent" element={<div>Agent Workspace</div>} />
      <Route path="/driver" element={<div>Driver Workspace</div>} />
      <Route path="/client" element={<div>Client Dashboard</div>} />
    </Routes>,
    { route: "/login" }
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("renders the sign-in flow", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole("heading", { name: /sign in to taxify/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enter control room/i })).toBeInTheDocument();
  });

  it("logs in with a nested data response", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          token: "nested-token",
          user: { id: "admin-1", role: "ADMIN", fullName: "Admin User" },
        },
      },
    });

    const { store } = renderLogin();
    await user.click(screen.getByRole("button", { name: /enter control room/i }));

    expect(await screen.findByText("Admin Dashboard")).toBeInTheDocument();
    expect(window.localStorage.getItem("taxify_token")).toBe("nested-token");
    expect(store.getState().auth).toMatchObject({
      status: "authenticated",
      token: "nested-token",
      user: { id: "admin-1", role: "ADMIN", fullName: "Admin User" },
      error: null,
    });
  });

  it("logs in with a flat response", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({
      data: {
        token: "flat-token",
        user: { id: "agent-1", role: "AGENT", fullName: "Agent User" },
      },
    });

    const { store } = renderLogin();
    await user.click(screen.getByRole("button", { name: /enter control room/i }));

    expect(await screen.findByText("Agent Workspace")).toBeInTheDocument();
    expect(window.localStorage.getItem("taxify_token")).toBe("flat-token");
    expect(store.getState().auth).toMatchObject({
      status: "authenticated",
      token: "flat-token",
      user: { id: "agent-1", role: "AGENT", fullName: "Agent User" },
      error: null,
    });
  });

  it("shows an error for an invalid login response and does not crash", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          token: "missing-user-token",
        },
      },
    });

    const { store } = renderLogin();
    await user.click(screen.getByRole("button", { name: /enter control room/i }));

    expect(await screen.findByText("Invalid login response from server")).toBeInTheDocument();
    expect(screen.queryByText("Admin Dashboard")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("taxify_token")).toBeNull();
    expect(store.getState().auth).toMatchObject({
      status: "idle",
      token: null,
      user: null,
      error: "Invalid login response from server",
    });
  });

  it("shows an error for a failed request and does not redirect", async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValue(new Error("Invalid credentials"));

    const { store } = renderLogin();
    await user.click(screen.getByRole("button", { name: /enter control room/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(screen.queryByText("Admin Dashboard")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("taxify_token")).toBeNull();
    await waitFor(() => {
      expect(store.getState().auth).toMatchObject({
        status: "idle",
        token: null,
        user: null,
        error: "Invalid credentials",
      });
    });
  });
});
