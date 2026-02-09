# 📖 CutPilot UI Components Explained

## Left Column (Video & Timeline)

### 1. **Video Player with Timeline** ✅

**Purpose**: This is your main video workspace

**What it does**:

- Shows your uploaded video with playback controls
- Below the video is a **visual timeline** showing:
  - 📊 **Colored segments** (Hook, Explanation, Peak, etc.) - automatically detected by AI
  - 🔇 **Gray bars** - silence/pauses in your video
  - 🎨 **Colored operation bars** - effects you've applied (purple = effects, yellow = trims, etc.)
  - 🔴 **Red playhead** - current playback position

**How to use**:

- Click anywhere on timeline to jump to that moment
- Use zoom buttons (+/-) to see more detail
- Click **-1F** / **+1F** buttons for frame-by-frame control (goes forward/back by 1/30th of a second)
- Play/pause video with the controls

**Why it's useful**: See everything at once - where silence is, where effects will apply, and exactly what's happening in your video.

---

### 2. **Quick Preview** ✅

**Purpose**: Test your edits without rendering the whole video

**What it does**:

- Takes a 10-20 second slice of your video
- Applies only the effects/edits in that time range
- Generates a quick preview clip

**How to use**:

1. Adjust "Preview Duration" slider (5-30 seconds)
2. Adjust "Start Time" to pick which part to preview
3. Click "Generate Preview"
4. Watch progress bar
5. Download the preview if you like it

**Why it's useful**: Rendering a 2-minute video might take 30 seconds, but previewing 10 seconds takes only 5 seconds. Perfect for testing!

---

### 3. **Before/After Comparison** ✅

**Purpose**: Show the difference between original and edited video

**What it does**:

- Shows original video on right, edited video on left
- Three viewing modes:
  - **Slider** - Drag divider to reveal before/after
  - **Split** - See both videos side-by-side
  - **Tabs** - Switch between before/after
- Videos play in sync

**How to use**:

1. First render your full video
2. Component will appear automatically
3. Choose viewing mode (Slider/Split/Tabs)
4. Click play to see synchronized comparison

**Why it's useful**: Perfect for demos and showing clients the improvements!

---

### 4. **~~Range Selection~~** ❌ REMOVED (redundant)

This has been removed because the timeline does the same thing better.

---

## Right Column (Editing Tools)

### Three Tabs:

---

### Tab 1: **Director Notes** 📝

**Purpose**: Write what you want done in plain English

**What it does**:

- Text area where you describe your edits
- Gemini AI reads your instructions and creates an edit plan
- Example: `"Remove silence, add zoom at 5 seconds, put caption 'WOW!' at 10 seconds"`

**How to use**:

1. Type your editing instructions
2. Click "Generate Plan"
3. AI creates operations matching your description

**Why it's useful**: No need to learn complex video editing - just describe what you want!

---

### Tab 2: **Edit Plan** 📋

**Purpose**: See and edit the AI-generated operations

**What it does**:

- Shows list of all planned edits (remove silence, effects, captions, etc.)
- Each operation shows:
  - Time range (start-end)
  - Type (effect, trim, audio, etc.)
  - Parameters (strength, text, etc.)
- Filter by type (All / Effects / Audio / Video)

**How to use**:

1. Review the AI-generated plan
2. Click operation to edit timing/parameters
3. Delete operations you don't want
4. Click "Render Video" when ready

**Why it's useful**: Full control - see exactly what will happen before rendering.

---

### Tab 3: **Assets & Memes** 🎭

**Purpose**: Add popular memes, sound effects, and overlays

**What it does**:

- Shows 8 preset memes:
  - 🔊 Vine Boom (audio)
  - ⚰️ Coffin Dance (audio)
  - 😱 Surprised Pikachu (image)
  - 👍👎 Drake Template (image)
  - ➡️ To Be Continued (video)
  - 📻 Record Scratch (audio)
  - 🎻 Sad Violin (audio)
  - 📯 Air Horn (audio)

**How to use**:

#### **To Browse Memes**:

1. Click "Assets & Memes" tab
2. See all 8 preset memes
3. Use search bar to filter (type "boom", "dance", etc.)
4. Switch category tabs:
   - **All** - Everything
   - **Videos** - Only video overlays
   - **Audio** - Only sound effects
   - **Images** - Only image memes

#### **To Upload Your Own Memes/Assets**:

1. Click "Assets & Memes" tab
2. Click the **"Upload"** button (purple button at top right)
3. Select files from your computer:
   - Videos (MP4, MOV, WebM)
   - Audio (MP3, WAV)
   - Images (PNG, JPG)
4. Files appear in the library instantly
5. Video thumbnails generate automatically

#### **To Use a Meme in Your Video**:

1. Click on any meme in the library
2. It automatically adds to your Director Notes like:
   ```
   Add audio "vine_boom.mp3" at [timestamp]
   ```
3. Edit the timestamp, then click "Generate Plan"
4. AI will insert the meme at that time

**Why it's useful**:

