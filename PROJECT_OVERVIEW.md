# CutPilot - AI-Powered Video Editor

## 🎬 What This Project Does

CutPilot is an **AI-first video editor** that uses natural language to automate video editing tasks.

### Core Concept
Instead of manually editing videos with timelines and complex tools, users:
1. **Upload a video**
2. **Describe what they want** in plain English (Director Notes)
3. **AI generates an edit plan** using Gemini 2.5 Flash
4. **System automatically renders** the final video

---

## ✅ Currently Implemented Features

### Phase 1: Upload & Analysis
- ✅ Video file upload (MP4, MOV, AVI)
- ✅ FFmpeg metadata extraction (duration, resolution, fps, codec)
- ✅ Thumbnail generation
- ✅ File validation

### Phase 2: AI Planning
- ✅ Gemini AI integration for plan generation
- ✅ Natural language input (Director Notes)
- ✅ Automatic operation detection:
  - Remove silence
  - Add effects (punch-in, shake, blur, glitch)
  - Audio effects (bass boost)
  - Text overlays/captions
- ✅ Multi-draft system (3 draft tabs)
- ✅ localStorage persistence

### Phase 3: Rendering Pipeline
- ✅ FFmpeg processing engine
- ✅ Background job system with progress tracking
- ✅ Real-time progress updates (polling)
- ✅ Success/error indicators
- ✅ Video download functionality
- ✅ Detailed logging for debugging

### Caption System (Current)
- ✅ Text overlay with timing
- ✅ Large 72px text
- ✅ White text with black border
- ✅ Drop shadow for depth
- ✅ Semi-transparent background box
- ✅ Smooth fade in/out animations
- ✅ Center positioning

---

## 🚀 Requested Features (Prioritized)

### **HIGH PRIORITY** (Essential for hackathon demo)

#### 1. ✅ Caption Enhancements
- ✅ Background box (already implemented)
- ✅ Font weight (bold - already implemented)
- ⚠️ **TO ADD**: Position options (top/center/bottom)
- ⚠️ **TO ADD**: Font style selection
- ⚠️ **TO ADD**: Text animations (slide, fade, typewriter)

#### 2. ❌ Fix Punch-In/Zoom Effect
**Current issue**: May not be working properly
**Priority**: HIGH - This is a core feature
**Action needed**: Debug and test

#### 3. ❌ Cut/Trim Timeframes
**Feature**: Remove specific timeframes (e.g., cut 0:05-0:10)
**Why important**: Basic editing necessity
**Implementation**: Add "trim" operation type

---

### **MEDIUM PRIORITY** (Nice to have)

#### 4. Manual Operation Editing
- Edit AI-generated operations (change timings, parameters)
- Add operations manually without AI
- Reorder operations
- Delete operations

#### 5. More Effects
- Transitions (fade, wipe, dissolve)
- Color grading (saturation, contrast, brightness)
- Speed changes (slow-mo, time-lapse)
- Crop/resize

---

### **LOW PRIORITY** (Scope creep - avoid for hackathon)

#### 6. Full Timeline Editor
- Drag-and-drop timeline interface
- Frame-by-frame scrubbing
- Multi-track editing
- Keyframe animations

#### 7. Asset Library
- Import images/overlays
- Music library
- Sound effects
- Transition presets

---

## 🎯 Recommended Scope for Hackathon

### Keep AI-First Philosophy
Your unique selling point is **AI automation**, not being "another manual editor."

### Focus on these 5 features:
1. ✅ **Enhanced captions** (position, style, animations)
2. ✅ **Fix punch-in effect** (debug current implementation)
3. ✅ **Trim/cut timeframes** (essential editing feature)
4. ✅ **Speed up rendering** (optimize FFmpeg pipeline)
5. ✅ **Better UI/UX** (clearer feedback, better timeline visualization)

### Avoid:
- ❌ Full manual timeline editor (too complex, defeats AI purpose)
- ❌ Drag-and-drop interface (time-consuming)
- ❌ Advanced color grading (not differentiating feature)

---

## 🏆 What Makes CutPilot Special?

