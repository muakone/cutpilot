"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "./ui/button";

interface Segment {
  id: string;
  label: string;
  startSec: number;
  endSec: number;
}

interface SilenceRange {
  start: number;
  end: number;
}

interface EditOperation {
  id: string;
  startSec: number;
  endSec: number;
  op: string;
  label: string;
}

interface VideoTimelineProps {
  videoPath: string | null;
  duration: number;
  currentTime: number;
  segments?: Segment[];
  silenceRanges?: SilenceRange[];
  operations?: EditOperation[];
  onTimeUpdate: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  isPlaying: boolean;
}

const formatTime = (sec: number): string => {
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
};

const SEGMENT_COLORS: Record<string, string> = {
  Hook: "bg-purple-500/40 border-purple-600",
  Intro: "bg-blue-500/40 border-blue-600",
  Content: "bg-green-500/40 border-green-600",
  Explanation: "bg-teal-500/40 border-teal-600",
  Pause: "bg-gray-400/40 border-gray-600",
  Peak: "bg-orange-500/40 border-orange-600",
  Outro: "bg-pink-500/40 border-pink-600",
  default: "bg-cyan-500/40 border-cyan-600",
};

const OP_COLORS: Record<string, string> = {
  remove_silence: "bg-red-400",
  effect: "bg-purple-400",
  trim: "bg-yellow-400",
  speed: "bg-blue-400",
  captions: "bg-green-400",
  overlay_audio: "bg-pink-400",
  overlay_video: "bg-orange-400",
};

export default function VideoTimeline({
  videoPath,
  duration,
  currentTime,
  segments = [],
  silenceRanges = [],
  operations = [],
  onTimeUpdate,
  onPlayPause,
  isPlaying,
}: VideoTimelineProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Sync video element with currentTime
  useEffect(() => {
    if (
      videoRef.current &&
      Math.abs(videoRef.current.currentTime - currentTime) > 0.5
    ) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Handle play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;

    onTimeUpdate(Math.max(0, Math.min(duration, newTime)));
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleVideoPlayPause = () => {
    onPlayPause(!isPlaying);
  };

  const skipForward = () => {
    onTimeUpdate(Math.min(duration, currentTime + 5));
  };

  const skipBackward = () => {
    onTimeUpdate(Math.max(0, currentTime - 5));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev / 1.5, 1));
  };

  const handleFrameStep = (direction: 1 | -1) => {
    // Assuming 30fps, step 1/30 of a second
    const frameTime = 1 / 30;
    onTimeUpdate(
      Math.max(0, Math.min(duration, currentTime + frameTime * direction)),
    );
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      {videoPath && (
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            src={videoPath}
            className="w-full h-full"
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={() => onPlayPause(false)}
          />

          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleVideoPlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={skipBackward}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={skipForward}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <span className="text-white text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1" />

              {/* Frame-by-frame controls */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleFrameStep(-1)}
                  className="text-white hover:bg-white/20 text-xs"
                >
                  -1F
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleFrameStep(1)}
                  className="text-white hover:bg-white/20 text-xs"
                >
                  +1F
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Timeline</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-600">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 10}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          <div
            ref={timelineRef}
            className="relative h-24 bg-gray-100 rounded-lg cursor-pointer select-none border border-gray-300"
            style={{ width: `${100 * zoomLevel}%` }}
            onClick={handleTimelineClick}
          >
            {/* Segments Layer */}
            {segments.map((segment) => {
              const left = (segment.startSec / duration) * 100;
              const width =
                ((segment.endSec - segment.startSec) / duration) * 100;
              const colorClass =
                SEGMENT_COLORS[segment.label] || SEGMENT_COLORS.default;

              return (
                <div
                  key={segment.id}
                  className={`absolute top-0 h-8 ${colorClass} border-l-2 border-r-2 flex items-center justify-center`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  <span className="text-xs font-medium text-gray-800 truncate px-1">
                    {segment.label}
                  </span>
                </div>
              );
            })}

            {/* Silence Ranges Layer */}
            {silenceRanges.map((silence, idx) => {
              const left = (silence.start / duration) * 100;
              const width = ((silence.end - silence.start) / duration) * 100;

              return (
                <div
                  key={`silence-${idx}`}
                  className="absolute top-8 h-4 bg-gray-400/60 border-l border-r border-gray-500"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`Silence: ${silence.start.toFixed(1)}s - ${silence.end.toFixed(1)}s`}
                />
              );
            })}

            {/* Operations Layer */}
            {operations.map((op) => {
              const left = (op.startSec / duration) * 100;
              const width = ((op.endSec - op.startSec) / duration) * 100;
              const colorClass = OP_COLORS[op.op] || "bg-gray-400";

              return (
                <div
                  key={op.id}
                  className={`absolute top-12 h-4 ${colorClass} border border-white/50 rounded-sm`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${op.label}: ${op.startSec.toFixed(1)}s - ${op.endSec.toFixed(1)}s`}
                />
              );
            })}

            {/* Current Time Indicator */}
            <motion.div
              className="absolute top-0 bottom-0 w-0.5 bg-red-600 pointer-events-none z-10"
              style={{ left: `${(currentTime / duration) * 100}%` }}
              animate={{ left: `${(currentTime / duration) * 100}%` }}
              transition={{ duration: 0.1 }}
            >
              <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-600 rounded-full" />
              <div className="absolute top-0 left-1 text-xs font-mono text-red-600 bg-white/90 px-1 rounded whitespace-nowrap">
                {formatTime(currentTime)}
              </div>
            </motion.div>

            {/* Time markers */}
            <div className="absolute bottom-0 left-0 right-0 h-4 flex justify-between text-xs text-gray-500 px-1">
              {Array.from({
                length: Math.min(11, Math.ceil(duration / 10)),
              }).map((_, i) => {
                const time = (i / 10) * duration;
                return (
                  <span key={i} className="text-[10px]">
                    {formatTime(time)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500/40 border border-purple-600 rounded" />
            <span className="text-gray-600">Segments</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-400/60 border border-gray-500 rounded" />
            <span className="text-gray-600">Silence</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-400 rounded" />
            <span className="text-gray-600">Effects</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-400 rounded" />
            <span className="text-gray-600">Trims</span>
          </div>
        </div>
      </div>
    </div>
  );
}
