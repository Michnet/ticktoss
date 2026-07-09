import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * TickToss global app store (Zustand).
 * 
 * Sections:
 *  - auth: current user session
 *  - location: user's detected / selected location
 *  - interests: local buffer for anonymous interest tracking
 *  - ui: loading states, sidebar open, etc.
 */
const useAppStore = create(
  persist(
    (set, get) => ({
      /* ── Auth ── */
      user: null,
      profile: null,
      isAuthLoading: true,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setAuthLoading: (loading) => set({ isAuthLoading: loading }),
      clearAuth: () => set({ user: null, profile: null, isAuthLoading: false }),

      isVendor: () => {
        const { profile } = get();
        return profile?.roles?.includes('tt_vendor') ?? false;
      },

      /* ── Location ── */
      userLocation: null,          // { lat, lng } from geolocation API
      selectedLocationId: null,    // pre-seeded hierarchy location_id
      setUserLocation: (loc) => set({ userLocation: loc }),
      setSelectedLocationId: (id) => set({ selectedLocationId: id }),

      /* ── Interest buffer (anonymous) ── */
      // Flushed to /api/interests/track on sign-in
      pendingInterests: [],
      addPendingInterest: (event) =>
        set((s) => ({
          pendingInterests: [
            ...s.pendingInterests.slice(-49),  // keep last 50
            { ...event, ts: Date.now() },
          ],
        })),
      clearPendingInterests: () => set({ pendingInterests: [] }),

      /* ── UI ── */
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      toasts: [],
      addToast: (toast) =>
        set((s) => ({
          toasts: [
            ...s.toasts,
            { id: Date.now(), duration: 4000, ...toast },
          ],
        })),
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      /* ── Cart ── */
      cartItems: [],
      addToCart: (product, quantity = 1) =>
        set((s) => {
          const existingItem = s.cartItems.find((item) => item.id === product.id);
          if (existingItem) {
            return {
              cartItems: s.cartItems.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
              ),
            };
          }
          return { cartItems: [...s.cartItems, { ...product, quantity }] };
        }),
      removeFromCart: (productId) =>
        set((s) => ({ cartItems: s.cartItems.filter((item) => item.id !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((s) => ({
          cartItems: s.cartItems.map((item) =>
            item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        })),
      clearCart: () => set({ cartItems: [] }),

    }),
    {
      name: 'ticktoss-store',
      // Only persist non-sensitive, lightweight fields
      partialize: (state) => ({
        userLocation: state.userLocation,
        selectedLocationId: state.selectedLocationId,
        pendingInterests: state.pendingInterests,
        cartItems: state.cartItems,
      }),
    }
  )
);

export default useAppStore;
