"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause } from "lucide-react";

interface DemoVideoProps {
  src: string;
  poster?: string;
}

export default function DemoVideo({ src, poster }: DemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrent] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [showOverlay, setShowOverlay] = useState(true);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
      setShowOverlay(false);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => {
      if (v.duration) {
        setProgress((v.currentTime / v.duration) * 100);
        setCurrent(formatTime(v.currentTime));
      }
    };
    const onMeta = () => setDuration(formatTime(v.duration));
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("ended", onEnd);
    };
  }, []);

  // IntersectionObserver — pause when out of view
  useEffect(() => {
    const v = videoRef.current;
    const c = containerRef.current;
    if (!v || !c) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.play().catch(() => {});
          setPlaying(true);
          setShowOverlay(false);
        } else {
          v.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(c);
    return () => observer.disconnect();
  }, []);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar || !v.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleProgressClick(e);
  };

  return (
    <div ref={containerRef} className="relative group rounded-sm overflow-hidden border rule bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        onClick={togglePlay}
        className="w-full cursor-pointer"
      />

      {/* Play overlay — shown before first play */}
      {showOverlay && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
          aria-label="Play video"
        >
          <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-2xl ring-4 ring-white/20">
            <Play className="h-9 w-9 text-zinc-900 ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls bar — visible on hover or when paused */}
      <div className={`absolute bottom-0 inset-x-0 bg-zinc-900/80 backdrop-blur-sm transition-opacity duration-200 ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          onMouseMove={handleDrag}
          className="h-1 bg-zinc-700 cursor-pointer group/progress"
        >
          <div
            className="h-full bg-accent transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Bottom row: play/pause + time */}
        <div className="flex items-center gap-3 px-3 py-2">
          <button onClick={togglePlay} className="text-white/80 hover:text-white transition-colors" aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" fill="currentColor" />}
          </button>
          <span className="stats text-xs text-white/60 tabular-nums">
            {currentTime} / {duration}
          </span>
        </div>
      </div>
    </div>
  );
}
