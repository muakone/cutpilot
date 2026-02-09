# CutPilot - Complete Implementation Roadmap

## Vision

An AI video editing tool that turns raw videos into platform-ready content using natural language prompts and timestamps.

---

## Current State ✅

### What Works

- ✅ Clean UI with timeline and segments
- ✅ Gemini AI edit plan generation
- ✅ Multi-draft system (3 drafts)
- ✅ Effects & assets library UI
- ✅ Database persistence (Prisma + SQLite)
- ✅ Type-safe API contracts (Zod)
- ✅ Time range selection
- ✅ Manual effect/asset application

### What's Missing

- ❌ Video upload
- ❌ Automatic video analysis
- ❌ Actual video processing/rendering
- ❌ Real video preview
- ❌ Export functionality
- ❌ Caption generation
- ❌ Platform-specific formatting

---

## Phase 1: Video Upload & Storage 🎥

### Goals

- Users can upload videos
- Store video files and metadata
- Extract basic video info (duration, resolution, fps)

### Tasks

1. **Frontend Upload Component**
   - Add file upload dropzone to UI
   - File validation (size, format: mp4, mov, avi)
   - Upload progress indicator
   - Thumbnail generation

2. **Backend Storage**
   - Set up video storage (local/cloud)
   - Create `/api/upload` endpoint
   - Update Prisma schema:
     ```prisma
     model Video {
       id            String   @id @default(cuid())
       projectId     String
       project       Project  @relation(...)
       filename      String
       filepath      String
       durationSec   Float
       width         Int
       height        Int
       fps           Float
       codec         String
       uploadedAt    DateTime @default(now())
     }
     ```

3. **Video Metadata Extraction**
   - Install `fluent-ffmpeg` + `@ffmpeg-installer/ffmpeg`
   - Extract: duration, resolution, fps, codec
   - Generate thumbnail at 0s

### Deliverable

✓ User uploads video → stored in database → metadata extracted

---

## Phase 2: Automatic Video Analysis 🤖

### Goals

- Automatically break down video into segments
- Detect silence, scene changes, speech
- Replace hardcoded segments with real data

### Tasks

1. **Silence Detection**
   - Use FFmpeg `silencedetect` filter
   - API: `/api/analyze/silence`
   - Detect pauses > 0.5s at -30dB threshold
   - Store silence ranges in DB

2. **Scene Detection**
   - Use FFmpeg `select='gt(scene,0.3)'`
   - Detect hard cuts and scene transitions
   - Create segments at scene boundaries

3. **Speech/Audio Analysis** (Optional - Advanced)
   - Integrate Whisper API for transcription
   - Detect speaker emphasis via volume spikes
   - Identify key moments by word patterns

4. **Auto-Segment Generation**
   - Combine silence + scene data
   - Generate smart segments with labels:
     - "Intro" (first 5s)
     - "Main Content" (bulk)
     - "Pause" (silence regions)
     - "Outro" (last segment)
   - Replace hardcoded segments in UI

5. **Update API**
   - `/api/analyze` - triggers all analysis
   - Returns segments array
   - Updates project in database

### Deliverable

✓ Upload video → auto-analyzes → generates timestamped segments

---

## Phase 3: Video Processing Backend 🎬

### Goals

- Apply edits (cuts, effects, overlays)
- Render final video
- Process operations from edit plan

### Tasks

1. **FFmpeg Processing Pipeline**
   - Set up FFmpeg command builder
   - Create `/api/render` endpoint
   - Process each `EditOp`:
     - `remove_silence` → FFmpeg silenceremove filter
     - `trim` → `-ss` start `-to` end
     - `speed` → `setpts` filter
     - `effect` (zoom/shake) → complex filters
     - `overlay_audio` → audio mixing
     - `overlay_video` → overlay filter

2. **Effect Implementation**
   - **Zoom (Punch-in)**: `zoompan` filter
   - **Shake**: `deshake` (inverse) or crop animation
   - **Glitch**: frame duplication + displacement
   - **Blur**: `boxblur` filter
   - **LUTs**: apply `.cube` color grading files
   - **Bass Boost**: `bass=g=10` audio filter

3. **Operation Queue System**
   - Process operations sequentially
   - Chain FFmpeg filters efficiently
   - Handle overlapping time ranges
   - Progress tracking for long renders

4. **Temp File Management**
   - Create intermediate files for complex edits
   - Clean up after render completes
   - Store final output

### Deliverable

✓ Edit plan → FFmpeg processes video → rendered output

---

## Phase 4: Real-time Preview System 👁️

### Goals

- Play actual video in UI
- Show timestamp cursor
- Preview effects in real-time (optional)

### Tasks

1. **Video Player Integration**
   - Use HTML5 `<video>` element or React player
   - Load uploaded video file
   - Sync player time with timeline slider
   - Play/pause controls

2. **Segment Visualization**
   - Highlight segments on timeline
   - Show silence regions visually
   - Mark effect application points

