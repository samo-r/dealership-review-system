import { getPostLoginPath, getRoleLandingPath } from "./authRedirect";
import { hasCapability } from "./roleCapabilities";

describe("authRedirect", () => {
  it("sends customers to home after login", () => {
    expect(getPostLoginPath("CUSTOMER")).toBe("/home");
  });

  it("sends dealer admins to dealer dashboard after login", () => {
    expect(getPostLoginPath("DEALER_ADMIN")).toBe("/dealer/dashboard");
  });

  it("sends system admins to admin dashboard after login", () => {
    expect(getPostLoginPath("ADMIN")).toBe("/admin/dashboard");
  });

  it("honours explicit redirect targets", () => {
    expect(getPostLoginPath("CUSTOMER", "/postreview/3")).toBe("/postreview/3");
  });

  it("uses role landing paths for unauthorized bounce targets", () => {
    expect(getRoleLandingPath("CUSTOMER")).toBe("/home");
    expect(getRoleLandingPath("DEALER_ADMIN")).toBe("/dealer/dashboard");
    expect(getRoleLandingPath(null)).toBe("/home");
  });
});

describe("roleCapabilities", () => {
  it("allows customers to create reviews", () => {
    expect(hasCapability("CUSTOMER", "review.create")).toBe(true);
  });

  it("blocks dealer admins from creating reviews", () => {
    expect(hasCapability("DEALER_ADMIN", "review.create")).toBe(false);
  });

  it("allows dealer admins to manage inventory", () => {
    expect(hasCapability("DEALER_ADMIN", "inventory.create")).toBe(true);
  });
});
