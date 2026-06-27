"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { SessionData } from "@/lib/wallet/session";
import { Copy, Check } from "lucide-react";

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
    networks.push(
      { id: "ethereum", label: "Ethereum / EVM", address: session.evmAddress },
    );
  }
  if (session.solanaAddress) {
    networks.push(
      { id: "solana", label: "Solana", address: session.solanaAddress },
    );
  }

  const [selected, setSelected] = useState(networks[0]?.id ?? "");
  const active = networks.find((n) => n.id === selected) ?? networks[0];

  useEffect(() => {
    if (!active?.address) return;
    QRCode.toDataURL(active.address, {
      margin: 2,
      width: 220,
      color: { dark: "#ffffff", light: "#09090b" },
    }).then(setQrDataUrl);
  }, [active?.address]);

  async function handleCopy() {
    if (!active?.address) return;
    await navigator.clipboard.writeText(active.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!active) {
    return (
      <p className="text-zinc-400">No wallet address available to receive funds.</p>
    );
  }

  return (
    <div className="max-w-lg space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Receive crypto</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Share your address or QR code to receive funds on this network.
        </p>
      </div>

      {networks.length > 1 && (
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Network</label>
          <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {networks.map((network) => (
              <option key={network.id} value={network.id}>
                {network.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex justify-center rounded-2xl bg-zinc-950 p-6">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="Wallet QR code" className="rounded-xl" />
        ) : (
          <div className="h-[220px] w-[220px] animate-pulse rounded-xl bg-white/10" />
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm text-zinc-400">Your address</label>
        <p className="break-all rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-sm text-zinc-200">
          {active.address}
        </p>
      </div>

      <Button variant="secondary" className="w-full" onClick={handleCopy}>
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copy address
          </>
        )}
      </Button>
    </div>
  );
}