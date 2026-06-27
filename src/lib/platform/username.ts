const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): string | null {
  const n = normalizeUsername(value);
  if (!n) return "Username is required";
  if (n.length < 3) return "Username must be at least 3 characters";
  if (n.length > 20) return "Username must be 20 characters or less";
  if (!USERNAME_RE.test(n)) {
    return "Use letters, numbers, and underscores only (start with a letter)";
  }
  return null;
}

export function usernameDisplay(value: string): string {
  return normalizeUsername(value);
}