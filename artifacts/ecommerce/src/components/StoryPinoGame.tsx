import React, { useState, useEffect } from "react";
import { 
  User, Briefcase, TrendingUp, ShieldAlert, 
  Coins, ChevronRight, RotateCcw, Building2,
  Users, Handshake, Landmark, Trophy, AlertTriangle,
  CreditCard, Crown
} from "lucide-react";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Choice {
  text: string;
  next: string;
  stats?: {
    wealth?: number;
    moral?: number;
    rep?: number;
  };
}

interface Scene {
  id: string;
  title: string;
  text: string;
  image?: string;
  choices?: Choice[];
  ending?: {
    type: "happy" | "dark" | "failed";
    reward: number;
    description: string;
  };
}

// Procedural Ending Generator for "999,999" combinations
const generateProceduralEnding = (stats: { wealth: number, moral: number, rep: number }) => {
  const wealthTiers = ["Bangkrut", "Pas-pasan", "Berkecukupan", "Kaya Raya", "Sultan Tertinggi", "Kaisar Ekonomi"];
  const moralTiers = ["Psikopat Korporat", "Kejam", "Ambisius", "Netral", "Bijaksana", "Malaikat Digital"];
  const repTiers = ["Asing", "Lokal", "Nasional", "Global", "Legendaris", "Dewa Industri"];

  const wIdx = Math.min(Math.floor(stats.wealth / 30), wealthTiers.length - 1);
  const mIdx = Math.min(Math.max(Math.floor((stats.moral + 50) / 20), 0), moralTiers.length - 1);
  const rIdx = Math.min(Math.floor(stats.rep / 20), repTiers.length - 1);

  const title = `${wealthTiers[wIdx]} yang ${moralTiers[mIdx]}`;
  const status = repTiers[rIdx];
  const secretCode = Math.floor(Math.random() * 999999).toString().padStart(6, '0');

  return {
    title,
    status,
    secretCode,
    reward: Math.max(10, Math.floor(stats.wealth / 2 + Math.abs(stats.moral) / 2)),
    type: stats.moral < -20 ? "dark" : "happy"
  };
};

