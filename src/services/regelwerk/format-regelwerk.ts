import { Buffer } from "node:buffer";

export const DISCORD_TEXT_DISPLAY_UTF8_MAX_BYTES = 4000;

export const REGELWERK_TEXT_CHUNK_UTF8_BYTES = 3200;

export function formatRegelwerkBody(lines: readonly string[]): string {
  const parts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("§")) {
      parts.push(`## ${trimmed}`);
    } else {
      parts.push(trimmed);
    }
  }

  return parts.join("\n\n");
}

function utf8ByteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

export function splitStringToUtf8ByteChunks(text: string, maxBytes: number): string[] {
  if (maxBytes < 1) {
    throw new Error("maxBytes must be >= 1");
  }

  if (utf8ByteLength(text) <= maxBytes) {
    return [text];
  }

  const buf = Buffer.from(text, "utf8");
  const parts: string[] = [];
  let offset = 0;

  while (offset < buf.length) {
    let end = Math.min(offset + maxBytes, buf.length);

    if (end < buf.length) {
      while (end > offset && (buf[end] & 0xc0) === 0x80) {
        end--;
      }

      if (end === offset) {
        end = offset + 1;

        while (end < buf.length && (buf[end] & 0xc0) === 0x80) {
          end++;
        }
      }
    }

    parts.push(buf.subarray(offset, end).toString("utf8"));
    offset = end;
  }

  return parts;
}

export function chunkRegelwerkDetailText(fullText: string): string[] {
  const maxBytes = REGELWERK_TEXT_CHUNK_UTF8_BYTES;
  const hardCap = DISCORD_TEXT_DISPLAY_UTF8_MAX_BYTES - 1;
  const lines = fullText.split("\n");
  const chunks: string[] = [];
  let current = "";

  const flush = (): void => {
    if (current.length > 0) {
      chunks.push(current);
      current = "";
    }
  };

  for (const line of lines) {
    const candidate = current === "" ? line : `${current}\n${line}`;

    if (utf8ByteLength(candidate) <= maxBytes) {
      current = candidate;
      continue;
    }

    flush();

    if (utf8ByteLength(line) <= maxBytes) {
      current = line;
      continue;
    }

    chunks.push(...splitStringToUtf8ByteChunks(line, maxBytes));
  }

  flush();
  const normalized: string[] = [];

  for (const chunk of chunks) {
    if (utf8ByteLength(chunk) <= hardCap) {
      normalized.push(chunk);
      continue;
    }

    normalized.push(...splitStringToUtf8ByteChunks(chunk, hardCap));
  }

  return normalized;
}
