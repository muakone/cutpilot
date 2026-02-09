"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Loader2, Play, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickPreviewProps {
  videoPath: string;
  duration: number;
  operations: Array<{
    id: string;
    startSec: number;
    endSec: number;
    op: string;
    label: string;
    params: Record<string, unknown>;
  }>;
}

export default function QuickPreview({
  videoPath,
  duration,
  operations,
}: QuickPreviewProps) {
  const [previewDuration, setPreviewDuration] = useState([15]);
  const [startTime, setStartTime] = useState([0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const maxStartTime = Math.max(0, duration - previewDuration[0]);

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    setError(null);
    setPreviewPath(null);
    setProgress(0);

    try {
      // Filter operations that fall within the preview window
      const previewStartSec = startTime[0];
      const previewEndSec = startTime[0] + previewDuration[0];

      const relevantOps = operations
        .filter((op) => {
          // Include operations that overlap with the preview window
          return !(op.endSec < previewStartSec || op.startSec > previewEndSec);
        })
        .map((op) => ({
          ...op,
          // Adjust timing relative to preview start
          startSec: Math.max(0, op.startSec - previewStartSec),
          endSec: Math.min(previewDuration[0], op.endSec - previewStartSec),
        }));

      // Step 1: Create trimmed preview clip
      const trimResponse = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoPath,
          operations: [
            {
              id: "preview-trim",
              startSec: previewStartSec,
              endSec: previewEndSec,
              op: "trim",
              label: "Preview Trim",
              params: {},
              status: "planned",
            },
          ],
        }),
      });

      if (!trimResponse.ok) {
        throw new Error("Failed to create preview trim");
      }

      const { jobId: trimJobId } = await trimResponse.json();

      // Poll for trim completion
      let trimComplete = false;
      let trimmedPath = "";

      while (!trimComplete) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const statusResponse = await fetch(`/api/render?jobId=${trimJobId}`);
        const status = await statusResponse.json();

        setProgress(status.progress / 2); // First 50%

        if (status.status === "completed") {
          trimComplete = true;
          trimmedPath = status.outputPath;
        } else if (status.status === "error") {
          throw new Error(status.error || "Trim failed");
        }
      }

      // Step 2: Apply operations to trimmed clip if any
      if (relevantOps.length > 0) {
        const renderResponse = await fetch("/api/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoPath: trimmedPath,
            operations: relevantOps,
          }),
        });

        if (!renderResponse.ok) {
          throw new Error("Failed to render preview");
        }

        const { jobId: renderJobId } = await renderResponse.json();

        // Poll for render completion
        let renderComplete = false;

        while (!renderComplete) {
          await new Promise((resolve) => setTimeout(resolve, 500));

          const statusResponse = await fetch(
            `/api/render?jobId=${renderJobId}`,
          );
          const status = await statusResponse.json();

          setProgress(50 + status.progress / 2); // Second 50%

          if (status.status === "completed") {
            renderComplete = true;
            setPreviewPath(status.outputPath);
          } else if (status.status === "error") {
            throw new Error(status.error || "Render failed");
          }
        }
      } else {
        // No operations to apply, use trimmed clip directly
        setPreviewPath(trimmedPath);
        setProgress(100);
      }
    } catch (err) {
      console.error("Preview generation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate preview",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Quick Preview</CardTitle>
        <p className="text-sm text-gray-600">
          Generate a short preview to test your edits without rendering the full
          video
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Preview Duration
            </label>
            <span className="text-sm text-gray-600">{previewDuration[0]}s</span>
          </div>
          <Slider
            value={previewDuration}
            onValueChange={setPreviewDuration}
            min={5}
            max={30}
            step={5}
            className="w-full"
          />
        </div>

        {/* Start Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Start Time
            </label>
            <span className="text-sm text-gray-600">{startTime[0]}s</span>
          </div>
          <Slider
            value={startTime}
            onValueChange={setStartTime}
            min={0}
            max={maxStartTime}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Preview: {startTime[0]}s - {startTime[0] + previewDuration[0]}s
          </p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGeneratePreview}
          disabled={isGenerating}
          className="w-full bg-purple-600 hover:bg-purple-500"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating... {Math.round(progress)}%
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Generate Preview
            </>
          )}
        </Button>

        {/* Progress Bar */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full bg-gray-200 rounded-full h-2"
            >
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        {/* Preview Video */}
        {previewPath && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <video
              src={previewPath}
              controls
              className="w-full rounded-lg bg-black"
            />
            <div className="flex gap-2">
              <a
                href={previewPath}
                download
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Preview
              </a>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