const STORY_SCENES: Record<string, Scene> = {
  start: {
    id: "start",
    title: "Masa Muda: Garasi Sempit",
    text: "Pino muda memulai TokoArthur di garasi. Ini adalah awal dari segalanya. Langkah pertamamu menentukan arah hidupmu.",
    choices: [
      { text: "Fokus Teknologi (Visionary)", next: "path_visionary_1", stats: { moral: 10, wealth: 2, rep: 5 } },
      { text: "Fokus Profit (Shark)", next: "path_shark_1", stats: { moral: -10, wealth: 25, rep: 2 } },
      { text: "Fokus Jaringan (Politician)", next: "path_politician_1", stats: { moral: 5, wealth: 5, rep: 15 } },
      { text: "Kerja Keras (Steady)", next: "path_visionary_1", stats: { moral: 5, wealth: 10, rep: 0 } },
      { text: "Jalan Pintas (Risky)", next: "path_shark_1", stats: { moral: -20, wealth: 40, rep: 0 } }
    ]
  },

  // MID LIFE: Expansion & Family
  path_visionary_1: {
    id: "path_visionary_1",
    title: "Masa Dewasa: Membangun Keluarga",
    text: "TokoArthur sukses besar. Pino kini di usia matang. Saatnya memikirkan masa depan pribadi. Siapa yang akan mendampingimu?",
    choices: [
      { text: "Nikahi Teman Masa Kecil", next: "family_stage", stats: { moral: 20, wealth: 0, rep: 10 } },
      { text: "Nikahi Anak Konglomerat", next: "family_stage", stats: { moral: 0, wealth: 100, rep: 30 } },
      { text: "Tetap Melajang (Workaholic)", next: "family_stage", stats: { moral: -5, wealth: 50, rep: -10 } },
      { text: "Nikahi Selebriti", next: "family_stage", stats: { moral: -10, wealth: -20, rep: 80 } },
      { text: "Nikahi Rekan Bisnis", next: "family_stage", stats: { moral: 5, wealth: 30, rep: 20 } }
    ]
  },
  path_shark_1: {
    id: "path_shark_1",
    title: "Masa Dewasa: Kekuatan Uang",
    text: "Pino menjadi simbol kekayaan. Tapi musuh mulai berdatangan. Di sisi lain, tekanan untuk memiliki pewaris mulai terasa.",
    choices: [
      { text: "Nikahi Model Terkenal", next: "family_stage", stats: { moral: -10, wealth: -50, rep: 50 } },
      { text: "Nikahi Anak Pejabat", next: "path_politician_1", stats: { moral: -20, wealth: 200, rep: 100 } },
      { text: "Cari Pewaris Lewat Adopsi", next: "family_stage", stats: { moral: 30, wealth: -10, rep: 20 } },
      { text: "Fokus ke Harta (No Family)", next: "family_stage", stats: { moral: -30, wealth: 150, rep: -20 } },
      { text: "Nikah Siri (Secret)", next: "family_stage", stats: { moral: -50, wealth: 20, rep: 0 } }
    ]
  },
  path_politician_1: {
    id: "path_politician_1",
    title: "Masa Dewasa: Tahta & Cinta",
    text: "Relasi Pino sangat kuat. Namun, setiap gerak-gerik pribadimu kini menjadi konsumsi publik. Pernikahanmu adalah langkah politik.",
    choices: [
      { text: "Pernikahan Diplomatik", next: "family_stage", stats: { moral: -10, wealth: 100, rep: 150 } },
      { text: "Nikah Sederhana (Rahasia)", next: "family_stage", stats: { moral: 20, wealth: -50, rep: -50 } },
      { text: "Nikahi Aktivis", next: "family_stage", stats: { moral: 40, wealth: -30, rep: 30 } },
      { text: "Gunakan AI Companion", next: "family_stage", stats: { moral: -20, wealth: 50, rep: -40 } },
      { text: "Jalin Hubungan Terlarang", next: "premature_death", stats: { moral: -100, wealth: -100, rep: 200 } }
    ]
  },

  family_stage: {
    id: "family_stage",
    title: "Masa Tua: Anak & Cucu",
    text: "Waktu berlalu cepat. Anak-anak Pino tumbuh besar, bahkan kini sudah ada cucu yang berlarian di rumah. Bagaimana Pino mendidik mereka?",
    choices: [
      { text: "Didik Jadi Teknokrat Jujur", next: "succession_stage", stats: { moral: 40, wealth: 10, rep: 50 } },
      { text: "Didik Jadi Pengusaha Kejam", next: "succession_stage", stats: { moral: -50, wealth: 200, rep: 20 } },
      { text: "Biarkan Hidup Bebas", next: "succession_stage", stats: { moral: 10, wealth: -50, rep: 0 } },
      { text: "Paksa Masuk Dunia Politik", next: "succession_stage", stats: { moral: -20, wealth: 100, rep: 150 } },
      { text: "Serahkan Harta ke Yayasan", next: "succession_stage", stats: { moral: 100, wealth: -200, rep: 80 } }
    ]
  },

  succession_stage: {
    id: "succession_stage",
    title: "Senja Hari: Warisan Pino",
    text: "Rambut Pino memutih. TokoArthur kini dijalankan oleh keturunanmu. Pino duduk di kursi goyang, merenungi arti hidup.",
    choices: [
      { text: "Meninggal dengan Tenang", next: "final_result", stats: { moral: 10, wealth: 0, rep: 10 } },
      { text: "Tulis Memoar Terakhir", next: "final_result", stats: { moral: 20, wealth: 0, rep: 30 } },
      { text: "Lakukan Perjalanan Terakhir", next: "final_result", stats: { moral: 10, wealth: -20, rep: 0 } },
      { text: "Hapus Semua Jejak Digital", next: "final_result", stats: { moral: 5, wealth: 0, rep: -100 } },
      { text: "Tantang Musuh Terakhir", next: "premature_death", stats: { moral: -50, wealth: -50, rep: 100 } }
    ]
  },

  premature_death: {
    id: "premature_death",
    title: "AKHIR YANG TRAGIS",
    text: "Tekanan politik dan hutang yang menumpuk menghancurkan Pino. Musuh-musuhmu bergerak di kegelapan. Pino meninggal sebelum waktunya dalam sebuah skandal besar.",
    choices: [
      { text: "Terima Takdir Tragismu", next: "final_result" }
    ]
  },

  final_result: {
    id: "final_result",
    title: "Konklusi Kehidupan",
    text: "Pino telah pergi. Namun, apa yang ditinggalkannya untuk anak cucu dan dunia?",
    ending: {
      type: "happy",
      reward: 0,
      description: ""
    }
  }
};

