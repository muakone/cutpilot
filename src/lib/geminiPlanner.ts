import type { PlanRequest } from "./planContracts";

/**
 * Builds a prompt for Gemini to generate an edit plan
 */
export function buildPlannerPrompt(req: PlanRequest): string {
  const effectsList = req.selectedEffects
    .map((e) => `${e.name}${e.strength ? ` (strength: ${e.strength}%)` : ""}`)
    .join(", ");
  const assetsList = req.selectedAssets
    .map((a) => {
      if (a.url) {
        // Include URL for images (especially base64)
        return `${a.filename} (${a.kind}, url: ${a.url.substring(0, 100)}${a.url.length > 100 ? "..." : ""})`;
      }
      return `${a.filename} (${a.kind})`;
    })
    .join(", ");
  const segmentsList = req.segments
    .map((s) => `${s.label}: ${s.startSec}s-${s.endSec}s`)
    .join(", ");

  return `You are a video editing assistant. Generate an edit plan as JSON ONLY. No markdown, no explanation, just valid JSON.

**Context:**
- Total video duration: ${req.totalDurationSec}s
- Selected range: ${req.selectedRange.startSec}s to ${req.selectedRange.endSec}s
- Segments: ${segmentsList || "none"}
- User instruction: "${req.instruction}"
- Selected effects: ${effectsList || "none"}
- Selected assets: ${assetsList || "none"}

**Output Format:**
Return ONLY a JSON object matching this structure:
{
  "plan": [
    {
      "id": "op1",
      "startSec": 0,
      "endSec": 10,
      "op": "remove_silence",
      "label": "Remove Silence",
      "params": { "minSilence": 0.6, "thresholdDb": -30 },
      "status": "planned"
    }
  ],
  "notes": "Optional notes about the plan"
}

**Available Operations:**

1. **remove_silence**: Remove silent parts from video
   - params: {"minSilence": 0.6, "thresholdDb": -30}

2. **effect**: Apply visual/audio effects
   - Visual effects: "punch-in" (zoom), "shake", "blur", "glitch"
   - Audio effects: "bass-boost"
   - params: {"strength": 50} (0-100)

3. **captions**: Add text overlays with animations
   - params: {
       "text": "Your text here",
       "position": "top" | "center" | "bottom",
       "animation": "fade" | "none",
       "fontSize": 72,
       "fontColor": "white",
       "bgColor": "black@0.7"
     }
   - Use this when user mentions: text, caption, subtitle, title, overlay text
   - Animation options: "fade" (smooth fade in/out) or "none" (instant)
   - Note: Complex slide animations removed for FFmpeg compatibility

4. **trim**: Keep only specific timeframe (cut out rest)
   - Use this when user wants to: cut, trim, keep only a portion, remove a section
   - startSec/endSec define what to KEEP

5. **speed**: Change video speed
   - params: {"speed": 2.0} // 0.5=half speed (slow-mo), 2.0=double speed
   - Use this when user mentions: slow motion, slow-mo, fast forward, speed up, slow down

6. **overlay_audio**: Add background music/sound effects
   - params: {
       "audioPath": "/uploads/sound.mp3" or URL from selectedAssets,
       "volume": 0.9 (0.0-1.0, default 0.5),
       "loop": false (boolean, whether to loop audio)
     }
   - Use this when user mentions: sound effect, audio, music, add sound, play sound
   - Check selectedAssets for matching audio files (kind="audio")
   - Examples: "add applause sound at 0:15", "play dramatic boom at 0:30"
   - Duration: use startSec/endSec for when audio should play

7. **overlay_video**: Add video meme/overlay/reaction
   - params: {
       "videoPath": "/uploads/meme.mp4" or URL from selectedAssets,
       "position": "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center",
       "scale": 0.3 (0.2-0.5 for small overlays, default 0.3)
     }
   - Use this when user mentions: video meme, emoji, reaction, add meme, video overlay
   - Check selectedAssets for matching video files (kind="video")
   - Examples: "add fire emoji at 0:20", "put thinking emoji in corner at 0:10"
   - Duration: use startSec/endSec for when video should display

8. **color_grade**: Apply color grading/visual style
   - params: {
       "preset": "warm" | "cool" | "vintage" | "cinematic" | "vibrant" | "faded" | "high-contrast" | "black-and-white",
       "intensity": 100 (0-100, default 100)
     }
   - Use this when user mentions: color, look, style, warmer, cooler, vintage, cinematic, saturated, dramatic
   - Examples: "make it warmer", "add vintage look", "more vibrant", "black and white"

9. **overlay_image**: Add image/meme overlay 
   - params: {
       "imagePath": "/uploads/barcode.png",
       "position": "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center",
       "scale": 0.3
     }
   - Use when user mentions: image, meme, overlay image, add [filename]
   - Parse the filename from user instruction and construct path as "/uploads/[filename]"
   - Position options: top-right (default), top-left, bottom-right, bottom-left, center
   - Scale: 0.1 (small) to 1.0 (full size), default 0.3

**Time Format Parsing - CRITICAL:**
ALWAYS convert time ranges to seconds. Common patterns:

1. **MM:SS format** (colon separates minutes and seconds):
   - "0:00" = 0 seconds (NOT 0.0)
   - "0:05" = 5 seconds (NOT 0.05 or 0.005)
   - "0:45" = 45 seconds (NOT 0.45 or 0.001)
   - "1:30" = 90 seconds (1*60 + 30)
   - "4:00" = 240 seconds (4*60)
   - "5:30" = 330 seconds (5*60 + 30)
   - "10:15" = 615 seconds (10*60 + 15)

2. **Time ranges** with dash or "to":
   - "0:00 - 0:45" = startSec: 0, endSec: 45
   - "at 0:10 - 0:30" = startSec: 10, endSec: 30
   - "from 1:00 to 1:15" = startSec: 60, endSec: 75
   - "4:00-5:30" = startSec: 240, endSec: 330

3. **Plain seconds** (no colon):
   - "5" or "5s" or "5 seconds" = 5
   - "30" = 30
   - "180" = 180

4. **Duration phrases**:
   - "for 3 seconds" = duration of 3 (calculate endSec = startSec + 3)
   - "for 10 seconds starting at 0:20" = startSec: 20, endSec: 30

**Rules:**
1. **DO NOT** include "remove_silence" by default - only add it if user explicitly requests silence removal in their instruction.
2. Add one "effect" operation per selected effect with the effect name as label and {"strength": <value>} in params.
3. Add captions whenever user requests text overlays, titles, subtitles, or mentions specific text to show.
   - Parse position from context: "at the top" → position: "top", "bottom" → "bottom", "center" → "center"
   - Use "fade" animation by default for smooth appearance
   - Extract the exact text user wants to display
4. Add overlay_image operations when user mentions adding/overlaying images:
   - CRITICAL: Extract imagePath from instruction FIRST
   - Look for pattern: (path: URL) or just a URL in the instruction
   - **CRITICAL TIME PARSING:** "0:00 - 0:45" means startSec: 0, endSec: 45 (NOT 0.001!)
   - Always convert MM:SS to seconds: "0:45" = 45, "1:30" = 90, "4:00" = 240
   - Default position: "top-right", scale: 0.3
   - Example 1: "Add image thinking.png (path: https://example.com/emoji.png) at 0:00 - 0:45"
     → Create overlay_image with imagePath: "https://example.com/emoji.png", startSec: 0, endSec: 45
   - Example 2: "overlay logo at 10 seconds for 5 seconds" + selectedAssets has {filename: "logo.png", url: "data:image/..."}
     → Create overlay_image with imagePath from selectedAssets.url, startSec: 10, endSec: 15
   - If selectedAssets has matching image, prefer its URL over instruction URL
5. Add color_grade operations when user mentions color adjustments, looks, or visual styles:
   - Keywords: "make it warmer/cooler", "add vintage look", "cinematic", "vibrant", "high contrast", "black and white"
   - Available presets: warm, cool, vintage, cinematic, vibrant, faded, high-contrast, black-and-white
   - Default intensity: 100 (fully applied), can be 0-100
   - Example: "make it warmer from 0:10 to 0:30" → color_grade with preset: "warm"
   - Can apply to specific time ranges or entire video
6. Add overlay_audio operations when user mentions sound effects or audio:
   - Keywords: "sound effect", "audio", "music", "add sound"
   - Check selectedAssets[] for audio files and use their URLs
   - Include audioPath from selectedAssets[].url
   - Default volume: 0.7 (0-1 range)
7. Add overlay_video operations when user mentions video memes, emojis, or reactions:
   - Keywords: "add meme", "video overlay", "emoji", "reaction", "add video"
   - Check selectedAssets[] for video files and use their URLs
   - Include videoPath from selectedAssets[].url
   - Position options: top-left, top-right, bottom-left, bottom-right, center
   - Scale: 0.2-0.5 for small overlays (0.3 default)

**SMART EDITING INTELLIGENCE:**
- If instruction mentions "make it engaging" or "make it viral" or "optimize": Add captions + color grading + trim silence
- If instruction says "add captions" or "subtitle" without specific text: Generate auto-caption operations for speech segments with placeholder text "[Auto-generated caption]"
- If video has long silent parts (>2s) and user says "clean up" or "polish": Suggest remove_silence
- If user mentions "funny" or "comedy": Consider adding sound effects at pauses
- If user mentions "professional" or "cinematic": Add color_grade with "cinematic" preset
- If user says "social media" or "TikTok" or "Reels": Add captions + vibrant color grading
- For short videos (<30s): More aggressive edits, faster pacing
- For longer videos (>2min): Be more selective, focus on key moments

**Additional Rules:**
8. Add trim operations when user wants to cut/keep specific timeframes.
9. Add speed operations when user mentions slow-mo, fast forward, or speed changes.
10. When user mentions "punch" or "punch feature" or "zoom in", use effect operation with label "Punch-In".
10. Use the selected range (${req.selectedRange.startSec}s-${req.selectedRange.endSec}s) as default start/end unless instruction specifies different times.
11. Each operation must have a unique short id (e.g., "op1", "op2", "img1", "color1", "audio1", "cap1", "cap2").
12. Valid op types: "remove_silence", "effect", "overlay_audio", "overlay_video", "overlay_image", "captions", "trim", "speed", "color_grade".
13. Keep the plan under 20 operations (prioritize most impactful edits).
14. All operations must have status="planned".
15. Return ONLY the JSON object, no markdown code blocks, no additional text.
16. BE CREATIVE: Use the full toolkit to make videos engaging. Don't just do the bare minimum!

**Example for image overlay:**
User says: 'Add image "thinking.png" (path: https://em-content.zobj.net/source/apple/391/thinking-face_1f914.png) at 0:00 - 0:45'
Your output should include:
{
  "id": "img1",
  "startSec": 0,
  "endSec": 45,
  "op": "overlay_image",
  "label": "Image: thinking.png",
  "params": {
    "imagePath": "https://em-content.zobj.net/source/apple/391/thinking-face_1f914.png",
    "position": "top-right"
  },
  "status": "planned"
}

**Example for captions:**
User says: "Add a caption 'Hello World' at 5 seconds at the top"
Your output should include:
{
  "id": "caption1",
  "startSec": 5,
  "endSec": 7,
  "op": "captions",
  "label": "Caption: Hello World",
  "params": {
    "text": "Hello World",
    "position": "top",
    "animation": "fade"
  },
  "status": "planned"
}

**Example for CRITICAL time parsing (emoji/meme overlay):**
User says: "Add image thinking.png (path: https://em-content.zobj.net/emoji.png) at 0:00 - 0:45"
CORRECT parsing:
{
  "id": "img1",
  "startSec": 0,      ← "0:00" = 0 seconds
  "endSec": 45,       ← "0:45" = 45 seconds (NOT 0.45 or 0.001!)
  "op": "overlay_image",
  "label": "Image: thinking.png",
  "params": {
    "imagePath": "https://em-content.zobj.net/emoji.png",
    "position": "top-right"
  },
  "status": "planned"
}

**Example for image overlay:**
User says: "Add image mylogo.png (path: data:image/png;base64,iVBORw0KG...) at 4:00 - 5:30"
AND selectedAssets includes: {filename: "mylogo.png", kind: "image", url: "data:image/png;base64,iVBORw0KG..."}
Your output should include:
{
  "id": "img1",
  "startSec": 240,
  "endSec": 330,
  "op": "overlay_image",
  "label": "Image: mylogo.png",
  "params": {
    "imagePath": "data:image/png;base64,iVBORw0KG...",
    "position": "top-right",
    "scale": 0.3
  },
  "status": "planned"
}
IMPORTANT: Extract the FULL imagePath from instruction (path: ...) or from selectedAssets[].url. Do NOT truncate base64 data URLs!

**Example for color grading:**
User says: "make it warmer from 0:10 to 0:30"
Your output should include:
{
  "id": "color1",
  "startSec": 10,
  "endSec": 30,
  "op": "color_grade",
  "label": "Color: Warm",
  "params": {
    "preset": "warm",
    "intensity": 100
  },
  "status": "planned"
}

**Example for sound effect:**
User says: "add applause sound at 0:15 for 3 seconds"
AND selectedAssets includes: {filename: "applause.mp3", kind: "audio", url: "/memes/applause.mp3"}
Your output should include:
{
  "id": "audio1",
  "startSec": 15,
  "endSec": 18,
  "op": "overlay_audio",
  "label": "Sound: Applause",
  "params": {
    "audioPath": "/memes/applause.mp3",
    "volume": 0.7
  },
  "status": "planned"
}

**Example for video meme:**
User says: "add fire emoji at 0:20 for 3 seconds in the corner"
AND selectedAssets includes: {filename: "fire.mp4", kind: "video", url: "https://..."}
Your output should include:
{
  "id": "video1",
  "startSec": 20,
  "endSec": 23,
  "op": "overlay_video",
  "label": "Video: Fire",
  "params": {
    "videoPath": "https://...",
    "position": "bottom-right",
    "scale": 0.3
  },
  "status": "planned"
}

**Example for punch effect:**
User says: "do the punch feature at 6:00 to 7:00"
Your output should include:
{
  "id": "effect1",
  "startSec": 360,
  "endSec": 420,
  "op": "effect",
  "label": "Punch-In",
  "params": {
    "strength": 50
  },
  "status": "planned"
}

Generate the plan now:`;
}

/**
 * Safely extracts the first JSON object from model output text
 */
export function safeParseModelJson(text: string): unknown {
  try {
    // Try parsing the entire text first
    return JSON.parse(text);
  } catch {
    // If that fails, try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Continue to next attempt
      }
    }

    // Try to find the first { and last } and extract that
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch {
        // Continue to next attempt
      }
    }

    // If all else fails, throw an error
    throw new Error("Could not extract valid JSON from model output");
  }
}
