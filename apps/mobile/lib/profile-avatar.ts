const STORAGE_KEY = "rakazo.mobileProfileAvatar.v1";
const DIRECTORY_NAME = "profile-avatar-v1";
let memoryUri: string | null = null;
const listeners = new Set<() => void>();

export function getCachedProfileAvatarUri(): string | null {
  return memoryUri;
}

export function subscribeProfileAvatar(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function loadProfileAvatar(): Promise<string | null> {
  try {
    const SecureStore = await import("expo-secure-store");
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    const { File } = await import("expo-file-system");
    const file = stored ? new File(stored) : null;
    memoryUri = file?.exists ? file.uri : null;
    if (stored && !memoryUri) await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // Preserve the in-memory photo if secure storage is temporarily unavailable.
  }
  notify();
  return memoryUri;
}

export async function chooseProfileAvatar(): Promise<boolean> {
  const ImagePicker = await import("expo-image-picker");
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  });
  if (result.canceled || !result.assets[0]?.uri) return false;
  await saveProfileAvatar(result.assets[0].uri);
  return true;
}

export async function saveProfileAvatar(sourceUri: string): Promise<string> {
  const SecureStore = await import("expo-secure-store");
  const { Directory, File, Paths } = await import("expo-file-system");
  const source = new File(sourceUri);
  if (!source.exists) throw new Error("PROFILE_PHOTO_UNAVAILABLE");
  const directory = new Directory(Paths.document, DIRECTORY_NAME);
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  const extension = /\.(png|webp|heic|jpg|jpeg)$/i.exec(source.name)?.[1]?.toLowerCase() ?? "jpg";
  const destination = new File(
    directory,
    `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`,
  );
  source.copySync(destination);
  if (!destination.exists) throw new Error("PROFILE_PHOTO_COPY_FAILED");

  const previousUri = memoryUri;
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, destination.uri);
  } catch (error) {
    try {
      destination.delete();
    } catch {}
    throw error;
  }
  memoryUri = destination.uri;
  notify();
  await deletePreviousPhoto(previousUri, destination.uri);
  return destination.uri;
}

export async function removeProfileAvatar(): Promise<void> {
  const SecureStore = await import("expo-secure-store");
  const previousUri = memoryUri;
  memoryUri = null;
  notify();
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // The in-memory UI still returns to its default avatar.
  }
  await deletePreviousPhoto(previousUri);
}

async function deletePreviousPhoto(uri: string | null, except?: string): Promise<void> {
  if (!uri || uri === except) return;
  try {
    const { File } = await import("expo-file-system");
    const file = new File(uri);
    if (file.exists && file.uri.includes(`/${DIRECTORY_NAME}/`)) file.delete();
  } catch {
    // A leftover photo is harmless and can be replaced or removed later.
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}
