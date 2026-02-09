# CutPilot Video Editor - Comprehensive Testing Guide

## 🎬 New Features Summary

### ✨ Enhanced Caption System
- **Positioning**: top, center, bottom
- **Animations**: fade, slide-left, slide-right, slide-up, slide-down, none
- **Styling**: Custom font size, colors, background
- **Professional effects**: Border, shadow, background box

### 🎥 Video Operations
- **Trim/Cut**: Keep only specific timeframes
- **Speed Control**: Slow motion (0.5x) or fast forward (2.0x)
- **Punch-In Zoom**: Fixed and working smoothly
- **Effects**: shake, blur, glitch, bass-boost

---

## 📋 Test Scenario 1: Caption Positioning

### Director Notes:
```
Create an intro sequence:
- Add caption "CUTPILOT" at the top at 1 second
- Add caption "AI-Powered Video Editor" in the center at 3 seconds  
- Add caption "Made with ❤️" at the bottom at 5 seconds
- Remove any silence
```

### Expected Result:
- Three captions appear in different positions
- All have professional styling (border, shadow, background)
- Default fade animation applied
- Silence removed

---

## 📋 Test Scenario 2: Caption Animations

### Director Notes:
```
Add dynamic text animations:
- "Watch This!" slides in from the left at 2 seconds
- "Amazing!" slides down from the top at 5 seconds
- "Subscribe!" slides in from the right at 8 seconds
- Add a punch-in zoom effect at 2.5 seconds
```

### Expected Result:
- First caption slides from left edge to center
- Second caption slides from top to center
- Third caption slides from right edge to center
- Zoom effect works smoothly
- All captions fade out after showing

---

## 📋 Test Scenario 3: Trim & Cut

### Director Notes:
```
Keep only the interesting part:
- Trim the video to keep only 5 seconds to 15 seconds
- Add caption "Highlights" at the center at 1 second (of trimmed video)
- Remove silence from the trimmed portion
```

### Expected Result:
- Video is 10 seconds long (15-5=10)
- Only timeframe 5s-15s from original video is kept
- Caption appears 1 second into the trimmed video
- Silence removed

---

## 📋 Test Scenario 4: Speed Control

### Director Notes:
```
Create a dynamic paced video:
- Keep the first 10 seconds at normal speed
- Show 10-15 seconds in slow motion (half speed)
- Fast forward 15-20 seconds (double speed)
- Add caption "Slow-Mo" at the center at 10 seconds
- Add caption "Fast!" at the bottom at 15 seconds  
```

### Expected Result:
- First 10 seconds play normally
- Next section plays in slow motion
- Final section plays at double speed
- Captions appear at specified times
- Audio pitch adjusted with speed

---

## 🐛 Troubleshooting

### If render fails:
1. **Check terminal logs**: Look for `[render_xxx]` messages
2. **Check browser console**: Press F12 → Console tab
3. **Common issues**:
   - FFmpeg not installed: Should be auto-installed via npm
   - Invalid time ranges: Check start < end times
   - Missing video: Upload video first

### If captions don't appear:
1. Check timing: Caption times must be within video duration
2. Check text: Special characters need escaping (handled automatically)
3. Check render logs: Look for "Text overlay" progress messages

### If UI doesn't update:
1. Check localStorage: Open DevTools → Application → Local Storage
2. Verify draft persistence: Switch between Draft 1/2/3
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## ✨ Advanced Testing

### Test Caption Styling Variations
Modify `addTextOverlay()` in `/src/lib/ffmpegProcessor.ts`:
- Change `fontsize=72` for different text sizes
- Change `y=h-h/4` to `y=(h-text_h)/2` for center position
- Change `boxcolor=black@0.7` to `boxcolor=blue@0.6` for colored box
- Adjust `borderw=3` for thicker/thinner borders

### Test Effect Combinations
Try these combinations:
- Punch-in + Caption at same time
- Shake + Caption + Blur
- Multiple captions overlapping (not recommended but should work)

---

## 📊 Expected Console Output

During rendering, you should see:
```
[render_1234567890_abc123] Starting video processing...
[render_1234567890_abc123] Operations: [array of operations]
[render_1234567890_abc123] Progress: 10% - Remove Silence
[render_1234567890_abc123] Progress: 45% - Text Overlay
[render_1234567890_abc123] Progress: 75% - Punch-in
[render_1234567890_abc123] Progress: 100% - Finalizing
[render_1234567890_abc123] Processing completed successfully
```

---

## 🎯 Success Criteria

✅ Video uploads without errors  
✅ AI generates edit plan with captions  
✅ Render completes successfully  
✅ Green success banner appears  
✅ Download button works  
✅ Rendered video plays correctly  
✅ Captions appear with styling:
  - Large white text with black border
  - Drop shadow for depth
  - Semi-transparent black background box
  - Smooth fade in/out animations
  - Positioned at bottom-center

✅ All effects work without FFmpeg errors  
✅ Progress tracking updates in real-time  
✅ Error messages display clearly if issues occur

---

## 🚀 Next Features to Test (Future)

- Manual caption editor (GUI for adding captions)
- Caption position presets (top, middle, bottom)
- Font selection (Arial, Impact, Comic Sans, etc.)
- Color picker for text and background
- Multiple caption tracks
- Caption templates (intro, outro, lower-thirds)
- Animated captions (slide, bounce, typewriter)

---

**Happy Testing! 🎉**

If you encounter any issues, check the terminal logs and browser console first.
