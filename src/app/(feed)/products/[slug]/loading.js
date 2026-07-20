export default function Loading() {
  return (
    <div className="tt-container tt-container-padding" style={{ padding: '1.5rem', minHeight: '80vh' }}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="tt-skeleton w-full md:w-1/2" style={{ aspectRatio: '1 / 1', borderRadius: 'var(--tt-radius-md)' }} />
        <div className="flex-1 flex flex-col gap-3">
          <div className="tt-skeleton" style={{ height: '24px', width: '70%' }} />
          <div className="tt-skeleton" style={{ height: '36px', width: '40%' }} />
          <div className="tt-skeleton" style={{ height: '80px' }} />
          <div className="tt-skeleton" style={{ height: '48px', width: '60%' }} />
          <div className="tt-skeleton" style={{ height: '48px' }} />
        </div>
      </div>
    </div>
  );
}