export function StoryPinoGame({ addCoins, userId, toast, onFinish, isSultan }: any) {
  const [currentScene, setCurrentScene] = useState<string>("start");
  const [stats, setStats] = useState({ wealth: 0, moral: 0, rep: 0 });
  const [history, setHistory] = useState<string[]>([]);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [proceduralEnding, setProceduralEnding] = useState<any>(null);

  const scene = STORY_SCENES[currentScene];

  // Dynamic Text Injector: Makes the story feel connected based on stats
  const getDynamicText = (text: string) => {
    let suffix = "";
    if (stats.wealth > 100) suffix += " Dengan kekayaan melimpah, Pino merasa tak terbendung.";
    if (stats.moral < -30) suffix += " Namun, bayang-bayang keputusan kejam mulai menghantui.";
    if (stats.rep > 50) suffix += " Seluruh negeri kini memperhatikan setiap gerak-gerik Pino.";
    return text + suffix;
  };

  const handleChoice = (choice: Choice) => {
    // Premature Death Condition: High Debt + High Politics
    const nextWealth = stats.wealth + (choice.stats?.wealth || 0);
    const nextRep = stats.rep + (choice.stats?.rep || 0);

    if (nextWealth < -80 && nextRep > 150) {
      setHistory([...history, currentScene]);
      setCurrentScene("premature_death");
      return;
    }

    if (choice.stats) {
      setStats(prev => ({
        wealth: prev.wealth + (choice.stats?.wealth || 0),
        moral: prev.moral + (choice.stats?.moral || 0),
        rep: prev.rep + (choice.stats?.rep || 0),
      }));
    }
    setHistory([...history, currentScene]);
    setCurrentScene(choice.next);
  };

  useEffect(() => {
    if (currentScene === "final_result" && !isGameFinished) {
      const pEnding = generateProceduralEnding(stats);
      setProceduralEnding(pEnding);
      setIsGameFinished(true);
      
      if (addCoins && userId) {
        addCoins(userId, pEnding.reward);
        toast({
          title: "Cerita Selesai!",
          description: `Ending: ${pEnding.title}. Kamu dapat ${pEnding.reward} Koin!`,
          variant: pEnding.type === "dark" ? "destructive" : "default"
        });
      }
      onFinish();
    }
  }, [currentScene, isGameFinished, stats, addCoins, userId, toast, onFinish]);

  const resetGame = () => {
    setCurrentScene("start");
    setStats({ wealth: 0, moral: 0, rep: 0 });
    setHistory([]);
    setIsGameFinished(false);
  };

  if (!scene) return (
    <div className="bg-neutral-900 rounded-[2.5rem] p-12 text-center border-8 border-neutral-800">
      <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan Narasi</h2>
      <p className="text-gray-400 mb-6">Scene "{currentScene}" tidak ditemukan dalam sistem.</p>
      <Button onClick={resetGame} className="bg-blue-600">Mulai Dari Awal</Button>
    </div>
  );

  return (
    <div className="bg-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-neutral-800 text-white font-sans relative">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      {/* HUD */}
      <div className="relative z-10 bg-black/40 backdrop-blur-md p-4 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Wealth</span>
            <div className="flex items-center gap-1 text-yellow-500 font-black">
              <TrendingUp className="h-3 w-3" /> {stats.wealth}M
            </div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Reputation</span>
            <div className="flex items-center gap-1 text-blue-400 font-black">
              <Users className="h-3 w-3" /> {stats.rep}
            </div>
          </div>
        </div>
        
        {isSultan && (
          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-yellow-500/20">
            <Crown className="h-3 w-3 text-white fill-white" />
            <span className="text-[10px] font-black text-white uppercase italic">Sultan Member</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-[500px] flex flex-col items-center p-6 pt-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentScene}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md flex flex-col items-center"
          >
            {/* Portrait Container */}
            {!scene.ending && (
              <div className="relative mb-8 group">
                <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full animate-pulse group-hover:bg-blue-500/40 transition-all" />
                <div className="w-48 h-48 rounded-full border-4 border-white/10 overflow-hidden shadow-2xl relative bg-neutral-800">
                  <img 
                    src="/pino_ceo_avatar_1778751293633.png" 
                    alt="Pino CEO"
                    className="w-full h-full object-cover scale-110 hover:scale-125 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg">
                  PINO
                </div>
              </div>
            )}

            {proceduralEnding && (
              <div className="mb-8 text-center">
                 <div className={`p-6 rounded-full inline-block mb-4 shadow-2xl ${proceduralEnding.type === 'dark' ? 'bg-red-600 shadow-red-600/40' : 'bg-green-600 shadow-green-600/40'}`}>
                    {proceduralEnding.type === 'dark' ? <AlertTriangle className="h-16 w-16" /> : <Trophy className="h-16 w-16" />}
                 </div>
                 <h2 className={`text-3xl font-black italic tracking-tighter ${proceduralEnding.type === 'dark' ? 'text-red-500' : 'text-green-500'}`}>
                    {proceduralEnding.title}
                 </h2>
                 <p className="text-xs text-gray-500 mt-2 tracking-widest font-bold">STATUS: {proceduralEnding.status}</p>
              </div>
            )}

            {/* Story Box */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl shadow-inner w-full mb-8 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 group-hover:w-2 transition-all" />
               <p className="text-lg leading-relaxed font-medium italic text-gray-100">
                 "{getDynamicText(scene.text)}"
               </p>
            </div>

            {/* Choices */}
            <div className="flex flex-col gap-4 w-full">
              {scene.choices ? (
                scene.choices.map((choice, i) => (
                  <Button
                    key={i}
                    onClick={() => handleChoice(choice)}
                    className="h-auto py-4 bg-neutral-800 hover:bg-neutral-700 border-2 border-white/10 rounded-2xl flex items-center justify-between px-6 text-left hover:border-blue-500/50 group transition-all"
                  >
                    <span className="font-bold flex-1 pr-4 text-sm">{choice.text}</span>
                    <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </Button>
                ))
              ) : (
                <div className="space-y-4 w-full">
                  <div className="bg-white/10 p-6 rounded-3xl text-center border border-white/5">
                     <p className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest">Procedural Ending Result</p>
                     <p className="text-lg font-black text-white mb-4">#{proceduralEnding?.secretCode}</p>
                     <div className="flex items-center justify-center gap-2 text-2xl font-black text-yellow-500">
                        <Coins className="h-6 w-6" /> +{proceduralEnding?.reward} KOIN
                     </div>
                  </div>
                  <Button 
                    onClick={resetGame}
                    className="w-full h-14 bg-white text-black font-black text-lg rounded-2xl hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    COBA JALAN LAIN
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 p-6 pt-0 text-center">
        <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">TokoArthur Original Story — Visual Novel Series</p>
      </div>
    </div>
  );
}
