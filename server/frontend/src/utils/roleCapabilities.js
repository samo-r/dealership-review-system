/**
 * Client-side capability map — mirrors Django ROLE_CAPABILITIES for UI gating.
 * Server enforcement remains authoritative; this only controls what renders.
 */
export const ROLE_CAPABILITIES = {
  ADMIN: new Set([
    "review.create",
    "review.delete.any",
    "inventory.read.any",
    "inventory.create",
    "inventory.update.any",
    "inventory.delete.any",
    "dealership.create",
    "dealership.update.any",
  ]),
  DEALER_ADMIN: new Set([
    "inventory.create",
    "inventory.update.own",
    "inventory.delete.own",
    "dealership.update.own",
  ]),
  CUSTOMER: new Set([
    "review.create",
    "review.update.own",
    "review.delete.own",
  ]),
};

export const hasCapability = (role, capability) => {
  if (!role || !capability) return false;
  return ROLE_CAPABILITIES[role]?.has(capability) ?? false;
};
