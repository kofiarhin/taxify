import { statusTone } from '../../constants/statuses';

export function StatusBadge({ value }) {
  const tone = statusTone[value] || 'bg-slate-50 text-slate-700 border-slate-200';
  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${tone}`}>{value?.replaceAll('_', ' ')}</span>;
}

export function LoadingBlock({ lines = 3 }) {
  return (
    <div className="space-y-3" aria-label="Loading">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-md bg-slate-200/80" />
      ))}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-[58ch] text-slate-600">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }) {
  return <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{message}</div>;
}
