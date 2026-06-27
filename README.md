# MultiVault

A multi-chain web wallet built with Next.js. Create or import a wallet in the browser, or connect MetaMask, Phantom, or Trust Wallet.

## Security

- Seed phrases and private keys are generated and encrypted **locally in the browser**
- Only **public wallet addresses** are stored in Supabase after signature verification
- Seed phrases are **never** uploaded to any server

## Features

- Create a new 12-word wallet (Ethereum + Solana addresses)
- Import an existing recovery phrase
- Connect MetaMask, Phantom, or Trust Wallet
- View balances on Ethereum, Polygon, BNB Chain, and Solana
- Encrypted local storage with password

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Run the Supabase schema in your project SQL editor:

```bash
# paste contents of supabase/schema.sql
```

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

### Vercel

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Tech stack

- Next.js 16
- Supabase
- ethers.js
- @solana/web3.js
- bip39 / @scure/bip39