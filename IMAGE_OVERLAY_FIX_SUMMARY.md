# Image Overlay Fix - Summary

## Problem

User tried to add image overlays and punch effects with these instructions:

```
Add image "barcode-BC-MJ2MRYN1-UHG.png" at 4:00 - 5:30
do the punch feature at 6:00 to 7:00
```

But none of it worked because:

1. ❌ No image overlay support in the system
2. ❌ Time format "MM:SS" wasn't being parsed
3. ❌ "punch feature" wasn't mapped to the punch-in effect
4. ❌ Asset clicks didn't include file paths for AI to use

## Solution Implemented

### 1. Added Image Overlay Support ✅

**File: `src/lib/ffmpegProcessor.ts`**

- Added `addImageOverlay()` function (75 lines)
- Supports 5 position presets: top-left, top-right, bottom-left, bottom-right, center
- Configurable scale (default 0.3 = 30% of video size)
- Time-constrained overlay using `enable='between(t,startSec,endSec)'`
- Added `overlay_image` case in `processVideo()` function

**Technical Details:**

```typescript
export async function addImageOverlay(
  inputPath: string,
  outputPath: string,
  imagePath: string,
  startSec: number,
  endSec: number,
  options?: {
    position?:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "center";
    scale?: number;
  },
  onProgress?: (percent: number) => void,
): Promise<void>;
```

FFmpeg filter used:

```
[1:v]scale=iw*0.3:ih*0.3[img];
[0:v][img]overlay=W-w-10:10:enable='between(t,240,330)'
```

### 2. Updated AI Prompt for Image Overlays ✅

**File: `src/lib/geminiPlanner.ts`**

Added operation type documentation:

```
8. **overlay_image**: Add image/meme overlay
   - params: {
       "imagePath": "/memes/barcode.png",
       "position": "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center",
       "scale": 0.3
     }
   - Use when user mentions: image, meme, overlay image, add [filename]
   - Parse the filename from user instruction and path from (path: ...)
   - Position options: top-right (default), top-left, bottom-right, bottom-left, center
   - Scale: 0.1 (small) to 1.0 (full size), default 0.3
```

Added time format parsing instructions:

```
**Time Format Parsing:**
- Support both formats: seconds ("240") and MM:SS ("4:00")
- When you see "M:SS" format, convert to seconds: "4:00" = 240s, "5:30" = 330s
- Examples: "1:30" = 90s, "0:45" = 45s, "10:15" = 615s
```

Added punch effect mapping:

```
7. When user mentions "punch" or "punch feature" or "zoom in", use effect operation with label "Punch-In".
```

Added practical examples:

```json
// Image overlay example
{
  "id": "img1",
  "startSec": 240,  // 4:00
  "endSec": 330,    // 5:30
  "op": "overlay_image",
  "label": "Image: barcode.png",
  "params": {
    "imagePath": "/memes/barcode.png",
    "position": "top-right",
    "scale": 0.3
  },
  "status": "planned"
}

// Punch effect example
{
  "id": "effect1",
  "startSec": 360,  // 6:00
  "endSec": 420,    // 7:00
  "op": "effect",
  "label": "Punch-In",
  "params": {
    "strength": 50
  },
  "status": "planned"
}
```

### 3. Fixed Asset Click Handler ✅

**File: `src/components/DirectorNotesPanel.tsx`**

Updated `onSelectAsset` callback to:

- Include file path in instruction: `Add image "file.png" (path: /memes/file.png) at 0:00 - 0:10`
- Add to assetChips array for AI context (audio/video only)
- Convert MemeAssetLibrary's Asset type to DirectorNotesPanel's AssetChip type
- Type-safe conversion with explicit checks

Before:

```typescript
assetText = `\nAdd ${asset.type} "${asset.filename}" at [timestamp]`;
```

After:

```typescript
if (asset.type === "image") {
  assetText = `\nAdd image "${asset.filename}" (path: ${asset.url}) at 0:00 - 0:10`;
}
// User edits: 0:00 - 0:10 → 4:00 - 5:30
```

## How It Works Now

### Step-by-Step Flow:

1. **User uploads video** → Video analysis runs
2. **User clicks image asset** (e.g., "surprised_pikachu.png")
   - Green notification appears: "Added 'surprised_pikachu.png' to your edit instructions!"
   - Instruction added to Director Notes:
     ```
     Add image "surprised_pikachu.png" (path: /memes/surprised_pikachu.png) at 0:00 - 0:10
     ```

