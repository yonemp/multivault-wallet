import fs from "fs";
import path from "path";

const replacements = [
  ["TACKERS_", "tackers_"],
  ["TACKERS-", "tackers-"],
  ["TACKERS-wallet", "tackers-wallet"],
  ["TACKERS-health", "tackers-health"],
  ["TACKERS |", "Tackers |"],
  ["TACKERS Terminal", "Tackers Terminal"],
  ["TACKERS cannot", "Tackers cannot"],
  ["Is TACKERS", "Is Tackers"],
  ["TACKERS currently", "Tackers currently"],
  ["Your TACKERS", "Your Tackers"],
  ["TACKERS <", "Tackers <"],
  ["[TACKERS Health]", "[Tackers Health]"],
  ["# TACKERS", "# Tackers"],
  ['message = "TACKERS"', 'message = "Tackers"'],
  ["Sign in to TACKERS", "Sign in to Tackers"],
  ["TACKERS RECOVERY", "Tackers recovery"],
  ["\uFEFF", ""],
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".git", ".next"].includes(entry.name)) walk(full);
    } else if (/\.(ts|tsx|md|json)$/.test(entry.name) && !full.includes("package-lock")) {
      patch(full);
    }
  }
}

function patch(file) {
  let text = fs.readFileSync(file, "utf8");
  const original = text;
  for (const [from, to] of replacements) text = text.split(from).join(to);
  if (text !== original) fs.writeFileSync(file, text, "utf8");
}

walk("src");
for (const file of ["package.json", "README.md"]) {
  if (fs.existsSync(file)) patch(file);
}