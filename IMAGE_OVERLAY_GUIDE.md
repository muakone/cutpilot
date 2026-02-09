# Image Overlay Feature Guide

## What's New

✅ **Image Overlay Support** - You can now add images/memes as overlays on your videos!
✅ **Time Format Parsing** - Use both seconds (240) or MM:SS format (4:00)
✅ **Better Asset Integration** - Clicking assets adds properly formatted instructions

## How to Use

### Method 1: Click an Asset (EASIEST!)

1. Go to the **Assets & Memes** tab
2. Click any image (e.g., Surprised Pikachu, Drake meme, or upload your own)
3. The instruction will be auto-added with the file path:
   ```
   Add image "surprised_pikachu.png" (path: /memes/surprised_pikachu.png) at 0:00 - 0:10
   ```
4. **Edit the times** to your desired start and end (e.g., change to `4:00 - 5:30`)
5. Click **Generate Plan**

### Method 2: Type Instructions Manually

You can type instructions in the Director Notes field:

```
Add image "barcode-BC-MJ2MRYN1-UHG.png" at 4:00 - 5:30
```

Or include the path:

```
Add image "mylogo.png" (path: /uploads/mylogo.png) at 0:00 - 10:00
```

Or for the punch effect:

```
do the punch feature at 6:00 to 7:00
```

### Time Format Examples

- **Seconds**: `240` (4 minutes)
- **MM:SS**: `4:00` (4 minutes)
- **MM:SS with seconds**: `5:30` (5 minutes 30 seconds)
- **Ranges**: `4:00 - 5:30` or `240 - 330`

### Position Options (Optional)

By default, images appear in the **top-right corner** at 30% scale. You can specify position:

```
Add image "meme.png" at 2:00 - 3:00 (center)
Add image "logo.png" at 0:00 - 10:00 (bottom-left)
```

Available positions:

- `top-right` (default)
- `top-left`
- `bottom-right`
- `bottom-left`
- `center`

## Your Example Instructions

Based on your request:

```
Add image "barcode-BC-MJ2MRYN1-UHG.png" at 4:00 - 5:30
do the punch feature at 6:00 to 7:00
```

This will:

1. Add the barcode image overlay from 4 minutes to 5 minutes 30 seconds (240s - 330s)
2. Apply the punch-in zoom effect from 6 minutes to 7 minutes (360s - 420s)

## Technical Details

### Image Overlay Parameters

The AI generates operations like this:

```json
{
  "id": "img1",
  "startSec": 240,
  "endSec": 330,
  "op": "overlay_image",
  "label": "Image: barcode-BC-MJ2MRYN1-UHG.png",
  "params": {
    "imagePath": "/uploads/barcode-BC-MJ2MRYN1-UHG.png",
    "position": "top-right",
    "scale": 0.3
  },
  "status": "planned"
}
```

### Punch Effect Parameters

```json
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
```

## Troubleshooting

### "Nothing happens when I click an asset"

- Make sure you're in the **Assets & Memes** tab
- Check the Director Notes field - the text should be added there
- Look for the green notification that says "Added '[filename]' to your edit instructions!"

### "AI doesn't understand my instruction"

- Use the format: `Add image "filename.png" at MM:SS - MM:SS`
- Make sure the filename matches exactly (include the extension)
- Try simplifying: `Add image "barcode.png" at 4:00 - 5:30`

### "Image doesn't appear in the video"

- Verify the image was uploaded to `/public/uploads/`
- Check the console for any FFmpeg errors
- Make sure the time range is within your video duration

## Next Steps

1. Upload your video
2. Click an image asset OR type your instruction
3. Edit the times (change `0:00 - 0:10` to your desired range like `4:00 - 5:30`)
4. Add more instructions on new lines (punch effect, text, etc.)
5. Click **Generate Plan**
6. Review the operations in the Edit Plan tab
7. Click **Render Video**

Enjoy your enhanced video with image overlays! 🎬✨
