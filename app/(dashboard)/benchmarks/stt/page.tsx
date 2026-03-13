import { BenchmarkTable } from "@/components/dashboard/benchmark-table";

export default function STTBenchmarksPage() {
  return (
    <BenchmarkTable
      type="STT"
      title="Speech-to-Text Benchmarks"
      description="WER, CER, RTF and latency rankings across leading STT vendors"
    />
  );
}
