# 🎬 CutPilot - Complete Testing & Feature Guide

## ✨ All Available Features

### 🎯 Caption System
| Feature | Options | Example |
|---------|---------|---------|
| **Position** | top, center, bottom | "Add caption at the top" |
| **Animation** | fade, slide-left, slide-right, slide-up, slide-down, none | "Slide from left" |
| **Font Size** | Any number (default 72) | fontSize: 100 |
| **Colors** | Any CSS color | fontColor: "yellow", bgColor: "blue@0.5" |
| **Styling** | Border, shadow, background box | Always applied automatically |

### 🎥 Video Operations
| Operation | Description | Prompt Keywords |
|-----------|-------------|-----------------|
| **Remove Silence** | Cuts quiet parts | "remove silence", "cut quiet parts" |
| **Punch-In (Zoom)** | Smooth zoom effect | "zoom in", "punch-in", "zoom effect" |
| **Shake** | Camera shake effect | "shake", "shaky cam" |
| **Blur** | Gaussian blur | "blur", "out of focus" |
| **Glitch** | RGB glitch effect | "glitch", "corrupted" |
| **Bass Boost** | Enhance low frequencies | "bass boost", "more bass" |
| **Trim** | Keep only timeframe | "keep 5-15 seconds", "trim to 10s" |
| **Speed** | Slow-mo or fast forward | "slow motion", "2x speed", "fast forward" |

---

## 📋 Test Scenario 1: Caption Positions

### Director Notes:
```
Show captions in all positions:
- Add "TOP TEXT" at the top at 1 second
- Add "CENTER TEXT" in the center at 3 seconds
- Add "BOTTOM TEXT" at the bottom at 5 seconds
- Remove silence
```

### What to Check:
✅ Each caption appears in correct position  
✅ All have border, shadow, and background box  
✅ Fade in/out animations work  
✅ Text is readable and properly styled  

---

## 📋 Test Scenario 2: Caption Animations

### Director Notes:
```
Demonstrate all animations:
- "FADE IN" with fade animation at 1 second at the top
- "SLIDE LEFT" sliding from the left at 3 seconds at the center
- "SLIDE RIGHT" sliding from the right at 5 seconds at the center
- "SLIDE UP" sliding up at 7 seconds at the bottom
- "SLIDE DOWN" sliding down at 9 seconds at the top
```

### What to Check:
✅ Fade animation: opacity changes from 0 to 1  
✅ Slide-left: text moves from right edge to center  
✅ Slide-right: text moves from left edge to center  
✅ Slide-up: text moves from bottom to position  
✅ Slide-down: text moves from top to position  

---

## 📋 Test Scenario 3: Trim Operation

### Director Notes:
```
Focus on the best part:
- Trim the video to keep only 5 seconds to 15 seconds
- Add caption "Best Part!" at center at 1 second
- Remove silence
```

### What to Check:
✅ Output video is exactly 10 seconds long  
✅ Content matches seconds 5-15 from original  
✅ Caption appears 1 second into trimmed video  
✅ Timing is accurate  

---

## 📋 Test Scenario 4: Speed Changes

### Director Notes:
```
Create varied pacing:
- Play the first 5 seconds in slow motion (half speed)
- Add caption "Slow Motion" at center at 2 seconds
- Then play 5-10 seconds at normal speed
- Then play 10-15 seconds in fast forward (double speed)
- Add caption "Fast!" at bottom at 12 seconds
```

### What to Check:
✅ First part plays at 0.5x speed  
✅ Audio pitch adjusted correctly  
✅ Captions appear at specified times  
✅ Speed changes are smooth  
✅ No audio/video desync  

---

## 📋 Test Scenario 5: Punch-In Zoom (FIXED!)

### Director Notes:
```
Dramatic zoom effect:
- Add caption "Watch closely" at top at 1 second
- Apply a punch-in zoom effect at 2 seconds
- Add caption "See that?" at center at 4 seconds
- Remove silence
```

