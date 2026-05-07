import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCcw, Play } from 'lucide-react';

// Character Assets
const BIRD_FRAME_1 = "https://i.ibb.co/cSkV90ws/lunar-flappy-duck.png";
const BIRD_FRAME_2 = "https://i.ibb.co/tp6kpmyF/lunar-flappy-duck2.png";

// Game Constants
const GRAVITY = 0.3;
const JUMP_STRENGTH = -6.5;
const PIPE_SPEED = 3.5;
const PIPE_SPAWN_RATE = 100; // frames
const PIPE_WIDTH = 80;
const PIPE_GAP = 240;
const BIRD_SIZE = 75;
const GROUND_HEIGHT = 100;

type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

interface PipeData {
  x: number;
  topHeight: number;
  passed: boolean;
  id: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Game state refs (for the loop)
  const birdPos = useRef(200);
  const birdVelocity = useRef(0);
  const pipes = useRef<PipeData[]>([]);
  const frameCount = useRef(0);
  const animationId = useRef<number>();
  const lastPipeId = useRef(0);

  // Background and Assets
  const birdImages = useRef<HTMLImageElement[]>([]);

  const initAssets = useCallback(() => {
    const img1 = new Image();
    img1.src = BIRD_FRAME_1;
    const img2 = new Image();
    img2.src = BIRD_FRAME_2;
    birdImages.current = [img1, img2];
  }, []);

  const resetGame = () => {
    birdPos.current = window.innerHeight / 2;
    birdVelocity.current = 0;
    pipes.current = [];
    frameCount.current = 0;
    setScore(0);
    setGameState('PLAYING');
  };

  const jump = useCallback(() => {
    if (gameState === 'PLAYING') {
      birdVelocity.current = JUMP_STRENGTH;
    } else if (gameState === 'START' || gameState === 'GAME_OVER') {
      resetGame();
    }
  }, [gameState]);

  useEffect(() => {
    initAssets();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, initAssets]);

  const update = () => {
    if (gameState !== 'PLAYING') return;

    frameCount.current++;

    // Bird Physics
    birdVelocity.current += GRAVITY;
    birdPos.current += birdVelocity.current;

    // Ground/Ceiling collision
    if (birdPos.current + BIRD_SIZE > window.innerHeight - GROUND_HEIGHT || birdPos.current < 0) {
      endGame();
    }

    // Pipe Spawning
    if (frameCount.current % PIPE_SPAWN_RATE === 0) {
      const minPipeHeight = 100;
      const maxPipeHeight = window.innerHeight - GROUND_HEIGHT - PIPE_GAP - 100;
      const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
      
      pipes.current.push({
        x: window.innerWidth,
        topHeight,
        passed: false,
        id: lastPipeId.current++
      });
    }

    // Pipe Movement & Collision
    pipes.current.forEach(pipe => {
      pipe.x -= PIPE_SPEED;

      // Collision Detection
      const birdRect = {
        left: 50,
        right: 50 + BIRD_SIZE,
        top: birdPos.current + 10, // Slight buffer for duck beak
        bottom: birdPos.current + BIRD_SIZE - 10
      };

      const topPipeRect = {
        left: pipe.x,
        right: pipe.x + PIPE_WIDTH,
        top: 0,
        bottom: pipe.topHeight
      };

      const bottomPipeRect = {
        left: pipe.x,
        right: pipe.x + PIPE_WIDTH,
        top: pipe.topHeight + PIPE_GAP,
        bottom: window.innerHeight - GROUND_HEIGHT
      };

      const intersects = (r1: any, r2: any) => {
        return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
      };

      if (intersects(birdRect, topPipeRect) || intersects(birdRect, bottomPipeRect)) {
        endGame();
      }

      // Scoring
      if (!pipe.passed && pipe.x + PIPE_WIDTH < 50) {
        pipe.passed = true;
        setScore(s => s + 1);
      }
    });

    // Cleanup off-screen pipes
    pipes.current = pipes.current.filter(p => p.x + PIPE_WIDTH > -100);
  };

  const endGame = () => {
    setGameState('GAME_OVER');
  };

