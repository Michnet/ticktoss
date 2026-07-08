'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import all possible dashboard views
// This ensures that the client only downloads the JS for the view they are currently looking at.
const MyProfile = dynamic(() => import('@/components/dashboard/MyProfile'), {
  loading: () => <ViewLoader />,
});
const MyOrders = dynamic(() => import('@/components/dashboard/MyOrders'), {
  loading: () => <ViewLoader />,
});
const SavedItems = dynamic(() => import('@/components/dashboard/SavedItems'), {
  loading: () => <ViewLoader />,
});
const VendorOverview = dynamic(() => import('@/components/dashboard/VendorOverview'), {
  loading: () => <ViewLoader />,
});
const VendorProducts = dynamic(() => import('@/components/dashboard/VendorProducts'), {
  loading: () => <ViewLoader />,
});
const CustomerOrders = dynamic(() => import('@/components/dashboard/CustomerOrders'), {
  loading: () => <ViewLoader />,
});
const MyCart = dynamic(() => import('@/components/cart/MyCart'), {
  loading: () => <ViewLoader />,
});

function ViewLoader() {
  return (
    <div className="flex items-center justify-center p-12 text-muted-2" style={{ minHeight: '300px' }}>
      Loading view...
    </div>
  );
}

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'profile';

  // Map the 'view' parameter to the corresponding component
  const renderView = () => {
    switch (view) {
      // Buyer Views
      case 'profile': return <MyProfile />;
      case 'my_orders': return <MyOrders />;
      case 'my_cart': return <MyCart />;
      case 'saved': return <SavedItems />;
      
      // Vendor Views
      case 'vendor_overview': return <VendorOverview />;
      case 'vendor_products': return <VendorProducts />;
      case 'customer_orders': return <CustomerOrders />;
      
      // Fallback
      default: return <MyProfile />;
    }
  };

  return (
    <div className="dashboard-content" style={{ animation: 'tt-fade-in 0.3s ease-out' }}>
      <Suspense fallback={<ViewLoader />}>
        {renderView()}
      </Suspense>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<ViewLoader />}>
      <DashboardPageContent />
    </Suspense>
  );
}
