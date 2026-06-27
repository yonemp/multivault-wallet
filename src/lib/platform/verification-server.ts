import { createHash, randomInt } from "crypto";
import { createServerClient } from "@/lib/supabase/server";

export type VerificationChannel = "email" | "phone";
export type VerificationPurpose = "2fa" | "contact";

const CODE_TTL_MS = 10 * 60_000;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 10 * 60_000;

function normalizeDestination(channel: VerificationChannel, value: string) {
  const trimmed = value.trim();
  if (channel === "email") return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10) throw new Error("Invalid phone number");
  return digits.startsWith("1") && digits.length === 11 ? `+${digits}` : `+${digits}`;
}

function hashCode(code: string, destination: string) {
  return createHash("sha256").update(`${code}:${destination}:mv`).digest("hex");
}

export function maskDestination(channel: VerificationChannel, value: string) {
  if (channel === "email") {
    const [user, domain] = value.split("@");
    if (!domain) return value;
    return `${user.slice(0, 2)}***@${domain}`;
  }
  const digits = value.replace(/\D/g, "");
  return `***${digits.slice(-4)}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function countRecentSends(destination: string, channel: VerificationChannel) {
  const supabase = createServerClient();
  const since = new Date(Date.now() - SEND_WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from("verification_codes")
    .select("id", { count: "exact", head: true })
    .eq("destination", destination)
    .eq("channel", channel)
    .gte("created_at", since);

  if (error) return 0;
  return count ?? 0;
}

async function storeCode(
  destination: string,
  channel: VerificationChannel,
  code: string,
  purpose: VerificationPurpose,
) {
  const supabase = createServerClient();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  const { error } = await supabase.from("verification_codes").insert({
    destination,
    channel,
    code_hash: hashCode(code, destination),
    purpose,
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);
}

async function sendEmailCode(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "MultiVault <onboarding@resend.dev>";
  if (!apiKey) throw new Error("Email verification is not configured (RESEND_API_KEY)");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your MultiVault verification code",
      html: `
        <p>Your verification code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>
        <p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to send email: ${err.slice(0, 200)}`);
  }
}

async function sendSmsCode(to: string, code: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    throw new Error("SMS verification is not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)");
  }

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `Your MultiVault code is ${code}. Expires in 10 minutes.`,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to send SMS: ${err.slice(0, 200)}`);
  }
}

export async function sendVerificationCode(opts: {
  channel: VerificationChannel;
  destination: string;
  purpose?: VerificationPurpose;
}): Promise<{ masked: string }> {
  const channel = opts.channel;
  const purpose = opts.purpose ?? "2fa";
  const raw = opts.destination.trim();

  if (channel === "email" && !isValidEmail(raw)) {
    throw new Error("Invalid email address");
  }

  const destination = normalizeDestination(channel, raw);
  const recent = await countRecentSends(destination, channel);
  if (recent >= MAX_SENDS_PER_WINDOW) {
    throw new Error("Too many codes sent — wait a few minutes and try again");
  }

  const code = String(randomInt(100000, 999999));
  await storeCode(destination, channel, code, purpose);

  if (channel === "email") {
    await sendEmailCode(destination, code);
  } else {
    await sendSmsCode(destination, code);
  }

  return { masked: maskDestination(channel, destination) };
}

export async function verifyVerificationCode(opts: {
  channel: VerificationChannel;
  destination: string;
  code: string;
  purpose?: VerificationPurpose;
}): Promise<boolean> {
  const destination = normalizeDestination(opts.channel, opts.destination);
  const purpose = opts.purpose ?? "2fa";
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("verification_codes")
    .select("id, code_hash, expires_at, verified_at")
    .eq("destination", destination)
    .eq("channel", opts.channel)
    .eq("purpose", purpose)
    .is("verified_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;
  if (data.code_hash !== hashCode(opts.code.trim(), destination)) return false;

  await supabase
    .from("verification_codes")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", data.id);

  return true;
}

export function verificationChannelsConfigured() {
  return {
    email: Boolean(process.env.RESEND_API_KEY),
    sms: Boolean(
      process.env.TWILIO_ACCOUNT_SID
      && process.env.TWILIO_AUTH_TOKEN
      && process.env.TWILIO_FROM_NUMBER,
    ),
  };
}