  useEffect(() => {
    if (gameState === 'GAME_OVER') {
      setHighScore(prev => Math.max(prev, score));
    }
  }, [gameState, score]);

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, y: number, height: number, inverted: boolean) => {
    const rimHeight = 35;
    const rimOverlap = 10;
    const bodyWidth = PIPE_WIDTH - 10;
    const bodyX = x + 5;

    ctx.save();
    
    // Pipe Colors
    const pipeDark = '#53800e';
    const pipeMain = '#73bf2e';
    const pipeLight = '#9de64e';
    const pipeHighlight = '#ffffff';

    if (inverted) {
      // Top Pipe
      // Body
      ctx.fillStyle = pipeMain;
      ctx.fillRect(bodyX, 0, bodyWidth, height - rimHeight);
      // Body Shadows/Highlights
      ctx.fillStyle = pipeDark;
      ctx.fillRect(bodyX, 0, 8, height - rimHeight);
      ctx.fillStyle = pipeLight;
      ctx.fillRect(bodyX + 15, 0, 10, height - rimHeight);
      ctx.fillStyle = pipeHighlight;
      ctx.fillRect(bodyX + 28, 0, 4, height - rimHeight);

      // Rim (at the bottom of top pipe)
      ctx.fillStyle = pipeMain;
      ctx.fillRect(x, height - rimHeight, PIPE_WIDTH, rimHeight);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, height - rimHeight, PIPE_WIDTH, rimHeight);
      
      // Rim Shadows
      ctx.fillStyle = pipeDark;
      ctx.fillRect(x + 4, height - rimHeight + 4, 10, rimHeight - 8);
      
      // Outer Border for body
      ctx.strokeRect(bodyX, -10, bodyWidth, height - rimHeight + 10);
    } else {
      // Bottom Pipe
      // Body
      ctx.fillStyle = pipeMain;
      ctx.fillRect(bodyX, y + rimHeight, bodyWidth, height - rimHeight);
      // Body Shadows/Highlights
      ctx.fillStyle = pipeDark;
      ctx.fillRect(bodyX, y + rimHeight, 8, height - rimHeight);
      ctx.fillStyle = pipeLight;
      ctx.fillRect(bodyX + 15, y + rimHeight, 10, height - rimHeight);
      ctx.fillStyle = pipeHighlight;
      ctx.fillRect(bodyX + 28, y + rimHeight, 4, height - rimHeight);

      // Rim (at the top of bottom pipe)
      ctx.fillStyle = pipeMain;
      ctx.fillRect(x, y, PIPE_WIDTH, rimHeight);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, PIPE_WIDTH, rimHeight);
      
      // Rim Shadows
      ctx.fillStyle = pipeDark;
      ctx.fillRect(x + 4, y + 4, 10, rimHeight - 8);

      // Outer Border for body
      ctx.strokeRect(bodyX, y + rimHeight, bodyWidth, height - rimHeight + 10);
    }
    
    ctx.restore();
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.clearRect(0, 0, width, height);

    // Draw Background (Sky)
    ctx.fillStyle = '#71c5cf';
    ctx.fillRect(0, 0, width, height);

    // Clouds
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(width - 200, 100, 60, 30);
    ctx.fillRect(width - 230, 115, 90, 30);
    
    ctx.fillRect(150, 200, 50, 25);
    ctx.fillRect(120, 212, 80, 25);

    // Draw Pipes
    pipes.current.forEach(pipe => {
      // Top Pipe
      drawPipe(ctx, pipe.x, 0, pipe.topHeight, true);
      // Bottom Pipe
      drawPipe(ctx, pipe.x, pipe.topHeight + PIPE_GAP, height - GROUND_HEIGHT - (pipe.topHeight + PIPE_GAP), false);
    });

    // Draw Ground
    ctx.fillStyle = '#ded895'; 
    ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(0, height - GROUND_HEIGHT, width, 12);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, height - GROUND_HEIGHT, width, 12);

    // Draw Bird
    const frame = Math.floor(frameCount.current / 8) % 2;
    const birdImg = birdImages.current[frame];
    if (birdImg && birdImg.complete) {
      ctx.drawImage(birdImg, 50, birdPos.current, BIRD_SIZE, BIRD_SIZE);
    } else {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(50, birdPos.current, BIRD_SIZE, BIRD_SIZE);
    }

    // Draw Score in-game
    if (gameState === 'PLAYING') {
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 6;
      ctx.font = '40px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.strokeText(score.toString(), width / 2, 100);
      ctx.fillText(score.toString(), width / 2, 100);
    }
  };

  useEffect(() => {
    let animationReq: number;
    const loop = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        update();
        draw(ctx);
      }
      animationReq = requestAnimationFrame(loop);
    };

    animationReq = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationReq);
  }, [gameState, score]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden cursor-pointer select-none font-press-start" onClick={jump}>
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Start Screen */}
      <AnimatePresence>
        {gameState === 'START' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20"
          >
            <motion.h1 
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              className="text-white text-5xl mb-12 drop-shadow-[0_6px_0_rgba(0,0,0,1)] text-center px-4"
            >
              FLAPPY<br/>LUNAR
            </motion.h1>
            
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="mb-12"
            >
              <img src={BIRD_FRAME_1} alt="Lunar Duck" className="w-24 h-24 pixelated" referrerPolicy="no-referrer" />
            </motion.div>

            <button 
              className="pixel-button px-10 py-6 flex items-center gap-4 text-2xl font-bold"
              onClick={(e) => { e.stopPropagation(); resetGame(); }}
            >
              <Play size={28} /> FLAP!
            </button>
            <p className="mt-10 text-white/80 text-sm">TAP TO FLY</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Summary Card */}
      <AnimatePresence>
        {gameState === 'GAME_OVER' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md p-4 z-30"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="pixel-card w-full max-w-sm p-8 flex flex-col items-center gap-8"
            >
              <h2 className="text-3xl font-bold text-red-600 mb-2">CRASHED!</h2>
              
              <div className="w-full flex justify-between items-center bg-yellow-50 p-6 border-4 border-black/10">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[12px] text-gray-500 uppercase">Score</span>
                  <span className="text-4xl font-bold">{score}</span>
                </div>
                <div className="h-16 w-[4px] bg-black/10" />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[12px] text-gray-500 uppercase">Best</span>
                  <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-500" />
                    <span className="text-4xl font-bold">{highScore}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 w-full">
                <button 
                  className="pixel-button w-full py-5 flex items-center justify-center gap-4 text-xl font-bold bg-[#73bf2e]"
                  onClick={(e) => { e.stopPropagation(); resetGame(); }}
                >
                  <RefreshCcw size={24} /> RETRY
                </button>
                <button 
                  className="w-full py-2 text-[10px] text-gray-500 hover:text-black uppercase"
                  onClick={(e) => { e.stopPropagation(); setGameState('START'); }}
                >
                  Main Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playing HUD */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-8 right-8 text-white text-xl drop-shadow-md z-10">
          {score}
        </div>
      )}

      {/* Credit Footer */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 credit-text uppercase">
        made by littlebaecon / artwork by awbymarcy
      </div>
    </div>
  );
}