### What to Check:
✅ Zoom effect starts smoothly at 2s  
✅ No FFmpeg errors (previous issue FIXED)  
✅ Zoom is gradual and professional  
✅ Captions visible during zoom  

---

## 📋 Test Scenario 6: All Effects Demo

### Director Notes:
```
Show all visual effects:
- Add caption "Punch-In" at top at 1s
- Apply punch-in zoom at 1.5s
- Add caption "Shake" at top at 4s
- Apply shake effect at 4.5s
- Add caption "Blur" at top at 7s
- Apply blur at 7.5s
- Add caption "Glitch" at top at 10s
- Apply glitch at 10.5s
- Remove silence
- Boost bass
```

### What to Check:
✅ All effects render without errors  
✅ Each effect is visible and distinct  
✅ Captions announce each effect  
✅ Bass boost audible  
✅ Silence removed  

---

## 📋 Test Scenario 7: Complex Multi-Layer

### Director Notes:
```
Create a professional video:
- Remove all silence first
- Trim to keep 10-40 seconds
- Add opening caption "CUTPILOT DEMO" at center with slide-down at 1s
- Apply punch-in zoom at 2s
- Add caption "AI-Powered" at top with slide-right at 5s
- Apply shake effect at 6s
- Add caption "Video Editing" at bottom with slide-left at 8s
- Apply blur effect briefly at 10s
- Add caption "Made Easy!" at center with fade at 12s
- Speed up the last 5 seconds to 1.5x speed
- Boost bass throughout
```

### What to Check:
✅ All 11 operations complete  
✅ Render time under 2 minutes  
✅ Output looks professional  
✅ No errors in console  
✅ All effects/captions work together  

---

## 📋 Test Scenario 8: Custom Styling

### Director Notes:
```
Create a custom styled caption:
- Add a large yellow caption "CUSTOM STYLE" at the center at 2 seconds with no animation
```

Then modify the generated plan JSON before rendering to set:
```json
{
  "params": {
    "text": "CUSTOM STYLE",
    "position": "center",
    "animation": "none",
    "fontSize": 100,
    "fontColor": "yellow",
    "bgColor": "red@0.8"
  }
}
```

### What to Check:
✅ Yellow text on red background  
✅ Larger font size (100px)  
✅ No animation (instant appear)  
✅ Still has border and shadow  

---

## 🐛 Troubleshooting Guide

### ❌ Render Fails
1. **Check terminal logs**: Look for `[render_xxx]` prefixed messages
2. **Check browser console**: F12 → Console tab for errors
3. **Common causes**:
   - Invalid time ranges (start >= end)
   - Missing video file
   - FFmpeg not found (should auto-install via npm)

### ❌ Captions Don't Appear
1. **Timing issue**: Caption times must be within video duration
2. **Text parsing**: Check if AI extracted correct text from prompt
3. **Check generated plan**: Open DevTools → Application → Local Storage → check draft plan

### ❌ Punch-In Effect Fails
- ✅ **FIXED** in latest version!
- If still failing: Check FFmpeg version supports zoompan filter
- Fallback: Try using "zoom" keyword instead of "punch-in"

### ❌ Trim Operation Cuts Wrong Part
- Remember: startSec/endSec define what to **KEEP**, not what to remove
- "Trim 5-15s" = Keep only seconds 5 through 15

### ❌ Speed Change Causes Audio Issues
- Very slow (<0.25x) or very fast (>4x) may have audio artifacts
- Keep speeds between 0.5x and 2.0x for best results

---

## ✅ Success Checklist

Before considering a test successful, verify:

- [ ] Green success banner appears after render
- [ ] Download button becomes available
- [ ] Downloaded video plays in media player
- [ ] No errors in browser console
- [ ] No errors in terminal logs
- [ ] All requested effects visible in output
- [ ] All captions appear with correct text
- [ ] Timing is accurate (±0.5s acceptable)
- [ ] Audio quality preserved
- [ ] Video quality acceptable

