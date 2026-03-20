import Anthropic from "@anthropic-ai/sdk";
import { ProxyAgent } from "undici";

/**
 * Returns an Anthropic client that routes through GLOBAL_AGENT_HTTP_PROXY when
 * the env var is set (required in sandboxed/Claude Code remote environments).
 *
 * Throws a clear error immediately if ANTHROPIC_API_KEY is missing so callers
 * surface a useful message rather than a cryptic network/auth failure.
 */
export function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add a valid API key to your .env file " +
      "(get one at https://console.anthropic.com/).",
    );
  }

  const proxyUrl = process.env.GLOBAL_AGENT_HTTP_PROXY;
  if (proxyUrl) {
    const dispatcher = new ProxyAgent(proxyUrl);
    return new Anthropic({
      apiKey,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchOptions: { dispatcher } as any,
    });
  }
  return new Anthropic({ apiKey });
}
