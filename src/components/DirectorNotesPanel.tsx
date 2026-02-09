"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanRequest } from "@/lib/planContracts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Pause,
  Wand2,
  Download,
  X,
  Edit2,
  Check,
  Zap,
  Image as ImageIcon,
  Music,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoUpload from "@/components/VideoUpload";
import VideoTimeline from "@/components/VideoTimeline";
import QuickPreview from "@/components/QuickPreview";
import BeforeAfterComparison from "@/components/BeforeAfterComparison";
import MemeAssetLibrary from "@/components/MemeAssetLibrary";

// Helper functions
const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

const formatSec = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// Types
interface Segment {
  label: string;
  start: number;
  end: number;
}

interface Effect {
  id: string;
  name: string;
  hasStrength: boolean;
}

interface Asset {
  id: string;
  filename: string;
  kind: "audio" | "video" | "image";
  url?: string;
}

interface EffectChip {
  id: string;
  name: string;
  strength?: number;
}

interface AssetChip {
  id: string;
  filename: string;
  kind: "audio" | "video" | "image";
  url?: string;
}

interface EditOp {
  id: string;
  startSec: number;
  endSec: number;
  op:
    | "remove_silence"
    | "effect"
    | "overlay_audio"
    | "overlay_video"
    | "overlay_image"
    | "captions"
    | "trim"
    | "speed"
    | "color_grade";
  label: string;
  params: {
    strength?: number;
    volume?: number;
    scale?: number;
    minSilence?: number;
    thresholdDb?: number;
    [key: string]: unknown;
  };
  status: "planned" | "rendered";
}

type DraftId = "draft1" | "draft2" | "draft3";

const TOTAL_DURATION = 80;

const segments: Segment[] = [
  { label: "Hook", start: 0, end: 6 },
  { label: "Explanation", start: 6, end: 28 },
  { label: "Pause", start: 28, end: 34 },
  { label: "Peak", start: 34, end: 55 },
];

const effects: Effect[] = [
  { id: "punch-in", name: "Punch-in", hasStrength: true },
  { id: "shake", name: "Shake", hasStrength: true },
  { id: "glitch", name: "Glitch", hasStrength: true },
  { id: "blur", name: "Blur", hasStrength: true },
  { id: "lut-warm", name: "LUT Warm", hasStrength: false },
  { id: "lut-clean", name: "LUT Clean", hasStrength: false },
  { id: "bass-boost", name: "Bass Boost", hasStrength: true },
  { id: "whoosh", name: "Whoosh", hasStrength: false },
];

const memesPackAssets: Asset[] = [
  { id: "surprised", filename: "surprised.mp4", kind: "video" },
  { id: "sad-violin", filename: "sad_violin.mp4", kind: "video" },
];

const myUploadsAssets: Asset[] = [
  { id: "vine-boom", filename: "vine_boom.mp3", kind: "audio" },
  { id: "laugh-track", filename: "laugh_track.mp3", kind: "audio" },
];

