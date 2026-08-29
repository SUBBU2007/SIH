export default function StarRating({ rating, max = 5 }) {
  const stars = [];
  for (let i = 0; i < max; i++) {
    const diff = rating - i;
    const fillPercent = diff >= 1 ? 100 : diff > 0 ? diff * 100 : 0;
    stars.push(
      <div key={i} className="relative inline-block h-5 w-5">
        <svg viewBox="0 0 24 24" className="absolute inset-0 h-5 w-5" style={{ color: "var(--line)" }} fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" style={{ color: "var(--accent)" }} fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </div>
      </div>
    );
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}