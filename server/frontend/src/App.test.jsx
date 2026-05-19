/* eslint-disable no-undef */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

jest.mock("./context/AuthContext", () => {
  const React = require("react");
  return {
    AuthProvider: ({ children }) => <>{children}</>,
    useAuth: jest.fn(),
  };
});

const { useAuth } = require("./context/AuthContext");

describe("App route authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ status: 200, dealers: [], reviews: [] }),
    });
  });

  afterEach(() => {
    if (global.fetch.mockRestore) {
      global.fetch.mockRestore();
    }
  });

  it("redirects anonymous users from /admin/dashboard to the login page", async () => {
    useAuth.mockReturnValue({ token: null, role: null, user: null });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("redirects authenticated customers from /dealer/dashboard back to the home page", async () => {
    useAuth.mockReturnValue({
      token: "fake-token",
      role: "CUSTOMER",
      user: { userName: "customer" },
    });

    render(
      <MemoryRouter initialEntries={["/dealer/dashboard"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: /find a dealership/i })).toBeInTheDocument();
    expect(screen.queryByText(/dealer dashboard/i)).not.toBeInTheDocument();
  });

  it("allows public access to /reviews without authentication", async () => {
    useAuth.mockReturnValue({ token: null, role: null, user: null });

    render(
      <MemoryRouter initialEntries={["/reviews"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Customer Reviews/i)).toBeInTheDocument();
  });
});
