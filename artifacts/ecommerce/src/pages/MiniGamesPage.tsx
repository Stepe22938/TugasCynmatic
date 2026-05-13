/**
 * MiniGamesPage.tsx
 * Halaman Minigames — Koleksi game seru untuk dapat koin dengan limit harian.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { 
  ChevronLeft, Trophy, Coins, Gamepad2, Sparkles, 
  RotateCw, MousePointer2, Timer, Star, Bird, Hash, HelpCircle,
  Play, RotateCcw, AlertCircle, CheckCircle2, Scissors, Hand
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";

type GameType = "dashboard" | "spin" | "click" | "flappy" | "tictactoe" | "quiz" | "rps" | "sawit";

export function MiniGamesPage() {
  const { user, addCoins } = useAuth();
  const { toast } = useToast();
  const [selectedGame, setSelectedGame] = useState<GameType>("dashboard");

  // --- Daily Limit Logic ---
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const DAILY_LIMIT = 6;

  useEffect(() => {
    if (!user) return;
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem(`minigame_date_${user.id}`);
    const count = Number(localStorage.getItem(`minigame_count_${user.id}`) || 0);

    if (lastDate !== today) {
      localStorage.setItem(`minigame_date_${user.id}`, today);
      localStorage.setItem(`minigame_count_${user.id}`, "0");
      setGamesPlayed(0);
    } else {
      setGamesPlayed(count);
    }
  }, [user]);

  const incrementGameCount = () => {
    const newCount = gamesPlayed + 1;
    setGamesPlayed(newCount);
    localStorage.setItem(`minigame_count_${user?.id}`, newCount.toString());
  };

  const checkLimit = () => {
    if (gamesPlayed >= DAILY_LIMIT) {
      toast({
        variant: "destructive",
        title: "Limit Tercapai!",
        description: `Kamu sudah memainkan ${DAILY_LIMIT} game hari ini. Kembali lagi besok!`,
      });
      return false;
    }
    return true;
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f9fafb] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white pb-14 pt-8 px-4">
        <div className="max-w-3xl mx-auto">
          {selectedGame === "dashboard" ? (
            <Link href="/profile" className="inline-flex items-center text-blue-100 hover:text-white transition-colors mb-6 font-medium text-sm">
              <ChevronLeft className="h-5 w-5 mr-1" /> Kembali ke Profil
            </Link>
          ) : (
            <button onClick={() => setSelectedGame("dashboard")} className="inline-flex items-center text-blue-100 hover:text-white transition-colors mb-6 font-medium text-sm">
              <ChevronLeft className="h-5 w-5 mr-1" /> Kembali ke Menu Game
            </button>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold mb-1 flex items-center gap-2">
                <Gamepad2 className="h-8 w-8 text-blue-200" /> MiniGames
              </h1>
              <p className="text-blue-100">Pilih game dan kumpulkan koin gratis!</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${gamesPlayed >= DAILY_LIMIT ? "bg-red-500" : "bg-green-500"} text-white`}>
                  Limit Harian: {gamesPlayed}/{DAILY_LIMIT} Game
                </span>
              </div>
            </div>
            <div className="bg-white/20 px-4 py-3 rounded-2xl border border-white/30 backdrop-blur-sm text-center">
              <div className="flex items-center gap-1">
                <Coins className="h-5 w-5 text-yellow-300" />
                <p className="text-2xl font-extrabold">{(user.coins || 0).toLocaleString("id-ID")}</p>
              </div>
              <p className="text-[10px] text-blue-100 font-semibold uppercase tracking-wider">Saldo Koin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10">
        {selectedGame === "dashboard" && <GameDashboard onSelect={(g) => {
          if (g === "spin") { // Spin is usually separate but if they want it limited too, we can.
            setSelectedGame(g);
          } else if (checkLimit()) {
            setSelectedGame(g);
          }
        }} />}
        
        {selectedGame === "spin" && <DailySpinGame addCoins={addCoins} userId={user.id} toast={toast} />}
        {selectedGame === "click" && <QuickClickGame addCoins={addCoins} userId={user.id} toast={toast} onFinish={incrementGameCount} />}
        {selectedGame === "flappy" && <FlappyBirdGame addCoins={addCoins} userId={user.id} toast={toast} onFinish={incrementGameCount} />}
        {selectedGame === "tictactoe" && <TicTacToeGame addCoins={addCoins} userId={user.id} toast={toast} onFinish={incrementGameCount} />}
        {selectedGame === "quiz" && <QuizGame addCoins={addCoins} userId={user.id} toast={toast} onFinish={incrementGameCount} />}
        {selectedGame === "rps" && <RPSGame addCoins={addCoins} userId={user.id} toast={toast} onFinish={incrementGameCount} />}
        {selectedGame === "sawit" && <SawitAdventureGame addCoins={addCoins} userId={user.id} toast={toast} onFinish={incrementGameCount} />}
      </div>
    </div>
  );
}

// --- Dashboard Component ---
function GameDashboard({ onSelect }: { onSelect: (g: GameType) => void }) {
  const games = [
    { id: "spin", title: "Daily Spin", icon: RotateCw, color: "bg-amber-500", desc: "Hoki harianmu!" },
    { id: "click", title: "Quick Click", icon: MousePointer2, color: "bg-indigo-600", desc: "Tes kecepatan klik." },
    { id: "flappy", title: "Flappy Coin", icon: Bird, color: "bg-sky-500", desc: "Lewati pipa, dapat koin." },
    { id: "tictactoe", title: "Tic Tac Toe", icon: Hash, color: "bg-emerald-600", desc: "Lawan bot cerdik." },
    { id: "quiz", title: "Quiz Pintar", icon: HelpCircle, color: "bg-rose-500", desc: "Asah otak, raih koin." },
    { id: "rps", title: "Suwit Koin", icon: Scissors, color: "bg-orange-500", desc: "Batu Gunting Kertas!" },
    { id: "sawit", title: "Petualangan Sawit", icon: TreePalm, color: "bg-green-700", desc: "Kumpulkan hasil panen!" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {games.map(game => (
        <div 
          key={game.id} 
          onClick={() => onSelect(game.id as GameType)}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className={`${game.color} p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <game.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">{game.title}</h3>
              <p className="text-xs text-muted-foreground">{game.desc}</p>
            </div>
            <Play className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- 1. Daily Spin ---
function DailySpinGame({ addCoins, userId, toast }: any) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastSpin, setLastSpin] = useState<number>(() => Number(localStorage.getItem(`last_spin_${userId}`) || 0));
  const canSpin = Date.now() - lastSpin > 24 * 60 * 60 * 1000;

  const handleSpin = () => {
    if (!canSpin || isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => {
      const rewards = [5, 10, 15, 20, 50, 100];
      const win = rewards[Math.floor(Math.random() * rewards.length)];
      addCoins(userId, win);
      const now = Date.now();
      setLastSpin(now);
      localStorage.setItem(`last_spin_${userId}`, now.toString());
      setIsSpinning(false);
      toast({ title: "Selamat!", description: `Kamu memenangkan ${win} Koin!` });
    }, 2000);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
      <div className="bg-amber-500 rounded-2xl p-3 inline-block mb-2">
        <RotateCw className={`h-8 w-8 text-white ${isSpinning ? "animate-spin" : ""}`} />
      </div>
      <h2 className="text-2xl font-extrabold">Daily Spin</h2>
      <div className="relative inline-block py-6">
        <div className={`w-32 h-32 rounded-full border-8 border-amber-100 flex items-center justify-center bg-amber-50 shadow-inner ${isSpinning ? "animate-spin" : ""}`}>
          <Trophy className="h-12 w-12 text-amber-500" />
        </div>
      </div>
      <p className="text-muted-foreground">Putar roda keberuntunganmu setiap 24 jam.</p>
      <Button 
        size="lg" onClick={handleSpin} disabled={!canSpin || isSpinning}
        className={`w-full max-w-xs h-14 rounded-2xl text-lg font-bold ${canSpin ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-gray-100 text-gray-400"}`}
      >
        {isSpinning ? "Memutar..." : canSpin ? "Putar Sekarang" : "Tunggu Besok"}
      </Button>
    </div>
  );
}

// --- 2. Quick Click ---
function QuickClickGame({ addCoins, userId, toast, onFinish }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [coinPos, setCoinPos] = useState({ top: "50%", left: "50%" });

  useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0) timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      onFinish();
      const reward = Math.floor(score / 5);
      if (reward > 0) {
        addCoins(userId, reward);
        toast({ title: "Waktu Habis!", description: `Skor: ${score}. Kamu mendapat ${reward} Koin!` });
      }
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const moveCoin = () => setCoinPos({ top: Math.random() * 80 + 10 + "%", left: Math.random() * 80 + 10 + "%" });
  const start = () => { setScore(0); setTimeLeft(10); setIsPlaying(true); moveCoin(); };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-indigo-600 p-4 text-white font-bold flex justify-between">
        <span>Quick Click</span>
        {isPlaying && <span>{timeLeft}s</span>}
      </div>
      <div className="p-6 text-center">
        {!isPlaying ? (
          <div className="py-10 space-y-4">
            <MousePointer2 className="h-12 w-12 text-indigo-600 mx-auto" />
            <h3 className="text-xl font-bold">Klik koin secepat mungkin!</h3>
            <p className="text-sm text-muted-foreground pb-4">Setiap 5 klik = 1 Koin. Waktu: 10 detik.</p>
            <Button onClick={start} className="bg-indigo-600 h-12 px-10 rounded-xl font-bold text-white">Mulai Game</Button>
          </div>
        ) : (
          <div className="relative h-80 bg-gray-50 rounded-2xl overflow-hidden cursor-crosshair">
            <div className="absolute top-4 left-4 font-black text-2xl text-indigo-200">SKOR: {score}</div>
            <button
              onClick={() => { setScore(s => s + 1); moveCoin(); }}
              style={{ top: coinPos.top, left: coinPos.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-yellow-400 rounded-full border-4 border-yellow-500 shadow-lg flex items-center justify-center animate-bounce z-10"
            >
              <Coins className="h-6 w-6 text-yellow-700" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 3. Flappy Bird ---
function FlappyBirdGame({ addCoins, userId, toast, onFinish }: any) {
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [birdY, setBirdY] = useState(150);
  const [pipes, setPipes] = useState<{ x: number; hole: number }[]>([]);
  const frameRef = useRef<number>();
  const velocity = useRef(0);
  const frameCount = useRef(0);

  const GRAVITY = 0.2;
  const JUMP = -4.5;
  const PIPE_SPEED = 1.5;
  const PIPE_SPAWN_RATE = 180;

  const gameLoop = useCallback(() => {
    setBirdY(y => {
      velocity.current += GRAVITY;
      const nextY = y + velocity.current;
      if (nextY < 0 || nextY > 380) { setGameStatus("gameover"); return y; }
      return nextY;
    });

    setPipes(prevPipes => {
      let nextPipes = prevPipes.map(p => ({ ...p, x: p.x - PIPE_SPEED })).filter(p => p.x > -60);
      frameCount.current++;
      if (frameCount.current % PIPE_SPAWN_RATE === 0) nextPipes.push({ x: 400, hole: Math.random() * 150 + 100 });

      nextPipes.forEach(p => {
        if (p.x + 60 < 50 && p.x + 60 > 50 - PIPE_SPEED) setScore(s => s + 1);
        if (p.x < 80 && p.x + 60 > 50) {
          if (birdY < p.hole - 80 || birdY > p.hole + 80) setGameStatus("gameover");
        }
      });
      return nextPipes;
    });

    if (gameStatus === "playing") frameRef.current = requestAnimationFrame(gameLoop);
  }, [birdY, gameStatus]);

  useEffect(() => {
    if (gameStatus === "playing") frameRef.current = requestAnimationFrame(gameLoop);
    else {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (gameStatus === "gameover") {
        onFinish();
        const reward = Math.floor(score / 3);
        if (reward > 0) {
          addCoins(userId, reward);
          toast({ title: "Game Over!", description: `Skor: ${score}. Kamu dapat ${reward} Koin!` });
        }
      }
    }
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [gameStatus, gameLoop]);

  const start = () => { setBirdY(150); velocity.current = 0; setScore(0); setPipes([]); frameCount.current = 0; setGameStatus("playing"); };
  const jump = () => { if (gameStatus === "playing") velocity.current = JUMP; };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-sky-500 p-4 text-white font-bold flex justify-between">
        <span>Flappy Coin</span>
        <span>Skor: {score}</span>
      </div>
      <div className="p-6 text-center">
        <div className="relative h-[400px] bg-sky-100 rounded-2xl overflow-hidden border-4 border-sky-200 cursor-pointer" onClick={jump}>
          {gameStatus === "idle" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-sky-500/10 backdrop-blur-[1px]">
              <Bird className="h-16 w-16 text-sky-600 animate-bounce" />
              <h3 className="text-xl font-bold text-sky-800">Bantu Burung Lewati Pipa!</h3>
              <p className="text-xs text-sky-700">Setiap 3 pipa = 1 Koin.</p>
              <Button onClick={(e) => { e.stopPropagation(); start(); }} className="bg-sky-600 text-white h-12 px-10 rounded-xl font-bold">Mulai Main</Button>
            </div>
          ) : gameStatus === "gameover" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-red-500/20 backdrop-blur-md">
              <AlertCircle className="h-16 w-16 text-red-600" />
              <h3 className="text-2xl font-black text-red-700">GAME OVER</h3>
              <p className="text-lg font-bold text-red-800">Skor Akhir: {score}</p>
              <Button onClick={(e) => { e.stopPropagation(); start(); }} className="bg-red-600 text-white h-12 px-10 rounded-xl font-bold">Main Lagi</Button>
            </div>
          ) : null}
          <div className="absolute left-[50px] w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-600 flex items-center justify-center transition-transform" style={{ top: birdY, transform: `rotate(${velocity.current * 3}deg)` }}><Bird className="h-5 w-5 text-yellow-700" /></div>
          {pipes.map((p, i) => (
            <React.Fragment key={i}>
              <div className="absolute bg-green-500 border-x-4 border-green-600 rounded-b-lg" style={{ left: p.x, top: 0, width: 60, height: p.hole - 80 }} />
              <div className="absolute bg-green-500 border-x-4 border-green-600 rounded-t-lg" style={{ left: p.x, top: p.hole + 80, width: 60, height: 400 - p.hole - 80 }} />
            </React.Fragment>
          ))}
          <div className="absolute bottom-0 w-full h-4 bg-green-600 border-t-2 border-green-700" />
        </div>
      </div>
    </div>
  );
}

// --- 4. Tic Tac Toe ---
function TicTacToeGame({ addCoins, userId, toast, onFinish }: any) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<string | null | "draw">(null);

  const checkWinner = (b: (string | null)[]) => {
    const lines = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
    for (const [a,b1,c] of lines) if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
    if (b.every(s => s !== null)) return "draw";
    return null;
  };

  const handleMove = (i: number) => {
    if (board[i] || winner || !isPlayerTurn) return;
    const next = [...board]; next[i] = "X"; setBoard(next); setIsPlayerTurn(false);
    const win = checkWinner(next);
    if (win) {
      setWinner(win); onFinish();
      if (win === "X") { addCoins(userId, 2); toast({ title: "Menang!", description: "Hebat! Kamu menang dan dapet 2 Koin!" }); }
    } else {
      setTimeout(() => {
        const available = next.map((s, idx) => s === null ? idx : null).filter(s => s !== null) as number[];
        if (available.length > 0) {
          const botIdx = available[Math.floor(Math.random() * available.length)];
          const nextWithBot = [...next]; nextWithBot[botIdx] = "O"; setBoard(nextWithBot);
          const winBot = checkWinner(nextWithBot); if (winBot) { setWinner(winBot); onFinish(); }
          setIsPlayerTurn(true);
        }
      }, 600);
    }
  };
  const reset = () => { setBoard(Array(9).fill(null)); setIsPlayerTurn(true); setWinner(null); };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-emerald-600 p-4 text-white font-bold flex justify-between"><span>Tic Tac Toe</span><button onClick={reset}><RotateCcw className="h-4 w-4" /></button></div>
      <div className="p-10 text-center flex flex-col items-center">
        <div className="grid grid-cols-3 gap-2 w-64 h-64 mb-6">
          {board.map((cell, i) => (
            <button key={i} onClick={() => handleMove(i)} className={`w-20 h-20 rounded-2xl border-4 flex items-center justify-center text-3xl font-black transition-all ${cell === "X" ? "bg-blue-50 border-blue-200 text-blue-600" : cell === "O" ? "bg-red-50 border-red-200 text-red-600" : "bg-gray-50 border-gray-100 hover:bg-gray-100"}`}>{cell}</button>
          ))}
        </div>
        {winner ? <div className="space-y-3"><p className="text-xl font-bold">{winner === "X" ? "🥳 Kamu Menang!" : winner === "O" ? "💀 Bot Menang!" : "🤝 Seri!"}</p><Button onClick={reset} className="bg-emerald-600">Main Lagi</Button></div> : <p className="text-sm font-medium text-muted-foreground">{isPlayerTurn ? "Giliranmu (X)" : "Giliran Bot (O)..."}</p>}
      </div>
    </div>
  );
}

// --- 5. Quiz Game ---
function QuizGame({ addCoins, userId, toast, onFinish }: any) {
  const [step, setStep] = useState<"intro" | "playing" | "result">("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const questions = [
    { q: "Apa nama mata uang koin di sini?", a: ["Rupiah", "Koin Toko", "Dollar"], correct: 1 },
    { q: "Berapa minimal koin untuk tukar voucher 5rb?", a: ["5.000", "10.000", "50.000"], correct: 0 },
    { q: "Siapa yang bisa mengatur koin user?", a: ["User lain", "Kurir", "Admin"], correct: 2 },
    { q: "Bagaimana cara dapat koin otomatis?", a: ["Chat admin", "Belanja", "Login aja"], correct: 1 },
    { q: "Apa warna icon koin di Toko Online?", a: ["Biru", "Kuning/Emas", "Merah"], correct: 1 },
  ];

  const handleAnswer = (idx: number) => {
    if (idx === questions[currentIdx].correct) setCorrectCount(c => c + 1);
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
    else { setStep("result"); onFinish(); }
  };

  const finish = () => {
    const reward = correctCount;
    if (reward > 0) { addCoins(userId, reward); toast({ title: "Kuis Selesai!", description: `Benar ${correctCount}/${questions.length}. Dapat ${reward} Koin!` }); }
    setStep("intro"); setCurrentIdx(0); setCorrectCount(0);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-rose-500 p-4 text-white font-bold">Quiz Pintar</div>
      <div className="p-8 text-center min-h-[300px] flex flex-col justify-center">
        {step === "intro" ? <div className="space-y-4"><HelpCircle className="h-16 w-16 text-rose-500 mx-auto" /><h3 className="text-xl font-bold">Uji Pengetahuanmu!</h3><Button onClick={() => setStep("playing")} className="bg-rose-500">Mulai Kuis</Button></div> : 
         step === "playing" ? <div className="space-y-6"><h3 className="text-xl font-extrabold">{questions[currentIdx].q}</h3><div className="grid grid-cols-1 gap-3">{questions[currentIdx].a.map((opt, i) => (<button key={i} onClick={() => handleAnswer(i)} className="w-full py-3 px-4 rounded-2xl border-2 hover:bg-rose-50 font-bold">{opt}</button>))}</div></div> :
         <div className="space-y-6"><CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" /><p className="text-lg font-bold">Benar: {correctCount} / {questions.length}</p><Button onClick={finish} className="bg-rose-500">Ambil Koin</Button></div>}
      </div>
    </div>
  );
}

// --- 6. Rock Paper Scissors ---
function RPSGame({ addCoins, userId, toast, onFinish }: any) {
  const [result, setResult] = useState<string | null>(null);
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [botChoice, setBotChoice] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const choices = [
    { name: "Batu", icon: Hand, rotate: 0 },
    { name: "Kertas", icon: Hand, rotate: 90 },
    { name: "Gunting", icon: Scissors, rotate: 0 },
  ];

  const handlePlay = (choice: string) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setResult(null);
    setPlayerChoice(null);
    setBotChoice(null);

    setTimeout(() => {
      const bot = choices[Math.floor(Math.random() * choices.length)].name;
      setPlayerChoice(choice);
      setBotChoice(bot);
      
      let res = "";
      if (choice === bot) res = "SERI";
      else if (
        (choice === "Batu" && bot === "Gunting") ||
        (choice === "Kertas" && bot === "Batu") ||
        (choice === "Gunting" && bot === "Kertas")
      ) {
        res = "MENANG";
        addCoins(userId, 2);
        toast({ title: "Kamu Menang!", description: "Dapet 2 Koin!" });
      } else {
        res = "KALAH";
      }
      
      setResult(res);
      setIsAnimating(false);
      onFinish();
    }, 1000);
  };

  const getIcon = (name: string) => {
    if (name === "Gunting") return <Scissors className="h-8 w-8" />;
    if (name === "Kertas") return <Hand className="h-8 w-8 rotate-90" />;
    return <Hand className="h-8 w-8" />;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-orange-500 p-4 text-white font-bold flex justify-between">
        <span>Suwit Koin (RPS)</span>
        <button onClick={() => {setResult(null); setPlayerChoice(null); setBotChoice(null);}}><RotateCcw className="h-4 w-4" /></button>
      </div>
      <div className="p-8 text-center space-y-8">
        <div className="flex justify-around items-center h-24">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Bot</span>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${result === "KALAH" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"}`}>
              {isAnimating ? <RotateCw className="h-6 w-6 animate-spin text-gray-400" /> : botChoice ? getIcon(botChoice) : "?"}
            </div>
          </div>
          <div className="text-2xl font-black text-gray-300">VS</div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Kamu</span>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${result === "MENANG" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"}`}>
              {isAnimating ? <RotateCw className="h-6 w-6 animate-spin text-gray-400" /> : playerChoice ? getIcon(playerChoice) : "?"}
            </div>
          </div>
        </div>

        {result && (
          <div className={`text-2xl font-black animate-bounce ${result === "MENANG" ? "text-green-600" : result === "KALAH" ? "text-red-600" : "text-gray-500"}`}>
            {result}!
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {choices.map(c => (
            <button
              key={c.name}
              disabled={isAnimating}
              onClick={() => handlePlay(c.name)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all active:scale-95"
            >
              <c.icon className={`h-8 w-8 ${c.name === "Kertas" ? "rotate-90" : ""}`} />
              <span className="text-xs font-bold">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 7. Petualangan Sawit ---
import { Trees as TreePalm, Mountain } from "lucide-react";

function SawitAdventureGame({ addCoins, userId, toast, onFinish }: any) {
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [playerY, setPlayerY] = useState(300);
  const [items, setItems] = useState<{ x: number; y: number; id: number }[]>([]);
  const [bgOffset, setBgOffset] = useState(0);
  
  const frameRef = useRef<number>();
  const velocity = useRef(0);
  const nextItemId = useRef(0);
  const frameCount = useRef(0);

  const GRAVITY = 0.4;
  const JUMP_FORCE = -10;
  const SPEED = 4;
  const ITEM_SPAWN_RATE = 60;

  const gameLoop = useCallback(() => {
    // Background movement
    setBgOffset(prev => (prev + SPEED) % 800);

    // Gravity & Physics
    setPlayerY(y => {
      velocity.current += GRAVITY;
      const nextY = y + velocity.current;
      if (nextY >= 300) {
        velocity.current = 0;
        return 300;
      }
      return nextY;
    });

    // Handle Items
    setItems(prev => {
      let next = prev.map(item => ({ ...item, x: item.x - SPEED })).filter(item => item.x > -50);
      
      frameCount.current++;
      if (frameCount.current % ITEM_SPAWN_RATE === 0) {
        next.push({
          x: 800,
          y: Math.random() * 150 + 150,
          id: nextItemId.current++
        });
      }

      // Collision check
      const hit = next.find(item => 
        item.x < 100 && item.x > 40 && 
        Math.abs(playerY - item.y) < 40
      );

      if (hit) {
        setScore(s => s + 1);
        return next.filter(item => item.id !== hit.id);
      }

      return next;
    });

    if (gameStatus === "playing") frameRef.current = requestAnimationFrame(gameLoop);
  }, [playerY, gameStatus]);

  useEffect(() => {
    if (gameStatus === "playing") {
      frameRef.current = requestAnimationFrame(gameLoop);
    } else if (gameStatus === "gameover") {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      onFinish();
      const reward = Math.floor(score / 5);
      if (reward > 0) {
        addCoins(userId, reward);
        toast({ title: "Panen Selesai!", description: `Kamu mengumpulkan ${score} Sawit. Dapat ${reward} Koin!` });
      }
    }
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [gameStatus, gameLoop]);

  const start = () => {
    setScore(0);
    setPlayerY(300);
    setItems([]);
    setBgOffset(0);
    velocity.current = 0;
    frameCount.current = 0;
    setGameStatus("playing");
    
    // Auto end after 30 seconds
    setTimeout(() => {
      setGameStatus(prev => prev === "playing" ? "gameover" : prev);
    }, 30000);
  };

  const jump = () => {
    if (gameStatus === "playing" && playerY >= 290) {
      velocity.current = JUMP_FORCE;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-green-700 p-4 text-white font-bold flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TreePalm className="h-5 w-5" />
          <span>Petualangan Sawit</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Score: {score}</span>
          {gameStatus === "playing" && <span className="text-xs font-mono">{Math.max(0, 30 - Math.floor(frameCount.current / 60))}s</span>}
        </div>
      </div>
      
      <div className="p-6">
        <div 
          className="relative h-[400px] bg-sky-100 rounded-2xl overflow-hidden border-4 border-green-800 cursor-pointer"
          onClick={jump}
        >
          {/* Parallax Background (Simulated) */}
          <div className="absolute inset-0 flex items-end pointer-events-none opacity-20" style={{ transform: `translateX(-${bgOffset % 100}px)` }}>
            {Array(20).fill(0).map((_, i) => (
              <TreePalm key={i} className="h-40 w-40 text-green-900 ml-10" />
            ))}
          </div>

          {gameStatus === "idle" || gameStatus === "gameover" ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm text-center p-6 text-white">
              <div className="bg-white p-4 rounded-3xl mb-4 shadow-2xl">
                <TreePalm className="h-20 w-20 text-green-700 animate-bounce" />
              </div>
              <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase">Petualangan Sawit</h2>
              <p className="text-sm text-green-100 mb-6 max-w-[250px]">Lompat untuk mengumpulkan buah sawit! Setiap 5 buah = 1 Koin.</p>
              <Button 
                onClick={(e) => { e.stopPropagation(); start(); }} 
                className="bg-green-600 hover:bg-green-500 text-white h-14 px-12 rounded-2xl font-bold text-lg shadow-lg"
              >
                {gameStatus === "idle" ? "Mulai Panen" : "Main Lagi"}
              </Button>
            </div>
          ) : null}

          {/* Player (Prabowo Placeholder) */}
          <div 
            className="absolute left-[60px] w-12 h-20 transition-transform flex flex-col items-center z-10"
            style={{ top: playerY }}
          >
            {/* Simple character shape */}
            <div className="w-8 h-8 bg-[#333] rounded-sm relative mb-[-4px]">
               {/* Peci */}
               <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-black rounded-t-full" />
            </div>
            <div className="w-10 h-10 bg-[#fefefe] border-2 border-gray-200 rounded-lg shadow-sm" />
            <div className="flex gap-1 mt-[-2px]">
              <div className="w-3 h-4 bg-[#fefefe] border-b-2 border-gray-300" />
              <div className="w-3 h-4 bg-[#fefefe] border-b-2 border-gray-300" />
            </div>
          </div>

          {/* Items (Palm Fruit) */}
          {items.map(item => (
            <div 
              key={item.id}
              className="absolute w-10 h-10 bg-orange-600 rounded-full border-2 border-orange-800 shadow-md flex items-center justify-center animate-pulse"
              style={{ left: item.x, top: item.y }}
            >
              <div className="w-6 h-6 bg-orange-400 rounded-full" />
            </div>
          ))}

          {/* Ground */}
          <div className="absolute bottom-0 w-full h-16 bg-[#3d2b1f] border-t-4 border-green-800">
             <div className="flex gap-4 p-2 opacity-30">
               {Array(10).fill(0).map((_, i) => <div key={i} className="w-4 h-4 bg-green-900 rotate-45" />)}
             </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 text-center">Tips: Klik area game untuk melompat dan ambil buah sawit!</p>
      </div>
    </div>
  );
}
