import { getLegacyItem } from "@/lib/storage/legacy-keys";

const STORAGE_KEY = "tackers_encrypted_wallet";

async function deriveKey(password: string, salt: BufferSource) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encryptMnemonic(mnemonic: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(mnemonic),
  );

  return JSON.stringify({
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext)),
  });
}

export async function decryptMnemonic(payload: string, password: string) {
  const { salt, iv, data } = JSON.parse(payload) as {
    salt: string;
    iv: string;
    data: string;
  };

  const key = await deriveKey(password, fromBase64(salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    key,
    fromBase64(data),
  );

  return new TextDecoder().decode(decrypted);
}

export function saveEncryptedWallet(payload: string) {
  localStorage.setItem(STORAGE_KEY, payload);
}

export function loadEncryptedWallet() {
  return getLegacyItem(STORAGE_KEY);
}

export function clearEncryptedWallet() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasLocalWallet() {
  return Boolean(loadEncryptedWallet());
}