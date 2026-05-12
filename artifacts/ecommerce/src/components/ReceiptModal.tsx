/**
 * ReceiptModal.tsx
 * Struk belanja otomatis — tampil sebagai modal + bisa dicetak / disimpan PDF.
 *
 * Cara cetak: tombol "Cetak Struk" memanggil window.print().
 * CSS print hanya menampilkan area struk, semua elemen lain disembunyikan.
 */
import React, { useRef, useEffect } from "react";
import { X, Printer, Package, CheckCircle2 } from "lucide-react";
import { PurchasedOrder } from "../contexts/OrderHistoryContext";
import { formatPrice } from "../utils/formatPrice";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateFull(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const PAYMENT_LABEL: Record<string, string> = {
  dana: "DANA",
  qris: "QRIS",
};

// ─── Divider ──────────────────────────────────────────────────────────────────

function Dashes() {
  return <div className="border-t border-dashed border-gray-300 my-3" />;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReceiptModalProps {
  order: PurchasedOrder;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Inject print styles once on mount
  useEffect(() => {
    const styleId = "receipt-print-style";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #receipt-print-root { display: block !important; position: fixed; inset: 0; background: white; z-index: 99999; }
        #receipt-print-area { width: 320px; margin: 0 auto; padding: 24px 0; font-family: 'Courier New', monospace; }
        .receipt-no-print { display: none !important; }
        @page { size: A5 portrait; margin: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(styleId)?.remove(); };
  }, []);

  const handlePrint = () => window.print();

  const shipping = order.shippingInfo;
  const payLabel = order.paymentMethod ? (PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod.toUpperCase()) : "—";

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center py-6 px-4 overflow-y-auto receipt-no-print"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden relative">

          {/* ── Header bar ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm">Struk Pembelian</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Cetak / PDF
              </button>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Receipt paper ── */}
          <div id="receipt-print-root">
            <div
              id="receipt-print-area"
              ref={printRef}
              className="px-6 py-5 font-mono text-xs text-gray-800 bg-white"
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
            >
              {/* Store logo & name */}
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <p className="text-base font-extrabold tracking-tight uppercase text-gray-900">Toko Online</p>
                <p className="text-[10px] text-gray-500 mt-0.5">toko-online.replit.app</p>
                <p className="text-[10px] text-gray-500">Belanja Mudah, Cepat, Aman</p>
              </div>

              <Dashes />

              {/* Tanggal & nomor struk */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">No. Struk</span>
                  <span className="font-bold text-gray-900">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tanggal</span>
                  <span className="font-semibold">{formatDateFull(order.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Jam</span>
                  <span className="font-semibold">{formatTime(order.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pembayaran</span>
                  <span className="font-bold text-orange-600">{payLabel}</span>
                </div>
              </div>

              {/* Shipping info jika ada */}
              {shipping && (
                <>
                  <Dashes />
                  <div className="space-y-1 text-[11px]">
                    <p className="font-bold text-gray-700 uppercase text-[10px] tracking-wider mb-1.5">Penerima</p>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">Nama</span>
                      <span className="font-semibold text-right">{shipping.firstName} {shipping.lastName}</span>
                    </div>
                    {shipping.phone && (
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-500 flex-shrink-0">No. HP</span>
                        <span className="font-semibold text-right">{shipping.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">Alamat</span>
                      <span className="font-semibold text-right leading-relaxed">{shipping.address}</span>
                    </div>
                  </div>
                </>
              )}

              <Dashes />

              {/* Header kolom item */}
              <div className="text-[10px] text-gray-400 uppercase tracking-widest flex justify-between mb-1.5">
                <span>Produk</span>
                <span>Subtotal</span>
              </div>

              {/* Items */}
              <div className="space-y-2.5">
                {order.items.map((item, i) => (
                  <div key={`${item.id}-${i}`}>
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold leading-tight flex-1 text-gray-900 text-[11px]" style={{ wordBreak: "break-word" }}>
                        {item.name}
                      </span>
                      <span className="font-bold text-gray-900 flex-shrink-0 text-[11px]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {item.quantity} pcs × {formatPrice(item.price)}
                    </div>
                  </div>
                ))}
              </div>

              <Dashes />

              {/* Subtotal & biaya */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal ({order.items.length} item)</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ongkos Kirim</span>
                  <span>{formatPrice(order.shippingFee)}</span>
                </div>
              </div>

              <Dashes />

              {/* Grand total */}
              <div className="flex justify-between items-center mt-1">
                <span className="font-extrabold text-sm uppercase tracking-wide text-gray-900">TOTAL</span>
                <span className="font-extrabold text-base text-orange-600">{formatPrice(order.grandTotal)}</span>
              </div>

              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Metode</span>
                <span className="font-semibold text-gray-600">{payLabel}</span>
              </div>

              <Dashes />

              {/* Status lunas */}
              <div className="flex items-center justify-center gap-2 py-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-[11px] font-bold text-green-600 uppercase tracking-wide">Pembayaran Lunas</span>
              </div>

              <Dashes />

              {/* Barcode placeholder */}
              <div className="flex flex-col items-center gap-2 py-2">
                {/* Fake barcode */}
                <div className="flex items-end gap-px h-10">
                  {Array.from({ length: 40 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-gray-800"
                      style={{
                        width: i % 3 === 0 ? "3px" : "1.5px",
                        height: `${55 + (i % 5) * 9}%`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 tracking-widest font-mono">
                  {order.orderNumber.replace("#", "").replace("-", "")}
                </p>
              </div>

              <Dashes />

              {/* Footer */}
              <div className="text-center space-y-1 pb-1">
                <p className="text-[11px] font-bold text-gray-800">Terima kasih telah berbelanja! 🛍️</p>
                <p className="text-[10px] text-gray-400">Simpan struk ini sebagai bukti transaksi.</p>
                <p className="text-[10px] text-gray-400">Komplain: cs@toko-online.id</p>
                <p className="text-[10px] text-gray-300 mt-2">— Toko Online —</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
