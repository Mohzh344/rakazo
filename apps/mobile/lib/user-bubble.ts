import type { ColorTokens } from "@rakazo/ui-tokens";
import type { MessageBubbleColors } from "./message-bubble-colors";
import { messageBubbleForeground } from "./message-bubble-colors";

export type UserBubble = { background: string; foreground: string };

/** Your bubbles take the bot's color in its own chat. */
export function withUserBubble(
  tokens: ColorTokens,
  userBubble: UserBubble | undefined,
  colors: MessageBubbleColors = { user: null, agent: null },
): ColorTokens {
  const userBackground = colors.user ?? userBubble?.background;
  const userForeground = colors.user
    ? messageBubbleForeground(colors.user)
    : userBubble?.foreground;
  if (!userBackground && !colors.agent) return tokens;
  return {
    ...tokens,
    ...(userBackground ? { chatUser: userBackground } : {}),
    ...(userForeground ? { chatUserForeground: userForeground } : {}),
    ...(colors.agent
      ? {
          muted: colors.agent,
          foreground: messageBubbleForeground(colors.agent),
          mutedForeground: messageBubbleForeground(colors.agent),
        }
      : {}),
  };
}
