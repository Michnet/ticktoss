export default function Loading() {
  return (
    <div className="tt-container tt-container-padding !py-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="tt-skeleton" style={{ width: '40px', height: '40px', borderRadius: '9999px' }} />
        <div className="tt-skeleton" style={{ width: '160px', height: '20px' }} />
      </div>
      <div className="tt-card overflow-hidden p-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="tt-skeleton" style={{ height: '80px', margin: '1px' }} />
        ))}
      </div>
    </div>
  );
}
