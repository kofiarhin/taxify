import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Providers } from "../src/redux/providers";
import { LoginPage } from "../src/pages/auth/LoginPage";

describe("LoginPage", () => {
  it("renders the sign-in form", () => {
    render(
      <Providers>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Providers>
    );

    expect(screen.getByRole("heading", { name: /sign in to taxify/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
