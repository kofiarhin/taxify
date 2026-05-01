export function StatusPanel({ label, value, detail }) {
  return (
    <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-[1px] hover:border-white/12 active:scale-[0.99]">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-4 text-3xl tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{detail}</p>
    </div>
  );
}
