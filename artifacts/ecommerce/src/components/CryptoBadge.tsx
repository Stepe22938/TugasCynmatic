import React from "react";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export function CryptoBadge({ className = "" }: { className?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/40 border border-white/20 ${className}`}
    >
      <TrendingUp className="h-3 w-3" />
      MyCrypto
    </motion.div>
  );
}
