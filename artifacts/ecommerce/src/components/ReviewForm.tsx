/**
 * ReviewForm.tsx
 * Modal form untuk menulis review setelah pembelian.
 * Menyimpan nama user pada review agar bisa ditampilkan publik.
 */
import React, { useState, useRef } from "react";
import { Star, Upload, X, Video } from "lucide-react";
import { Button } from "./ui/button";
import { MediaFile, Review } from "../contexts/OrderHistoryContext";

interface ReviewFormProps {
  orderId: string;
  product: { id: number; name: string; image: string };
  existingReview?: Review;
  /** Nama user yang sedang login — disimpan di review */
  userName: string;
  onSubmit: (review: Review) => void;
  onClose: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" data-testid={`button-star-${star}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110">
          <Star className={`h-8 w-8 transition-colors ${
            star <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
          }`} />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({ orderId, product, existingReview, userName, onSubmit, onClose }: ReviewFormProps) {
  const [rating, setRating]     = useState(existingReview?.rating ?? 0);
  const [status, setStatus]     = useState<"sesuai" | "tidak_sesuai">(existingReview?.status ?? "sesuai");
  const [comment, setComment]   = useState(existingReview?.comment ?? "");
  const [mediaFiles, setMedia]  = useState<MediaFile[]>(existingReview?.mediaFiles ?? []);
  const [error, setError]       = useState("");
  const fileInputRef            = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - mediaFiles.length;
    files.slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMedia((prev) => [...prev, {
          name: file.name,
          type: file.type.startsWith("video") ? "video" : "image",
          preview: ev.target?.result as string,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0)              return setError("Mohon pilih rating bintang terlebih dahulu.");
    if (comment.trim().length < 5) return setError("Komentar harus minimal 5 karakter.");
    setError("");
    onSubmit({
      productId: product.id, orderId, userName,
      rating, status, comment: comment.trim(), mediaFiles,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Tulis Ulasan Produk</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="button-close-review">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Info produk + nama user */}
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
            <img src={product.image} alt={product.name} className="w-14 h-14 rounded-lg object-cover bg-muted" />
            <div>
              <p className="font-medium text-sm">{product.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ulasan oleh <span className="font-semibold">{userName}</span></p>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold mb-2">Rating Produk</label>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {["", "Sangat Buruk", "Buruk", "Cukup", "Bagus", "Sangat Bagus"][rating]}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold mb-2">Status Barang</label>
            <div className="flex gap-3">
              {(["sesuai", "tidak_sesuai"] as const).map((s) => (
                <button key={s} type="button" data-testid={`button-status-${s}`} onClick={() => setStatus(s)}
                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    status === s
                      ? s === "sesuai" ? "border-green-500 bg-green-50 text-green-700" : "border-red-500 bg-red-50 text-red-700"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}>
                  {s === "sesuai" ? "Barang Sesuai" : "Barang Tidak Sesuai"}
                </button>
              ))}
            </div>
          </div>

          {/* Komentar */}
          <div>
            <label htmlFor="review-comment" className="block text-sm font-semibold mb-2">Komentar / Ulasan</label>
            <textarea id="review-comment" data-testid="input-review-comment"
              value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder={status === "tidak_sesuai" ? "Jelaskan ketidaksesuaian barang..." : "Bagikan pengalaman Anda..."}
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          {/* Upload media */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Lampiran Foto/Video <span className="text-muted-foreground font-normal">(opsional, maks. 3)</span>
            </label>
            {mediaFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {mediaFiles.map((file, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border bg-muted">
                    {file.type === "image"
                      ? <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <Video className="h-6 w-6 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground px-1 text-center truncate w-full">{file.name}</span>
                        </div>}
                    <button type="button" onClick={() => setMedia((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-black/80">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {mediaFiles.length < 3 && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-media"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <Upload className="h-4 w-4" />Pilih Foto / Video
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
              onChange={handleFileChange} data-testid="input-file-upload" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" data-testid="button-submit-review">Kirim Ulasan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
