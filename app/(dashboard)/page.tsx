export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
      <p className="mt-1 text-sm text-gray-500">
        NICE Media Processing Center of Excellence
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Vendors Tracked", value: "—" },
          { label: "Benchmarks Run", value: "—" },
          { label: "News Items", value: "—" },
          { label: "Active Evaluations", value: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
