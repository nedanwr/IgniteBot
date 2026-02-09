const ENCRYPTION_PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTION_PREFIX);
}

export async function encryptToken(
  plaintext: string,
  hexKey: string
): Promise<string> {
  const keyBuffer = hexToBuffer(hexKey);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: TAG_LENGTH * 8 },
    key,
    encoded
  );

  // Combine iv + ciphertext (which includes the auth tag appended by Web Crypto)
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_LENGTH);

  return ENCRYPTION_PREFIX + bytesToBase64(combined);
}

export async function decryptToken(
  value: string,
  hexKey: string
): Promise<string> {
  if (!isEncrypted(value)) {
    return value;
  }

  const payload = value.slice(ENCRYPTION_PREFIX.length);
  const combined = base64ToBytes(payload);

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const keyBuffer = hexToBuffer(hexKey);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: TAG_LENGTH * 8 },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
