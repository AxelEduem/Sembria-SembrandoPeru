function HorarioLoadingSkeleton() {
  const cards = Array.from(
    { length: 4 },
    (_, index) => index,
  );

  const days = Array.from(
    { length: 6 },
    (_, index) => index,
  );

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card}
            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.035)]"
          >
            <div className="border-b border-slate-100 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-36 max-w-full animate-pulse rounded bg-slate-200" />

                      <div className="mt-2 h-3 w-44 max-w-full animate-pulse rounded bg-slate-100" />
                    </div>

                    <div className="h-12 w-16 shrink-0 animate-pulse rounded-xl bg-slate-100" />
                  </div>

                  <div className="mt-2.5 flex gap-1.5">
                    <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />

                    <div className="h-5 w-28 animate-pulse rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-2.5 py-2">
                <div className="h-7 w-7 animate-pulse rounded-lg bg-slate-200" />

                <div className="min-w-0 flex-1">
                  <div className="h-2 w-12 animate-pulse rounded bg-slate-200" />

                  <div className="mt-1.5 h-3 w-32 max-w-full animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            </div>

            <div className="px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />

                  <div className="mt-1.5 h-2.5 w-44 animate-pulse rounded bg-slate-100" />
                </div>

                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {days.map((day) => (
                  <div
                    key={day}
                    className="min-h-[78px] rounded-xl border border-slate-100 bg-slate-50/60 p-2.5"
                  >
                    <div className="h-2.5 w-10 animate-pulse rounded bg-slate-200" />

                    <div className="mt-3 h-7 w-full animate-pulse rounded-lg bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-2">
              <div className="h-2.5 w-28 animate-pulse rounded bg-slate-100" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HorarioLoadingSkeleton;