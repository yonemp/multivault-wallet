"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { ChainSelect } from "@/components/ui/ChainSelect";
import { Panel } from "@/components/ui/Panel";
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
      width: 220,
      color: { dark: "#1a1f2e", light: "#f7f8fa" },
    }).then(setQrDataUrl);
  }, [address]);

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!chains.length) {
    return <p className="text-[var(--muted)]">No wallet address available.</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-5 border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Receive</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Select network and share your address.</p>
      </div>

      <Panel className="space-y-5 p-5">
        <ChainSelect
          label="Network"
          value={selected}
          onChange={setSelected}
          chains={chains}
        />

        <div className="flex flex-col items-center border border-[var(--border)] bg-[var(--surface-solid)] p-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            <QrCode className="h-3.5 w-3.5" />
            Scan · {chain.symbol}
          </div>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR code"
              className="border border-[var(--border)] bg-white p-2"
            />
          ) : (
            <div className="h-[220px] w-[220px] animate-pulse bg-[var(--border)]" />
          )}
        </div>

        {address && (
          <div>
            <label className="mv-label">{chain.name} address</label>
            <p className="break-all border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2.5 font-mono text-xs text-[var(--foreground)]">
              {address}
            </p>
          </div>
        )}

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
      </Panel>
    </div>
  );
}