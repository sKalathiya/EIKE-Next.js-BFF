import { humanizeError } from "@/lib/human-error";

export type SearchEvent =
  | { type: "sources"; sources: string[] }
  | { type: "token"; token: string }
  | { type: "end" }
  | { type: "error"; message: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function normalizeEvent(value: unknown): SearchEvent | null {
  const record = asRecord(value);
  if (!record) return null;

  const nested = "data" in record ? normalizeEvent(record.data) : null;
  if (nested) return nested;

  if (record.type === "sources" && Array.isArray(record.sources)) {
    return {
      type: "sources",
      sources: record.sources.filter((item): item is string => typeof item === "string"),
    };
  }
  if (record.type === "token" && typeof record.token === "string") {
    return { type: "token", token: record.token };
  }
  if (record.type === "end") {
    return { type: "end" };
  }
  if (typeof record.answer === "string" && record.answer.trim()) {
    return { type: "token", token: record.answer };
  }
  if (typeof record.message === "string" && record.message.trim()) {
    return { type: "error", message: humanizeError(record.message, "Could not get an answer. Try again.") };
  }
  return null;
}

function parseFrame(frame: string): SearchEvent | null {
  const payload = frame
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("");

  if (!payload || payload === "[DONE]") return null;
  try {
    return normalizeEvent(JSON.parse(payload));
  } catch {
    return payload ? { type: "token", token: payload } : null;
  }
}

export async function* readSearchStream(response: Response): AsyncGenerator<SearchEvent> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload: unknown = await response.json().catch(() => null);
    const event = normalizeEvent(payload);
    if (event) yield event;
    yield { type: "end" };
    return;
  }

  if (!response.body) {
    yield { type: "error", message: "Could not read the answer." };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const event = parseFrame(frame);
      if (event) {
        yield event;
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
      }
    }
  }

  const leftover = buffer.trim();
  if (!leftover) return;

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(leftover);
  } catch {
    parsed = null;
  }
  const event = parseFrame(leftover) ?? normalizeEvent(parsed);
  if (event) yield event;
}
