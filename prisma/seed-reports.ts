import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Check your .env file.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const REPORTS = [
  {
    type: "MonthlyLandscape" as const,
    title: "Speech Technology Landscape Report — March 2026",
    status: "Completed" as const,
    summary: "The speech AI market continues rapid consolidation around a few key players. OpenAI's Whisper V3 Turbo and Deepgram's Nova-2 lead STT accuracy, while ElevenLabs dominates TTS quality. V2V remains nascent but accelerating with GPT-4o Realtime and Gemini Live.",
    content: `# Speech Technology Landscape Report — March 2026

## Executive Summary

The speech AI market continues rapid consolidation around a few key players. OpenAI's Whisper V3 Turbo and Deepgram's Nova-2 lead STT accuracy, while ElevenLabs dominates TTS quality. V2V remains nascent but accelerating with GPT-4o Realtime and Gemini Live.

## STT Technology Update

### Accuracy Leaders
The top STT models by WER on LibriSpeech test-clean:
- **AssemblyAI Universal-2**: 2.1% WER — best overall accuracy
- **OpenAI Whisper Large V3**: 2.7% WER — strong multilingual support
- **Deepgram Nova-2**: 3.2% WER — fastest inference at 0.07 RTF
- **Google Chirp 2.0**: 3.5% WER — best language coverage (100+ languages)

### Latency Benchmarks
For real-time contact center use cases, latency is critical:
- **Deepgram**: ~280ms average, best for real-time streaming
- **OpenAI**: ~420ms average, good balance of speed and accuracy
- **AssemblyAI**: ~510ms average, prioritizes accuracy over speed
- **Azure**: ~450ms average, strong custom model support

### Pricing Trends
STT pricing continues to drop:
- Deepgram offers the lowest at $0.0043/min
- AssemblyAI competitive at $0.0062/min
- OpenAI at $0.006/min
- Google and Azure remain higher at $0.016-0.024/min but offer enterprise features

## TTS Technology Update

### Quality Rankings
ElevenLabs continues to lead in voice quality:
- **ElevenLabs Multilingual V2**: MOS 4.5, naturalness 92/100
- **OpenAI TTS-1 HD**: MOS 4.2, naturalness 87/100
- **Azure Neural TTS**: MOS 4.0, naturalness 83/100
- **Google Neural2**: MOS 3.9, naturalness 81/100
- **Amazon Polly Neural**: MOS 3.7, naturalness 78/100

### Key Development
ElevenLabs' Flash model now offers sub-200ms TTFB, making it viable for real-time conversational applications.

## V2V / Conversational AI Update

### Emerging Landscape
Voice-to-voice is the fastest growing segment:
- **OpenAI GPT-4o Realtime**: Most capable but expensive at $0.06/min
- **Google Gemini Live**: Strong multilingual support
- **Hume AI EVI-2**: Unique emotion-aware capabilities
- **Retell AI**: Purpose-built for phone automation
- **VAPI**: Flexible orchestration platform

### Task Completion Benchmarks
Early evaluations show:
- Hume EVI-2: 82% task completion, strong naturalness (85/100)
- Retell: 78% task completion, faster latency (950ms avg)

## Recommendations for NICE

1. **STT**: Evaluate AssemblyAI Universal-2 for accuracy-critical applications; Deepgram Nova-2 for real-time streaming
2. **TTS**: Begin ElevenLabs integration for IVR and virtual agent responses
3. **V2V**: Monitor GPT-4o Realtime and Hume EVI-2; too early for production deployment
4. **Priority Integration**: Google and Azure have existing CXone marketplace connectors — leverage these first
5. **Next Steps**: Schedule vendor demonstrations with top 3 STT and top 2 TTS vendors`,
    generatedBy: "report-generator-agent",
  },
  {
    type: "VendorComparison" as const,
    title: "Vendor Comparison Report — openai vs deepgram vs assemblyai",
    status: "Completed" as const,
    summary: "Comparing the three leading STT vendors for NICE CXone integration. AssemblyAI leads in accuracy, Deepgram in speed, and OpenAI in versatility. For contact center use cases, AssemblyAI is recommended for post-call analytics and Deepgram for real-time transcription.",
    content: `# Vendor Comparison: OpenAI vs Deepgram vs AssemblyAI

## Executive Summary

Comparing the three leading STT vendors for NICE CXone integration. AssemblyAI leads in accuracy (2.1% WER), Deepgram in speed (280ms latency), and OpenAI in versatility (STT + TTS + V2V). For contact center use cases, AssemblyAI is recommended for post-call analytics and Deepgram for real-time transcription.

## Company Profiles

### OpenAI
- Founded 2015, San Francisco
- Full speech AI stack: Whisper (STT), TTS-1 (TTS), GPT-4o Realtime (V2V)
- Cloud-only deployment, SOC2 + GDPR certified

### Deepgram
- Founded 2015, San Francisco
- Purpose-built for enterprise speech: Nova-2 (STT), Aura (TTS), Voice Agent API
- Cloud + on-prem options, SOC2 + HIPAA certified

### AssemblyAI
- Founded 2017, San Francisco
- STT specialist: Universal-2 (STT), LeMUR (audio intelligence)
- Cloud-only, SOC2 + HIPAA + PCI DSS certified

## Performance Comparison

| Metric | OpenAI Whisper V3 | Deepgram Nova-2 | AssemblyAI Universal-2 |
|--------|------------------|-----------------|----------------------|
| WER (LibriSpeech) | 2.7% | 3.2% | 2.1% |
| CER | 1.8% | 2.3% | 1.5% |
| Avg Latency | 420ms | 280ms | 510ms |
| RTF | 0.105 | 0.07 | 0.128 |
| Price/min | $0.006 | $0.0043 | $0.0062 |

## Pricing Analysis

At 100,000 minutes/month:
- **Deepgram**: $430/mo (lowest)
- **OpenAI**: $600/mo
- **AssemblyAI**: $620/mo

At 1,000,000 minutes/month:
- **Deepgram**: ~$3,600/mo (volume discount)
- **AssemblyAI**: ~$5,500/mo (volume pricing)
- **OpenAI**: $6,000/mo (no volume discount)

## NICE CXone Compatibility

| Vendor | Status | Integration Method | Complexity | Est. Days |
|--------|--------|-------------------|------------|-----------|
| OpenAI | Compatible | REST API | Low | 15 |
| Deepgram | Compatible | REST + WebSocket | Low | 12 |
| AssemblyAI | Compatible | REST + WebSocket | Low | 12 |

## Recommendation

**For real-time transcription**: Deepgram Nova-2 — fastest latency, lowest cost, on-prem option
**For post-call analytics**: AssemblyAI Universal-2 — best accuracy, LeMUR for transcript analysis
**For full-stack solution**: OpenAI — if you also need TTS and V2V capabilities`,
    generatedBy: "report-generator-agent",
  },
  {
    type: "BuildVsBuy" as const,
    title: "Build vs Buy Analysis — Q1 2026",
    status: "Completed" as const,
    summary: "Analysis recommends a buy strategy for STT and TTS (scores 7-9/10), with selective build for V2V orchestration. Estimated 3-year TCO is 40% lower with buy vs build for STT, while V2V orchestration layer offers better control when built in-house.",
    content: `# Build vs Buy Analysis — Q1 2026

## Executive Summary

Analysis recommends a buy strategy for STT and TTS (vendor scores 7-9/10), with selective build for V2V orchestration. Estimated 3-year TCO is 40% lower with buy vs build for STT, while V2V orchestration layer offers better control when built in-house.

## Vendor Scorecard

### STT Vendors (Buy Recommended)
| Vendor | Score | Rationale |
|--------|-------|-----------|
| Google | 9/10 | Certified CXone integration, FedRAMP, on-prem option |
| Azure | 9/10 | Certified CXone integration, best compliance |
| AssemblyAI | 8/10 | Best accuracy, strong compliance, STT-only focus |
| Deepgram | 8/10 | Fastest, on-prem option, contact center focused |
| OpenAI | 8/10 | Good accuracy, full stack, easy REST API |

### TTS Vendors (Buy Recommended)
| Vendor | Score | Rationale |
|--------|-------|-----------|
| ElevenLabs | 7/10 | Best quality, growing compliance |
| Azure | 9/10 | Enterprise-grade, 400+ voices, certified |
| Amazon Polly | 7/10 | Reliable, good compliance |

### V2V Vendors (Selective Buy)
| Vendor | Score | Rationale |
|--------|-------|-----------|
| Hume AI | 6/10 | Unique emotion capability, early stage |
| Retell | 6/10 | Purpose-built for phones, early stage |
| VAPI | 5/10 | Orchestration layer, may duplicate CXone |

## Build Option Analysis

Building in-house speech capabilities would require:
- **Team**: 8-12 ML engineers, 3-4 infrastructure engineers
- **Timeline**: 12-18 months for production-ready STT, 6-12 months for TTS
- **Infrastructure**: GPU cluster ($50-100K/month for training + inference)
- **Estimated annual cost**: $2-4M

## Buy Option Analysis

Using vendor APIs:
- **STT at scale (1M min/mo)**: $3,600-6,000/month
- **TTS at scale**: $4,000-16,000/month depending on quality tier
- **Total annual cost**: $91-264K + integration development

## 3-Year TCO Comparison

| Component | Build | Buy |
|-----------|-------|-----|
| STT | $7.2M | $432K |
| TTS | $4.8M | $576K |
| V2V Orchestration | $1.2M | $2.4M |
| **Total** | **$13.2M** | **$3.4M** |

## Recommendation

1. **Buy STT**: Use Deepgram (real-time) + AssemblyAI (analytics) — $120K/year
2. **Buy TTS**: Use Azure Neural TTS (enterprise) + ElevenLabs (premium) — $200K/year
3. **Build V2V Orchestration**: Build custom V2V orchestration on top of CXone using vendor STT/TTS — $400K/year
4. **Estimated savings vs full build**: $9.8M over 3 years`,
    generatedBy: "report-generator-agent",
  },
  {
    type: "IntegrationReadiness" as const,
    title: "NICE CXone Integration Readiness Assessment — March 2026",
    status: "Completed" as const,
    summary: "Of 16 tracked vendors, 2 have certified CXone integrations (Google, Azure), 7 are compatible with moderate integration effort, and 4 require custom development. Recommended priority: Azure Speech (certified), then Deepgram and AssemblyAI for STT.",
    content: `# NICE CXone Integration Readiness Assessment — March 2026

## Executive Summary

Of 16 tracked vendors, 2 have certified CXone integrations (Google, Azure), 7 are compatible with moderate integration effort, and 4 require custom development. Recommended priority: Azure Speech (certified), then Deepgram and AssemblyAI for STT.

## Integration Readiness Matrix

| Vendor | Status | Method | Complexity | Days | Score |
|--------|--------|--------|------------|------|-------|
| Google | Certified | REST/gRPC | Low | 10 | 9/10 |
| Azure | Certified | REST/SDK/WS | Low | 10 | 9/10 |
| OpenAI | Compatible | REST | Low | 15 | 8/10 |
| AssemblyAI | Compatible | REST/WS | Low | 12 | 8/10 |
| Deepgram | Compatible | REST/WS | Low | 12 | 8/10 |
| AWS Transcribe | Compatible | REST/WS/SDK | Medium | 20 | 7/10 |
| Speechmatics | Compatible | REST/WS | Medium | 18 | 7/10 |
| ElevenLabs | Custom Required | REST/WS | Medium | 20 | 7/10 |
| Amazon Polly | Compatible | REST/SDK | Low | 10 | 7/10 |
| Hume AI | Custom Required | WebSocket | High | 30 | 6/10 |
| Retell | Custom Required | REST/WS | High | 25 | 6/10 |
| VAPI | Custom Required | REST/WS | High | 30 | 5/10 |
| NVIDIA | Custom Required | gRPC | Very High | 45 | 5/10 |
| Meta | Custom Required | Self-hosted | Very High | 60 | 4/10 |
| Microsoft | Not Compatible | Self-hosted | Very High | N/A | 3/10 |
| Coqui | Not Compatible | Self-hosted | Very High | N/A | 3/10 |

## Implementation Roadmap

### Phase 1 (Q2 2026) — Certified Integrations
- Deploy Azure Speech connector from CXone marketplace
- Configure Google CCAI integration
- Timeline: 2-3 weeks

### Phase 2 (Q2-Q3 2026) — High-Priority Compatible
- Build Deepgram real-time STT integration
- Build AssemblyAI post-call analytics integration
- Build OpenAI Whisper batch processing integration
- Timeline: 6-8 weeks

### Phase 3 (Q3-Q4 2026) — TTS Integration
- Build ElevenLabs TTS integration for virtual agent responses
- Configure Azure Neural TTS as fallback
- Timeline: 4-6 weeks

### Phase 4 (2027) — V2V Evaluation
- Evaluate Hume AI for emotion-aware routing
- Pilot V2V agent capabilities
- Timeline: 8-12 weeks

## Resource Requirements

- **Phase 1**: 1 engineer, 2-3 weeks
- **Phase 2**: 2 engineers, 6-8 weeks
- **Phase 3**: 1 engineer, 4-6 weeks
- **Phase 4**: 2 engineers, 8-12 weeks
- **Total**: 3 engineers over 6-9 months`,
    generatedBy: "report-generator-agent",
  },
];

async function main() {
  console.log("Seeding report data...\n");

  for (const r of REPORTS) {
    await prisma.report.create({
      data: {
        type: r.type,
        title: r.title,
        status: r.status,
        summary: r.summary,
        content: r.content,
        contentHtml: null,
        generatedBy: r.generatedBy,
        metadata: {} as any,
      },
    });
    console.log(`  ✓ ${r.type}: ${r.title}`);
  }

  console.log(`\nSeeded ${REPORTS.length} reports.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
