export default function Loading() {
  return (
    <div className="tt-container tt-container-padding" style={{ padding: '2rem 1.5rem', minHeight: '80vh' }}>
      <div className="tt-skeleton" style={{ height: '60px', marginBottom: '2rem' }} />
      <div className="tt-grid-products">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="tt-skeleton" style={{ height: '360px' }} />
        ))}
      </div>
    </div>
  );
}
