import { expect, it, vi } from "vitest";
import { createThreadHeaderStyles } from "../components/thread-header-styles";
import { HEADER_CONTROL_SIZE } from "./native-controls";

vi.mock("react-native", () => ({
  Platform: { OS: "ios", Version: 26 },
  StyleSheet: { create: <T>(styles: T) => styles, hairlineWidth: 1 },
}));
vi.mock("./appearance", () => ({
  mobileTokens: () => ({
    background: "background",
    border: "border",
    card: "card",
    foreground: "foreground",
  }),
}));

it("stacks the avatar over a readable two-line name capsule", () => {
  const { titleStack, titleCapsule } = createThreadHeaderStyles();
  expect(titleStack).toMatchObject({ alignItems: "center", maxWidth: 280, gap: 2 });
  expect(titleCapsule.minHeight).toBe(HEADER_CONTROL_SIZE - 12);
  expect(titleCapsule).toMatchObject({ maxWidth: 280, paddingVertical: 2 });
});

it("centers the name capsule with mirrored horizontal padding", () => {
  const { titleCapsule } = createThreadHeaderStyles();
  expect(titleCapsule).toMatchObject({ paddingHorizontal: 12, justifyContent: "center" });
  for (const side of ["paddingStart", "paddingEnd", "paddingLeft", "paddingRight"]) {
    expect(titleCapsule).not.toHaveProperty(side);
  }
});

it("uses a borderless fallback title fill and leaves the header buttons clear", () => {
  const styles = createThreadHeaderStyles();
  expect(styles.titleCapsuleFill).not.toHaveProperty("borderWidth");
  expect(styles.statusBarFade).not.toHaveProperty("backgroundColor");
});

it("lets a long chat name wrap below the avatar", () => {
  const { title } = createThreadHeaderStyles();
  expect(title).toMatchObject({ flexShrink: 1, maxWidth: 256, textAlign: "center" });
});

it("sets the name in compact, readable type for the stacked header", () => {
  const { title } = createThreadHeaderStyles();
  expect(title).toMatchObject({
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "600",
    color: "foreground",
  });
});
