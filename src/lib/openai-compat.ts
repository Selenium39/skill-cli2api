/**
 * OpenAI compatibility module. Ported from Python openai_compat.py.
 */

import { z } from "zod";

// --- Zod schemas (with passthrough for extra fields) ---

const ChatMessageRoleSchema = z.enum(["system", "user", "assistant", "tool", "developer"]);

export const ChatMessageSchema = z
  .object({
    role: ChatMessageRoleSchema,
    content: z.unknown(),
  })
  .passthrough();

export const ChatCompletionRequestSchema = z
  .object({
    model: z.string().nullable().optional(),
    messages: z.array(ChatMessageSchema),
    stream: z.boolean().optional().default(false),
    max_tokens: z.number().nullable().optional(),
  })
  .passthrough();

export const ErrorResponseSchema = z
  .object({
    error: z.record(z.unknown()).optional().default({}),
  })
  .passthrough();

export const ChatCompletionRequestCompatSchema = z
  .object({
    model: z.string().nullable().optional(),
    messages: z.array(ChatMessageSchema).nullable().optional(),
    input: z.unknown().optional(),
    instructions: z.string().nullable().optional(),
    stream: z.boolean().optional().default(false),
    max_tokens: z.number().nullable().optional(),
    max_output_tokens: z.number().nullable().optional(),
  })
  .passthrough();

export const ResponsesRequestSchema = z
  .object({
    model: z.string().nullable().optional(),
    input: z.unknown().optional(),
    stream: z.boolean().optional().default(false),
    max_output_tokens: z.number().nullable().optional(),
    instructions: z.string().nullable().optional(),
  })
  .passthrough();

// --- Inferred types ---
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ChatCompletionRequestCompat = z.infer<typeof ChatCompletionRequestCompatSchema>;
export type ResponsesRequest = z.infer<typeof ResponsesRequestSchema>;

// --- Helper: coerce Responses API part ---
function _coerceResponsesPart(part: Record<string, unknown>): Record<string, unknown> | null {
  const partType = part.type;
  if (
    (partType === "input_text" || partType === "output_text" || partType === "text") &&
    typeof part.text === "string"
  ) {
    return { type: "text", text: part.text };
  }
  if (partType === "image_url" || partType === "input_image") {
    return part;
  }
  return null;
}

function _coerceResponsesContent(content: unknown): string | Array<Record<string, unknown>> {
  if (content === null || content === undefined) return "";
  if (typeof content === "string") return content;
  if (typeof content === "object" && !Array.isArray(content) && content !== null) {
    const coerced = _coerceResponsesPart(content as Record<string, unknown>);
    if (coerced !== null) {
      const t = coerced.type;
      if (t === "image_url" || t === "input_image") {
        return [coerced];
      }
      return (coerced.text as string) ?? "";
    }
    return String(content);
  }
  if (Array.isArray(content)) {
    const parts: Array<Record<string, unknown>> = [];
    for (const part of content) {
      if (typeof part !== "object" || part === null || Array.isArray(part)) continue;
      const coerced = _coerceResponsesPart(part as Record<string, unknown>);
      if (coerced !== null) parts.push(coerced);
    }
    if (parts.length > 0) return parts;
    const texts = content
      .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null && !Array.isArray(p))
      .map((p) => p.text)
      .filter((t): t is string => typeof t === "string");
    if (texts.length > 0) return texts.join("");
    return "";
  }
  return String(content);
}

/** Convert Responses API input to ChatMessage[]. */
export function responsesInputToMessages(inputObj: unknown): ChatMessage[] {
  const messages: ChatMessage[] = [];

  function add(role: string, content: unknown): void {
    messages.push({ role: role as ChatMessage["role"], content });
  }

  function coerceItem(item: unknown): void {
    if (item === null || item === undefined) return;
    if (typeof item === "string") {
      add("user", item);
      return;
    }
    if (typeof item !== "object" || Array.isArray(item)) {
      add("user", String(item));
      return;
    }
    const obj = item as Record<string, unknown>;
    const role = obj.role;
    const itemType = obj.type;
    if (itemType === "message" || typeof role === "string") {
      const r = typeof role === "string" ? role : "user";
      add(r, _coerceResponsesContent(obj.content));
      return;
    }
    if (
      (itemType === "input_text" || itemType === "output_text" || itemType === "text") &&
      typeof obj.text === "string"
    ) {
      add("user", obj.text);
      return;
    }
    if (itemType === "image_url" || itemType === "input_image") {
      add("user", _coerceResponsesContent(obj));
      return;
    }
  }

  if (inputObj === null || inputObj === undefined) return messages;
  if (Array.isArray(inputObj)) {
    for (const item of inputObj) coerceItem(item);
    return messages;
  }
  coerceItem(inputObj);
  return messages;
}

