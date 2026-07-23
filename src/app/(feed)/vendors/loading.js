export default function Loading() {
  return (
    <div className="tt-container tt-container-padding" style={{ padding: '2rem 1.5rem', minHeight: '80vh' }}>
      <div className="tt-skeleton" style={{ height: '60px', marginBottom: '2rem' }} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="tt-skeleton" style={{ height: '230px' }} />
        ))}
      </div>
    </div>
  );
}
