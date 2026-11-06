export type MessageBubbleRole = "user" | "agent";
export type MessageBubbleColors = { user: string | null; agent: string | null };

export const MESSAGE_BUBBLE_COLOR_CHOICES = [
  { label: "Default", value: null },
  { label: "White", value: "#FFFFFF" },
  { label: "Charcoal", value: "#343434" },
  { label: "Blue", value: "#3767D6" },
  { label: "Violet", value: "#7655D8" },
  { label: "Teal", value: "#20878A" },
  { label: "Green", value: "#31824A" },
  { label: "Rose", value: "#B94E70" },
] as const;

const STORAGE_KEY = "rakazo.mobileMessageBubbleColors.v1";
const allowedColors = new Set<string>(
  MESSAGE_BUBBLE_COLOR_CHOICES.flatMap((choice) => (choice.value ? [choice.value] : [])),
);
const DEFAULT_COLORS: MessageBubbleColors = { user: null, agent: null };
let memoryColors: MessageBubbleColors = DEFAULT_COLORS;
let writeChain: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();

export function getCachedMessageBubbleColors(): MessageBubbleColors {
  return memoryColors;
}

export function subscribeMessageBubbleColors(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function loadMessageBubbleColors(): Promise<MessageBubbleColors> {
  try {
    const SecureStore = await import("expo-secure-store");
    const saved = await SecureStore.getItemAsync(STORAGE_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : null;
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      memoryColors = {
        user:
          typeof record.user === "string" && allowedColors.has(record.user) ? record.user : null,
        agent:
          typeof record.agent === "string" && allowedColors.has(record.agent) ? record.agent : null,
      };
    } else {
      memoryColors = DEFAULT_COLORS;
    }
  } catch {
    // Keep the in-memory preference if secure storage is temporarily unavailable.
  }
  notify();
  return memoryColors;
}

export async function setMessageBubbleColor(
  role: MessageBubbleRole,
  color: string | null,
): Promise<MessageBubbleColors> {
  if (color !== null && !allowedColors.has(color)) throw new Error("UNSUPPORTED_BUBBLE_COLOR");
  memoryColors = { ...memoryColors, [role]: color };
  const snapshot = memoryColors;
  notify();
  const writing = writeChain.then(async () => {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(snapshot));
  });
  writeChain = writing.then(
    () => undefined,
    () => undefined,
  );
  await writing.catch(() => undefined);
  return memoryColors;
}

/** White or other pale fills use black ink; saturated and dark fills use white ink. */
export function messageBubbleForeground(background: string): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(background)?.[1];
  if (!hex) return "#000000";
  const channels = [0, 2, 4].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance =
    0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0);
  return luminance > 0.52 ? "#000000" : "#FFFFFF";
}

function notify(): void {
  for (const listener of listeners) listener();
}
