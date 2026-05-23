import { AlertCircle, ArrowLeft, Ghost, Home } from "lucide-react";
import { Link } from "wouter";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden p-6">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,88,12,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-10 max-w-lg">
        {/* 404 Visual Node */}
        <div className="relative group">
          <div className="absolute inset-0 bg-orange-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl flex items-center justify-center relative z-10 shadow-2xl group-hover:scale-110 transition-transform duration-700">
            <Ghost className="h-16 w-16 text-orange-500 animate-bounce" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-7xl font-black tracking-tighter italic text-white leading-none">404</h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xl font-black text-white uppercase tracking-[0.2em] italic">Dimension Lost</p>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">The node you requested does not exist</p>
          </div>
        </div>

        <p className="text-sm font-bold text-white/40 italic leading-relaxed">
          The signal you're trying to track has been encrypted or moved to a restricted frequency. Please recalibrate your navigation protocol.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full pt-6">
          <Link href="/" className="w-full">
            <Button className="w-full h-16 rounded-[1.2rem] bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-orange-600/30 gap-3 group italic">
              <Home className="h-5 w-5" /> Return to Command Center
            </Button>
          </Link>
          <Link href="/profile" className="w-full">
            <Button variant="ghost" className="w-full h-16 rounded-[1.2rem] bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 font-black uppercase tracking-widest text-[11px] gap-3 italic">
              <ArrowLeft className="h-5 w-5" /> Access Profile Node
            </Button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">TokoArthur Identity Protocol v3.0</p>
      </div>
    </div>
  );
}
