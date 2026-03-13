import { BenchmarkTable } from "@/components/dashboard/benchmark-table";

export default function TTSBenchmarksPage() {
  return (
    <BenchmarkTable
      type="TTS"
      title="TTS Benchmarks"
      description="Text-to-Speech quality, latency, and pricing benchmarks across vendors"
    />
  );
}