export default function DirectorNotesPanel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(80);
  const [instruction, setInstruction] = useState("");
  const [effectChips, setEffectChips] = useState<EffectChip[]>([]);
  const [assetChips, setAssetChips] = useState<AssetChip[]>([]);
  const [activeDraft, setActiveDraft] = useState<DraftId>("draft1");
  const [draftPlans, setDraftPlans] = useState<Record<DraftId, EditOp[]>>({
    draft1: [],
    draft2: [],
    draft3: [],
  });
  const [editingOpId, setEditingOpId] = useState<string | null>(null);
  const [tempEditValues, setTempEditValues] = useState<{
    start: number;
    end: number;
    param: number;
  }>({ start: 0, end: 0, param: 0 });
  const [effectsSearch, setEffectsSearch] = useState("");
  const [assetsSearch, setAssetsSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<
    "all" | "effects" | "audio" | "video"
  >("all");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<{
    id: string;
    filepath: string;
    durationSec: number;
    thumbnail: string | null;
  } | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState("");
  const [renderedVideoPath, setRenderedVideoPath] = useState<string | null>(
    null,
  );

  // Asset selection feedback
  const [assetAddedFeedback, setAssetAddedFeedback] = useState<string | null>(
    null,
  );

  // Clear confirmation modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    silenceRanges: Array<{ start: number; end: number }>;
    segments: Array<{
      id: string;
      label: string;
      startSec: number;
      endSec: number;
    }>;
    characteristics: {
      totalSilenceDuration: number;
      silencePercentage: number;
      videoType: string;
      recommendations: string[];
    };
  } | null>(null);

  const currentPlan = draftPlans[activeDraft];

  const filteredEffects = effects.filter((effect) =>
    effect.name.toLowerCase().includes(effectsSearch.toLowerCase()),
  );

  const filteredMemesAssets = memesPackAssets.filter((asset) =>
    asset.filename.toLowerCase().includes(assetsSearch.toLowerCase()),
  );

  const filteredMyUploadsAssets = myUploadsAssets.filter((asset) =>
    asset.filename.toLowerCase().includes(assetsSearch.toLowerCase()),
  );

  const filteredPlan = currentPlan.filter((op: EditOp) => {
    if (planFilter === "all") return true;
    if (planFilter === "effects")
      return (
        op.op === "effect" ||
        op.op === "remove_silence" ||
        op.op === "color_grade"
      );
    if (planFilter === "audio") return op.op === "overlay_audio";
    if (planFilter === "video") return op.op === "overlay_video";
    return true;
  });

  const editingOp = editingOpId
    ? currentPlan.find((op: EditOp) => op.id === editingOpId)
    : null;

  // Initialize project on mount
  useEffect(() => {
    const initProject = async () => {
      try {
        // Check localStorage for existing projectId
        let storedProjectId = localStorage.getItem("cutpilot_projectId");

        if (!storedProjectId) {
          // Create new project
          const createResponse = await fetch("/api/project", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              totalDurationSec: TOTAL_DURATION,
              segments: segments.map((seg, idx) => ({
                id: `seg-${idx}`,
                label: seg.label,
                startSec: seg.start,
                endSec: seg.end,
              })),
            }),
          });

          if (!createResponse.ok) {
            console.error("Failed to create project");
            return;
          }

          const createData = await createResponse.json();
          storedProjectId = createData.projectId;
          if (storedProjectId) {
            localStorage.setItem("cutpilot_projectId", storedProjectId);
          }
        }

        setProjectId(storedProjectId);

        // Fetch project data
        const fetchResponse = await fetch(`/api/project?id=${storedProjectId}`);

        if (!fetchResponse.ok) {
          console.error("Failed to fetch project");
          return;
        }

        const projectData = await fetchResponse.json();

        // Load active draft and plans from localStorage
        const savedActiveDraft = localStorage.getItem("cutpilot_activeDraft");
        const savedDraft1 = localStorage.getItem("cutpilot_draft1Plan");
        const savedDraft2 = localStorage.getItem("cutpilot_draft2Plan");
        const savedDraft3 = localStorage.getItem("cutpilot_draft3Plan");

        setActiveDraft((savedActiveDraft as DraftId) || "draft1");
        setDraftPlans({
          draft1: savedDraft1 ? JSON.parse(savedDraft1) : [],
          draft2: savedDraft2 ? JSON.parse(savedDraft2) : [],
          draft3: savedDraft3 ? JSON.parse(savedDraft3) : [],
        });

        // Load uploaded video from localStorage
        const savedVideo = localStorage.getItem("cutpilot_uploadedVideo");
        if (savedVideo) {
          setUploadedVideo(JSON.parse(savedVideo));
        }

        // Load analysis from localStorage
        const savedAnalysis = localStorage.getItem("cutpilot_analysis");
        if (savedAnalysis) {
          setAnalysisResults(JSON.parse(savedAnalysis));
        }
      } catch (error) {
        console.error("Error initializing project:", error);
      }
    };

    initProject();
  }, []);

  const handleSegmentClick = (seg: Segment) => {
    setStartSec(seg.start);
    setEndSec(seg.end);
    setCurrentSec(seg.start);
  };

  const handleAddEffect = (effect: Effect) => {
    if (!effectChips.find((e: EffectChip) => e.id === effect.id)) {
      setEffectChips([
        ...effectChips,
        {
          id: effect.id,
          name: effect.name,
          strength: effect.hasStrength ? 35 : undefined,
        },
      ]);
    }
  };

  const handleRemoveEffect = (id: string) => {
    setEffectChips(effectChips.filter((e: EffectChip) => e.id !== id));
  };

  const handleEffectStrengthChange = (id: string, strength: number) => {
    setEffectChips(
      effectChips.map((e: EffectChip) =>
        e.id === id ? { ...e, strength } : e,
      ),
    );
  };

  const handleAddAsset = (asset: Asset) => {
    if (!assetChips.find((a: AssetChip) => a.id === asset.id)) {
      setAssetChips([
        ...assetChips,
        { id: asset.id, filename: asset.filename, kind: asset.kind },
      ]);
    }
  };

  const handleRemoveAsset = (id: string) => {
    setAssetChips(assetChips.filter((a: AssetChip) => a.id !== id));
  };

  // Auto-analyze video after upload
  const analyzeVideo = async (videoData: {
    filepath: string;
    durationSec: number;
  }) => {
    setIsAnalyzing(true);
    try {
      console.log("[UI] Starting video analysis...");
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoPath: videoData.filepath,
          duration: videoData.durationSec,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      console.log("[UI] Analysis complete:", data);

      setAnalysisResults(data.analysis);

      // Store in localStorage
      localStorage.setItem("cutpilot_analysis", JSON.stringify(data.analysis));
    } catch (error) {
      console.error("[UI] Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!projectId) {
      console.error("No project ID available");
      return;
    }

    setIsGenerating(true);

    try {
      // Build request matching PlanRequest schema
      const segmentsToUse =
        analysisResults?.segments ||
        segments.map((seg, idx) => ({
          id: `seg-${idx}`,
          label: seg.label,
          startSec: seg.start,
          endSec: seg.end,
        }));

      const requestBody: PlanRequest = {
        projectId,
        totalDurationSec: uploadedVideo?.durationSec || TOTAL_DURATION,
        selectedRange: {
          startSec,
          endSec,
        },
        instruction,
        segments: segmentsToUse,
        selectedEffects: effectChips,
        selectedAssets: assetChips,
        existingPlan: currentPlan.length > 0 ? currentPlan : undefined,
      };

      // Call plan API
      const planResponse = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!planResponse.ok) {
        const errorData = await planResponse.json();
        console.error("Plan generation failed:", errorData);
        return;
      }

      const planData = await planResponse.json();

      // Update draft plans with new plan
      const updatedPlans = {
        ...draftPlans,
        [activeDraft]: planData.plan,
      };
      setDraftPlans(updatedPlans);

      // Save to localStorage
      localStorage.setItem(
        `cutpilot_${activeDraft}Plan`,
        JSON.stringify(planData.plan),
      );

      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 2000);
    } catch (error) {
      console.error("Error generating plan:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRenderVideo = async () => {
    if (!uploadedVideo || currentPlan.length === 0) {
      alert("Please upload a video and generate a plan first");
      return;
    }

    setIsRendering(true);
    setRenderProgress(0);
    setRenderStatus("Starting render...");
    setRenderedVideoPath(null);

    try {
      // Start render job
      const renderResponse = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoPath: uploadedVideo.filepath,
          operations: currentPlan,
        }),
      });

      if (!renderResponse.ok) {
        const errorData = await renderResponse.json();
        throw new Error(errorData.error || "Render failed");
      }

      const { jobId } = await renderResponse.json();

      // Poll for progress
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/render?jobId=${jobId}`);
          if (!statusResponse.ok) {
            clearInterval(pollInterval);
            setIsRendering(false);
            setRenderStatus("Error fetching render status");
            return;
          }

          const status = await statusResponse.json();
          setRenderProgress(status.progress);
          setRenderStatus(status.currentOperation);

          if (status.status === "completed") {
            clearInterval(pollInterval);
            setIsRendering(false);
            setRenderedVideoPath(status.outputPath);
            setRenderStatus("Render complete!");
          } else if (status.status === "error") {
            clearInterval(pollInterval);
            setIsRendering(false);
            setRenderStatus(`Error: ${status.error}`);
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsRendering(false);
          setRenderStatus("Error polling render status");
        }
      }, 1000);
    } catch (error) {
      setIsRendering(false);
      setRenderStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleRemoveOp = (id: string) => {
    setDraftPlans({
      ...draftPlans,
      [activeDraft]: currentPlan.filter((op: EditOp) => op.id !== id),
    });
    if (editingOpId === id) {
      setEditingOpId(null);
    }
  };

  const handleStartEditOp = (op: EditOp) => {
    setEditingOpId(op.id);
    let paramValue = 0;
    if (op.params.strength !== undefined) paramValue = op.params.strength;
    else if (op.params.volume !== undefined)
      paramValue = op.params.volume * 100;
    else if (op.params.scale !== undefined) paramValue = op.params.scale * 100;
    setTempEditValues({
      start: op.startSec,
      end: op.endSec,
      param: paramValue,
    });
  };

  const handleSaveEditOp = (id: string) => {
    setDraftPlans({
      ...draftPlans,
      [activeDraft]: currentPlan.map((op: EditOp) => {
        if (op.id !== id) return op;
        const updated = {
          ...op,
          startSec: tempEditValues.start,
          endSec: tempEditValues.end,
        };
        if (op.params.strength !== undefined) {
          updated.params = {
            ...updated.params,
            strength: tempEditValues.param,
          };
        } else if (op.params.volume !== undefined) {
          updated.params = {
            ...updated.params,
            volume: tempEditValues.param / 100,
          };
        } else if (op.params.scale !== undefined) {
          updated.params = {
            ...updated.params,
            scale: tempEditValues.param / 100,
          };
        }
        return updated;
      }),
    });
    setEditingOpId(null);
  };

  const handleCancelEdit = () => {
    setEditingOpId(null);
  };

  const handleSwitchDraft = (draftId: DraftId) => {
    setActiveDraft(draftId);
    localStorage.setItem("cutpilot_activeDraft", draftId);
  };

  const handleClearAll = () => {
    // Clear all state
    setUploadedVideo(null);
    setRenderedVideoPath(null);
    setInstruction("");
    setAnalysisResults(null);
    setDraftPlans({ draft1: [], draft2: [], draft3: [] });
    setActiveDraft("draft1");
    setEffectChips([]);
    setAssetChips([]);
    setAssetAddedFeedback(null);

    // Clear localStorage
    localStorage.removeItem("cutpilot_uploadedVideo");
    localStorage.removeItem("cutpilot_draft1Plan");
    localStorage.removeItem("cutpilot_draft2Plan");
    localStorage.removeItem("cutpilot_draft3Plan");
    localStorage.removeItem("cutpilot_instruction");
    localStorage.removeItem("cutpilot_analysisResults");
    localStorage.removeItem("cutpilot_activeDraft");

    setShowClearConfirm(false);
  };

  const handleClearPlan = () => {
    setDraftPlans({ ...draftPlans, [activeDraft]: [] });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-8 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-amber-900">CutPilot</h1>
            <div className="flex gap-1 bg-white rounded-xl border border-orange-200 p-1.5 shadow-sm">
              {(["draft1", "draft2", "draft3"] as DraftId[]).map(
                (draftId, idx) => (
                  <button
                    key={draftId}
                    onClick={() => handleSwitchDraft(draftId)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center ${
                      activeDraft === draftId
                        ? "bg-amber-700 text-white shadow-sm"
                        : "text-neutral-600 hover:bg-orange-50"
                    }`}
                  >
                    Draft {idx + 1}
                    {draftPlans[draftId].length > 0 && (
                      <span className="ml-1.5 opacity-70">
                        ({draftPlans[draftId].length})
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              className="rounded-xl bg-amber-700 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all px-6 h-11 flex items-center"
              onClick={handleGeneratePlan}
              disabled={isGenerating || !projectId}
            >
              <Wand2 className="w-5 h-5 mr-2" />
              {isGenerating ? "Generating..." : "Generate Plan"}
            </Button>
            <Button
              className="rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-md hover:shadow-lg transition-all px-6 h-11 flex items-center"
              onClick={handleRenderVideo}
              disabled={
                isRendering || !uploadedVideo || currentPlan.length === 0
              }
            >
              <Play className="w-5 h-5 mr-2" />
              {isRendering ? "Rendering..." : "Render Video"}
            </Button>
            {(uploadedVideo || renderedVideoPath) && (
              <Button
                variant="outline"
                className="rounded-xl border-2 border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 px-4 h-11 flex items-center"
                onClick={() => setShowClearConfirm(true)}
                disabled={isRendering || isGenerating}
              >
                <X className="w-4 h-4 mr-2" />
                Clear & Start Over
              </Button>
            )}
            {saveIndicator && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 text-xs font-medium rounded-lg"
              >
                <Check className="w-3.5 h-3.5" />
                Saved
              </motion.div>
            )}
          </div>
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Clear Everything?
              </h3>
              <p className="text-gray-600 mb-6">
                This will delete your uploaded video, all drafts, and render
                progress. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Render Progress */}
        {isRendering && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-900">
                {renderStatus}
              </span>
              <span className="text-sm font-mono text-amber-700">
                {Math.round(renderProgress)}%
              </span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${renderProgress}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Rendered Video Result */}
        {renderedVideoPath && !isRendering && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Video rendered successfully!
                </span>
              </div>
              <a
                href={renderedVideoPath}
                download
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </motion.div>
        )}

        {/* Render Error */}
        {renderStatus.startsWith("Error:") && !isRendering && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                {renderStatus}
              </span>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-8 space-y-0">
            {/* Video Upload */}
            {!uploadedVideo && (
              <VideoUpload
                projectId={projectId}
                onUploadComplete={(videoData) => {
                  setUploadedVideo(videoData);
                  setEndSec(Math.floor(videoData.durationSec));
                  // Auto-analyze the uploaded video
                  analyzeVideo(videoData);
                }}
              />
            )}

            {/* Video Preview */}
            <Card className="rounded-2xl shadow-lg border-orange-200 bg-white">
              <CardContent className="p-8">
                <div className="aspect-video bg-neutral-800 rounded-xl flex items-center justify-center mb-4 relative">
                  {uploadedVideo ? (
                    <video
                      src={uploadedVideo.filepath}
                      className="w-full h-full rounded-xl"
                      controls
                      poster={uploadedVideo.thumbnail || undefined}
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Timeline Scrubber */}
                <div className="space-y-2">
                  <Slider
                    value={[currentSec]}
                    max={TOTAL_DURATION}
                    step={1}
                    onValueChange={(vals: number[]) => setCurrentSec(vals[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 font-mono">
                    <span>{formatSec(currentSec)}</span>
                    <span>{formatSec(TOTAL_DURATION)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Timeline Visualization */}
            {uploadedVideo && (
              <VideoTimeline
                videoPath={uploadedVideo.filepath}
                duration={uploadedVideo.durationSec}
                currentTime={currentSec}
                segments={analysisResults?.segments || []}
                silenceRanges={analysisResults?.silenceRanges || []}
                operations={currentPlan}
                onTimeUpdate={setCurrentSec}
                onPlayPause={setIsPlaying}
                isPlaying={isPlaying}
              />
            )}

            {/* Quick Preview */}
            {uploadedVideo && currentPlan.length > 0 && (
              <QuickPreview
                videoPath={uploadedVideo.filepath}
                duration={uploadedVideo.durationSec}
                operations={currentPlan}
              />
            )}

            {/* Before/After Comparison */}
            {uploadedVideo && (
              <BeforeAfterComparison
                originalVideoPath={uploadedVideo.filepath}
                editedVideoPath={renderedVideoPath}
              />
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-8 space-y-0">
            <Tabs defaultValue="notes" className="w-full">
              <TabsList className="w-full !h-auto grid grid-cols-3 bg-white border-2 border-orange-200 rounded-xl p-1 shadow-sm">
                <TabsTrigger
                  value="notes"
                  className="!h-auto rounded-lg data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 inline-flex items-center justify-center text-sm font-medium py-1.5 px-2"
                >
                  Director Notes
                </TabsTrigger>
                <TabsTrigger
                  value="planned"
                  className="!h-auto rounded-lg data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 inline-flex items-center justify-center text-sm font-medium py-1.5 px-1"
                >
                  Edit Plan
                </TabsTrigger>
                <TabsTrigger
                  value="assets"
                  className="!h-auto rounded-lg data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 inline-flex items-center justify-center text-sm font-medium py-1.5 px-2"
                >
                  Assets & Memes
                </TabsTrigger>
              </TabsList>

              {/* NOTES TAB */}
              <TabsContent value="notes" className="mt-8 space-y-0">
                <Card className="rounded-2xl shadow-lg border-orange-200 bg-white">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-lg font-semibold text-amber-900">
                      Director&apos;s Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-base font-medium text-amber-900">
                        Instruction
                      </label>
                      <Textarea
                        placeholder="00:12–00:18 punch-in + captions, add vine boom at 00:16"
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        className="min-h-32 rounded-xl resize-none bg-amber-50/30 border-orange-200 focus:bg-white text-base p-4"
                      />
                    </div>

                    <Separator className="bg-orange-200" />

                    {/* Chips */}
                    <div className="space-y-5">
                      {/* Timestamp Chip */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-amber-800">
                          Range:
                        </span>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge
                            variant="outline"
                            className="rounded-full px-4 py-1.5 text-sm font-mono bg-orange-100 border-orange-300 text-amber-800 font-medium h-8 flex items-center"
                          >
                            {formatSec(startSec)} – {formatSec(endSec)}
                          </Badge>
                        </motion.div>
                      </div>

                      {/* Effect Chips */}
                      {effectChips.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-sm font-medium text-amber-800">
                            Effects:
                          </span>
                          <div className="flex flex-wrap gap-2.5">
                            <AnimatePresence>
                              {effectChips.map((effect) => (
                                <motion.div
                                  key={effect.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Badge className="rounded-full px-4 py-1.5 text-sm flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-600 text-white shadow-sm h-8">
                                    <span>{effect.name}</span>
                                    {effect.strength !== undefined && (
                                      <span className="opacity-80">
                                        {effect.strength}%
                                      </span>
                                    )}
                                    <button
                                      onClick={() =>
                                        handleRemoveEffect(effect.id)
                                      }
                                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {/* Asset Chips */}
                      {assetChips.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-sm font-medium text-amber-800">
                            Assets:
                          </span>
                          <div className="flex flex-wrap gap-2.5">
                            <AnimatePresence>
                              {assetChips.map((asset) => (
                                <motion.div
                                  key={asset.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Badge className="rounded-full px-3 py-1 text-xs flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white h-7">
                                    {asset.kind === "audio" ? (
                                      <Music className="w-3 h-3" />
                                    ) : (
                                      <ImageIcon className="w-3 h-3" />
                                    )}
                                    <span>{asset.filename}</span>
                                    <button
                                      onClick={() =>
                                        handleRemoveAsset(asset.id)
                                      }
                                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PLANNED CHANGES TAB */}
              <TabsContent value="planned" className="mt-8 space-y-0">
                {currentPlan.length > 0 ? (
                  <div className="flex gap-4">
                    {/* Left Side - List */}
                    <div
                      className={`space-y-5 transition-all ${editingOpId ? "flex-1" : "w-full"}`}
                    >
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-amber-900">
                          Planned Changes
                        </h3>
                        <div className="flex items-center gap-2">
                          <select
                            value={planFilter}
                            onChange={(e) =>
                              setPlanFilter(e.target.value as typeof planFilter)
                            }
                            className="h-9 px-4 text-sm rounded-xl border-2 border-orange-200 bg-white text-neutral-700 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400 flex items-center"
                          >
                            <option value="all">All</option>
                            <option value="effects">Effects</option>
                            <option value="audio">Audio</option>
                            <option value="video">Video</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-4 text-sm hover:bg-red-50 hover:text-red-600 rounded-xl flex items-center justify-center"
                            onClick={handleClearPlan}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>

                      {/* Cards */}
                      <div className="space-y-4">
                        <AnimatePresence>
                          {filteredPlan.map((op) => {
                            const isSelected = editingOpId === op.id;
                            return (
                              <motion.div
                                key={op.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className={`border-2 rounded-2xl p-5 bg-white shadow-md cursor-pointer transition-all hover:shadow-lg ${
                                  isSelected
                                    ? "border-orange-400 ring-2 ring-amber-200 bg-amber-50/30"
                                    : "border-orange-200 hover:border-amber-300"
                                }`}
                                onClick={() =>
                                  !isSelected && handleStartEditOp(op)
                                }
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <span className="text-base font-bold text-amber-900">
                                        {op.label}
                                      </span>
                                      <Badge
                                        variant={
                                          op.status === "rendered"
                                            ? "default"
                                            : "secondary"
                                        }
                                        className="text-xs px-2.5 py-0.5 h-6 rounded-full bg-amber-100 text-amber-700 border-0 font-medium flex items-center"
                                      >
                                        {op.status}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-orange-700 font-mono">
                                      {formatSec(op.startSec)}–
                                      {formatSec(op.endSec)}
                                      {op.params.strength !== undefined &&
                                        ` • Strength ${op.params.strength}%`}
                                      {op.params.volume !== undefined &&
                                        ` • Volume ${Math.round(op.params.volume * 100)}%`}
                                      {op.params.scale !== undefined &&
                                        ` • Scale ${op.params.scale.toFixed(1)}x`}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-amber-100 rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEditOp(op);
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveOp(op.id);
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>

                      {filteredPlan.length === 0 && (
                        <div className="flex items-center justify-center py-20">
                          <p className="text-base text-amber-700 font-medium">
                            No changes match the current filter.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Side - Inspector */}
                    <AnimatePresence>
                      {editingOpId && editingOp && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="w-80 shrink-0"
                        >
                          <Card className="rounded-2xl shadow-lg border-orange-200 bg-white sticky top-6">
                            <CardHeader className="pb-5">
                              <div className="flex items-start justify-between gap-3">
                                <CardTitle className="text-lg font-bold text-amber-900">
                                  Inspector
                                </CardTitle>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-neutral-100 rounded-lg"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                              <div className="space-y-2">
                                <p className="text-base font-bold text-amber-900">
                                  {editingOp.label}
                                </p>
                                <Badge
                                  variant={
                                    editingOp.status === "rendered"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs px-2.5 py-0.5 h-6 rounded-full bg-amber-100 text-amber-700 border-0 font-medium flex items-center"
                                >
                                  {editingOp.status}
                                </Badge>
                              </div>

                              <Separator className="bg-orange-200" />

                              <div className="space-y-5">
                                <div className="space-y-3">
                                  <label className="text-sm font-semibold text-amber-800">
                                    Start (sec)
                                  </label>
                                  <Input
                                    type="number"
                                    value={tempEditValues.start}
                                    onChange={(e) =>
                                      setTempEditValues({
                                        ...tempEditValues,
                                        start: clamp(
                                          Number(e.target.value),
                                          0,
                                          tempEditValues.end - 1,
                                        ),
                                      })
                                    }
                                    className="rounded-xl h-10 text-base border-orange-200 bg-amber-50/30"
                                    min={0}
                                    max={tempEditValues.end - 1}
                                  />
                                </div>
                                <div className="space-y-3">
                                  <label className="text-sm font-semibold text-amber-800">
                                    End (sec)
                                  </label>
                                  <Input
                                    type="number"
                                    value={tempEditValues.end}
                                    onChange={(e) =>
                                      setTempEditValues({
                                        ...tempEditValues,
                                        end: clamp(
                                          Number(e.target.value),
                                          tempEditValues.start + 1,
                                          TOTAL_DURATION,
                                        ),
                                      })
                                    }
                                    className="rounded-xl h-10 text-base border-orange-200 bg-amber-50/30"
                                    min={tempEditValues.start + 1}
                                    max={TOTAL_DURATION}
                                  />
                                </div>

                                {(editingOp.params.strength !== undefined ||
                                  editingOp.params.volume !== undefined ||
                                  editingOp.params.scale !== undefined) && (
                                  <div className="space-y-3">
                                    <label className="text-sm font-semibold text-amber-800">
                                      {editingOp.params.strength !==
                                        undefined &&
                                        `Strength: ${tempEditValues.param}%`}
                                      {editingOp.params.volume !== undefined &&
                                        `Volume: ${tempEditValues.param}%`}
                                      {editingOp.params.scale !== undefined &&
                                        `Scale: ${(tempEditValues.param / 100).toFixed(2)}x`}
                                    </label>
                                    <Slider
                                      value={[tempEditValues.param]}
                                      max={100}
                                      step={1}
                                      onValueChange={(vals) =>
                                        setTempEditValues({
                                          ...tempEditValues,
                                          param: vals[0],
                                        })
                                      }
                                      className="w-full"
                                    />
                                  </div>
                                )}
                              </div>

                              <Separator className="bg-orange-200" />

                              <div className="flex gap-3">
                                <Button
                                  className="flex-1 rounded-xl bg-amber-700 hover:bg-amber-600 text-white shadow-md h-11 flex items-center justify-center"
                                  onClick={() => handleSaveEditOp(editingOpId)}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1 rounded-xl hover:bg-amber-50 border-orange-200 h-11 flex items-center justify-center"
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 px-6 bg-white rounded-2xl border-2 border-dashed border-orange-300">
                    <Layers className="w-16 h-16 text-amber-300 mb-4" />
                    <p className="text-lg text-amber-800 font-semibold mb-2">
                      No planned changes yet
                    </p>
                    <p className="text-sm text-orange-600">
                      Generate a plan to get started
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ASSETS & MEMES TAB */}
              <TabsContent value="assets" className="mt-8 space-y-0">
                {/* Feedback notification */}
                <AnimatePresence>
                  {assetAddedFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3"
                    >
                      <Check className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">
                          {assetAddedFeedback}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Check Director Notes tab and edit the timestamp!
                        </p>
                      </div>
                      <button
                        onClick={() => setAssetAddedFeedback(null)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <MemeAssetLibrary
                  onSelectAsset={(asset) => {
                    // Add selected meme/asset to instruction with path info
                    let assetText = "";
                    if (asset.type === "image") {
                      assetText = `\nAdd image "${asset.filename}" (path: ${asset.url}) at 0:00 - 0:10`;
                    } else if (asset.type === "video") {
                      assetText = `\nAdd video overlay "${asset.filename}" (path: ${asset.url}) at 0:00 - 0:10`;
                    } else if (asset.type === "audio") {
                      assetText = `\nAdd audio "${asset.filename}" (path: ${asset.url}) at 0:00`;
                    } else {
                      assetText = `\nAdd ${asset.type} "${asset.filename}" (path: ${asset.url}) at 0:00`;
                    }
                    setInstruction((prev) => prev + assetText);

                    // Also add to asset chips for AI context (includes images now!)
                    if (
                      !assetChips.find((a) => a.filename === asset.filename)
                    ) {
                      const assetChip: AssetChip = {
                        id: asset.id,
                        filename: asset.filename,
                        kind: asset.type as "audio" | "video" | "image",
                        url: asset.url,
                      };
                      setAssetChips((prev) => [...prev, assetChip]);
                    }

                    // Show visual feedback
                    setAssetAddedFeedback(
                      `Added "${asset.filename}" to your edit instructions!`,
                    );
                    setTimeout(() => setAssetAddedFeedback(null), 5000);

                    console.log("Selected asset:", asset);
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
