import { NextResponse } from "next/server";
import { createAnthropicClient } from "@/lib/anthropic-client";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      participants: string[];
      topic: string;
      vertical: string;
      numCharacters: number;
      sentiment: string;
      empathyLevel: string;
      callOutcome: string;
      language: string;
      complexity: string;
      includeHold: boolean;
      includeInterruptions: boolean;
    };

    const {
      participants,
      topic,
      vertical,
      numCharacters,
      sentiment,
      empathyLevel,
      callOutcome,
      language,
      complexity,
      includeHold,
      includeInterruptions,
    } = body;

    const participantList = participants.join(", ");

    const prompt = `Generate a realistic call center conversation with the following parameters:
* Participants: ${participantList}
* Vertical/Industry: ${vertical}
* Scenario/Topic: ${topic}
* Sentiment: ${sentiment}
* Empathy Level: ${empathyLevel}
* Call Outcome: ${callOutcome}
* Language: ${language}
* Complexity: ${complexity}
* Target Length: approximately ${numCharacters} characters
* Include Hold Events: ${includeHold ? "yes" : "no"}
* Include Interruptions: ${includeInterruptions ? "yes" : "no"}

Format the output as a conversation transcript with clear speaker labels (AGENT:, CUSTOMER:${participants.includes("Supervisor") ? ", SUPERVISOR:" : ""}) on each line. Make it realistic for a professional call center environment. Do not include any preamble or explanation — output only the conversation transcript.`;

    const client = createAnthropicClient();

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      messages: [{ role: "user" as const, content: prompt }],
    } as Anthropic.MessageCreateParamsNonStreaming);

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("\n");

    if (!text) {
      return NextResponse.json({ error: "No content generated" }, { status: 500 });
    }

    return NextResponse.json({ conversation: text });
  } catch (error) {
    const msg = String(error);
    console.error("[text-generation]", msg);
    return NextResponse.json(
      { error: "Generation failed", detail: msg },
      { status: 500 },
    );
  }
}
