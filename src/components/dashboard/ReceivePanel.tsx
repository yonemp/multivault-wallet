"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChainSelect } from "@/components/ui/ChainSelect";
import { ChainId, getChain } from "@/lib/wallet/chains";
import { getAddress, getSessionChains, SessionData } from "@/lib/wallet/session";
import { Copy, Check, QrCode } from "lucide-react";

type ReceivePanelProps = {
  session: SessionData;
};

export function ReceivePanel({ session }: ReceivePanelProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const chains = getSessionChains(session);
  const [selected, setSelected] = useState<ChainId>(chains[0] ?? "ethereum");
  const address = getAddress(session, selected);
  const chain = getChain(selected);

  useEffect(() => {
    if (!address) return;
    QRCode.toDataURL(address, {
      margin: 2,
      width: 240,
      color: { dark: chain.color, light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [address, chain.color]);

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!chains.length) {
    return <p className="text-slate-500">No wallet address available.</p>;
  }

  return (
    <motion.div
      className="mx-auto max-w-lg"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Receive</h1>
        <p className="mt-2 text-slate-500">Select a chain and share your address.</p>
      </div>

      <Card className="space-y-6 shadow-lg shadow-blue-100/40">
        <ChainSelect
          label="Network"
          value={selected}
          onChange={setSelected}
          chains={chains}
        />

        <div className="flex flex-col items-center rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/80 to-white p-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-700">
            <QrCode className="h-4 w-4" />
            Scan to send {chain.symbol}
          </div>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={qrDataUrl}
              alt="QR code"
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
            />
          ) : (
            <div className="h-[240px] w-[240px] animate-pulse rounded-2xl bg-slate-100" />
          )}
        </div>

        {address && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              {chain.name} address
            </label>
            <p className="break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700">
              {address}
            </p>
          </div>
        )}

        <Button variant="secondary" className="w-full" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-emerald-600" />
              Address copied
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy address
            </>
          )}
        </Button>
      </Card>
    </motion.div>
  );
}