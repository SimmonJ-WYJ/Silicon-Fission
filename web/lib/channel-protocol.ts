export type ChannelProtocol = "openai" | "anthropic";

export function parseChannelProtocol(value: unknown): ChannelProtocol | null {
  if (value === undefined || value === "openai") return "openai";
  if (value === "anthropic") return "anthropic";
  return null;
}

export function channelTypeForProtocol(protocol: ChannelProtocol): number {
  switch (protocol) {
    case "openai":
      return 1;
    case "anthropic":
      return 14;
  }
}
