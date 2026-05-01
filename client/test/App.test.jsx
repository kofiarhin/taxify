import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { LoginPage } from "../src/pages/auth/LoginPage";
import { renderWithProviders } from "./test-utils";

describe("LoginPage", () => {
  it("renders the sign-in flow", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole("heading", { name: /sign in to taxify/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enter control room/i })).toBeInTheDocument();
  });
});
