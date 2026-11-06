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

it("sizes the chat title like the header buttons and reserves room for two name lines", () => {
  const { titleCapsule } = createThreadHeaderStyles();
  expect(titleCapsule.minHeight).toBe(HEADER_CONTROL_SIZE);
  expect(titleCapsule).toMatchObject({ maxWidth: 280, paddingVertical: 3 });
});

it("pads the chat title evenly at its start and end, mirrored for right-to-left", () => {
  const { titleCapsule } = createThreadHeaderStyles();
  expect(titleCapsule).toMatchObject({ paddingStart: 11, paddingEnd: 9 });
  for (const side of ["paddingHorizontal", "paddingLeft", "paddingRight"]) {
    expect(titleCapsule).not.toHaveProperty(side);
  }
});

it("uses a borderless fallback title fill and leaves the header buttons clear", () => {
  const styles = createThreadHeaderStyles();
  expect(styles.titleCapsuleFill).not.toHaveProperty("borderWidth");
  expect(styles.statusBarFade).not.toHaveProperty("backgroundColor");
});

it("lets a long chat name give way to the avatars beside it", () => {
  const { title } = createThreadHeaderStyles();
  expect(title.flexShrink).toBe(1);
});

it("sets the chat title in compact, readable type so two lines fit beside the avatar", () => {
  const { title } = createThreadHeaderStyles();
  expect(title).toMatchObject({
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "600",
    color: "foreground",
  });
});
