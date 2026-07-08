import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  /**
   * Submits the cart items and address information to create an order.
   * If the user is unauthenticated, they will be redirected to the login page.
   *
   * @param {Array} cartItems - Array of product objects in the cart
   * @param {Object} addresses - { shipping: {...}, billing: {...} }
   * @param {String} paymentMethod - Payment method selected
   * @param {String} notes - Optional order notes
   */
  const submitOrder = async (cartItems, addresses, paymentMethod = 'cash_on_delivery', notes = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems,
          shipping_address: addresses.shipping || {},
          billing_address: addresses.billing || {},
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