- Viral content = more engagement
- No need to download memes separately
- One-click to add popular sounds/effects
- Upload custom content too!

---

## Summary: What Each Part Does

| Component          | Purpose                                 | When to Use                  |
| ------------------ | --------------------------------------- | ---------------------------- |
| **Video Player**   | Watch your video                        | Always                       |
| **Timeline**       | See segments, silence, effects visually | After uploading video        |
| **Frame Controls** | Precise timing (-1F/+1F)                | When timing captions/effects |
| **Quick Preview**  | Test 10-20s clips fast                  | Before full render           |
| **Before/After**   | Compare original vs edited              | After rendering, for demos   |
| **Director Notes** | Describe edits in English               | Start here for AI editing    |
| **Edit Plan**      | Review/edit operations                  | After AI generates plan      |
| **Assets & Memes** | Add viral sounds/effects                | When you want memes!         |

---

## Typical Workflow

```
1. Upload video (left column, top)
   ↓
2. Wait for AI analysis (timeline appears)
   ↓
3. Write Director Notes (right column, first tab)
   OR browse Assets & Memes (third tab)
   ↓
4. Click "Generate Plan" (AI creates operations)
   ↓
5. Review Edit Plan (second tab)
   ↓
6. Optional: Generate Quick Preview to test
   ↓
7. Click "Render Video"
   ↓
8. View Before/After comparison
   ↓
9. Download final video
```

---

## Key Differences Clarified

### **Timeline vs Range Selector** ❌

- **Range Selector**: OLD, removed - was confusing
- **Timeline**: NEW, shows everything visually with video player

### **Library Tab vs Assets & Memes Tab** ❌

- **Library Tab**: OLD, removed - had effects and old asset list
- **Assets & Memes Tab**: NEW, comprehensive library with:
  - 8 preset memes
  - Upload capability
  - Search and filtering
  - Thumbnail previews
  - Better organization

### **Effects & Captions**

- OLD way: Select from library tab
- NEW way: Describe in Director Notes, AI handles it
- Still see all operations in Edit Plan tab

---

## How to Upload Memes - Complete Guide

### Method 1: Upload Button (Recommended)

1. Click **"Assets & Memes"** tab (right column, 3rd tab)
2. Click purple **"Upload"** button in top-right corner
3. File picker opens
4. Select one or more files:
   - Videos: .mp4, .mov, .webm, .avi, .mkv
   - Audio: .mp3, .wav, .m4a, .ogg
   - Images: .png, .jpg, .jpeg, .gif
5. Files process automatically
6. Appear in library immediately
7. Videos get automatic thumbnails

### Method 2: Drag & Drop (Coming Soon)

Currently, drag & drop is supported for the main video upload only.

### What You Can Upload

- ✅ **Meme sound effects**: Vine boom, bruh sound, dramatic music
- ✅ **Reaction images**: Surprised Pikachu, Drake meme, expanding brain
- ✅ **Short video clips**: "To Be Continued" arrow, "Directed by Robert" meme
- ✅ **Music tracks**: Background music, intro/outro tracks
- ✅ **Your own content**: Custom sounds, logos, watermarks

### File Limits

- Max file size: Not currently limited (but keep under 100MB for performance)
- Supported formats: Most common video/audio/image formats
- No limit on number of uploads

### After Uploading

1. Asset appears in library grid
2. Has a small trash icon (hover to see it)
3. Click asset to use it
4. Search for it by filename
5. Filter by category (video/audio/image)
6. Delete by clicking trash icon

---

## Tips & Tricks

### For Best Results:

- Upload videos under 2 minutes for fast processing
- Use Quick Preview before full render
- Let AI analysis finish before planning
- Click effects/memes in library to auto-add to notes
- Use frame controls (-1F/+1F) for precise caption timing
- Try Before/After slider view for impressive demos

### Common Workflows:

- **Quick Edit**: Upload → Notes → Generate → Render
- **With Memes**: Upload → Click memes → Generate→ Render
- **Detailed Edit**: Upload → Check Timeline → Plan → Edit → Preview → Render

---

## Questions?

**Q: Do presets memes actually exist?**  
A: Currently they're placeholders. To use them, add actual files to `/public/memes/` folder OR just upload your own!

**Q: Can I delete uploaded assets?**  
A: Yes! Hover over uploaded asset → click trash icon

**Q: How do I add a meme to my video?**  
A: Click it in Assets & Memes tab → it adds to Director Notes → edit timestamp → Generate Plan

**Q: What's better - Timeline or Range Selector?**  
A: Timeline! Range Selector was removed because it was redundant.

**Q: Why three tabs?**  
A: Clean separation:

- Tab 1 = Input (what you want)
- Tab 2 = Review (what AI planned)
- Tab 3 = Resources (memes/assets to use)

---

## You're Ready! 🎉

Now you understand:

- ✅ What the timeline does (shows everything visually)
- ✅ Difference between tabs (Notes → Plan → Assets)
- ✅ How to upload memes (Click Upload button in Assets tab)
- ✅ When to use each feature

Happy editing! 🎬
