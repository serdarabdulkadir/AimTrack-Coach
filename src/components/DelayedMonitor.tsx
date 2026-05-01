import React, { useRef, useEffect, useState } from 'react';
import { Camera, Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DelayedMonitor: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [delay, setDelay] = useState(5); 
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const frameBuffer = useRef<{ image: ImageBitmap; timestamp: number }[]>([]);
  const requestRef = useRef<number>();

  const startMonitor = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }, 
        audio: false 
      });
      setStream(mediaStream);
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Kameraya erişim engellendi veya kamera bulunamadı.');
      console.error(err);
    }
  };

  const stopMonitor = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    // Deep clear buffer
    frameBuffer.current.forEach(f => f.image.close());
    frameBuffer.current = [];
    setIsRecording(false);
  };

  useEffect(() => {
    if (isRecording && stream && videoRef.current && canvasRef.current) {
      videoRef.current.srcObject = stream;
      const ctx = canvasRef.current.getContext('2d', { alpha: false });
      if (!ctx) return;

      const render = async () => {
        if (!videoRef.current || !canvasRef.current || !ctx || !isRecording) return;

        // Capture frame from local video element
        if (videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
          try {
            // Use ImageBitmap which is more efficient than ImageData
            const bitmap = await createImageBitmap(videoRef.current);
            frameBuffer.current.push({
              image: bitmap,
              timestamp: Date.now()
            });
          } catch (e) {
            // Ignore capture errors during stop/pause
          }
        }

        // Target time for the delayed frame
        const now = Date.now();
        const targetTime = now - (delay * 1000);

        // Keep buffer manageable (max 15 seconds)
        const maxBufferSize = 15 * 1000;
        while (frameBuffer.current.length > 0 && frameBuffer.current[0].timestamp < now - maxBufferSize) {
          const frame = frameBuffer.current.shift();
          frame?.image.close(); // Crucial for memory
        }

        // Find best frame to display
        let frameToDisplay = null;
        while (frameBuffer.current.length > 1 && frameBuffer.current[1].timestamp < targetTime) {
          const frame = frameBuffer.current.shift();
          frame?.image.close();
        }

        if (frameBuffer.current.length > 0 && frameBuffer.current[0].timestamp <= targetTime) {
          frameToDisplay = frameBuffer.current[0];
        }

        if (frameToDisplay) {
          // Clear and draw the delayed frame
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(frameToDisplay.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
        } else {
          // If no delayed frame yet, we can show a placeholder or nothing
          // During the initial delay, we don't draw anything to the canvas
        }

        requestRef.current = requestAnimationFrame(render);
      };

      requestRef.current = requestAnimationFrame(render);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRecording, stream, delay]);

  useEffect(() => {
    return () => {
      stopMonitor();
    };
  }, []);
  
  return (
    <div className="flex flex-col gap-6 h-full p-4 md:p-6 bg-[#0a0a0a] text-white overflow-y-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Gecikmeli Video Monitörü</h2>
          <p className="text-zinc-400 text-xs md:text-sm max-w-md">Gecikmeli görüntü akışı ile kendi tekniğinizi anlık analiz edin.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center justify-between gap-3 bg-zinc-900 px-4 py-2.5 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-mono whitespace-nowrap">{delay}sn Gecikme</span>
            </div>
            <input 
              type="range" min="1" max="15" value={delay} 
              onChange={(e) => setDelay(parseInt(e.target.value))}
              className="w-24 xs:w-32 h-1 accent-white appearance-none bg-zinc-700 rounded-full"
            />
          </div>
          <div className="flex gap-2">
            {isRecording ? (
               <button 
                onClick={stopMonitor}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-full font-bold text-xs hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                <Pause className="w-4 h-4" />
                Durdur
              </button>
            ) : (
              <button 
                onClick={startMonitor}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-bold text-xs hover:bg-zinc-200 transition-colors whitespace-nowrap"
              >
                <Camera className="w-4 h-4" />
                Kamerayı Başlat
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-[300px] bg-zinc-950 rounded-[32px] border border-zinc-800 overflow-hidden flex items-center justify-center">
        <video ref={videoRef} autoPlay muted playsInline className="absolute opacity-0 pointer-events-none w-1 h-1" />
        
        <canvas 
          ref={canvasRef}
          width={1280}
          height={720}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${isRecording ? 'opacity-100' : 'opacity-0'}`}
        />

        {!isRecording && (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <Camera className="w-12 h-12 text-zinc-700" />
            <p className="text-zinc-600 font-medium uppercase tracking-widest text-[10px]">Kamera Hazır Değil</p>
          </div>
        )}
        
        {isRecording && (
          <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-white">Gecikmeli Yayın</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <span className="text-xs font-mono text-zinc-300">-{delay}s</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 bottom-4 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-3 rounded-2xl text-xs font-medium text-center">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-4 flex items-center gap-4 transition-all hover:bg-zinc-900">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center shrink-0">
               <RotateCcw className="w-5 h-5 text-zinc-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold tracking-widest truncate">Tampon {i}</p>
              <p className="text-[11px] md:text-xs text-zinc-400 font-medium truncate">Senkronize Ediliyor...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
