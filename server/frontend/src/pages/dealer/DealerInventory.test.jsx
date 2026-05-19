/* eslint-disable no-undef */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DealerInventory from "./DealerInventory";
import App from "../../App";

jest.mock("../../context/AuthContext", () => {
  const React = require("react");
  return {
    AuthProvider: ({ children }) => <>{children}</>,
    useAuth: jest.fn(),
  };
});

const { useAuth } = require("../../context/AuthContext");

describe("DealerInventory RBAC behavior", () => {
  const authHeaders = () => ({ Authorization: "Bearer test-token" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (global.fetch.mockRestore) {
      global.fetch.mockRestore();
    }
  });

  it("lets a dealer_admin add a vehicle and includes dealer_id in the request payload", async () => {
    useAuth.mockReturnValue({
      user: { assignedDealerId: 1 },
      token: "test-token",
      role: "DEALER_ADMIN",
      authHeaders,
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ status: 200, vehicles: [] }),
      })
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ status: 201, vehicle: { _id: "123" } }),
      })
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ status: 200, vehicles: [] }),
      });

    render(<DealerInventory />);

    expect(await screen.findByRole("heading", { name: /Inventory/i })).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: /add vehicle/i }));
    expect(await screen.findByPlaceholderText(/e.g., Toyota/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/e.g., Toyota/i), {
      target: { value: "Toyota" },
    });
    fireEvent.change(screen.getByPlaceholderText(/e.g., Camry/i), {
      target: { value: "Camry" },
    });
    fireEvent.change(screen.getAllByRole("spinbutton")[0], {
      target: { value: "2024" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Add Vehicle/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));

    const addRequest = global.fetch.mock.calls[1];
    expect(addRequest[0]).toContain("/djangoapp/inventory/add");
    expect(addRequest[1].method).toBe("POST");

    const body = JSON.parse(addRequest[1].body);
    expect(body).toMatchObject({
      dealer_id: 1,
      car_make: "Toyota",
      car_model: "Camry",
      car_year: "2024",
    });
  });

  it("prevents a customer from reaching the dealer inventory page", async () => {
    useAuth.mockReturnValue({
      user: { userName: "customer" },
      token: "fake-token",
      role: "CUSTOMER",
      authHeaders: () => ({ Authorization: "Bearer fake-token" }),
    });

    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ status: 200, dealers: [], reviews: [] }),
    });

    render(
      <MemoryRouter initialEntries={["/dealer/inventory"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: /find a dealership/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add vehicle/i })).not.toBeInTheDocument();
  });
});
