import { RobloxHttpError } from "./errors.js";

const DEFAULT_TIMEOUT_MS = 10000;
const USER_AGENT = "LunarRP-DiscordBot/1.0 (+https://lunarrp.info)";

export type FetchJsonOptions = {
  timeoutMs?: number;
};

export async function fetchJson<T>(
  url: string,
  init: RequestInit | undefined,
  options: FetchJsonOptions,
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        ...normalizeHeaders(init?.headers),
      },
    });
    const text = await response.text();
    const snippet = text.length > 500 ? text.slice(0, 500) + "…" : text;

    if (!response.ok) {
      throw new RobloxHttpError(`Roblox HTTP ${String(response.status)}`, response.status, snippet);
    }

    const data: unknown = JSON.parse(text);

    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (headers === undefined || headers === null) {
    return {};
  }

  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers as Iterable<readonly [string, string]>);
  }

  if (typeof headers === "object") {
    return { ...(headers as Record<string, string>) };
  }

  return {};
}
