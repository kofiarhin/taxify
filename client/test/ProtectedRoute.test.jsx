import { describe, expect, it } from "vitest";
import { Routes, Route } from "react-router-dom";
import { screen } from "@testing-library/react";
import { ProtectedRoute } from "../src/routes/ProtectedRoute";
import { renderWithProviders } from "./test-utils";

describe("ProtectedRoute", () => {
  it("redirects guests to login", () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Screen</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/driver" element={<div>Driver Screen</div>} />
        </Route>
      </Routes>,
      { route: "/driver" }
    );

    expect(screen.getByText("Login Screen")).toBeInTheDocument();
  });

  it("renders protected content for authenticated users", () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Screen</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/driver" element={<div>Driver Screen</div>} />
        </Route>
      </Routes>,
      {
        route: "/driver",
        preloadedState: {
          auth: {
            token: "token",
            user: { role: "DRIVER", fullName: "Dana Vale", email: "driver@taxify.local" },
            status: "authenticated",
          },
        },
      }
    );

    expect(screen.getByText("Driver Screen")).toBeInTheDocument();
  });
});
