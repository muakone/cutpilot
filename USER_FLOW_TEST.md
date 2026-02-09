# 🧪 CutPilot - User Flow Testing Guide

**Step-by-step guide to test all features**

---

## 🚀 Quick Start (2 Minutes)

### Test 1: Basic Flow with Quick Actions

1. **Start the app**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000

2. **Upload a Test Video**
   - Click "Choose Video" or drag & drop
   - Use any video file (MP4 recommended, <100MB for fast testing)
   - Wait for upload to complete (~5-10 seconds)
   - ✅ You should see: Video preview, timeline appears, auto-analysis starts

3. **Use Quick Action**
   - Scroll to "Director's Notes" section
   - Click **"✨ Make Viral"** button
   - ✅ You should see: Instruction field updates with "Make it viral and engaging for social media"

4. **Generate AI Plan**
   - Click **"Generate Plan"** button (orange)
   - Wait 3-5 seconds
   - ✅ You should see:
     - "Planned Changes" tab shows multiple operations
     - Operations like: captions, color grading, remove silence
     - Each operation shows time range and parameters

5. **Preview Operations**
   - Look at the "Planned Changes" list
   - Click on any operation to see details
   - ✅ You should see: Operation details, edit/delete options

6. **Render Video**
   - Click **"Render Video"** button (orange)
   - Watch progress bar
   - ⚠️ **Known Issue**: May hang at 99% (FFmpeg issue)
   - ✅ If successful: Download link appears

---

## 🎯 Detailed Feature Tests

### Test 2: All Quick Actions

Test each button individually:

| Button              | Expected Result                                |
| ------------------- | ---------------------------------------------- |
| **✨ Make Viral**   | "Make it viral and engaging for social media"  |
| **💬 Add Captions** | "Add captions throughout the video"            |
| **🎬 Cinematic**    | "Make it professional and cinematic"           |
| **✂️ Clean Up**     | "Clean up and remove silence"                  |
| **😂 Make Funny**   | "Add funny sound effects at the right moments" |
| **📱 TikTok Ready** | "Optimize for TikTok and Instagram Reels"      |

**Steps:**

1. Click each button
2. Check instruction field updates
3. Click "Generate Plan"
4. Check AI generates appropriate operations

---

### Test 3: Custom Instructions

**Test Natural Language Understanding:**

1. **Simple Caption**

   ```
   Add caption "Hello World" at 5 seconds
   ```

   - Generate Plan
   - ✅ Should create: 1 caption operation at 5s

2. **Time-Specific Edits**

   ```
   Add zoom from 0:10 to 0:20, add applause at 0:15
   ```

   - Generate Plan
   - ✅ Should create: zoom operation + audio overlay

3. **Multiple Operations**

   ```
   Make it warmer, add captions, remove silence
   ```

   - Generate Plan
   - ✅ Should create: color_grade + captions + remove_silence

4. **With Timestamps**
   ```
   At 0:05 add fire emoji, at 0:10 add vine boom sound
   ```

   - Generate Plan
   - ✅ Should create: video overlay + audio overlay at correct times

---

### Test 4: Asset Library

**Test Meme/Sound Selection:**

1. **Open Asset Library**
   - Switch to "Effects & Assets" tab
   - Click "Memes & Assets" sub-tab
   - ✅ Should see: 12 preset assets (sounds + video memes)

2. **Select Audio Asset**
   - Find "Applause" sound
   - Click to select
   - ✅ Should see: Orange chip appears in Director's Notes
   - Type instruction: "Add applause at 10 seconds"
   - Generate Plan
   - ✅ Should create: overlay_audio with applause.wav URL

3. **Select Video Meme**
   - Find "Fire Emoji" video
   - Click to select
   - ✅ Should see: Chip appears with video icon
   - Type instruction: "Add fire at 0:15 in the corner"
   - Generate Plan
   - ✅ Should create: overlay_video with Tenor URL

4. **Upload Custom Asset**
   - Click "Upload" button
   - Upload an image (PNG/JPG)
   - ✅ Should see: Asset appears in "My Uploads"
   - Select it and use in instruction

---

### Test 5: Multiple Drafts

**Test Iterative Editing:**

1. **Create Draft 1**
   - Type: "Add caption Hello at 5 seconds"
   - Generate Plan
   - ✅ Draft 1 should show (1) operation count

2. **Switch to Draft 2**
   - Click "Draft 2" button
   - Type: "Make it cinematic"
   - Generate Plan
   - ✅ Draft 2 should show different operations

