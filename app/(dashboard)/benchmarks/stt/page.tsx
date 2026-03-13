import { BenchmarkTable } from "@/components/dashboard/benchmark-table";

export default function STTBenchmarksPage() {
  return (
    <BenchmarkTable
      type="STT"
      title="STT Benchmarks"
      description="Speech-to-Text accuracy, latency, and pricing benchmarks across vendors"
    />
  );
}
