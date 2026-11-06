import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => new Map<string, string>());
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async (key: string) => store.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    store.set(key, value);
  }),
}));

describe("message bubble colors", () => {
  beforeEach(() => {
    store.clear();
    vi.resetModules();
  });

  it("persists user and agent choices and notifies mounted chat messages", async () => {
    const {
      getCachedMessageBubbleColors,
      loadMessageBubbleColors,
      setMessageBubbleColor,
      subscribeMessageBubbleColors,
    } = await import("./message-bubble-colors");
    const listener = vi.fn();
    subscribeMessageBubbleColors(listener);

    await setMessageBubbleColor("user", "#FFFFFF");
    await setMessageBubbleColor("agent", "#343434");

    expect(getCachedMessageBubbleColors()).toEqual({ user: "#FFFFFF", agent: "#343434" });
    expect(listener).toHaveBeenCalledTimes(2);
    await loadMessageBubbleColors();
    expect(getCachedMessageBubbleColors()).toEqual({ user: "#FFFFFF", agent: "#343434" });
  });

  it("restores both choices from secure storage after an app restart", async () => {
    const beforeRestart = await import("./message-bubble-colors");
    await beforeRestart.setMessageBubbleColor("user", "#FFFFFF");
    await beforeRestart.setMessageBubbleColor("agent", "#343434");

    vi.resetModules();
    const afterRestart = await import("./message-bubble-colors");
    expect(afterRestart.getCachedMessageBubbleColors()).toEqual({ user: null, agent: null });

    await afterRestart.loadMessageBubbleColors();
    expect(afterRestart.getCachedMessageBubbleColors()).toEqual({
      user: "#FFFFFF",
      agent: "#343434",
    });
  });

  it("uses black text on white bubbles and white text on dark bubbles", async () => {
    const { messageBubbleForeground } = await import("./message-bubble-colors");
    expect(messageBubbleForeground("#FFFFFF")).toBe("#000000");
    expect(messageBubbleForeground("#343434")).toBe("#FFFFFF");
  });

  it("rejects colors outside the appearance palette", async () => {
    const { setMessageBubbleColor } = await import("./message-bubble-colors");
    await expect(setMessageBubbleColor("user", "url(https://example.test)")).rejects.toThrow(
      "UNSUPPORTED_BUBBLE_COLOR",
    );
  });
});