---

## 🎯 Performance Benchmarks

Expected render times (approximate):
- **30s video, 1-2 operations**: 10-20 seconds
- **60s video, 3-5 operations**: 30-60 seconds
- **120s video, 5-10 operations**: 1-3 minutes
- **Complex multi-effect**: 2-5 minutes

If renders take significantly longer, check:
- Video resolution (4K videos take much longer)
- Number of operations (each adds processing time)
- System resources (CPU/RAM usage)

---

## 📊 What Each Operation Does (Technical)

| Operation | FFmpeg Filter | Processing Time |
|-----------|---------------|-----------------|
| Remove Silence | silencedetect + trim + concat | Medium (depends on video length) |
| Punch-In | zoompan | Medium |
| Shake | crop with sin/cos | Fast |
| Blur | gblur | Fast |
| Glitch | hue + eq | Fast |
| Bass Boost | equalizer | Fast |
| Caption | drawtext | Fast |
| Trim | setpts | Fast |
| Speed | setpts + atempo | Medium |

---

## 🚀 Quick Start Test

**Fastest way to verify everything works:**

1. Upload ANY video (even a short test clip)
2. Paste this into Director Notes:
```
Test all features:
- Add caption "CUTPILOT WORKS!" at center at 2 seconds
- Remove silence
- Add a punch-in zoom at 3 seconds
```
3. Click "Generate Edit Plan"
4. Click "Render Video"
5. Wait for green success banner
6. Download and play

**Expected result in ≤1 minute:**
✅ Rendered video with caption, zoom, and no silence

---

## 🎓 Understanding the AI

### What the AI Can Do:
- Parse natural language requests
- Extract timing information ("at 5 seconds")
- Detect caption text and position
- Understand effect keywords
- Generate valid operation JSON

### What the AI Can't Do:
- Preview the video content (it's blind to visual content)
- Guarantee perfect timing (uses your time specifications)
- Create complex custom effects not in the list
- Edit based on video content analysis (yet!)

### Pro Tips for Best Results:
1. **Be specific about timing**: "at 5 seconds" not "early on"
2. **Name caption text explicitly**: "Add caption 'Hello'" not "add text"
3. **Use keywords**: "punch-in", "slide-left", etc.
4. **Specify position**: "at the top" vs "at the bottom"
5. **One instruction per line** for clarity

---

## 🎬 Sample Director Notes (Copy-Paste Ready)

### For YouTube Intro:
```
Create an engaging intro:
- Add caption "WELCOME TO MY CHANNEL" at the top with slide-down at 1 second
- Apply punch-in zoom at 1.5 seconds
- Add caption "SUBSCRIBE!" at the bottom with slide-up at 3 seconds
- Remove any silence
- Boost the bass for impact
```

### For Tutorial Video:
```
Clean up this tutorial:
- Remove all silence and pauses
- Add caption "Step 1: Setup" at the top at 5 seconds
- Add caption "Step 2: Configure" at the top at 15 seconds
- Add caption "Step 3: Deploy" at the top at 25 seconds
- Trim to keep only 0-40 seconds
```

### For Social Media Clip:
```
Make this viral ready:
- Trim to keep only the best 15 seconds (10s to 25s)
- Add caption "WATCH THIS!" at the center with fade at 1 second
- Apply punch-in zoom at 2 seconds
- Add caption "AMAZING!" at the bottom with slide-left at 8 seconds
- Speed up to 1.5x for the last 5 seconds
- Remove silence
- Boost bass
```

### For Music Video:
```
Create a cool music effect:
- Add caption "NOW PLAYING" at the top at 1 second
- Apply shake effect at 5 seconds
- Apply blur at 10 seconds
- Apply glitch at 15 seconds
- Add caption "ARTIST NAME" at the bottom at 20 seconds with slide-right
- Boost bass throughout
```

---

**Ready to test? Open http://localhost:3000 and start creating! 🚀**
