'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';
import VendorAddBulk from '@/components/dashboard/VendorAddBulk';

function AdminPageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'overview';

  if (view === 'vendor-applications') {
    return <VendorApplicationsView />;
  }

  if (view === 'bulk-add') {
    return <VendorAddBulk />;
  }

  return (
    <div>
      <h1 className="tt-section-title">Admin <span>Overview</span></h1>
      <p style={{ color: 'var(--tt-muted)', marginTop: '0.5rem' }}>
        Select a section from the menu to manage the platform.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="tt-card tt-glass p-6">
          <h3 className="font-bold mb-2">Platform Stats</h3>
          <p className="text-sm text-[var(--tt-muted-2)]">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="tt-skeleton h-[200px] w-full" />}>
      <AdminPageContent />
    </Suspense>
  );
}

function VendorApplicationsView() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const supabase = getSupabaseBrowserClient();
  const { addToast } = useAppStore();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/vendors?intent=get_applications');
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to load applications');
      }
      
      setApplications(result.applications || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      addToast({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (appId, userId) => {
    setProcessingId(appId);
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          intent: 'approval', 
          application_id: appId,
          user_id: userId
        }),
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to approve application');
      }

      addToast({ type: 'success', message: 'Application approved successfully!' });
      // Remove the approved app from the list
      setApplications(prev => prev.filter(app => app.id !== appId));
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="tt-section-title">Vendor <span>Applications</span></h1>
        <div className="tt-skeleton h-[200px] w-full mt-6" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="tt-section-title">Vendor <span>Applications</span></h1>
      <p style={{ color: 'var(--tt-muted)', marginTop: '0.5rem', marginBottom: '2rem' }}>
        Review and approve pending vendor applications.
      </p>

      {applications.length === 0 ? (
        <div className="tt-card tt-glass p-8 text-center">
          <p className="text-[var(--tt-muted)]">No pending applications found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map(app => (
            <div key={app.id} className="tt-card tt-glass p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div>
                <h3 className="font-bold text-lg">{app.meta?.tt_store?.name || app.business_name || 'Unnamed Store'}</h3>
                <div className="text-sm text-[var(--tt-muted-2)] mt-1 space-y-1">
                  <p><span className="font-semibold">Applicant:</span> {app.profiles?.display_name || 'N/A'} ({app.profiles?.email || 'N/A'})</p>
                  <p><span className="font-semibold">Call Numbers:</span> {app.meta?.tt_store?.calls?.join(', ') || 'N/A'}</p>
                  {app.meta?.tt_store?.whatsapp?.length > 0 && (
                    <p><span className="font-semibold">WhatsApp:</span> {app.meta.tt_store.whatsapp.join(', ')}</p>
                  )}
                  <p><span className="font-semibold">Location:</span> {app.meta?.tt_store?.address || 'N/A'}</p>
                  {app.note && <p><span className="font-semibold">Notes:</span> {app.note}</p>}
                  <p><span className="font-semibold">Applied:</span> {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleApprove(app.id, app.user_id)}
                  disabled={processingId === app.id}
                  className="tt-btn tt-btn-primary flex-1 md:flex-none"
                  style={{ opacity: processingId === app.id ? 0.7 : 1 }}
                >
                  {processingId === app.id ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
