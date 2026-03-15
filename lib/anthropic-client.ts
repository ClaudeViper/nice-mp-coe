import Anthropic from "@anthropic-ai/sdk";
import { ProxyAgent } from "undici";

/**
 * Returns an Anthropic client that routes through GLOBAL_AGENT_HTTP_PROXY when
 * the env var is set (required in sandboxed/Claude Code remote environments).
 */
export function createAnthropicClient(): Anthropic {
  const proxyUrl = process.env.GLOBAL_AGENT_HTTP_PROXY;
  if (proxyUrl) {
    const dispatcher = new ProxyAgent(proxyUrl);
    return new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      fetchOptions: { dispatcher } as RequestInit,
    });
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}
