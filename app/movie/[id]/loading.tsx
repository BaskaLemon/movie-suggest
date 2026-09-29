export default function Loading() {
  return (
    <div className="grid gap-10 px-4 pt-28 sm:px-8 lg:grid-cols-[320px_1fr] lg:pl-8 lg:pt-40" aria-busy>
      <div className="mx-auto aspect-[2/3] w-full max-w-[320px] animate-pulse rounded-[28px] bg-white/[0.06]" />
      <div className="space-y-4 self-end">
        <div className="h-20 w-3/4 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-24 w-full max-w-2xl animate-pulse rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}
