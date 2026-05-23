/**
 * MyCryptoPage.tsx
 * High-fidelity Crypto Dashboard and AI Analysis Hub.
 * Exclusive for MyCrypto Members.
 */
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  TrendingUp, TrendingDown, LayoutDashboard, 
  BarChart3, Zap, Shield, Crown, Globe,
  ArrowUpRight, ArrowDownRight, Search, Filter,
  Bell, Settings, Wallet, Bot, Cpu, LineChart,
  MessageSquare, Sparkles, ChevronRight, Lock, MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { useMyCrypto } from "../contexts/MyCryptoContext";
import { formatPrice } from "../utils/formatPrice";
import { Button } from "../components/ui/button";

const CRYPTO_DATA = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", price: 68420.50, change: 2.4, color: "bg-orange-500" },
  { id: "eth", name: "Ethereum", symbol: "ETH", price: 3450.12, change: -1.2, color: "bg-blue-500" },
  { id: "sol", name: "Solana", symbol: "SOL", price: 145.80, change: 8.5, color: "bg-purple-500" },
  { id: "bnb", name: "BNB", symbol: "BNB", price: 590.20, change: 0.5, color: "bg-yellow-500" },
];

const SIGNALS = [
  { coin: "BTC/USDT", type: "BUY", strength: "STRONG", price: "68,000", target: "72,000", reasoning: "RSI oversold on 4h timeframe with bullish divergence." },
  { coin: "ETH/USDT", type: "SELL", strength: "WEAK", price: "3,500", target: "3,200", reasoning: "Resistance at psychological 3.5k level with declining volume." },
  { coin: "SOL/USDT", type: "BUY", strength: "STRONG", price: "140", target: "165", reasoning: "Breakout from falling wedge confirmed by social sentiment." },
];

