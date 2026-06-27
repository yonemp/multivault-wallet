export type TwoFactorChannel = "email" | "phone";

export async function fetchVerificationChannels(): Promise<{ email: boolean; sms: boolean }> {
  try {
    const res = await fetch("/api/verify/send");
    if (!res.ok) return { email: false, sms: false };
    const data = (await res.json()) as { channels?: { email?: boolean; sms?: boolean } };
    return {
      email: data.channels?.email ?? false,
      sms: data.channels?.sms ?? false,
    };
  } catch {
    return { email: false, sms: false };
  }
}

export async function sendVerificationCode(
  channel: TwoFactorChannel,
  destination: string,
  purpose: "2fa" | "contact" = "2fa",
): Promise<{ masked: string }> {
  const res = await fetch("/api/verify/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, destination, purpose }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; masked?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to send code");
  return { masked: data.masked ?? destination };
}

export async function verifyCode(
  channel: TwoFactorChannel,
  destination: string,
  code: string,
  purpose: "2fa" | "contact" = "2fa",
): Promise<boolean> {
  const res = await fetch("/api/verify/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, destination, code, purpose }),
  });
  return res.ok;
}