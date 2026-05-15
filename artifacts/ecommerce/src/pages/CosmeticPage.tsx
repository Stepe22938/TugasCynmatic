import React, { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Tag, Sparkles, ChevronLeft, Check, Lock, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useCosmetics, Cosmetic } from "../contexts/CosmeticContext";
import { Button } from "../components/ui/button";
import { formatPrice } from "../utils/formatPrice";
import { useToast } from "../hooks/use-toast";

const RARITY_COLORS = {
  common: "bg-slate-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-amber-500",
};

export function CosmeticPage() {
  const { user, updateUser } = useAuth();
  const { cosmetics } = useCosmetics();
  const [tab, setTab] = useState<"owned" | "shop">("owned");
  const { toast } = useToast();

  const isOwned = (id: string) => user?.ownedCosmetics.includes(id);
  const isEquipped = (id: string) => user?.equippedCosmetics.includes(id);

  const toggleEquip = (cosmetic: Cosmetic) => {
    if (!user) return;
    let newEquipped = [...user.equippedCosmetics];
    
    if (isEquipped(cosmetic.id)) {
      newEquipped = newEquipped.filter(id => id !== cosmetic.id);
    } else {
      // Jika tipe tag, hanya boleh satu tag aktif (opsional, tapi rapi)
      if (cosmetic.type === "tag") {
        const otherTags = cosmetics.filter(c => c.type === "tag" && c.id !== cosmetic.id).map(c => c.id);
        newEquipped = newEquipped.filter(id => !otherTags.includes(id));
      }
      newEquipped.push(cosmetic.id);
    }
    
    updateUser({ ...user, equippedCosmetics: newEquipped });
    toast({ title: isEquipped(cosmetic.id) ? "Dilepas!" : "Dipasang!" });
  };

  const buyCosmetic = (cosmetic: Cosmetic) => {
    if (!user) return;
    if (user.balance < cosmetic.price) {
      toast({ title: "Saldo Tidak Cukup", variant: "destructive" });
      return;
    }
    
    updateUser({ 
      ...user, 
      balance: user.balance - cosmetic.price,
      ownedCosmetics: [...user.ownedCosmetics, cosmetic.id],
      purchaseHistory: [...user.purchaseHistory, { itemName: `Cosmetic: ${cosmetic.name}`, price: cosmetic.price, timestamp: new Date().toISOString() }]
    });
    toast({ title: "Pembelian Berhasil!", description: `${cosmetic.name} sekarang milikmu.` });
  };

  const ownedItems = cosmetics.filter(c => isOwned(c.id));
  const shopItems = cosmetics.filter(c => !isOwned(c.id));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/profile">
            <button className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group">
              <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-widest text-[10px]">Kembali ke Profil</span>
            </button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl text-white">
              <Palette className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter">Cynmatic Cosmetics</h1>
              <p className="text-indigo-100 font-medium">Kustomisasi identitasmu agar terlihat premium.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12">
        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-card/50 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl mb-8 w-fit">
          <button onClick={() => setTab("owned")} className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'owned' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-muted-foreground hover:bg-muted'}`}>Koleksiku</button>
          <button onClick={() => setTab("shop")} className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'shop' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-muted-foreground hover:bg-muted'}`}>Toko Kosmetik</button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(tab === "owned" ? ownedItems : shopItems).map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest text-white ${RARITY_COLORS[item.rarity]}`}>
                {item.rarity}
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                  {item.type === "tag" ? (
                    <span className="text-xl font-black text-primary">{item.value}</span>
                  ) : (
                    <img src={item.value} className="w-16 h-16 object-contain" />
                  )}
                </div>

                <div>
                  <h3 className="font-black tracking-tight">{item.name}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{item.type === 'tag' ? 'Identity Tag' : 'Avatar Visual'}</p>
                </div>

                {tab === "owned" ? (
                   <Button 
                    onClick={() => toggleEquip(item)}
                    variant={isEquipped(item.id) ? "default" : "outline"}
                    className={`w-full rounded-2xl font-black text-[10px] uppercase tracking-widest h-11 ${isEquipped(item.id) ? 'bg-green-600 hover:bg-green-700' : ''}`}
                   >
                     {isEquipped(item.id) ? <><Check className="h-4 w-4 mr-2" /> Terpasang</> : "Pasang"}
                   </Button>
                ) : (
                  <Button 
                    onClick={() => buyCosmetic(item)}
                    className="w-full rounded-2xl font-black text-[10px] uppercase tracking-widest h-11 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" /> {item.price === 0 ? "GRATIS" : formatPrice(item.price)}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {(tab === "owned" ? ownedItems : shopItems).length === 0 && (
          <div className="text-center py-20 bg-card rounded-[3rem] border border-dashed">
            <Sparkles className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">Belum ada item untuk ditampilkan</p>
          </div>
        )}
      </div>
    </div>
  );
}
