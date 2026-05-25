const stats = [
  {
    value: "15 min",
    label: "From signup to live agent",
  },
  {
    value: "95%",
    label: "Conversations without human",
  },
  {
    value: "24/7",
    label: "Always on",
  },
];

export default function StatsBar() {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.02]">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 divide-y divide-white/[0.06] md:grid-cols-3 md:divide-x md:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.value} className="flex flex-col items-center justify-center px-8 py-10">
              <span className="mb-1.5 text-3xl font-semibold tracking-tight text-white">
                {stat.value}
              </span>
              <span className="text-sm text-white/40">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
