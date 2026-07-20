export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="tt-skeleton" style={{ height: '64px', borderRadius: 'var(--tt-radius-md)' }} />
      <div className="tt-skeleton" style={{ height: '160px', borderRadius: 'var(--tt-radius-md)' }} />
      <div className="tt-skeleton" style={{ height: '280px', borderRadius: 'var(--tt-radius-md)' }} />
      <div className="tt-skeleton" style={{ height: '280px', borderRadius: 'var(--tt-radius-md)' }} />
    </div>
  );
}
