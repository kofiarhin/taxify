import { formatElapsed, useElapsedSeconds } from '../../lib/tripMeter';

export function TripMeter({ startedAt }) {
  const elapsedSeconds = useElapsedSeconds(startedAt, Boolean(startedAt));
  if (!startedAt) return null;

  return (
    <div className="rounded-lg border border-teal-700/20 bg-teal-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800">Elapsed</p>
          <p className="font-mono text-3xl font-bold text-slate-950">{formatElapsed(elapsedSeconds)}</p>
        </div>
        <p className="max-w-[14rem] text-right text-xs font-medium text-teal-900/80">
          Final fare is calculated from distance and time once the driver ends the trip.
        </p>
      </div>
    </div>
  );
}
