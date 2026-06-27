# MultiVault

A multi-chain web wallet built with Next.js. Create or import a wallet in the browser, or connect MetaMask, Phantom, or Trust Wallet.

## Security

- Seed phrases and private keys are generated and encrypted **locally in the browser**
- Only **public wallet addresses** are stored in Supabase after signature verification
- Seed phrases are **never** uploaded to any server

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables:

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and anon key.

3. Run the database schema in Supabase SQL Editor:

```bash
# paste contents of supabase/schema.sql
```

4. Start the dev server:

```bash
npm run dev
```

## Deploy (Vercel)

Add these environment variables in Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## API

- `POST /api/wallet/register` — verify signature and save public address
- `GET /api/wallets` — list registered wallet addresses

## Tech stack

- Next.js 16
- Supabase
- ethers.js
- @solana/web3.js
- bip39