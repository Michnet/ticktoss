'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '@/store/useAppStore';
import { Trash2, ShoppingCart, Plus, Minus, Store, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useCheckout } from '@/hooks/useCheckout';
import { resizedImage } from '@/helpers/universal';
import AuthForm from '@/components/auth/AuthForm';
import AddressForm from '@/components/checkout/AddressForm';

export default function MyCart() {
  const { user, cartItems, removeFromCart, updateQuantity, clearCart } = useAppStore();
  const { submitOrder, isLoading, error } = useCheckout();
  const [success, setSuccess] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [address, setAddress] = useState({});
  const isAddressComplete = ['firstName', 'lastName', 'phone', 'address', 'city'].every((field) => address[field]?.trim());

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + ((item.price || item.sale_price || 0) * (item.quantity || 1)), 0);
  };

  const handleCheckoutClick = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    await processCheckout();
  };

  const processCheckout = async () => {
    const result = await submitOrder(cartItems, address, 'cash_on_delivery', 'Order from MyCart');
    if (result.success) {
      setSuccess(true);
      clearCart();
    }
  };

  if (success) {
    return (
      <div className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-lg)] p-8 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
        <p className="text-[var(--tt-muted)] mb-6">Thank you for your purchase. We have sent an email confirmation with your order details.</p>
        <Link href="/products" className="tt-btn tt-btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-lg)] p-12 text-center max-w-2xl mx-auto">
        <ShoppingCart size={48} className="mx-auto text-[var(--tt-muted-2)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--tt-text)] mb-2">Your cart is empty</h2>
        <p className="text-[var(--tt-muted)] mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/products" className="tt-btn tt-btn-primary tt-shimmer">Browse Products</Link>
      </div>
    );
  }


  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingCart size={28} />
        My Cart
      </h1>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-[var(--tt-radius-md)] mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={item.id} 
                className="relative bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-md)] p-4 flex flex-row items-start sm:items-center gap-4 shadow-sm"
              >
                {item?.featured_image ? (
                  <img src={resizedImage(item.featured_image?.url, 'thumbnail')} alt={item.name} className="w-20 h-20 object-cover rounded-[var(--tt-radius-sm)] bg-[var(--tt-surface-2)]" />
                ) : (
                  <div className="w-20 h-20 rounded-[var(--tt-radius-sm)] bg-[var(--tt-surface-2)] flex items-center justify-center text-[var(--tt-muted)]">
                    No img
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.product_categories?.name && (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-[var(--tt-surface-2)] text-[var(--tt-muted)] px-2 py-0.5 rounded-full">
                        {item.product_categories.name}
                      </span>
                    )}
                    {item.vendor?.tt_stores?.[0]?.name && (
                      <span className="text-xs text-[var(--tt-muted)] flex items-center gap-1">
                        <Store size={12} />
                        {item.vendor.tt_stores[0].name}
                      </span>
                    )}
                  </div>
                  <Link href={`/products/${item.slug || item.id}`} className="font-semibold text-sm text-[var(--tt-text)] hover:text-[var(--tt-flame)] transition-colors line-clamp-2">
                    {item.name}
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="text-[var(--tt-flame)] font-bold">
                      UGX {(item.sale_price || item.price || 0).toLocaleString()}
                    </div>
                    {item.price && item.sale_price && item.price > item.sale_price && (
                      <div className="text-xs text-[var(--tt-muted-2)] line-through">
                        UGX {item.price.toLocaleString()}
                      </div>
                    )}
                  </div>
                  {item.stock !== undefined && item.stock <= (item.stock_alert_level || 5) && (
                    <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertTriangle size={12} />
                      Only {item.stock} left in stock
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center gap-3 bg-[var(--tt-surface-2)] rounded-full px-2 py-1 border border-[var(--tt-border)]">
                  <button 
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                    className="p-1 hover:bg-[var(--tt-surface)] rounded-full transition-colors text-[var(--tt-muted)] hover:text-[var(--tt-text)]"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity || 1}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                    className="p-1 hover:bg-[var(--tt-surface)] rounded-full transition-colors text-[var(--tt-muted)] hover:text-[var(--tt-text)]"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="absolute top-2 right-2 p-2 text-[var(--tt-muted-2)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors self-end sm:self-auto"
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-lg)] p-6 h-fit sticky top-24 shadow-sm">
          <h3 className="text-lg font-bold mb-4 pb-4 border-b border-[var(--tt-border)]">Order Summary</h3>
          <div className="flex justify-between mb-3 text-[var(--tt-muted)]">
            <span>Subtotal</span>
            <span>UGX {calculateSubtotal().toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-4 text-[var(--tt-muted)]">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex justify-between mb-6 pb-4 border-b border-[var(--tt-border)] font-bold text-lg text-[var(--tt-text)]">
            <span>Total</span>
            <span className="text-[var(--tt-flame)]">UGX {calculateSubtotal().toLocaleString()}</span>
          </div>

          <h4 className="text-sm font-bold mb-3 text-[var(--tt-text)]">Delivery Details</h4>
          <div className="mb-4">
            <AddressForm value={address} onChange={setAddress} />
          </div>

          <button
            onClick={handleCheckoutClick}
            disabled={isLoading || !isAddressComplete}
            className="tt-btn tt-btn-primary tt-shimmer w-full flex items-center justify-center gap-2 py-3"
          >
            {isLoading ? 'Processing...' : 'Secure Checkout'}
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {authModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAuthModalOpen(false)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'relative', width: '100%', maxWidth: '440px', zIndex: 3001 }}
            >
              <button
                onClick={() => setAuthModalOpen(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--tt-surface)', border: '1px solid var(--tt-border)', color: 'var(--tt-text)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                ✕
              </button>
              <AuthForm 
                defaultMode="login" 
                onSuccess={() => {
                  setAuthModalOpen(false);
                  // Optionally trigger processCheckout() directly here if we want immediate checkout after login.
                  // For now, let user click again.
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