3. **Switch to Draft 3**
   - Click "Draft 3"
   - Type: "Add funny sounds"
   - Generate Plan
   - ✅ Draft 3 should show sound effects

4. **Compare Drafts**
   - Switch between Draft 1, 2, 3
   - ✅ Each should keep its own plan
   - ✅ Clicking draft buttons shows different operation counts

---

### Test 6: Operation Editing

**Test Manual Refinement:**

1. **Generate a Plan**
   - Use any instruction
   - Generate plan with multiple operations

2. **Edit Operation Timing**
   - In "Planned Changes", click an operation
   - ✅ Should see: Edit panel opens on right
   - Adjust start/end time sliders
   - Click "Save"
   - ✅ Operation timing updates

3. **Delete Operation**
   - Click X button on any operation
   - ✅ Operation disappears from list

4. **Add More Operations**
   - Type new instruction
   - Generate Plan again
   - ✅ New operations added to existing plan (iterative editing!)

---

### Test 7: Timeline Visualization

**Test Visual Feedback:**

1. **After uploading video**
   - Look at "Video Timeline" card
   - ✅ Should see:
     - Horizontal timeline bar
     - Colored segments for operations
     - Hover shows operation details

2. **Scrub Timeline**
   - Drag the time slider under video preview
   - ✅ Timeline cursor should move
   - ✅ Time display updates (00:00 format)

---

### Test 8: AI Intelligence

**Test Smart Suggestions:**

1. **"Make it viral"**
   - Generate Plan
   - ✅ Should include:
     - Multiple captions
     - Color grading (vibrant)
     - Remove silence

2. **"Professional"**
   - Generate Plan
   - ✅ Should include:
     - Color grading with "cinematic" preset

3. **"Social media"**
   - Generate Plan
   - ✅ Should include:
     - Captions at center position
     - Vibrant colors

4. **"Clean up"**
   - Generate Plan
   - ✅ Should include:
     - remove_silence operation

---

### Test 9: Clear & Start Over

**Test Reset Functionality:**

1. **After working with a video**
   - Click **"Clear & Start Over"** (red button)
   - ✅ Confirmation modal appears

2. **Confirm Clear**
   - Click "Clear Everything"
   - ✅ Should reset:
     - Video removed
     - All drafts cleared
     - Instruction field empty
     - Timeline cleared
     - Returns to upload screen

3. **Check Persistence**
   - Refresh page (F5)
   - ✅ Should still be cleared (localStorage updated)

---

### Test 10: Auto-Save

**Test localStorage Persistence:**

1. **Upload video and create plan**
   - Do any editing workflow
   - Watch for "✅ Saved" indicator (top right)

2. **Refresh Page** (F5)
   - ✅ Should restore:
     - Uploaded video
     - Current draft plans
     - Selected assets
     - Instruction text

3. **Check Console**
   - Open DevTools (F12)
   - Go to Application → localStorage
   - ✅ Should see keys:
     - `cutpilot_uploadedVideo`
     - `cutpilot_draft1Plan`
     - `cutpilot_analysis`

---

## 🎨 Visual Tests

### Test Color Grading

**Generate plan with:**

```
Make it warmer from 0:00 to 0:10
```

✅ Should create: `color_grade` operation with preset="warm"

**Try all presets:**

- "make it warmer"
- "make it cooler"
- "add vintage look"
- "make it cinematic"
- "more vibrant"
- "black and white"

### Test Caption Styles

**Generate plan with:**

```
Add caption "AMAZING" at center at 5 seconds
```

✅ Should create: `captions` operation with:

- text: "AMAZING"
- position: "center"
- animation: "fade"

---

## 🎵 Audio Tests

### Test Sound Effects

**For each sound:**

1. **Select sound from library** (Applause, Boom, Whoosh, etc.)
2. **Type instruction:**
   ```
   Add [sound name] at 10 seconds
   ```
3. **Generate Plan**
4. ✅ Should create: `overlay_audio` with:
   - audioPath: Mixkit CDN URL
   - volume: 0.7
   - startSec: 10

**Test volume adjustment:**

```
Add applause at 10 seconds with high volume
```

✅ AI should increase volume parameter

---

## 📹 Video Overlay Tests

### Test Animated Emojis

**For each emoji:**

1. **Select emoji** (Thinking, Fire, Skull, Crying)
2. **Type instruction:**
   ```
   Add [emoji] at 15 seconds in the corner
   ```
3. **Generate Plan**
4. ✅ Should create: `overlay_video` with:
   - videoPath: Tenor CDN URL
   - position: "bottom-right" or similar
   - scale: 0.3

**Test positions:**

