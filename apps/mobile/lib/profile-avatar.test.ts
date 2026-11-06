import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  secure: new Map<string, string>(),
  files: new Map<string, string>(),
  pickedUri: "file:///picker/portrait.jpg",
}));
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async (key: string) => state.secure.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    state.secure.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    state.secure.delete(key);
  }),
}));
vi.mock("expo-file-system", () => {
  class Directory {
    uri: string;
    constructor(parent: Directory | string, name?: string) {
      const base = typeof parent === "string" ? parent : parent.uri;
      this.uri = name ? `${base.replace(/\/$/, "")}/${name}` : base;
    }
    get exists() {
      return this.uri === "file:///documents" || state.files.has(this.uri);
    }
    create() {
      state.files.set(this.uri, "directory");
    }
  }
  class File {
    uri: string;
    name: string;
    constructor(parent: Directory | string, name?: string) {
      const base = typeof parent === "string" ? parent : parent.uri;
      this.uri = name ? `${base.replace(/\/$/, "")}/${name}` : base;
      this.name = this.uri.split("/").at(-1) ?? "";
    }
    get exists() {
      return state.files.has(this.uri);
    }
    copySync(destination: File) {
      const data = state.files.get(this.uri);
      if (data === undefined) throw new Error("source missing");
      state.files.set(destination.uri, data);
    }
    delete() {
      state.files.delete(this.uri);
    }
  }
  return { Directory, File, Paths: { document: new Directory("file:///documents") } };
});
vi.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: vi.fn(async () => ({
    canceled: false,
    assets: [{ uri: state.pickedUri }],
  })),
}));

describe("local profile avatar", () => {
  beforeEach(() => {
    state.secure.clear();
    state.files.clear();
    state.pickedUri = "file:///picker/portrait.jpg";
    state.files.set(state.pickedUri, "portrait image");
    vi.resetModules();
  });

  it("copies a selected photo into documents, persists its local URI, and notifies the UI", async () => {
    const {
      getCachedProfileAvatarUri,
      loadProfileAvatar,
      saveProfileAvatar,
      subscribeProfileAvatar,
    } = await import("./profile-avatar");
    const listener = vi.fn();
    subscribeProfileAvatar(listener);

    const uri = await saveProfileAvatar(state.pickedUri);

    expect(uri).toMatch(/^file:\/\/\/documents\/profile-avatar-v1\/avatar-.*\.jpg$/);
    expect(state.secure.get("rakazo.mobileProfileAvatar.v1")).toBe(uri);
    expect(getCachedProfileAvatarUri()).toBe(uri);
    expect(listener).toHaveBeenCalledOnce();
    await loadProfileAvatar();
    expect(getCachedProfileAvatarUri()).toBe(uri);
  });

  it("replaces an existing local photo and removes it when reset to the default", async () => {
    const { getCachedProfileAvatarUri, removeProfileAvatar, saveProfileAvatar } = await import(
      "./profile-avatar"
    );
    const previous = await saveProfileAvatar(state.pickedUri);
    state.pickedUri = "file:///picker/new-portrait.jpg";
    state.files.set(state.pickedUri, "new portrait image");
    const replacement = await saveProfileAvatar(state.pickedUri);
    await Promise.resolve();

    expect(replacement).not.toBe(previous);
    expect(state.files.has(previous)).toBe(false);
    await removeProfileAvatar();
    expect(getCachedProfileAvatarUri()).toBeNull();
    expect(state.secure.has("rakazo.mobileProfileAvatar.v1")).toBe(false);
    expect(state.files.has(replacement)).toBe(false);
  });
});