3. **Preview Mode**
   - "Preview" button generates quick preview
   - Apply edits to 10-20s clips for fast preview
   - Show before/after comparison

4. **Real-time Feedback**
   - Update video player when segments clicked
   - Jump to specific timestamps
   - Visual indicators for operations

### Deliverable

✓ Click segment → video jumps to timestamp → see actual footage

---

## Phase 5: Advanced AI Features 🧠

### Goals

- Smarter prompt understanding
- Context-aware effect placement
- Multi-turn editing conversations

### Tasks

1. **Enhanced Prompt Engineering**
   - Improve Gemini system prompt
   - Add examples of good edit plans
   - Handle complex instructions:
     - "Make it more energetic"
     - "Add memes at funny moments"
     - "Remove awkward pauses"

2. **Context Analysis**
   - Feed Gemini:
     - Transcript (if available)
     - Silence timestamps
     - Scene change points
     - Video metadata
   - Let AI decide WHERE to place effects

3. **Iterative Editing**
   - Store conversation history
   - Support follow-up prompts:
     - "Make that zoom stronger"
     - "Move the meme to 0:15"
   - Update existing operations instead of recreating

4. **Smart Defaults**
   - Auto-suggest effects based on video type
   - Gaming video → add "Vine boom" at kills
   - Tutorial → add captions
   - Vlog → remove all silence

5. **Meme Intelligence**
   - Detect "reaction-worthy" moments:
     - Long pauses → "awkward silence" meme
     - Surprise statements → "surprised pikachu"
     - Fails → "sad violin"
   - Auto-insert from library

### Deliverable

✓ Natural language → smart edits → context-aware placement

---

## Phase 6: Export & Platform Formatting 📤

### Goals

- Export final video
- Auto-format for TikTok/Reels/YouTube
- Apply platform-specific optimizations

### Tasks

1. **Export System**
   - `/api/export` endpoint
   - Process full edit plan
   - Output formats: mp4, mov, webm
   - Quality settings: 1080p, 720p, 480p

2. **Platform Presets**
   - **TikTok/Reels** (9:16 vertical)
     - 1080x1920 resolution
     - Max 60s duration
     - H.264 codec, 30fps
     - Auto-crop to vertical
   - **YouTube Shorts** (9:16)
     - Same as TikTok
     - Max 60s
   - **YouTube** (16:9 horizontal)
     - 1920x1080 or 1280x720
     - No duration limit
     - Keep original aspect ratio

3. **Auto-Cropping**
   - Detect main subject in frame
   - Smart crop to 9:16 for vertical
   - Use FFmpeg `cropdetect` or ML model

4. **Optimization**
   - Compress for platform limits
   - TikTok: max 287MB
   - Instagram: max 100MB
   - Adjust bitrate accordingly

5. **Download UI**
   - Format selector dropdown
   - Platform-specific tips
   - Download button
   - Progress bar during export

### Deliverable

✓ Click "Export" → select platform → download ready-to-post video

---

## Phase 7: Caption & Overlay System 📝

### Goals

- Auto-generate captions from speech
- Overlay text at timestamps
- Support custom fonts/styles

### Tasks

1. **Transcription**
   - Integrate Whisper API (OpenAI)
   - Or use Gemini for audio transcription
   - Extract word-level timestamps
   - Store in database:
     ```prisma
     model Caption {
       id        String  @id
       projectId String
       startSec  Float
       endSec    Float
       text      String
       wordLevel Json?   // [{word, start, end}]
     }
     ```

2. **Caption Styling**
   - Font: Bold, clean (e.g., Montserrat)
   - Position: Center/bottom
   - Animation: Word-by-word highlight
   - Background: Semi-transparent box
   - Stroke/outline for readability

3. **Caption Rendering**
   - FFmpeg `drawtext` filter
   - Animate with timing data
   - Support multiple lines
   - Auto-wrap long sentences

4. **User Control**
   - Enable/disable captions
   - Edit caption text
   - Adjust timing manually
   - Choose style presets:
     - "TikTok Style" (big, bold, center)
     - "Subtitle Style" (bottom, smaller)
     - "Mr. Beast Style" (animated words)

5. **Caption in Edit Plan**
   - Add `captions` operation type
   - AI can decide when to add captions:
     - "Add captions throughout"
     - "Caption only the key parts"

### Deliverable

✓ Auto-transcribe → generate styled captions → render in video

---

## Phase 8: Meme & Asset System 🎭

### Goals

- Upload custom memes/sound effects
- Intelligent meme insertion
- Browse built-in library

### Tasks

1. **Asset Upload**
   - Upload memes (video: mp4)
   - Upload sound effects (audio: mp3, wav)
   - Store in `public/assets/` or cloud
   - Add to database:
     ```prisma
     model Asset {
       id           String  @id
       userId       String?
       filename     String
       filepath     String
       kind         String  // audio | video | image
       category     String? // meme | sfx | music
       tags         String[]
       durationSec  Float?
       uploadedAt   DateTime
     }
     ```