```
Add fire emoji at center at 20 seconds
```

✅ position should be "center"

---

## ⚡ Performance Tests

### Test Large Video

1. **Upload video >100MB**
   - ✅ Upload progress shown
   - ✅ May take 30-60 seconds
   - ✅ Analysis completes

2. **Generate Complex Plan**
   - Use "Make it viral" (creates many operations)
   - ✅ Should handle 10-20 operations
   - ✅ Plan generates in 5-10 seconds

---

## 🐛 Known Issues to Check

### Issue 1: FFmpeg 99% Hang

**Symptoms:**

- Rendering gets stuck at 99%
- Never completes

**Workaround:**

- Use MP4 input (not WebM)
- Use shorter videos (<1 minute)
- Check FFmpeg is installed: `ffmpeg -version`

### Issue 2: Audio Not Playing

**Check:**

- Video has audio track
- Browser allows autoplay
- Volume is not muted

### Issue 3: Assets Not Loading

**Check:**

- Internet connection (CDN URLs need network)
- Console for CORS errors
- Try different asset

---

## ✅ Success Criteria

### Must Work:

- ✅ Video upload
- ✅ Quick Actions populate instructions
- ✅ Generate Plan creates operations
- ✅ Multiple drafts maintain separate plans
- ✅ Asset selection adds chips
- ✅ Operation editing updates values
- ✅ Timeline shows visualizations
- ✅ Clear & Start Over resets everything
- ✅ localStorage persists across refresh

### Nice to Have:

- ✅ Rendering completes (may fail due to FFmpeg)
- ✅ Downloads work
- ✅ Export to platform formats

---

## 🎬 Demo Scenarios

### Scenario 1: Social Media Creator (30s)

```
1. Upload short video (10-20s)
2. Click "📱 TikTok Ready"
3. Generate Plan
4. Show: captions + vibrant colors
5. (Optional) Render
```

### Scenario 2: Funny Edit (45s)

```
1. Upload video
2. Select: Vine Boom + Crying Emoji from library
3. Type: "Add vine boom at 0:10, crying emoji at 0:15"
4. Generate Plan
5. Show: 2 operations with correct timing
```

### Scenario 3: Professional Polish (60s)

```
1. Upload video
2. Click "🎬 Cinematic"
3. Generate Plan
4. Show: color_grade with cinematic preset
5. Switch to Draft 2
6. Click "✂️ Clean Up"
7. Generate Plan
8. Show: remove_silence operation
9. Compare both drafts
```

---

## 📊 What to Screenshot/Record

For demo/presentation:

1. **Upload Screen** - Clean UI
2. **Quick Actions** - 6 colorful buttons
3. **Generated Plan** - List of operations
4. **Asset Library** - Memes & sounds
5. **Timeline Visualization** - Operations on timeline
6. **Multiple Drafts** - Draft 1, 2, 3 switching
7. **Operation Editing** - Right panel with sliders
8. **Rendering Progress** - Progress bar

---

## 🎯 Testing Checklist

Print this and check off as you test:

**Basic Flow:**

- [ ] Upload video
- [ ] Video preview appears
- [ ] Timeline scrubber works
- [ ] Quick Action button works
- [ ] Generate Plan creates operations
- [ ] Operations appear in list
- [ ] Render button clickable

**AI Features:**

- [ ] "Make it viral" creates multiple operations
- [ ] "Cinematic" adds color grading
- [ ] "TikTok Ready" optimizes for social
- [ ] Custom instructions work
- [ ] Time parsing correct (0:10 = 10 seconds)

**Assets:**

- [ ] Sound effects selectable
- [ ] Video memes selectable
- [ ] Custom upload works
- [ ] Assets appear in operations

**Editing:**

- [ ] Can edit operation timing
- [ ] Can delete operations
- [ ] Multiple drafts work
- [ ] Draft switching preserves plans

**Persistence:**

- [ ] Auto-save indicator appears
- [ ] Refresh preserves state
- [ ] Clear resets everything

---

## 🚨 If Something Breaks

1. **Check Console** (F12 → Console tab)
   - Look for red errors
   - Screenshot and note error message

2. **Check Network** (F12 → Network tab)
   - Are API calls succeeding?
   - /api/plan should return 200
   - /api/render should return 200

3. **Check localStorage**
   - F12 → Application → localStorage
   - Try clearing: `localStorage.clear()`
   - Refresh page

4. **Restart Server**
   ```bash
   # Stop: Ctrl+C
   npm run dev
   ```

---

**Good luck testing! 🚀 Each feature should work independently.**
