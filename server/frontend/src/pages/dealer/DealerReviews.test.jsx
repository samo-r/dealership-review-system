/* eslint-disable no-undef */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ActionButton from "../../components/common/ActionButton";
import Dealer from "../../components/Dealers/Dealer";

jest.mock("../../context/AuthContext", () => {
  const React = require("react");
  return {
    useAuth: jest.fn(),
  };
});

const { useAuth } = require("../../context/AuthContext");

describe("Dealer review RBAC behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    global.fetch = jest.fn((url) => {
      if (url.includes("djangoapp/dealer/1")) {
        return Promise.resolve({
          json: jest.fn().mockResolvedValue({
            status: 200,
            dealer: [
              {
                full_name: "Sample Dealer",
                city: "Test City",
                state: "TS",
                address: "123 Test St",
                zip: "12345",
              },
            ],
          }),
        });
      }

      if (url.includes("djangoapp/reviews/dealer/1")) {
        return Promise.resolve({
          json: jest.fn().mockResolvedValue({ status: 200, reviews: [] }),
        });
      }

      return Promise.resolve({ json: jest.fn().mockResolvedValue({ status: 200, dealers: [] }) });
    });
  });

  afterEach(() => {
    if (global.fetch.mockRestore) {
      global.fetch.mockRestore();
    }
  });

  it("allows customers to see Add Review and navigates to the postreview page", async () => {
    useAuth.mockReturnValue({
      user: { userName: "customer" },
      role: "CUSTOMER",
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<ActionButton dealerId={1} />} />
          <Route path="/postreview/:id" element={<div>Post Review Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /add review/i }));

    expect(await screen.findByText(/Post Review Page/i)).toBeInTheDocument();
  });

  it("hides the dealer review button for dealer_admins on the dealer detail page", async () => {
    useAuth.mockReturnValue({
      user: { userName: "dealer_admin" },
      role: "DEALER_ADMIN",
    });

    render(
      <MemoryRouter initialEntries={["/dealer/1"]}>
        <Routes>
          <Route path="/dealer/:id" element={<Dealer />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Sample Dealer/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /add review/i })).not.toBeInTheDocument();
  });

  it("redirects anonymous add-review attempts to login", async () => {
    useAuth.mockReturnValue({ user: null, role: null });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<ActionButton dealerId={1} />} />
          <Route path="/postreview/:id" element={<div>Post Review Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /add review/i }));

    expect(await screen.findByText(/Login Page/i)).toBeInTheDocument();
  });
});
