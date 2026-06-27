export type SessionData = {
  mode: "local" | "external";
  walletType: "created" | "imported" | "metamask" | "phantom" | "trust";
  evmAddress?: string;
  solanaAddress?: string;
};

const SESSION_KEY = "multivault_session";

export function saveSession(session: SessionData) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): SessionData | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}