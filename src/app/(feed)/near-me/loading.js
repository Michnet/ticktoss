export default function Loading() {
  return (
    <div className="tt-container tt-container-padding" style={{ padding: '2rem 1.5rem', minHeight: '80vh' }}>
      <div className="tt-skeleton" style={{ height: '60px', maxWidth: '500px', margin: '0 auto 3rem' }} />
      <div className="tt-grid-products">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="tt-skeleton" style={{ height: '360px' }} />
        ))}
      </div>
    </div>
  );
}
