export type TwoFactorChannel = "email" | "phone";

type StoredCode = {
  channel: TwoFactorChannel;
  destination: string;
  code: string;
  expiresAt: number;
};

const STORAGE_KEY = "mv_2fa_pending";

function maskDestination(channel: TwoFactorChannel, value: string) {
  if (channel === "email") {
    const [user, domain] = value.split("@");
    if (!domain) return value;
    return `${user.slice(0, 2)}***@${domain}`;
  }
  const digits = value.replace(/\D/g, "");
  return `***${digits.slice(-4)}`;
}

/** Generate and store a verification code (demo — no real SMS/email). */
export function sendVerificationCode(
  channel: TwoFactorChannel,
  destination: string,
): { masked: string; devCode?: string } {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const payload: StoredCode = {
    channel,
    destination: destination.trim().toLowerCase(),
    code,
    expiresAt: Date.now() + 10 * 60_000,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return {
    masked: maskDestination(channel, destination),
    devCode: process.env.NODE_ENV === "development" ? code : code,
  };
}

export function verifyCode(
  channel: TwoFactorChannel,
  destination: string,
  input: string,
): boolean {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const stored = JSON.parse(raw) as StoredCode;
    if (stored.expiresAt < Date.now()) return false;
    if (stored.channel !== channel) return false;
    if (stored.destination !== destination.trim().toLowerCase()) return false;
    return stored.code === input.trim();
  } catch {
    return false;
  }
}

export function clearVerificationCode() {
  sessionStorage.removeItem(STORAGE_KEY);
}