# 🧪 Quick Testing Guide for New Features

## Testing Order

### 1. Test Punch-In Effect Fix

1. Upload a video
2. In Director Notes, type: `"Add a punch-in effect at 5 seconds"`
3. Click "Generate Plan"
4. Check operations list - should see "effect: punch-in" operation
5. Click "Render Video"
6. Watch rendered video - zoom should apply at specified time only

**Expected Result**: Smooth zoom-in effect at 5 seconds only, not throughout entire video

---

### 2. Test Timeline Visualization

1. After uploading video, wait for auto-analysis
2. Scroll down to "Timeline" section (below video player)
3. You should see:
   - Colored segments (different content sections)
   - Gray bars (silence regions)
   - Purple/colored bars (applied operations)
   - Red playhead cursor
4. Click on timeline - video should jump to that time
5. Click zoom in (+) button - timeline should expand
6. Use frame-by-frame buttons (-1F, +1F)

**Expected Result**: Visual timeline showing all layers, clickable, zoomable

---

### 3. Test Frame-by-Frame Scrubbing

1. In video player controls (at bottom of video)
2. Look for `-1F` and `+1F` buttons
3. Click them - video should advance/rewind by single frames
4. Notice time changes by ~0.03 seconds (1/30th second)

**Expected Result**: Precise frame-by-frame control

---

### 4. Test Quick Preview

1. Upload video and generate a plan with operations
2. Look for "Quick Preview" card (below timeline)
3. Adjust "Preview Duration" slider (5-30s)
4. Adjust "Start Time" slider
5. Click "Generate Preview"
6. Watch progress bar
7. Preview video should appear when done
8. Click "Download Preview" to save

**Expected Result**: Short preview clip with only relevant operations applied

---

### 5. Test Before/After Comparison

1. Upload video
2. Generate plan and render full video
3. Look for "Before/After Comparison" card
4. Try all three modes:
   - **Slider**: Drag divider left/right
   - **Split**: See both videos side-by-side
   - **Tabs**: Switch between before/after
5. Click play/pause - both videos should sync
6. Click reset - both should restart

**Expected Result**: Smooth comparison with synchronized playback

---

### 6. Test Meme & Asset Library

1. In right column tabs, click "Memes" tab
2. Browse preset memes (Vine Boom, Coffin Dance, etc.)
3. Click search bar - try searching "boom"
4. Switch between category tabs (All, Videos, Audio, Images)
5. Click "Upload" button - select local file
6. Uploaded file should appear in library
7. Click any asset - check console log for "Selected asset"

**Expected Result**: 8 preset memes + ability to upload custom assets

---

## Quick Demo Script

### 30-Second Demo:

```
"Watch this - I upload a video [drag & drop],
AI analyzes it automatically [point to timeline segments],
I add a meme from our library [open meme tab, click Vine Boom],
generate a plan with AI [type notes, click generate],
preview just 10 seconds to test [show quick preview],
render the full video [show progress],
and compare before/after with this cool slider [drag comparison slider]"
```

### Full 2-Minute Demo:

1. **Problem** (15s): "Manual video editing takes hours"
2. **Upload** (15s): Drag video, show instant analysis
3. **Timeline** (20s): Point out segments, silence, zoom in
4. **Memes** (20s): Open library, show preset memes
5. **AI Planning** (20s): Type notes, generate plan
6. **Preview** (15s): Quick 10s preview
7. **Render** (10s): Full render with progress
8. **Comparison** (20s): Before/after slider demo

---

## Common Issues & Solutions

### Issue: Timeline not showing

**Solution**: Make sure video is uploaded and analyzed. Check `analysisResults` exists.

### Issue: Punch-in still not working

**Solution**: Clear browser cache, restart dev server (`npm run dev`)

### Issue: Quick preview fails

**Solution**: Ensure operations exist in current plan before generating preview

### Issue: Meme library empty

**Solution**: The presets are placeholders. Add actual files to `/public/memes/` folder or just use upload feature

### Issue: Comparison shows "Render video first"

**Solution**: You need to render a video before comparison will work

---

## Browser Console Commands

Check if components loaded:

```javascript
// Check localStorage
console.log(localStorage.getItem("cutpilot_uploadedVideo"));
console.log(localStorage.getItem("cutpilot_analysis"));
console.log(localStorage.getItem("cutpilot_draft1Plan"));
```

---

## File Structure Check

Make sure these files exist:

```
src/components/
  ├── VideoTimeline.tsx          ✅ NEW
  ├── QuickPreview.tsx           ✅ NEW
  ├── BeforeAfterComparison.tsx  ✅ NEW
  ├── MemeAssetLibrary.tsx       ✅ NEW
  └── DirectorNotesPanel.tsx     ✅ MODIFIED

src/lib/
  └── ffmpegProcessor.ts         ✅ MODIFIED (punch-in fix)
```

---

## Performance Notes

- **Timeline Zoom**: Works best with videos under 2 minutes
- **Quick Preview**: Faster than full render (processes only selected segment)
- **Comparison**: Both videos load simultaneously - may take a moment
- **Meme Library**: Thumbnails generate automatically for uploaded videos

---

## Testing Checklist

- [ ] Punch-in effect applies only at specified time
- [ ] Timeline shows segments, silence, operations
- [ ] Timeline zoom works (1x to 10x)
- [ ] Frame-by-frame buttons work (-1F, +1F)
- [ ] Quick preview generates correctly
- [ ] Preview only applies operations in time window
- [ ] Before/after comparison in all 3 modes
- [ ] Comparison videos play in sync
- [ ] Meme library shows 8 presets
- [ ] Can upload custom assets
- [ ] Can search/filter memes
- [ ] All tabs work (Notes, Plan, Library, Memes)

---

## Ready for Hackathon? ✅

If all tests pass, you're ready to present! 🎉

---

## Demo Tips

1. **Have a good test video ready**: 30-60 seconds, with some silence
2. **Pre-practice the demo**: Know where to click
3. **Start dev server early**: `npm run dev`
4. **Check browser console**: Make sure no errors
5. **Have backup plan**: If live demo fails, have screenshots/video recording

Good luck! 🚀
