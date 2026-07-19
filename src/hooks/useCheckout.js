import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  /**
   * Submits cart items and a single address (used for both billing and
   * shipping) to create an order per vendor represented in the items.
   * If the user is unauthenticated, they will be redirected to the login page.
   *
   * @param {Array} items - Array of product/cart items to order
   * @param {Object} address - { firstName, lastName, phone, address, city, zipCode }
   * @param {String} paymentMethod - Payment method selected
   * @param {String} notes - Optional order notes
   */
  const submitOrder = async (items, address, paymentMethod = 'cash_on_delivery', notes = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          address,
          payment_method: paymentMethod,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthenticated, redirect to login
          router.push('/login?callbackUrl=/checkout');
          throw new Error('Please login to complete your order.');
        }
        throw new Error(data.error || 'Failed to place order');
      }

      return { success: true, orders: data.orders };

    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { submitOrder, isLoading, error };
}
