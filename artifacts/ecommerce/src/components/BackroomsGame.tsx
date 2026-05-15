/**
 * BackroomsGame.tsx
 * Minigame horor 2D pixel-art Backrooms.
 * Menghindari monster, naik level, dan simulasi multiplayer.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Skull, Users, User, ArrowRight, ShieldAlert, 
  Map as MapIcon, Zap, Ghost, Eye, Lock, Unlock,
  Trophy, Coins, DoorOpen, Move
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface Entity {
  id: number;
  x: number;
  y: number;
  type: "hound" | "smiler" | "partygoer";
  speed: number;
}

interface Item {
  id: number;
  x: number;
  y: number;
  type: "almond_water" | "battery";
}

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

const getLevelConfig = (idx: number) => {
  const levelNum = idx + 1;
  // Dynamic scaling for 1000 levels
  return { 
    id: levelNum, 
    name: levelNum <= 5 ? "Introduction" : levelNum <= 50 ? "The Maze" : "Deep Backrooms", 
    entityCount: levelNum === 1 ? 1 : Math.min(1 + Math.floor(idx / 3), 40), 
    entitySpeed: Math.min(1.2 + (idx * 0.04), 6.0), 
    color: idx % 10 === 0 ? "bg-red-500/10" : idx % 5 === 0 ? "bg-orange-100" : "bg-yellow-100", 
    coinMult: Math.floor((idx + 1) * 2 * (1 + idx / 10)), // Exponential-ish scaling
    gridSize: Math.min(12 + Math.floor(idx / 5), 45) // Cap for performance
  };
};

export function BackroomsGame({ addCoins, userId, toast, onFinish }: any) {
  const [gameState, setGameState] = useState<"menu" | "multiplayer_setup" | "playing" | "gameover" | "win">("menu");
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [pairingCode, setPairingCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 50 });
  const [entities, setEntities] = useState<Entity[]>([]);
  const [otherPlayers, setOtherPlayers] = useState<Player[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const [sanity, setSanity] = useState(100);
  const [items, setItems] = useState<Item[]>([]);
  const [isFlickering, setIsFlickering] = useState(false);
  
  const [maze, setMaze] = useState<number[][]>([]);
  const [exitPos, setExitPos] = useState({ x: 14, y: 14 });
  const [gridSize, setGridSize] = useState(16);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();
  const level = getLevelConfig(currentLevelIdx);

  // Keys state
  const keys = useRef<Record<string, boolean>>({});

  const spawnEntities = useCallback((count: number, speed: number) => {
    const newEntities: Entity[] = [];
    for (let i = 0; i < count; i++) {
      newEntities.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        type: i % 3 === 0 ? "hound" : i % 3 === 1 ? "smiler" : "partygoer",
        speed: speed + Math.random() * 0.5
      });
    }
    setEntities(newEntities);
  }, []);

  const spawnItems = useCallback((count: number, size: number, mazeData: number[][]) => {
    const newItems: Item[] = [];
    for (let i = 0; i < count; i++) {
      let rx, ry;
      do {
        rx = Math.floor(Math.random() * (size - 2)) + 1;
        ry = Math.floor(Math.random() * (size - 2)) + 1;
      } while (mazeData[ry][rx] === 1);
      
      newItems.push({
        id: i,
        x: rx * (100 / size) + (100 / size / 2),
        y: ry * (100 / size) + (100 / size / 2),
        type: Math.random() > 0.3 ? "almond_water" : "battery"
      });
    }
    setItems(newItems);
  }, []);

  const generateMaze = useCallback((size: number) => {
    const newMaze = Array(size).fill(0).map(() => Array(size).fill(1));
    
    const walk = (x: number, y: number) => {
      newMaze[y][x] = 0;
      const directions = [[0, 2], [0, -2], [2, 0], [-2, 0]].sort(() => Math.random() - 0.5);
      for (const [dx, dy] of directions) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size && newMaze[ny][nx] === 1) {
          newMaze[y + dy / 2][x + dx / 2] = 0;
          walk(nx, ny);
        }
      }
    };
    
    walk(1, 1);
    
    // BACKROOMS STYLE: Create rooms and open spaces
    for (let i = 0; i < (size * size) / 8; i++) {
      const rx = Math.floor(Math.random() * (size - 3)) + 1;
      const ry = Math.floor(Math.random() * (size - 3)) + 1;
      // Carve out 2x2 or 3x3 rooms
      const rw = Math.random() > 0.5 ? 2 : 3;
      const rh = Math.random() > 0.5 ? 2 : 3;
      for (let ey = 0; ey < rh; ey++) {
        for (let ex = 0; ex < rw; ex++) {
          if (ry + ey < size - 1 && rx + ex < size - 1) {
            newMaze[ry + ey][rx + ex] = 0;
          }
        }
      }
    }

    // Ensure start is clear
    newMaze[1][1] = 0;
    newMaze[1][2] = 0;
    newMaze[2][1] = 0;

    // Set exit
    let ex = size - 2;
    let ey = size - 2;
    // Ensure exit is reachable
    newMaze[ey][ex] = 0;
    newMaze[ey-1][ex] = 0;
    newMaze[ey][ex-1] = 0;
    
    setExitPos({ x: ex, y: ey });
    return newMaze;
  }, []);

  const startLevel = useCallback((idx: number) => {
    const levelConfig = getLevelConfig(idx);
    setCurrentLevelIdx(idx);
    setGridSize(levelConfig.gridSize);
    
    const m = generateMaze(levelConfig.gridSize);
    setMaze(m);
    setPlayerPos({ x: 1.5 * (100 / levelConfig.gridSize), y: 1.5 * (100 / levelConfig.gridSize) });
    // Time scales slightly with map size
    setTimeLeft(120 + Math.floor(levelConfig.gridSize * 2));
    setSanity(prev => Math.min(prev + 30, 100));
    spawnEntities(levelConfig.entityCount, levelConfig.entitySpeed);
    spawnItems(5 + Math.floor(idx / 2), levelConfig.gridSize, m);
    setGameState("playing");
  }, [generateMaze, spawnEntities, spawnItems]);

  const handleCreateRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setPairingCode(code);
    setRoomUsers(["You (Host)"]);
    setMode("multi");
    setGameState("multiplayer_setup");
  };

  const handleJoinRoom = () => {
    if (inputCode.length < 4) {
      toast({ title: "Kode Salah", description: "Masukkan kode pairing yang valid.", variant: "destructive" });
      return;
    }
    setPairingCode(inputCode);
    setMode("multi");
    // Simulate finding room
    setTimeout(() => {
      setRoomUsers(["Host", "You"]);
      setGameState("multiplayer_setup");
    }, 800);
  };

  const startMultiplayer = () => {
    // In multi mode, we add some "fake" players to the game
    const fakes: Player[] = roomUsers.filter(u => !u.includes("You")).map((u, i) => ({
      id: `fake-${i}`,
      name: u,
      x: 30 + i * 10,
      y: 30 + i * 10,
      color: ["bg-blue-500", "bg-green-500", "bg-purple-500"][i % 3]
    }));
    setOtherPlayers(fakes);
    startLevel(0);
  };

  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;

    // 1. Move Player
    setPlayerPos(prev => {
      let nx = prev.x;
      let ny = prev.y;
      const speed = 0.8;
      let dx = 0;
      let dy = 0;

      if (keys.current["ArrowUp"] || keys.current["w"]) dy -= speed;
      if (keys.current["ArrowDown"] || keys.current["s"]) dy += speed;
      if (keys.current["ArrowLeft"] || keys.current["a"]) dx -= speed;
      if (keys.current["ArrowRight"] || keys.current["d"]) dx += speed;

      // Wall Collision Detection
      const checkCollision = (tx: number, ty: number) => {
        const gx = Math.floor(tx / (100 / gridSize));
        const gy = Math.floor(ty / (100 / gridSize));
        if (gx < 0 || gx >= gridSize || gy < 0 || gy >= gridSize) return true;
        return maze[gy][gx] === 1;
      };

      // Try horizontal move
      if (!checkCollision(nx + dx, ny)) {
        nx += dx;
      }
      // Try vertical move
      if (!checkCollision(nx, ny + dy)) {
        ny += dy;
      }

      // Exit Check
      const pgx = Math.floor(nx / (100 / gridSize));
      const pgy = Math.floor(ny / (100 / gridSize));
      if (pgx === exitPos.x && pgy === exitPos.y) {
        // We handle level up in a separate effect or here
      }

      return { x: nx, y: ny };
    });

    // 2. Move Entities
    setEntities(prev => {
      let sanityLoss = 0;
      const next = prev.map(en => {
        const dx = playerPos.x - en.x;
        const dy = playerPos.y - en.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 3) {
          setGameState("gameover");
        }

        // Sanity drain if near entities
        if (dist < 15) {
          sanityLoss += 0.05;
        }

        if (dist === 0) return en;
        
        const moveX = (dx / dist) * (en.speed * 0.15);
        const moveY = (dy / dist) * (en.speed * 0.15);
        
        let nx = en.x;
        let ny = en.y;

        const gx = Math.floor((nx + moveX) / (100 / gridSize));
        const gy = Math.floor((ny + moveY) / (100 / gridSize));
        
        if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize && maze[gy][gx] === 0) {
           nx += moveX;
           ny += moveY;
        } else {
           nx += (Math.random() - 0.5) * 0.2;
           ny += (Math.random() - 0.5) * 0.2;
        }

        return { ...en, x: nx, y: ny };
      });

      if (sanityLoss > 0) {
        setSanity(s => Math.max(0, s - sanityLoss));
      }
      return next;
    });

    // 3. Collect Items
    setItems(prev => {
      const remaining = prev.filter(item => {
        const dx = playerPos.x - item.x;
        const dy = playerPos.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 3) {
          if (item.type === "almond_water") {
            setSanity(s => Math.min(100, s + 30));
            toast({ title: "Almond Water", description: "Restored Sanity!" });
          } else {
            setTimeLeft(t => t + 20);
            toast({ title: "Battery Found", description: "+20 Seconds!" });
          }
          return false;
        }
        return true;
      });
      return remaining;
    });

    // 4. Move Other Players
    if (mode === "multi") {
      setOtherPlayers(prev => prev.map(p => ({
        ...p,
        x: p.x + (Math.random() - 0.5) * 0.3,
        y: p.y + (Math.random() - 0.5) * 0.3
      })));
    }

    if (sanity < 30 && Math.random() < 0.05) {
      setIsFlickering(true);
      setTimeout(() => setIsFlickering(false), 50);
    }

    // 5. Exit Proximity Flicker (Lamp near door cue)
    const exitX_pct = exitPos.x * (100 / gridSize) + (100 / gridSize / 2);
    const exitY_pct = exitPos.y * (100 / gridSize) + (100 / gridSize / 2);
    const dxExit = playerPos.x - exitX_pct;
    const dyExit = playerPos.y - exitY_pct;
    const distToExit = Math.sqrt(dxExit * dxExit + dyExit * dyExit);
    
    if (distToExit < 25 && Math.random() < 0.15) {
      setIsFlickering(true);
      setTimeout(() => setIsFlickering(false), 40);
    }

    if (sanity <= 0) {
        setGameState("gameover");
        toast({ title: "Lost Sanity", description: "You went insane in the Backrooms.", variant: "destructive" });
    }

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [playerPos, gameState, mode, maze, gridSize, exitPos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.current[e.key] = true;
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.key] = false;
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // 1. Animation Loop Effect
  useEffect(() => {
    if (gameState === "playing") {
      frameRef.current = requestAnimationFrame(gameLoop);
      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
    }
  }, [gameState, gameLoop]);

  // 2. Timer Effect (Stable)
  useEffect(() => {
    if (gameState !== "playing") return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameState("gameover");
          toast({ title: "Time Out", description: "You got lost forever in the Backrooms.", variant: "destructive" });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, toast]);
  
  // Exit Detection Effect
  useEffect(() => {
    if (gameState !== "playing") return;

    const pgx = Math.floor(playerPos.x / (100 / gridSize));
    const pgy = Math.floor(playerPos.y / (100 / gridSize));

    if (pgx === exitPos.x && pgy === exitPos.y) {
      const levelConfig = getLevelConfig(currentLevelIdx);
      const rewardAmount = levelConfig.coinMult;
      
      if (addCoins && userId) {
        addCoins(userId, rewardAmount);
      }
      
      setScore(prev => prev + rewardAmount);
      
      if (currentLevelIdx < 1000) {
        startLevel(currentLevelIdx + 1);
        toast({ 
          title: "Level Escaped!", 
          description: `Kamu dapet ${rewardAmount} Koin! Masuk ke Level ${currentLevelIdx + 2}` 
        });
      } else {
        setGameState("win");
      }
    }
  }, [playerPos.x, playerPos.y, gridSize, exitPos, gameState, currentLevelIdx, startLevel, addCoins, userId, toast]);

  const handleFinish = () => {
    const finalReward = gameState === "win" ? 500 : 0;
    if (finalReward > 0) {
      addCoins(userId, finalReward);
      toast({ title: "Game Completed!", description: `Grand Prize: ${finalReward} Koin!` });
    }
    onFinish();
    setGameState("menu");
  };

  return (
    <div className="bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border-4 border-neutral-800 text-white font-mono">
      {/* Header Info */}
      <div className="bg-neutral-800 p-4 flex justify-between items-center border-b border-neutral-700">
        <div className="flex items-center gap-2">
          <Skull className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-bold tracking-widest uppercase">The Backrooms 2D</span>
        </div>
        {gameState === "playing" && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col gap-1 w-24">
               <div className="flex justify-between text-[8px] uppercase">
                  <span>Sanity</span>
                  <span>{Math.floor(sanity)}%</span>
               </div>
               <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-700">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: `${sanity}%`, backgroundColor: sanity < 30 ? "#ef4444" : "#eab308" }}
                    className="h-full"
                  />
               </div>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Zap className="h-4 w-4" /> LVL {level.id}
            </div>
            <div className="flex items-center gap-1 text-green-400 font-bold">
              <Coins className="h-4 w-4" /> {score}
            </div>
            <div className="bg-black/50 px-3 py-1 rounded-full font-bold">
              TIME: {timeLeft}s
            </div>
          </div>
        )}
      </div>

      <div className="relative h-[500px] w-full bg-neutral-950 overflow-hidden">
        <AnimatePresence>
          {/* MENU */}
          {gameState === "menu" && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-8 text-center"
            >
              <div className="mb-8 relative">
                <div className="absolute -inset-4 bg-yellow-500/20 blur-2xl rounded-full animate-pulse" />
                <Ghost className="h-24 w-24 text-yellow-600 mx-auto mb-4 relative z-10" />
                <h2 className="text-4xl font-black tracking-tighter text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">BACKROOMS</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                <Button 
                  size="lg" onClick={() => { setMode("single"); startLevel(0); }}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black font-black h-14 rounded-xl border-b-4 border-yellow-800 active:border-b-0 transition-all"
                >
                  SINGLE PLAYER
                </Button>
                <Button 
                  size="lg" onClick={() => setGameState("multiplayer_setup")}
                  variant="outline"
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-black h-14 rounded-xl border-b-4 border-neutral-950 active:border-b-0 transition-all"
                >
                  <Users className="h-5 w-5 mr-2" /> MULTIPLAYER
                </Button>
              </div>
              
              <p className="mt-8 text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Lari dari entitas, bertahan hidup, ambil koin.</p>
            </motion.div>
          )}

          {/* MULTIPLAYER SETUP */}
          {gameState === "multiplayer_setup" && !pairingCode && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-8"
            >
              <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-500" /> MULTIPLAYER SETUP
              </h3>
              
              <div className="w-full max-w-sm space-y-6">
                <div className="p-6 bg-neutral-800 rounded-2xl border-2 border-neutral-700">
                  <p className="text-sm font-bold mb-3 uppercase text-neutral-400">Join Existing Room</p>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="ENTER CODE" 
                      className="bg-black border-neutral-600 text-center font-black tracking-widest uppercase"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                    <Button onClick={handleJoinRoom} className="bg-blue-600 font-bold">JOIN</Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-neutral-700" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-neutral-500">Or</span></div>
                </div>

                <Button onClick={handleCreateRoom} className="w-full h-14 bg-neutral-700 hover:bg-neutral-600 border-2 border-neutral-500 font-black text-lg">
                  CREATE NEW ROOM
                </Button>

                <Button variant="ghost" onClick={() => setGameState("menu")} className="w-full text-neutral-500">Back</Button>
              </div>
            </motion.div>
          )}

          {/* ROOM LOBBY */}
          {gameState === "multiplayer_setup" && pairingCode && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black p-8"
            >
              <div className="bg-yellow-500/10 border-2 border-yellow-500/30 p-4 rounded-2xl text-center mb-8">
                <p className="text-xs font-bold text-yellow-500 uppercase mb-1">Pairing Code</p>
                <p className="text-4xl font-black tracking-[0.5em] text-white">{pairingCode}</p>
              </div>

              <div className="w-full max-w-xs space-y-4 mb-8">
                <p className="text-xs font-bold uppercase text-neutral-500 mb-2">Players in Room ({roomUsers.length}/4)</p>
                {roomUsers.map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-neutral-800 rounded-xl border border-neutral-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? "bg-yellow-500" : "bg-blue-500"}`}>
                        <User className="h-5 w-5 text-black" />
                      </div>
                      <span className="font-bold text-sm">{u}</span>
                    </div>
                    {i === 0 && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-neutral-400">HOST</span>}
                  </div>
                ))}
                {roomUsers.length < 2 && (
                  <div className="animate-pulse flex items-center justify-center py-4 text-neutral-600 italic text-xs">
                    Waiting for players...
                  </div>
                )}
              </div>

              <Button 
                onClick={startMultiplayer}
                className="w-full max-w-xs h-14 bg-yellow-600 hover:bg-yellow-500 text-black font-black text-lg rounded-2xl"
              >
                START GAME
              </Button>
            </motion.div>
          )}

          {/* GAME OVER / WIN */}
          {(gameState === "gameover" || gameState === "win") && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className={`absolute inset-0 z-[60] flex flex-col items-center justify-center backdrop-blur-xl p-8 text-center ${gameState === "gameover" ? "bg-red-950/80" : "bg-green-950/80"}`}
            >
              <div className="mb-6">
                {gameState === "gameover" ? (
                  <>
                    <Skull className="h-20 w-20 text-red-500 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-4xl font-black text-white tracking-tighter">YOU DIED</h2>
                    <p className="text-red-300 font-bold mt-2">ENTITY CAUGHT YOU AT LEVEL {currentLevelIdx + 1}</p>
                  </>
                ) : (
                  <>
                    <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-4xl font-black text-white tracking-tighter">BACKROOMS MASTER</h2>
                    <p className="text-green-300 font-bold mt-2">YOU CONQUERED ALL 1000 LEVELS!</p>
                  </>
                )}
              </div>

              <div className="bg-black/40 p-6 rounded-3xl border border-white/10 mb-8 w-full max-w-xs">
                <p className="text-neutral-400 text-xs font-bold uppercase mb-1">{gameState === "win" ? "Total Coins Earned" : "Coins Collected"}</p>
                <p className="text-4xl font-black text-white">{score + (gameState === "win" ? 500 : 0)}</p>
                <div className="flex items-center justify-center gap-2 mt-2 text-yellow-500">
                  <Coins className="h-5 w-5" />
                  <span className="font-bold text-lg">Koin Berhasil Disimpan</span>
                </div>
              </div>

              <Button onClick={handleFinish} className="h-14 px-12 bg-white text-black font-black rounded-2xl hover:bg-gray-200">
                Back to Menu
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GAME WORLD (Pixel Style) */}
        <div className={`absolute inset-0 pointer-events-none z-[60] transition-opacity duration-75 ${isFlickering ? "opacity-100 bg-white/10" : "opacity-0"}`} />
        <div className="absolute inset-0 pointer-events-none z-[55] shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
        <div className="absolute inset-0 pointer-events-none z-[50] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
        
        {/* Flashlight Mask */}
        {gameState === "playing" && (
          <div 
            className="absolute inset-0 pointer-events-none z-[45] transition-all duration-300"
            style={{
              background: `radial-gradient(circle 120px at ${playerPos.x}% ${playerPos.y}%, transparent 0%, rgba(0,0,0,0.92) 100%)`
            }}
          />
        )}
        
        <div 
          className={`absolute inset-0 transition-colors duration-1000 ${level.color}`}
          style={{ 
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: `${100 / gridSize}% ${100 / gridSize}%`
          }}
        >
          {/* Walls */}
          {maze.map((row, y) => row.map((cell, x) => cell === 1 ? (
            <div 
              key={`${x}-${y}`}
              className="absolute bg-neutral-800 border-2 border-neutral-900 shadow-inner"
              style={{ 
                left: x * (100 / gridSize) + "%", 
                top: y * (100 / gridSize) + "%", 
                width: (100 / gridSize) + "%", 
                height: (100 / gridSize) + "%",
                backgroundImage: "radial-gradient(circle, #444 1px, transparent 1px)",
                backgroundSize: "4px 4px"
              }}
            />
          ) : null))}

          {/* Exit Door */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute z-10 flex items-center justify-center bg-black/50 rounded-lg border-2 border-yellow-500/50"
            style={{ 
              left: exitPos.x * (100 / gridSize) + "%", 
              top: exitPos.y * (100 / gridSize) + "%", 
              width: (100 / gridSize) + "%", 
              height: (100 / gridSize) + "%"
            }}
          >
            <DoorOpen className="text-yellow-400 w-2/3 h-2/3" />
            <div className="absolute inset-0 bg-yellow-400/20 blur-lg" />
          </motion.div>

          {/* Items */}
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
              style={{ left: item.x + "%", top: item.y + "%" }}
            >
              <div className="relative group">
                {item.type === "almond_water" ? (
                   <div className="w-4 h-6 bg-blue-400/80 border border-white rounded-t-sm relative">
                      <div className="absolute inset-0 bg-white/20 blur-[2px]" />
                   </div>
                ) : (
                   <div className="w-5 h-3 bg-yellow-600 border border-black rounded-sm flex items-center px-0.5">
                      <div className="w-1 h-1 bg-neutral-900 rounded-full" />
                   </div>
                )}
                <div className="absolute -inset-2 bg-white/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}

          {/* Entities (Monsters) */}
          {entities.map(en => (
            <motion.div
              key={en.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ left: en.x + "%", top: en.y + "%" }}
            >
              <div className="relative">
                {en.type === "hound" ? (
                   <div className="w-10 h-6 bg-neutral-800 border-2 border-black rounded-sm relative">
                      <div className="absolute -top-2 left-0 w-4 h-4 bg-red-900 rounded-full blur-[2px] animate-pulse" />
                   </div>
                ) : en.type === "smiler" ? (
                   <div className="flex flex-col items-center">
                      <div className="flex gap-2 mb-[-4px]">
                        <div className="w-2 h-2 bg-white rounded-full blur-[1px]" />
                        <div className="w-2 h-2 bg-white rounded-full blur-[1px]" />
                      </div>
                      <div className="w-8 h-4 bg-white rounded-b-full border-t-4 border-black" />
                   </div>
                ) : (
                   <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-red-600">
                      <Eye className="h-6 w-6 text-red-900" />
                   </div>
                )}
                {/* Glow/Shadow */}
                <div className="absolute inset-0 bg-red-500/20 blur-xl -z-10 rounded-full" />
              </div>
            </motion.div>
          ))}

          {/* Other Players */}
          {otherPlayers.map(p => (
            <div 
              key={p.id}
              className={`absolute w-8 h-8 ${p.color} border-2 border-black rounded-sm -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10 flex items-center justify-center`}
              style={{ left: p.x + "%", top: p.y + "%" }}
            >
              <User className="h-5 w-5 text-black/50" />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/50 px-2 py-0.5 rounded text-[8px] font-bold">
                {p.name}
              </span>
            </div>
          ))}

          {/* PLAYER */}
          <motion.div 
            className="absolute w-8 h-8 bg-white border-2 border-black rounded-sm -translate-x-1/2 -translate-y-1/2 shadow-xl z-30 flex items-center justify-center"
            style={{ left: playerPos.x + "%", top: playerPos.y + "%" }}
          >
             <div className="w-full h-full relative overflow-hidden">
                <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-black rounded-full" />
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20" />
             </div>
             {/* Flashlight Effect */}
             <div className="absolute w-[200px] h-[200px] bg-yellow-500/10 blur-[60px] rounded-full -z-10" />
          </motion.div>
        </div>
      </div>

      {/* Controls Help */}
      <div className="bg-neutral-800 p-4 grid grid-cols-2 gap-4 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-700 px-2 py-1 rounded">WASD / ARROWS</div>
          <span>UNTUK BERGERAK</span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <DoorOpen className="h-3 w-3 text-yellow-500" />
          <span>CARI PINTU KELUAR</span>
        </div>
      </div>
    </div>
  );
}
