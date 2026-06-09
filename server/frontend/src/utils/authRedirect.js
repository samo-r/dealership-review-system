/**
 * Resolve where to send the user after login/register.
 * Supports redirectTo (ActionButton, RequireAuth) and legacy from (React Router location).
 */
export const getRedirectFromLocation = (location) => {
  if (!location?.state) return "/";

  if (location.state.redirectTo) {
    return location.state.redirectTo;
  }

  const from = location.state.from;
  if (from?.pathname) {
    return `${from.pathname}${from.search || ""}${from.hash || ""}`;
  }

  return "/";
};

export const getRoleLandingPath = (role) => {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "DEALER_ADMIN") return "/dealer/dashboard";
  return "/home";
};

export const getPostLoginPath = (role, redirectTo) => {
  if (redirectTo && redirectTo !== "/") {
    return redirectTo;
  }
  return getRoleLandingPath(role);
};
