export default function HelpBox({ title, steps }) {
  return (
    <div className="mb-6 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
      <p className="font-display text-sm font-medium">{title}</p>
      <ol className="mt-2 space-y-1 text-sm text-[var(--ink-dim)]">
        {steps.map((s, i) => <li key={i}>{i + 1}. {s}</li>)}
      </ol>
    </div>
  );
}