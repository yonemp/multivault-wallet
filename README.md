# MultiVault

A multi-chain web wallet built with Next.js. Create or import a wallet in the browser, or connect MetaMask, Phantom, or Trust Wallet.

## Security

- Seed phrases and private keys are generated and encrypted **locally in the browser**
- Only **public wallet addresses** are stored in a local SQLite database after signature verification
- Seed phrases are **never** uploaded to any server

## Features

- Create a new 12-word wallet (Ethereum + Solana addresses)
- Import an existing recovery phrase
- Connect MetaMask, Phantom, or Trust Wallet
- View balances on Ethereum, Polygon, BNB Chain, and Solana
- Encrypted local storage with password
- Local SQLite database at `data/multivault.db`

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database is created automatically on first wallet registration.

## API

- `POST /api/wallet/register` — verify signature and save public address
- `GET /api/wallets` — list registered wallet addresses (local dev)

## Deploy note

SQLite persists on your machine when running locally. Serverless hosts like Vercel use ephemeral filesystems, so use local/self-hosted deployment for the database to persist.

## Tech stack

- Next.js 16
- better-sqlite3
- ethers.js
- @solana/web3.js
- bip39