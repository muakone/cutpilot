"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Upload,
  Search,
  Video,
  Music,
  Image as ImageIcon,
  Trash2,
  Plus,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface Asset {
  id: string;
  filename: string;
  type: "video" | "audio" | "image";
  url: string;
  category: "meme" | "upload" | "preset";
  tags: string[];
  thumbnail?: string;
  duration?: number;
  size: number;
  uploadedAt: Date;
}

interface MemeAssetLibraryProps {
  onSelectAsset: (asset: Asset) => void;
}

// Predefined meme assets
// NOTE: For demo purposes, these use placeholder paths
// In production, replace with actual hosted images or upload real meme images to /public/memes/
const PRESET_MEMES: Asset[] = [
  {
    id: "thinking-emoji",
    filename: "thinking.png",
    type: "image",
    url: "https://em-content.zobj.net/source/apple/391/thinking-face_1f914.png",
    category: "preset",
    tags: ["thinking", "hmm", "reaction"],
    size: 25000,
    uploadedAt: new Date(),
  },
  {
    id: "fire-emoji",
    filename: "fire.png",
    type: "image",
    url: "https://em-content.zobj.net/source/apple/391/fire_1f525.png",
    category: "preset",
    tags: ["fire", "lit", "hot"],
    size: 25000,
    uploadedAt: new Date(),
  },
  {
    id: "crying-laugh",
    filename: "crying_laugh.png",
    type: "image",
    url: "https://em-content.zobj.net/source/apple/391/face-with-tears-of-joy_1f602.png",
    category: "preset",
    tags: ["funny", "lol", "crying"],
    size: 25000,
    uploadedAt: new Date(),
  },
  {
    id: "skull-emoji",
    filename: "skull.png",
    type: "image",
    url: "https://em-content.zobj.net/source/apple/391/skull_1f480.png",
    category: "preset",
    tags: ["dead", "skull", "funny"],
    size: 20000,
    uploadedAt: new Date(),
  },
  // NOTE: Audio/video assets below require files in public/memes/ folder
  // For demo: Replace URLs with your own audio files or use user uploads
  {
    id: "applause",
    filename: "applause.mp3",
    type: "audio",
    url: "https://assets.mixkit.co/active_storage/sfx/2568/2568.wav", // Free applause sound
    category: "preset",
    tags: ["clap", "applause", "celebration"],
    duration: 3,
    size: 80000,
    uploadedAt: new Date(),
  },
  {
    id: "dramatic-boom",
    filename: "dramatic_boom.mp3",
    type: "audio",
    url: "https://assets.mixkit.co/active_storage/sfx/2027/2027.wav", // Free boom sound
    category: "preset",
    tags: ["boom", "impact", "dramatic"],
    duration: 2,
    size: 50000,
    uploadedAt: new Date(),
  },
  {
    id: "whoosh",
    filename: "whoosh.mp3",
    type: "audio",
    url: "https://assets.mixkit.co/active_storage/sfx/2890/2890.wav", // Free whoosh sound
    category: "preset",
    tags: ["whoosh", "transition", "swoosh"],
    duration: 1,
    size: 30000,
    uploadedAt: new Date(),
  },
  {
    id: "vine-boom",
    filename: "vine_boom.mp3",
    type: "audio",
    url: "https://assets.mixkit.co/active_storage/sfx/2018/2018.wav", // Free boom/hit sound
    category: "preset",
    tags: ["sound", "effect", "boom"],
    duration: 2,
    size: 50000,
    uploadedAt: new Date(),
  },
  {
    id: "laugh-track",
    filename: "laugh_track.mp3",
    type: "audio",
    url: "https://assets.mixkit.co/active_storage/sfx/2534/2534.wav", // Free audience laugh
    category: "preset",
    tags: ["laugh", "comedy", "audience"],
    duration: 4,
    size: 90000,
    uploadedAt: new Date(),
  },
  {
    id: "suspense",
    filename: "suspense.mp3",
    type: "audio",
    url: "https://assets.mixkit.co/active_storage/sfx/2869/2869.wav", // Free suspense sound
    category: "preset",
    tags: ["suspense", "tension", "dramatic"],
    duration: 3,
    size: 70000,
    uploadedAt: new Date(),
  },
  {
    id: "cheer",
    filename: "cheer.mp3",
    type: "audio",
    url: "https://assets.mixkit.co/active_storage/sfx/2019/2019.wav", // Free crowd cheer
    category: "preset",
    tags: ["cheer", "celebration", "victory"],
    duration: 3,
    size: 85000,
    uploadedAt: new Date(),
  },
  {
    id: "error-beep",
    filename: "error_beep.mp3",
    type: "audio",
    url: "https://assets.mixkit.co/active_storage/sfx/2869/2869.wav", // Free error sound
    category: "preset",
    tags: ["error", "fail", "wrong"],
    duration: 1,
    size: 25000,
    uploadedAt: new Date(),
  },
  {
    id: "thinking-emoji",
    filename: "thinking.mp4",
    type: "video",
    url: "https://media.tenor.com/G1LvT1n5NmkAAAAM/thinking-think.gif", // Thinking emoji animation
    category: "preset",
    tags: ["thinking", "hmm", "wonder"],
    duration: 2,
    thumbnail: "/memes/thinking_thumb.jpg",
    size: 500000,
    uploadedAt: new Date(),
  },
  {
    id: "fire-emoji",
    filename: "fire.mp4",
    type: "video",
    url: "https://media.tenor.com/MzWWj_RqZY0AAAAM/fire-joypixels.gif", // Fire emoji animation
    category: "preset",
    tags: ["fire", "lit", "hot"],
    duration: 2,
    thumbnail: "/memes/fire_thumb.jpg",
    size: 450000,
    uploadedAt: new Date(),
  },
  {
    id: "skull-emoji",
    filename: "skull.mp4",
    type: "video",
    url: "https://media.tenor.com/JTCLGysdWHEAAAAM/skull-emoji.gif", // Skull emoji (dead/lol)
    category: "preset",
    tags: ["skull", "dead", "lol"],
    duration: 2,
    thumbnail: "/memes/skull_thumb.jpg",
    size: 400000,
    uploadedAt: new Date(),
  },
  {
    id: "crying-emoji",
    filename: "crying.mp4",
    type: "video",
    url: "https://media.tenor.com/NHYLfQqCF7EAAAAM/crying-emoji-emoticon.gif", // Crying laughing emoji
    category: "preset",
    tags: ["crying", "laughing", "funny"],
    duration: 2,
    thumbnail: "/memes/crying_thumb.jpg",
    size: 480000,
    uploadedAt: new Date(),
  },
  {
    id: "record-scratch",
    filename: "record_scratch.mp3",
    type: "audio",
    url: "/memes/record_scratch.mp3",
    category: "preset",
    tags: ["sound", "freeze", "pause"],
    duration: 3,
    size: 80000,
    uploadedAt: new Date(),
  },
  {
    id: "sad-violin",
    filename: "sad_violin.mp3",
    type: "audio",
    url: "/memes/sad_violin.mp3",
    category: "preset",
    tags: ["sad", "dramatic", "music"],
    duration: 10,
    size: 300000,
    uploadedAt: new Date(),
  },
  {
    id: "air-horn",
    filename: "air_horn.mp3",
    type: "audio",
    url: "/memes/air_horn.mp3",
    category: "preset",
    tags: ["loud", "horn", "hype"],
    duration: 2,
    size: 60000,
    uploadedAt: new Date(),
  },
];

