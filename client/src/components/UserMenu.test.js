import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserMenu from "./UserMenu";

describe("UserMenu", () => {
  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("renders user navigation links", () => {
    // Arrange
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    // Act
    const profile = screen.getByRole("link", { name: /profile/i });
    const orders = screen.getByRole("link", { name: /orders/i });

    // Assert
    expect(profile).toHaveAttribute("href", "/dashboard/user/profile");
    expect(orders).toHaveAttribute("href", "/dashboard/user/orders");
  });
});