### Your Competitive Advantage:
1. **Natural language input** - No learning curve
2. **AI-powered decisions** - Detects silence, suggests effects
3. **One-click rendering** - Fast turnaround
4. **Perfect for**:
   - Content creators who hate editing
   - Quick social media videos
   - Podcast highlights
   - Tutorial videos

### Target Users:
- YouTubers who record long takes
- Podcasters creating clips
- Educators making course videos
- Small business owners doing marketing

---

## 📋 Demo Script (What to Show)

### 1. The Problem
"Manual video editing takes hours. You need to learn complex software."

### 2. The Solution
"With CutPilot, just describe what you want in plain English."

### 3. The Demo
```
Director Notes: 
"Remove the boring parts where I'm silent. 
Add a zoom-in effect when I mention 'AI'. 
Put a caption that says 'Watch This!' at 5 seconds.
Make the audio punchier with bass boost."
```

### 4. The Magic
- AI understands the request
- Generates edit plan automatically
- Renders in seconds
- Professional-looking result

### 5. The Flexibility
"Not happy? Click regenerate for a different edit plan. Or switch to manual mode to tweak specific parts."

---

## 🛠️ Technical Stack

- **Frontend**: Next.js 16.1, React 19, TypeScript
- **AI**: Google Gemini 2.5 Flash
- **Video Processing**: FFmpeg, fluent-ffmpeg
- **Storage**: localStorage (no backend needed)
- **Styling**: Tailwind CSS, Framer Motion

---

## 🐛 Known Issues

1. ⚠️ **Punch-in effect not working** - Needs debugging
2. ⚠️ **Complex effects can fail** - FFmpeg filter limitations
3. ⚠️ **Large files slow** - No streaming, loads entire file
4. ⚠️ **No video preview** - Can't see changes before rendering

---

## 🎨 UI/UX Flow

```
1. Landing Page
   ↓
2. Upload Video → Shows metadata & thumbnail
   ↓
3. Director Notes → Describe edits in plain English
   ↓
4. Generate Plan → AI creates operation list
   ↓
5. Review & Edit → See operations, modify if needed
   ↓
6. Render Video → Progress bar, real-time updates
   ↓
7. Download → Success banner with download button
```

---

## 🔮 Future Vision (Post-Hackathon)

- **V2.0**: Real-time preview
- **V2.1**: Cloud rendering (handle large files)
- **V2.2**: Template library ("Make it like a Mr. Beast video")
- **V2.3**: Voice commands ("Hey CutPilot, add a caption here")
- **V2.4**: Batch processing (edit 10 videos at once)
- **V3.0**: AI-generated B-roll from stock footage
- **V3.1**: Automatic subtitle generation (AI transcription)

---

## 💡 Suggested Next Steps

### Immediate (Today):
1. Fix punch-in zoom effect
2. Add caption positioning (top/bottom/center)
3. Add trim/cut functionality
4. Test everything thoroughly

### Tomorrow:
5. Add simple text animations
6. Improve UI feedback
7. Add more AI prompts examples
8. Create demo video

### Polish:
9. Error handling improvements
10. Loading states
11. Responsive design
12. Documentation

---

## ✨ Hackathon Pitch Format

**Problem**: Video editing is hard and time-consuming

**Solution**: CutPilot - AI video editor that works like a conversation

**Demo**: Upload → Describe → Render → Download (under 2 minutes)

**Technology**: Gemini AI + FFmpeg + Next.js

**Innovation**: Natural language video editing (competitors use manual tools)

**Market**: 50M+ content creators globally

**Business Model**: Freemium (5 videos/month free, premium for unlimited)

---

## 🎯 Is This In Scope?

### ✅ DEFINITELY IN SCOPE:
- Caption positioning (top/bottom/center)
- Basic text animations
- Trim/cut specific timeframes
- Fix existing effects
- Better AI prompts

### ⚠️ BORDERLINE (Do if time permits):
- Manual operation editing
- Font selection
- Advanced animations
- Multiple caption tracks

### ❌ OUT OF SCOPE (Skip for hackathon):
- Full timeline editor with drag-drop
- Multi-track editing
- Keyframe animations
- Asset library with uploads
- Real-time preview
- Video effects marketplace

---

**Your project is PERFECT for a hackathon!** Focus on the AI automation angle, keep manual controls simple, and you'll have a impressive demo. 🚀
