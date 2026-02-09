"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface BeforeAfterComparisonProps {
  originalVideoPath: string;
  editedVideoPath: string | null;
}

export default function BeforeAfterComparison({
  originalVideoPath,
  editedVideoPath,
}: BeforeAfterComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState([50]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<"slider" | "split" | "tabs">(
    "slider",
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<"before" | "after">("before");

  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);

  // Sync video playback
  useEffect(() => {
    const beforeVideo = beforeVideoRef.current;
    const afterVideo = afterVideoRef.current;

    if (!beforeVideo || !afterVideo) return;

    const syncVideos = () => {
      if (Math.abs(beforeVideo.currentTime - afterVideo.currentTime) > 0.1) {
        afterVideo.currentTime = beforeVideo.currentTime;
      }
      setCurrentTime(beforeVideo.currentTime);
    };

    beforeVideo.addEventListener("timeupdate", syncVideos);
    return () => beforeVideo.removeEventListener("timeupdate", syncVideos);
  }, []);

  const handlePlayPause = () => {
    const beforeVideo = beforeVideoRef.current;
    const afterVideo = afterVideoRef.current;

    if (!beforeVideo || !afterVideo) return;

    if (isPlaying) {
      beforeVideo.pause();
      afterVideo.pause();
    } else {
      beforeVideo.play();
      afterVideo.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    const beforeVideo = beforeVideoRef.current;
    const afterVideo = afterVideoRef.current;

    if (beforeVideo) beforeVideo.currentTime = 0;
    if (afterVideo) afterVideo.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const formatTime = (sec: number): string => {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  if (!editedVideoPath) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Before/After Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Render your video to see the before/after comparison</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Before/After Comparison</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === "slider" ? "default" : "outline"}
              onClick={() => setViewMode("slider")}
            >
              Slider
            </Button>
            <Button
              size="sm"
              variant={viewMode === "split" ? "default" : "outline"}
              onClick={() => setViewMode("split")}
            >
              Split
            </Button>
            <Button
              size="sm"
              variant={viewMode === "tabs" ? "default" : "outline"}
              onClick={() => setViewMode("tabs")}
            >
              Tabs
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Slider View */}
        {viewMode === "slider" && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {/* Before Video (Right side) */}
              <video
                ref={beforeVideoRef}
                src={originalVideoPath}
                className="absolute inset-0 w-full h-full object-contain"
                muted
              />

              {/* After Video (Left side, clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition[0]}% 0 0)` }}
              >
                <video
                  ref={afterVideoRef}
                  src={editedVideoPath}
                  className="absolute inset-0 w-full h-full object-contain"
                  muted
                />
              </div>

              {/* Slider Line */}
              <motion.div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10 cursor-ew-resize"
                style={{ left: `${sliderPosition[0]}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-1 h-4 bg-gray-400" />
                </div>
              </motion.div>

              {/* Labels */}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                After
              </div>
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                Before
              </div>
            </div>

            <Slider
              value={sliderPosition}
              onValueChange={setSliderPosition}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* Split View */}
        {viewMode === "split" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Before</h4>
              <video
                ref={beforeVideoRef}
                src={originalVideoPath}
                className="w-full aspect-video bg-black rounded-lg"
                muted
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">After</h4>
              <video
                ref={afterVideoRef}
                src={editedVideoPath}
                className="w-full aspect-video bg-black rounded-lg"
                muted
              />
            </div>
          </div>
        )}

        {/* Tabs View */}
        {viewMode === "tabs" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={activeTab === "before" ? "default" : "outline"}
                onClick={() => setActiveTab("before")}
                className="flex-1"
              >
                Before
              </Button>
              <Button
                variant={activeTab === "after" ? "default" : "outline"}
                onClick={() => setActiveTab("after")}
                className="flex-1"
              >
                After
              </Button>
            </div>

            {activeTab === "before" ? (
              <video
                ref={beforeVideoRef}
                src={originalVideoPath}
                className="w-full aspect-video bg-black rounded-lg"
                muted
              />
            ) : (
              <video
                ref={afterVideoRef}
                src={editedVideoPath}
                className="w-full aspect-video bg-black rounded-lg"
                muted
              />
            )}
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Button
            size="sm"
            onClick={handlePlayPause}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>

          <span className="text-sm font-mono text-gray-700">
            {formatTime(currentTime)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