export default function MemeAssetLibrary({
  onSelectAsset,
}: MemeAssetLibraryProps) {
  const [uploadedAssets, setUploadedAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "video" | "audio" | "image"
  >("all");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load uploaded assets from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cutpilot_uploadedAssets");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert uploadedAt from string back to Date
        const assets = parsed.map((asset: Asset) => ({
          ...asset,
          uploadedAt: new Date(asset.uploadedAt),
        }));
        setUploadedAssets(assets);
      }
    } catch (error) {
      console.error("Failed to load uploaded assets:", error);
    }
  }, []);

  // Save uploaded assets to localStorage whenever they change
  // Note: Images are stored as base64, so localStorage limit is ~5MB per domain
  // For production, consider uploading to server instead
  useEffect(() => {
    try {
      if (uploadedAssets.length > 0) {
        localStorage.setItem(
          "cutpilot_uploadedAssets",
          JSON.stringify(uploadedAssets),
        );
      } else {
        // Clear localStorage if no uploaded assets
        localStorage.removeItem("cutpilot_uploadedAssets");
      }
    } catch (error) {
      console.error("Failed to save uploaded assets:", error);
      // If localStorage is full, alert the user
      if (error instanceof Error && error.name === "QuotaExceededError") {
        alert("Storage limit reached! Please delete some uploaded assets.");
      }
    }
  }, [uploadedAssets]);

  const allAssets = [...PRESET_MEMES, ...uploadedAssets];

  const filteredAssets = allAssets.filter((asset) => {
    const matchesSearch =
      asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesCategory =
      selectedCategory === "all" || asset.type === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Determine type
        let type: "video" | "audio" | "image" = "video";
        if (file.type.startsWith("audio/")) type = "audio";
        else if (file.type.startsWith("image/")) type = "image";

        // For images, convert to base64 for persistence
        let url: string;
        if (type === "image") {
          url = await fileToBase64(file);
        } else {
          // For video/audio, use blob URL (won't persist across sessions)
          url = URL.createObjectURL(file);
        }

        // Create asset object
        const newAsset: Asset = {
          id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename: file.name,
          type,
          url,
          category: "upload",
          tags: [],
          size: file.size,
          uploadedAt: new Date(),
        };

        // Generate thumbnail for video
        if (type === "video") {
          const thumbnail = await generateVideoThumbnail(url);
          newAsset.thumbnail = thumbnail;
        }

        setUploadedAssets((prev) => [...prev, newAsset]);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = videoUrl;
      video.crossOrigin = "anonymous";
      video.currentTime = 1;

      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          resolve(canvas.toDataURL("image/jpeg"));
        }
      };
    });
  };

  const handleDeleteAsset = (assetId: string) => {
    setUploadedAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5" />;
      case "audio":
        return <Music className="w-5 h-5" />;
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      default:
        return <Video className="w-5 h-5" />;
    }
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Meme & Asset Library
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Add popular memes, sound effects, and overlays to your video
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Upload */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search memes, sounds, effects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-purple-600 hover:bg-purple-500"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*,image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Category Tabs */}
        <Tabs
          value={selectedCategory}
          onValueChange={(v) =>
            setSelectedCategory(v as "all" | "video" | "audio" | "image")
          }
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
              <AnimatePresence>
                {filteredAssets.map((asset) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group"
                  >
                    <Card
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        console.log("Card clicked, asset:", asset);
                        onSelectAsset(asset);
                      }}
                    >
                      <div className="p-3 space-y-2">
                        {/* Thumbnail/Icon */}
                        <div className="relative aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {asset.type === "video" && asset.thumbnail ? (
                            <img
                              src={asset.thumbnail}
                              alt={asset.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : asset.type === "image" ? (
                            <img
                              src={asset.url}
                              alt={asset.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400">
                              {getAssetIcon(asset.type)}
                            </div>
                          )}

                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="w-8 h-8 text-white" />
                          </div>

                          {/* Type badge */}
                          <Badge className="absolute top-2 right-2 text-xs">
                            {asset.type}
                          </Badge>

                          {/* Duration for audio/video */}
                          {asset.duration && (
                            <Badge className="absolute bottom-2 right-2 text-xs bg-black/60">
                              {asset.duration}s
                            </Badge>
                          )}
                        </div>

                        {/* Info */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {asset.filename}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatFileSize(asset.size)}</span>
                            {asset.category === "preset" && (
                              <Badge variant="outline" className="text-xs">
                                Preset
                              </Badge>
                            )}
                          </div>

                          {/* Tags */}
                          {asset.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {asset.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px] px-1 py-0"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete button for uploaded assets */}
                      {asset.category === "upload" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAsset(asset.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredAssets.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No assets found</p>
                <p className="text-xs mt-1">
                  Try a different search or upload your own
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-gray-600">
          <span>{filteredAssets.length} assets available</span>
          <span>{uploadedAssets.length} uploaded</span>
        </div>
      </CardContent>
    </Card>
  );
}