/** Convert ResponsesRequest to ChatCompletionRequest. */
export function responsesRequestToChatRequest(req: ResponsesRequest): ChatCompletionRequest {
  const messages: ChatMessage[] = [];
  if (typeof req.instructions === "string" && req.instructions.trim()) {
    messages.push({ role: "system", content: req.instructions });
  }
  messages.push(...responsesInputToMessages(req.input));

  const extra = { ...req };
  delete (extra as Record<string, unknown>).model;
  delete (extra as Record<string, unknown>).input;
  delete (extra as Record<string, unknown>).stream;
  delete (extra as Record<string, unknown>).max_output_tokens;
  delete (extra as Record<string, unknown>).max_tokens;
  delete (extra as Record<string, unknown>).instructions;

  let maxTokens = req.max_output_tokens;
  if (maxTokens === undefined && typeof (extra as Record<string, unknown>).max_tokens === "number") {
    maxTokens = (extra as Record<string, unknown>).max_tokens as number;
  }

  return {
    ...extra,
    model: req.model ?? null,
    messages,
    stream: req.stream ?? false,
    max_tokens: maxTokens ?? null,
  } as ChatCompletionRequest;
}

/** Normalize compat request to standard ChatCompletionRequest. */
export function compatChatRequestToChatRequest(
  req: ChatCompletionRequest | ChatCompletionRequestCompat
): ChatCompletionRequest {
  if ("messages" in req && Array.isArray(req.messages) && req.messages.length > 0) {
    return req as ChatCompletionRequest;
  }

  const compat = req as ChatCompletionRequestCompat;
  let messages: ChatMessage[] = [];
  if (typeof compat.instructions === "string" && compat.instructions.trim()) {
    messages.push({ role: "system", content: compat.instructions });
  }
  messages = messages.concat(responsesInputToMessages(compat.input));

  if (messages.length === 0) {
    throw new Error("Missing messages or input");
  }

  const extra = { ...compat };
  delete (extra as Record<string, unknown>).model;
  delete (extra as Record<string, unknown>).messages;
  delete (extra as Record<string, unknown>).input;
  delete (extra as Record<string, unknown>).instructions;
  delete (extra as Record<string, unknown>).stream;
  delete (extra as Record<string, unknown>).max_tokens;
  delete (extra as Record<string, unknown>).max_output_tokens;

  let maxTokens = compat.max_tokens;
  if (maxTokens === undefined && compat.max_output_tokens !== undefined) {
    maxTokens = compat.max_output_tokens;
  }
  if (maxTokens === undefined && typeof (extra as Record<string, unknown>).max_tokens === "number") {
    maxTokens = (extra as Record<string, unknown>).max_tokens as number;
  }

  return {
    ...extra,
    model: compat.model ?? null,
    messages,
    stream: compat.stream ?? false,
    max_tokens: maxTokens ?? null,
  } as ChatCompletionRequest;
}

/** Extract text from various content formats. */
export function normalizeMessageContent(content: unknown): string {
  if (content === null || content === undefined) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const part of content) {
      if (typeof part !== "object" || part === null || Array.isArray(part)) continue;
      const p = part as Record<string, unknown>;
      if (p.type === "text" && typeof p.text === "string") parts.push(p.text);
    }
    return parts.join("");
  }
  if (typeof content === "object" && content !== null && !Array.isArray(content)) {
    const obj = content as Record<string, unknown>;
    if (obj.type === "text" && typeof obj.text === "string") return obj.text;
  }
  return String(content);
}

/** Convert messages array to "ROLE: text" format. */
export function messagesToPrompt(messages: ChatMessage[]): string {
  const parts = messages.map((m) => {
    const role = m.role.toUpperCase();
    const text = normalizeMessageContent(m.content);
    return `${role}: ${text}`;
  });
  return parts.join("\n\n").trim();
}

/** Extract image URLs from a single content value. */
export function extractImageUrlsFromContent(content: unknown): string[] {
  const urls: string[] = [];
  if (content === null || content === undefined) return urls;

  if (typeof content === "object" && !Array.isArray(content) && content !== null) {
    const obj = content as Record<string, unknown>;
    const partType = obj.type;
    if (partType === "image_url" || partType === "input_image") {
      const image = obj.image_url;
      if (typeof image === "object" && image !== null && !Array.isArray(image)) {
        const url = (image as Record<string, unknown>).url;
        if (typeof url === "string" && url) urls.push(url);
      } else if (typeof image === "string" && image) {
        urls.push(image);
      }
    }
    return urls;
  }

  if (!Array.isArray(content)) return urls;

  for (const part of content) {
    if (typeof part !== "object" || part === null || Array.isArray(part)) continue;
    const p = part as Record<string, unknown>;
    const partType = p.type;
    if (partType !== "image_url" && partType !== "input_image") continue;
    const image = p.image_url;
    if (typeof image === "object" && image !== null && !Array.isArray(image)) {
      const url = (image as Record<string, unknown>).url;
      if (typeof url === "string" && url) urls.push(url);
    } else if (typeof image === "string" && image) {
      urls.push(image);
    }
  }
  return urls;
}

/** Extract image URLs from all messages. */
export function extractImageUrls(messages: ChatMessage[]): string[] {
  const urls: string[] = [];
  for (const message of messages) {
    urls.push(...extractImageUrlsFromContent(message.content));
  }
  return urls;
}