export function MyCryptoPage() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const { isCryptoMember, cryptoExpiry, config, buyCryptoMembership } = useMyCrypto();
  const [, setLocation] = useLocation();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");

  const COINS = [
    { name: "Bitcoin", symbol: "BTC", pair: "BINANCE:BTCUSDT" },
    { name: "Ethereum", symbol: "ETH", pair: "BINANCE:ETHUSDT" },
    { name: "Solana", symbol: "SOL", pair: "BINANCE:SOLUSDT" },
    { name: "BNB", symbol: "BNB", pair: "BINANCE:BNBUSDT" },
    { name: "XRP", symbol: "XRP", pair: "BINANCE:XRPUSDT" },
    { name: "Doge", symbol: "DOGE", pair: "BINANCE:DOGEUSDT" },
  ];

  const handleUpgrade = (months: number) => {
    setIsUpgrading(true);
    const success = buyCryptoMembership(months);
    setIsUpgrading(false);
  };

  if (!user) return null;

  // If not a member, show paywall
  if (!isCryptoMember) {
    return (
      <div className="min-h-screen bg-[#05070A] text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-[#0D1117] border border-white/5 rounded-[3rem] p-12 text-center shadow-3xl relative z-10"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3">
             <TrendingUp className="h-12 w-12 text-white shadow-lg" />
          </div>
          
          <h1 className="text-4xl font-black mb-6 tracking-tight">Eksklusif MyCrypto <span className="text-blue-400">Membership</span></h1>
          <p className="text-white/40 text-lg font-medium leading-relaxed mb-10">
            Dapatkan akses penuh ke sistem analisis AI crypto tercanggih, sinyal trading akurat, dan pelacakan portofolio real-time di TokoArthur.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-12 text-left">
            {[
              "AI Crypto Market Analysis",
              "Real-time Trading Signals",
              "Advanced Portfolio Tracker",
              "News Sentiment Analytics",
              "Staking Yield Optimizer",
              "Exclusive Crypto Chat"
            ].map(f => (
              <div key={f} className="flex items-center gap-3 text-sm font-bold text-white/70 bg-white/5 p-4 rounded-2xl border border-white/5">
                <Shield className="h-4 w-4 text-blue-400" /> {f}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            {config.durations.map(d => (
              <button
                key={d.months}
                disabled={isUpgrading}
                onClick={() => handleUpgrade(d.months)}
                className="p-6 bg-white/5 border border-white/10 rounded-3xl text-left hover:bg-blue-600/10 hover:border-blue-600/50 transition-all group"
              >
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1 group-hover:text-blue-400 transition-colors">{d.label}</p>
                <p className="text-xl font-black">{formatPrice(config.price * d.months)}</p>
              </button>
            ))}
          </div>

          <div className="space-y-4">
             <Link href="/profile" className="block text-white/30 text-xs font-bold hover:text-white transition-colors">Nanti Dulu Co</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070A] text-white flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-[#0D1117] border-r border-white/5 p-6 flex flex-col h-auto md:h-screen sticky top-20 z-40">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-black tracking-tighter text-xl">MY<span className="text-blue-500">CRYPTO</span></h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Membership Active</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { id: "market", icon: Globe, label: "Market Watch" },
            { id: "ai", icon: Sparkles, label: "AI Analysis" },
            { id: "signals", icon: Zap, label: "Signals" },
            { id: "portfolio", icon: Wallet, label: "Portfolio" },
            { id: "bots", icon: Bot, label: "Auto Bots" }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === item.id ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">My Balance</p>
            <p className="text-xl font-black text-blue-400">{formatPrice(balance)}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-white/40 hover:text-white" onClick={() => setLocation("/profile")}>
            <ChevronRight className="h-4 w-4 rotate-180" /> Kembali
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">Welcome Back, <span className="text-blue-500">{user.name}</span></h1>
            <p className="text-white/40 font-medium italic">Sistem MyCrypto kamu berjalan optimal.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
               <input 
                 type="text" 
                 placeholder="Search coin or signal..."
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-blue-500/50"
               />
            </div>
            <button className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-[#0D1117] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
                 <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><LineChart className="h-6 w-6" /></div>
                   <TrendingUp className="h-4 w-4 text-emerald-500" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Portfolio Value</p>
                 <h3 className="text-2xl font-black">$42,920.00</h3>
                 <p className="text-[10px] text-emerald-500 font-bold mt-1">+12.5% Today</p>
               </div>
               <div className="bg-[#0D1117] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
                 <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500"><Zap className="h-6 w-6" /></div>
                   <div className="px-2 py-1 bg-purple-500/20 rounded text-[8px] font-black text-purple-400">ACTIVE</div>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Active Signals</p>
                 <h3 className="text-2xl font-black">12 Signals</h3>
                 <p className="text-[10px] text-purple-400 font-bold mt-1">9 High Accuracy</p>
               </div>
               <div className="bg-[#0D1117] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
                 <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500"><Bot className="h-6 w-6" /></div>
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Auto Bots</p>
                 <h3 className="text-2xl font-black">3 Running</h3>
                 <p className="text-[10px] text-white/40 font-bold mt-1">Grid & DCA</p>
               </div>
               <div className="bg-[#0D1117] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
                 <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500"><Shield className="h-6 w-6" /></div>
                   <Shield className="h-4 w-4 text-emerald-500" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Risk Score</p>
                 <h3 className="text-2xl font-black">LOW (24%)</h3>
                 <p className="text-[10px] text-emerald-500 font-bold mt-1">Optimal Safety</p>
               </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Real-time TradingView Chart */}
               <div className="lg:col-span-2 bg-[#0D1117] rounded-[3rem] p-4 border border-white/5 shadow-2xl overflow-hidden h-[700px] flex flex-col">
                 <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 px-6 pt-4 gap-4">
                   <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
                     <LineChart className="h-5 w-5 text-blue-500" /> Live Analysis ({selectedSymbol})
                   </h3>
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                      {COINS.map(c => (
                        <button
                          key={c.symbol}
                          onClick={() => setSelectedSymbol(c.symbol)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                            selectedSymbol === c.symbol ? "bg-blue-600 text-white shadow-lg" : "bg-white/5 text-white/40 hover:bg-white/10"
                          }`}
                        >
                          {c.symbol}
                        </button>
                      ))}
                   </div>
                 </div>
                 <div className="flex-1 w-full rounded-2xl overflow-hidden border border-white/5 bg-black">
                    <iframe
                      src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d4d&symbol=${COINS.find(c => c.symbol === selectedSymbol)?.pair || "BINANCE:BTCUSDT"}&interval=D&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=www.tradingview.com&utm_medium=widget&utm_campaign=chart&utm_term=${COINS.find(c => c.symbol === selectedSymbol)?.pair || "BINANCE:BTCUSDT"}`}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      title="TradingView Chart"
                    />
                 </div>
               </div>

               {/* AI Assistant Quick Panel */}
               <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-[3rem] p-10 border border-blue-500/20 shadow-2xl relative overflow-hidden flex flex-col h-[700px]">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles className="h-32 w-32 text-blue-500" />
                 </div>
                 <div className="relative z-10">
                   <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-900/40">
                     <MessageSquare className="h-7 w-7" />
                   </div>
                   <h3 className="text-2xl font-black mb-4 tracking-tighter">AI Crypto Analis</h3>
                   <p className="text-white/50 text-sm font-medium leading-relaxed mb-8">
                     Tanyakan apa saja tentang market crypto. Analisis teknikal, fundamental, dan sentimen dalam hitungan detik.
                   </p>
                   <div className="space-y-3 mb-8">
                      {[
                        `Prediksi harga ${selectedSymbol} besok?`,
                        `Analisis teknikal ${selectedSymbol} hari ini`,
                        `Support & Resistance ${selectedSymbol}`
                      ].map(q => (
                        <button key={q} className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-bold text-white/60 transition-all border border-white/5">
                          {q}
                        </button>
                      ))}
                   </div>
                   <Button 
                    onClick={() => setLocation("/aichat")}
                    className="w-full h-14 rounded-2xl bg-white text-black font-black hover:bg-white/90 shadow-xl"
                   >
                     Mulai Analisis
                   </Button>
                 </div>
               </div>
            </div>

            {/* Trading Signals Section */}
            <div className="bg-[#0D1117] rounded-[3rem] p-10 border border-white/5 shadow-2xl">
               <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><Zap className="h-6 w-6" /></div>
                   <h3 className="text-xl font-black tracking-tighter">AI Premium Signals</h3>
                 </div>
                 <div className="flex gap-2">
                   <Button variant="outline" size="sm" className="rounded-xl border-white/10 text-[10px] font-black uppercase tracking-widest">SPOT</Button>
                   <Button variant="outline" size="sm" className="rounded-xl border-white/10 text-[10px] font-black uppercase tracking-widest opacity-30">FUTURES</Button>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {SIGNALS.map(signal => (
                   <div key={signal.coin} className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 hover:border-emerald-500/20 transition-all relative overflow-hidden">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h4 className="text-lg font-black">{signal.coin}</h4>
                           <span className={`text-[10px] font-black px-2 py-0.5 rounded ${signal.type === "BUY" ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}`}>
                             {signal.type}
                           </span>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Accuracy</p>
                           <p className="text-sm font-black text-blue-400">92%</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-black/20 p-3 rounded-2xl">
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Entry</p>
                           <p className="font-black text-sm">${signal.price}</p>
                        </div>
                        <div className="bg-black/20 p-3 rounded-2xl">
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Target</p>
                           <p className="font-black text-sm">${signal.target}</p>
                        </div>
                     </div>
                     <p className="text-[11px] text-white/40 font-medium leading-relaxed italic border-t border-white/5 pt-4">
                       " {signal.reasoning} "
                     </p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
        
        {activeTab === "market" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[80vh] flex flex-col">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black tracking-tighter">Global Market Overview</h2>
                <div className="flex gap-2">
                   <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Market Open</span>
                </div>
             </div>
             <div className="flex-1 bg-[#0D1117] rounded-[3rem] border border-white/5 overflow-hidden p-2 shadow-3xl">
                <iframe
                  src="https://s.tradingview.com/embed-widget/screener/?locale=en#%7B%22width%22%3A%22100%22%2C%22height%22%3A%22100%22%2C%22defaultColumn%22%3A%22overview%22%2C%22screener_type%22%3A%22crypto_mkt%22%2C%22displayCurrency%22%3A%22USD%22%2C%22colorTheme%22%3A%22dark%22%2C%22transparency%22%3Atrue%7D"
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="Market Screener"
                />
             </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-3xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="relative z-10">
                   <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                      <Sparkles className="h-10 w-10 text-white" />
                   </div>
                   <h2 className="text-4xl font-black mb-4 tracking-tighter">AI Deep Analysis Terminal</h2>
                   <p className="text-white/80 text-lg font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                     Analisis koin favoritmu dengan model LLM tercanggih yang sudah dilatih khusus untuk data blockchain dan indikator finansial.
                   </p>
                   <Button 
                    onClick={() => setLocation("/aichat")}
                    className="h-16 px-12 rounded-2xl bg-white text-blue-600 font-black text-lg hover:scale-105 transition-all shadow-2xl"
                   >
                     BUKA TERMINAL ANALISIS
                   </Button>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#0D1117] p-10 rounded-[3rem] border border-white/5 space-y-6">
                   <h3 className="text-xl font-black flex items-center gap-3"><LineChart className="h-5 w-5 text-blue-400" /> Technical Report</h3>
                   <div className="space-y-4">
                      {["RSI 14 (Daily): Neutral (52.4)", "MACD (4h): Bullish Crossover", "Bollinger Bands: Consolidation"].map(i => (
                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-sm font-bold text-white/50">{i}</div>
                      ))}
                   </div>
                </div>
                <div className="bg-[#0D1117] p-10 rounded-[3rem] border border-white/5 space-y-6">
                   <h3 className="text-xl font-black flex items-center gap-3"><BarChart3 className="h-5 w-5 text-purple-400" /> Sentiment Analysis</h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest text-white/30">
                        <span>FEAR & GREED INDEX</span>
                        <span className="text-emerald-500">GREED (72)</span>
                      </div>
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 w-[72%]" />
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed font-medium">Sentimen sosial untuk BTC dan koin utama sedang berada di area optimis tinggi karena narasi ETF.</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === "signals" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black tracking-tighter">Premium Trading Signals</h2>
                <div className="flex gap-2">
                   <Button size="sm" className="bg-blue-600 text-[10px] font-black rounded-xl">ALL</Button>
                   <Button size="sm" variant="ghost" className="text-[10px] font-black rounded-xl text-white/30">SCALPING</Button>
                   <Button size="sm" variant="ghost" className="text-[10px] font-black rounded-xl text-white/30">SWING</Button>
                </div>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {SIGNALS.map((signal, idx) => (
                  <div key={idx} className="bg-[#0D1117] rounded-[3rem] p-10 border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 p-6">
                        <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${signal.type === "BUY" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                           {signal.type} SIGNAL
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-6 mb-10">
                        <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-2xl font-black shadow-inner">
                           {signal.coin[0]}
                        </div>
                        <div>
                           <h3 className="text-2xl font-black tracking-tight">{signal.coin}</h3>
                           <p className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">Strategy: {idx % 2 === 0 ? "Trend Following" : "Mean Reversion"}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-4 mb-10">
                        <div className="bg-black/40 p-5 rounded-3xl border border-white/5">
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Entry Price</p>
                           <p className="text-lg font-black text-blue-400">${signal.price}</p>
                        </div>
                        <div className="bg-black/40 p-5 rounded-3xl border border-white/5">
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Take Profit</p>
                           <p className="text-lg font-black text-emerald-500">${signal.target}</p>
                        </div>
                        <div className="bg-black/40 p-5 rounded-3xl border border-white/5">
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Stop Loss</p>
                           <p className="text-lg font-black text-red-500">${(parseFloat(signal.price.replace(/,/g, "")) * 0.95).toLocaleString()}</p>
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-8 border-t border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500"><Shield className="h-4 w-4" /></div>
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Conf. Level: 92%</p>
                        </div>
                        <Button className="rounded-2xl bg-[#CCFF00] text-black font-black text-xs hover:scale-105 transition-all shadow-xl shadow-[#CCFF00]/10 border-0">
                           COPY SIGNAL
                        </Button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === "portfolio" && (
           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#0D1117] rounded-[3rem] p-12 border border-white/5 shadow-3xl">
                   <div className="flex items-center justify-between mb-12">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">Total Balance</p>
                         <h2 className="text-5xl font-black tracking-tighter italic">$128,492.20</h2>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-2">Profit (24h)</p>
                         <h3 className="text-2xl font-black text-emerald-500">+$12,042.50</h3>
                      </div>
                   </div>
                   
                   <div className="space-y-6">
                      {[
                        { name: "Bitcoin", sym: "BTC", amount: "1.42", val: "$97,156.40", color: "bg-orange-500" },
                        { name: "Ethereum", sym: "ETH", amount: "8.50", val: "$29,326.02", color: "bg-blue-500" },
                        { name: "Solana", sym: "SOL", amount: "124.0", val: "$1,807.92", color: "bg-purple-500" },
                        { name: "Tether", sym: "USDT", amount: "201.86", val: "$201.86", color: "bg-emerald-500" },
                      ].map(asset => (
                        <div key={asset.sym} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 group hover:border-blue-500/20 transition-all">
                           <div className="flex items-center gap-5">
                              <div className={`w-12 h-12 ${asset.color} rounded-2xl flex items-center justify-center font-black shadow-lg`}>{asset.sym[0]}</div>
                              <div>
                                 <h4 className="font-black text-lg">{asset.name}</h4>
                                 <p className="text-xs font-black text-white/20 tracking-widest uppercase">{asset.amount} {asset.sym}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-lg">{asset.val}</p>
                              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Available</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-[#0D1117] rounded-[3rem] p-10 border border-white/5 shadow-2xl">
                      <h3 className="text-xl font-black mb-10 tracking-tighter">Asset Distribution</h3>
                      <div className="relative w-48 h-48 mx-auto mb-10">
                         {/* CSS Circular Chart Placeholder */}
                         <div className="absolute inset-0 rounded-full border-[12px] border-orange-500 border-t-blue-500 border-r-purple-500 border-b-emerald-500 rotate-45 shadow-2xl" />
                         <div className="absolute inset-4 rounded-full bg-[#0D1117] flex items-center justify-center flex-col">
                            <p className="text-xs font-black text-white/30 uppercase tracking-widest">Coins</p>
                            <p className="text-xl font-black">4 Types</p>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> BTC</span>
                            <span className="text-white/40">75.6%</span>
                         </div>
                         <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> ETH</span>
                            <span className="text-white/40">22.8%</span>
                         </div>
                         <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> SOL</span>
                            <span className="text-white/40">1.4%</span>
                         </div>
                      </div>
                   </div>

                   <Button className="w-full h-20 rounded-[2.5rem] bg-blue-600 text-white font-black text-lg hover:scale-105 transition-all shadow-3xl shadow-blue-900/20 border-0">
                      DEPOSIT ASSETS
                   </Button>
                </div>
             </div>
           </div>
        )}

        {activeTab === "bots" && (
           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black tracking-tighter italic">TokoArthur Auto Trading <span className="text-blue-500">Bots</span></h2>
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 animate-pulse"><Bot className="h-6 w-6" /></div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { name: "Grid Trading Bot", desc: "Auto Buy Low Sell High dalam rentang harga tertentu.", icon: LayoutDashboard, color: "text-blue-400", risk: "Low" },
                  { name: "DCA Bot", desc: "Investasi berkala secara otomatis untuk meratakan harga entry.", icon: Zap, color: "text-orange-400", risk: "Med" },
                  { name: "Smart Rebalance", desc: "Menjaga proporsi aset portfolio secara otomatis.", icon: BarChart3, color: "text-purple-400", risk: "Low" },
                ].map((bot, idx) => (
                  <div key={idx} className="bg-[#0D1117] rounded-[3rem] p-10 border border-white/5 hover:border-blue-500/20 transition-all shadow-2xl flex flex-col h-[450px]">
                     <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 ${bot.color} shadow-inner`}>
                        <bot.icon className="h-7 w-7" />
                     </div>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-black tracking-tight">{bot.name}</h3>
                        <span className="text-[9px] font-black px-2 py-1 bg-white/5 rounded-lg text-white/30 uppercase tracking-[0.2em]">Risk: {bot.risk}</span>
                     </div>
                     <p className="text-white/40 text-sm font-medium leading-relaxed mb-10 flex-1">{bot.desc}</p>
                     
                     <div className="pt-8 border-t border-white/5 space-y-4">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-white/20">
                           <span>APY ESTIMATE</span>
                           <span className="text-emerald-500">+24.5%</span>
                        </div>
                        <Button className="w-full h-14 rounded-2xl bg-white text-black font-black text-xs hover:bg-white/90 shadow-xl border-0 uppercase tracking-widest">
                           ACTIVATE BOT
                        </Button>
                     </div>
                  </div>
                ))}
             </div>
           </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 right-10 z-[100]">
        <button className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group">
          <MessageCircle className="h-8 w-8" />
          <div className="absolute right-20 bg-[#0D1117] text-white text-[10px] font-black px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-white/10 shadow-2xl whitespace-nowrap">
            Support MyCrypto
          </div>
        </button>
      </div>
    </div>
  );
}