2. **Meme Library**
   - Pre-populated memes:
     - "Surprised Pikachu"
     - "Sad Violin"
     - "Bruh Sound Effect"
     - "Vine Boom"
     - "Windows Error"
   - Searchable by tag/name
   - Preview thumbnails

3. **Smart Insertion**
   - AI detects moment type:
     - Pause → "Crickets chirping"
     - Mistake → "Fail sound"
     - Surprise → "Dramatic zoom + boom"
   - Position overlay:
     - Corner for reactions
     - Fullscreen for emphasis
     - Audio-only for SFX

4. **Overlay Rendering**
   - FFmpeg overlay filter
   - Position: `x=W-w-10:y=H-h-10` (bottom-right)
   - Scale: 0.3x for corner overlays
   - Blend mode: normal or screen

5. **User Control**
   - Drag memes to timeline
   - Adjust timing/position
   - Replace or remove easily

### Deliverable

✓ Upload meme → AI inserts at perfect moment → renders in final video

---

## Phase 9: Polish & Production Ready 🚀

### Goals

- Performance optimization
- Error handling
- User experience improvements
- Deployment prep

### Tasks

1. **Performance**
   - Stream video uploads (chunked)
   - Background processing with queue (Bull/BullMQ)
   - Caching for repeated renders
   - Optimize FFmpeg commands

2. **Error Handling**
   - Upload fails → clear error message
   - Render fails → show logs
   - Invalid formats → guide user
   - Network errors → retry logic

3. **UX Improvements**
   - Loading states everywhere
   - Render progress indicator
   - Keyboard shortcuts (space to play, arrow keys)
   - Undo/redo for edits
   - Tutorial/onboarding

4. **Storage Strategy**
   - Local for dev: store in `/uploads`
   - Production: S3/Cloudflare R2/Vercel Blob
   - Clean up old files periodically

5. **Deployment**
   - Environment variables setup
   - Database migration strategy
   - FFmpeg installed on server
   - Consider serverless functions for processing
   - CDN for video delivery

6. **Testing**
   - Test with various video formats
   - Test large files (>500MB)
   - Test complex edit plans
   - Edge cases: 0s silence, corrupted files

### Deliverable

✓ Robust, fast, production-ready app

---

## Tech Stack Additions

### New Dependencies Needed

```json
{
  "dependencies": {
    // Video processing
    "fluent-ffmpeg": "^2.1.3",
    "@ffmpeg-installer/ffmpeg": "^1.1.0",
    "@ffmpeg-installer/ffprobe": "^1.4.1",

    // File uploads
    "formidable": "^3.5.1",
    "multer": "^1.4.5-lts.1",

    // Transcription (optional)
    "openai": "^4.0.0", // for Whisper

    // Background jobs (optional)
    "bull": "^4.12.0",
    "ioredis": "^5.3.2",

    // Cloud storage (optional)
    "@aws-sdk/client-s3": "^3.0.0"
  }
}
```

### Infrastructure

- **Storage**: Local dev → S3/R2 for production
- **Processing**: Server-side FFmpeg → consider AWS Lambda for scale
- **Queue**: Redis + Bull for background renders
- **Database**: SQLite → PostgreSQL for production

---

## Priority Order (MVP First)

### **Week 1: Core Video Handling**

1. ✅ Phase 1: Upload & storage
2. ✅ Phase 2: Auto-analysis (silence detection)
3. ✅ Phase 4: Basic video preview

### **Week 2: Processing & Export**

4. ✅ Phase 3: FFmpeg video processing
5. ✅ Phase 6: Export system (basic)

### **Week 3: AI & Polish**

6. ✅ Phase 5: Enhanced AI prompts
7. ✅ Phase 7: Caption system
8. ✅ Phase 8: Meme library

### **Week 4: Production**

9. ✅ Phase 6: Platform formatting
10. ✅ Phase 9: Polish & deploy

---

## Success Metrics

- ✅ Upload video < 30s
- ✅ Auto-analysis completes in < 60s
- ✅ Simple edit renders in < 120s
- ✅ Complex edit (10+ ops) in < 300s
- ✅ User can go from upload → export in < 5 minutes
- ✅ Supports videos up to 10 minutes / 500MB
- ✅ 90%+ of prompts generate valid edit plans

---

## Next Immediate Steps

1. **Install FFmpeg dependencies**

   ```bash
   npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
   npm install formidable
   ```

2. **Update Prisma schema** - add Video model

3. **Create upload API** - `/api/upload`

4. **Build video analysis** - `/api/analyze`

5. **Test with real video** - upload → analyze → see segments

---

## Questions to Answer

- **Storage**: Local files or cloud (S3/R2)?
- **Processing**: Sync or background queue?
- **Transcription**: Whisper API or Gemini?
- **Scale**: Single user or multi-tenant?
- **Budget**: Free tier constraints?

---

**Let's start building! 🚀**
