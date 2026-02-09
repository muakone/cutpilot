# 🎬 CutPilot - AI Video Editor

**Transform raw videos into platform-ready content using natural language.**

CutPilot is an AI-powered video editor that understands plain English instructions. No complex timelines or tools—just describe what you want, and let the AI do the editing.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Google Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-orange)](https://ai.google.dev)

---

## ✨ Features

### 🤖 AI-Powered Editing

- **Natural Language Processing**: "Make it viral", "Add captions", "Remove silence"
- **Smart Suggestions**: AI recommends edits based on video context
- **Quick Actions**: One-click presets for common tasks

### 🎨 Visual Effects

- **Color Grading**: 8 presets (warm, cool, vintage, cinematic, vibrant, faded, high-contrast, B&W)
- **Captions**: Animated text overlays with fade effects
- **Image Overlays**: Memes, logos, emojis with position control
- **Video Overlays**: Animated emoji reactions (🤔🔥💀😂)

### 🎵 Audio Features

- **Sound Effects**: 8 built-in sounds (applause, boom, whoosh, laugh, suspense, cheer)
- **Audio Overlays**: Add music or SFX at specific timestamps
- **Volume Control**: Adjust audio levels for perfect mixing

### ⚡ Smart Editing Tools

- **Auto Silence Removal**: Detect and cut silent parts
- **Speed Control**: Slow-mo or fast-forward
- **Trim & Cut**: Extract specific segments
- **Timeline Visualization**: See all edits in context

### 📱 Platform Export

- **TikTok/Reels**: 9:16 vertical (1080x1920, 30fps)
- **YouTube Shorts**: Optimized for short-form
- **YouTube**: 16:9 horizontal (1080p/720p)
- **Instagram Stories**: Vertical format

### 🎯 Iterative Editing

- **Multiple Drafts**: Create 3 different edit versions
- **Edit Operations**: Refine timing and parameters
- **Before/After**: Compare original vs edited
- **Auto-Save**: localStorage persistence

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- FFmpeg installed on your system
- Google Gemini API key

```bash
# Install FFmpeg (Windows with Chocolatey)
choco install ffmpeg

# Install FFmpeg (macOS with Homebrew)
brew install ffmpeg

# Install FFmpeg (Ubuntu/Debian)
sudo apt install ffmpeg
```

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd cutpilot-ui
npm install
```

2. **Set up environment variables:**

```bash
# Create .env.local file
echo "GEMINI_API_KEY=your_api_key_here" > .env.local
```

Get your API key from: https://aistudio.google.com/apikey

3. **Run the development server:**

```bash
npm run dev
```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 Usage Guide

### Basic Workflow

1. **Upload Video**
   - Click "Choose Video" or drag & drop
   - Supported formats: MP4, MOV, WebM, AVI
   - Max recommended size: 500MB

2. **Add Instructions**
   - Type natural language: "Add captions at the center"
   - Use Quick Actions for common tasks
   - Select memes/sounds from the library

3. **Generate Plan**
   - AI analyzes video and creates edit plan
   - Review planned operations
   - Edit timing or remove unwanted edits

4. **Render Video**
   - Click "Render Video"
   - Watch progress in real-time
   - Download final result

### Example Instructions

**Viral Social Media Content:**

```
Make it viral and engaging for TikTok
```

**Professional Polish:**

```
Make it cinematic with color grading, remove silence
```

**Comedy Edits:**

```
Add vine boom at funny moments, add laughing emoji
```

**Tutorial Enhancement:**

```
Add captions throughout, make text center, remove silence
```

**Time-Specific Edits:**

```
Add applause sound at 0:15, zoom in from 0:20 to 0:30, add "AMAZING" caption at 0:25
```

---

## 🎮 Quick Actions

| Button          | Effect                                     |
| --------------- | ------------------------------------------ |
| ✨ Make Viral   | Captions + color grading + silence removal |
| 💬 Add Captions | Auto-generate caption placeholders         |
| 🎬 Cinematic    | Professional color grading                 |
| ✂️ Clean Up     | Remove silence and polish                  |
| 😂 Make Funny   | Add sound effects at key moments           |
| 📱 TikTok Ready | Optimize for vertical social media         |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **AI**: Google Gemini 2.5 Flash
- **Video Processing**: FFmpeg, fluent-ffmpeg
- **UI**: Tailwind CSS v4, Radix UI, Framer Motion
- **Storage**: localStorage (client-side), file-based videos
- **Database**: Prisma + SQLite (optional)

---

## 📁 Project Structure

```
cutpilot-ui/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── analyze/   # Video analysis
│   │   │   ├── plan/      # AI plan generation
│   │   │   ├── render/    # Video rendering
│   │   │   └── export/    # Platform export
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/
│   │   ├── DirectorNotesPanel.tsx  # Main UI
│   │   ├── VideoUpload.tsx         # Upload handler
│   │   └── MemeAssetLibrary.tsx    # Asset browser
│   └── lib/
│       ├── geminiPlanner.ts        # AI prompt builder
│       ├── ffmpegProcessor.ts      # Video processing
│       ├── platformPresets.ts      # Export formats
│       └── editPlanSchema.ts       # Type definitions
├── public/
│   └── uploads/           # Video storage
└── prisma/
    └── schema.prisma      # Database schema
```

---

## 🎯 Supported Operations

| Operation        | Description         | Parameters                                 |
| ---------------- | ------------------- | ------------------------------------------ |
| `captions`       | Add text overlays   | text, position, animation, fontSize, color |
| `overlay_image`  | Add images/memes    | imagePath, position, scale                 |
| `overlay_video`  | Add video memes     | videoPath, position, scale                 |
| `overlay_audio`  | Add sound effects   | audioPath, volume, loop                    |
| `color_grade`    | Apply color filters | preset, intensity                          |
| `remove_silence` | Cut silent parts    | thresholdDb, minSilence                    |
| `trim`           | Extract segment     | startSec, endSec                           |
| `change_speed`   | Slow-mo/fast        | speed (0.5-2.0)                            |
| `zoom_in/out`    | Camera zoom         | level (1.2-2.0)                            |
| `effect`         | Visual effects      | strength (0-100)                           |

---

## 🐛 Known Issues

- **FFmpeg 99% Hang**: Rendering may hang at 99% on certain systems
  - Workaround: Use MP4 input instead of WebM
  - Check FFmpeg is properly installed: `ffmpeg -version`
- **Large Files**: Videos >500MB may be slow
  - Recommendation: Compress before uploading

- **Windows Fonts**: Caption rendering may fail if fonts missing
  - Install Arial or use system fonts

---

## 🎨 Asset Library

### Built-in Sounds

- 🎉 Applause
- 💥 Dramatic Boom
- 💨 Whoosh
- 🎯 Vine Boom
- 😂 Laugh Track
- 🎵 Suspense
- 🎊 Cheer
- ❌ Error Beep

### Built-in Video Memes

- 🤔 Thinking Emoji
- 🔥 Fire Emoji
- 💀 Skull Emoji
- 😂 Crying Emoji

_All assets use free CDN sources (Mixkit, Tenor)_

---

## 🚢 Deployment

See [HOSTING_GUIDE.md](./HOSTING_GUIDE.md) for production deployment instructions.

**Quick Deploy to Vercel:**

```bash
npm run build
vercel deploy
```

**Environment Variables Required:**

- `GEMINI_API_KEY`: Your Google Gemini API key

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- Google Gemini AI for natural language processing
- FFmpeg for video processing
- Mixkit for free sound effects
- Tenor for emoji animations

---

## 📞 Support

- Documentation: See `PROJECT_OVERVIEW.md`
- Testing Guide: See `TEST_INSTRUCTIONS.md`
- Issues: Open a GitHub issue

---

**Made with ❤️ for creators who want to edit videos as easily as they chat**
