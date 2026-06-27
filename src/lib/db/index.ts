import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export type WalletRecord = {
  id: number;
  address: string;
  chain: string;
  wallet_type: string;
  last_seen_at: string;
  created_at: string;
};

let db: Database.Database | null = null;

function getDbPath() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "multivault.db");
}

function getDb() {
  if (!db) {
    db = new Database(getDbPath());
    db.pragma("journal_mode = WAL");
    db.exec(`
      create table if not exists connected_wallets (
        id integer primary key autoincrement,
        address text not null,
        chain text not null check (chain in ('ethereum', 'solana', 'polygon', 'bsc')),
        wallet_type text not null check (wallet_type in ('created', 'imported', 'metamask', 'phantom', 'trust')),
        last_seen_at text not null default (datetime('now')),
        created_at text not null default (datetime('now')),
        unique (address, chain)
      );
    `);
  }
  return db;
}

export function upsertWallet(input: {
  address: string;
  chain: string;
  walletType: string;
}) {
  const database = getDb();
  const now = new Date().toISOString();

  database
    .prepare(
      `insert into connected_wallets (address, chain, wallet_type, last_seen_at)
       values (@address, @chain, @walletType, @now)
       on conflict(address, chain) do update set
         wallet_type = excluded.wallet_type,
         last_seen_at = excluded.last_seen_at`,
    )
    .run({
      address: input.address,
      chain: input.chain,
      walletType: input.walletType,
      now,
    });
}

export function listWallets(): WalletRecord[] {
  const database = getDb();
  return database
    .prepare(
      `select id, address, chain, wallet_type, last_seen_at, created_at
       from connected_wallets
       order by last_seen_at desc`,
    )
    .all() as WalletRecord[];
}