/**
 * Subscription tier limits stub.
 * Billing is not active in MVP — limits are enforced in API routes only.
 */
export const SUBSCRIPTION_LIMITS = {
  free:    { maxActiveListings: 5 },
  starter: { maxActiveListings: 20 },
  pro:     { maxActiveListings: Infinity },
};

/**
 * Returns the max active listings allowed for a given subscription tier.
 * @param {string|null} tier
 * @returns {number}
 */
export function getListingLimit(tier) {
  return (SUBSCRIPTION_LIMITS[tier ?? 'free'] ?? SUBSCRIPTION_LIMITS.free).maxActiveListings;
}

/**
 * Check if a vendor can publish another listing.
 * @param {number} currentActiveCount
 * @param {string|null} tier
 * @returns {{ allowed: boolean, limit: number }}
 */
export function canPublishListing(currentActiveCount, tier) {
  const limit = getListingLimit(tier);
  return {
    allowed: currentActiveCount < limit,
    limit,
  };
}