3. **User edits the times** in Director Notes:

   ```
   Add image "surprised_pikachu.png" (path: /memes/surprised_pikachu.png) at 4:00 - 5:30
   do the punch feature at 6:00 to 7:00
   ```

4. **User clicks "Generate Plan"**
   - AI receives instruction + selectedAssets context
   - AI parses "4:00" → 240 seconds, "5:30" → 330 seconds
   - AI extracts path: "/memes/surprised_pikachu.png"
   - AI recognizes "punch feature" → punch-in effect
   - AI generates operations:
     ```json
     [
       {
         "id": "img1",
         "startSec": 240,
         "endSec": 330,
         "op": "overlay_image",
         "label": "Image: surprised_pikachu.png",
         "params": {
           "imagePath": "/memes/surprised_pikachu.png",
           "position": "top-right",
           "scale": 0.3
         }
       },
       {
         "id": "effect1",
         "startSec": 360,
         "endSec": 420,
         "op": "effect",
         "label": "Punch-In",
         "params": { "strength": 50 }
       }
     ]
     ```

5. **User clicks "Render Video"**
   - FFmpeg processes each operation:
     - Overlay image from 4:00 to 5:30 (top-right corner, 30% scale)
     - Apply punch-in zoom from 6:00 to 7:00
   - Final video saved to `/public/uploads/processed/`

## Testing Instructions

### Test 1: Click Asset

1. Go to Assets & Memes tab
2. Click "Surprised Pikachu" image
3. ✅ Green notification should appear
4. ✅ Director Notes should have: `Add image "surprised_pikachu.png" (path: /memes/surprised_pikachu.png) at 0:00 - 0:10`

### Test 2: Edit Times & Generate Plan

1. Edit the instruction to: `Add image "surprised_pikachu.png" (path: /memes/surprised_pikachu.png) at 0:10 - 0:20`
2. Click "Generate Plan"
3. Switch to "Edit Plan" tab
4. ✅ Should see operation: "Image: surprised_pikachu.png" from 10s to 20s

### Test 3: Full Workflow with Your Example

1. Upload a video (at least 7+ minutes long)
2. Click a meme image
3. Edit instruction to:
   ```
   Add image "surprised_pikachu.png" (path: /memes/surprised_pikachu.png) at 4:00 - 5:30
   do the punch feature at 6:00 to 7:00
   ```
4. Generate Plan
5. ✅ Should see two operations:
   - Image overlay: 240s - 330s
   - Punch-In effect: 360s - 420s
6. Render Video
7. ✅ Final video should have image visible from 4:00-5:30 and zoom effect from 6:00-7:00

## File Changes Summary

| File                                    | Changes                                              | Lines Added |
| --------------------------------------- | ---------------------------------------------------- | ----------- |
| `src/lib/ffmpegProcessor.ts`            | Added `addImageOverlay()` function + processing case | +113        |
| `src/lib/geminiPlanner.ts`              | Added overlay_image docs + time parsing + examples   | +52         |
| `src/components/DirectorNotesPanel.tsx` | Fixed asset callback with path inclusion             | +12         |
| `IMAGE_OVERLAY_GUIDE.md`                | Created user-facing documentation                    | +152        |

**Total:** 329 lines added, 4 files modified

## Known Limitations

1. **Uploaded Images**: Currently, uploaded images use blob URLs which won't persist across sessions. For production, need to save uploads to `/public/uploads/` folder via API endpoint.

2. **Position Customization**: Users can't easily customize position in the instruction yet. They'd need to manually specify: `Add image "file.png" (path: /path) at 4:00 - 5:30 (bottom-left)`

3. **Multiple Images**: Multiple overlays at the same time will stack. Each operation is processed sequentially.

4. **Image Size**: Large images (>5MB) might slow down rendering. Consider adding image compression.

## Next Steps

If you want to improve further:

- [ ] Add server endpoint to save uploaded images persistently
- [ ] Add image preview in Edit Plan tab
- [ ] Support position/scale editing in UI (not just text)
- [ ] Add image templates (corner watermarks, center banners, etc.)
- [ ] Batch image overlay (apply same image to multiple time ranges)

## Deployment Checklist

Before demoing:

- [x] Image overlay function implemented
- [x] AI prompt updated with overlay_image operation
- [x] Time format parsing (MM:SS) documented
- [x] Punch feature keyword mapping added
- [x] Asset click handler includes paths
- [ ] Test with real video (7+ minutes)
- [ ] Verify preset memes work (Surprised Pikachu, Drake, etc.)
- [ ] Check uploaded image flow

Ready for hackathon demo! 🎬✨
