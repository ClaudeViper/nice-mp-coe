import { BenchmarkTable } from "@/components/dashboard/benchmark-table";

export default function TTSBenchmarksPage() {
  return (
    <BenchmarkTable
      type="TTS"
      title="TTS Benchmarks"
      description="MOS scores, naturalness, TTFB and roundtrip WER across leading TTS vendors"
    />
  );
}
