"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { SessionData } from "@/lib/wallet/session";
import { Copy, Check, QrCode } from "lucide-react";

type ReceivePanelProps = {
  session: SessionData;
};

type NetworkOption = {
  id: string;
  label: string;
  address: string;
};

export function ReceivePanel({ session }: ReceivePanelProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const networks: NetworkOption[] = [];
  if (session.evmAddress) {
    networks.push({ id: "ethereum", label: "Ethereum / EVM", address: session.evmAddress });
  }
  if (session.solanaAddress) {
    networks.push({ id: "solana", label: "Solana", address: session.solanaAddress });
  }

  const [selected, setSelected] = useState(networks[0]?.id ?? "");
  const active = networks.find((n) => n.id === selected) ?? networks[0];

  useEffect(() => {
    if (!active?.address) return;
    QRCode.toDataURL(active.address, {
      margin: 2,
      width: 240,
      color: { dark: "#1e40af", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [active?.address]);

  async function handleCopy() {
    if (!active?.address) return;
    await navigator.clipboard.writeText(active.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!active) {
    return <p className="text-slate-500">No wallet address available.</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Receive</h1>
        <p className="mt-2 text-slate-500">
          Share your address or QR code to receive crypto.
        </p>
      </div>

      <Card className="space-y-6 shadow-lg shadow-blue-100/40">
        {networks.length > 1 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Network
            </label>
            <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {networks.map((network) => (
                <option key={network.id} value={network.id}>
                  {network.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex flex-col items-center rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/80 to-white p-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-700">
            <QrCode className="h-4 w-4" />
            Scan to send
          </div>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="Wallet QR code"
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
            />
          ) : (
            <div className="h-[240px] w-[240px] animate-pulse rounded-2xl bg-slate-100" />
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Your address
          </label>
          <p className="break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700">
            {active.address}
          </p>
        </div>

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
    </div>
  );
}