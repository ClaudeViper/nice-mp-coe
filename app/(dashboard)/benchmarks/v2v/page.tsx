import { BenchmarkTable } from "@/components/dashboard/benchmark-table";

export default function V2VBenchmarksPage() {
  return (
    <BenchmarkTable
      type="V2V"
      title="V2V Benchmarks"
      description="Task completion, e2e latency, persona consistency and interruption handling rankings"
    />
  );
}
