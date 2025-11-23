# Video Background Assets

Place theme-specific ambient video backgrounds here.

## Required Files

### Calm Theme - Japanese Tea Garden
- **Filename**: `calm-background.mp4` (and optionally `calm-background.webm`)
- **Optional poster**: `calm-poster.jpg`

**Specifications:**
- Duration: 8 seconds (seamless loop)
- Resolution: 1920x1080 (or 1280x720 for smaller file size)
- Frame rate: 24-30fps
- Codec: H.264 (MP4), VP9 (WebM)
- File size target: < 5MB

**Visual Style:**
- Japanese zen garden atmosphere
- Earth tones: muted greens, tans, stone grays
- Gentle motion: soft rain, water ripples, floating leaves
- Bokeh/soft focus backgrounds
- No harsh movements or sudden changes
- Peaceful, meditative mood

**Example scenes:**
- Rain falling on moss-covered stones
- Koi pond with gentle ripples
- Bamboo swaying in breeze
- Steam rising from tea
- Cherry blossom petals drifting

---

### Sci-Fi Theme - 80s Arcade Mothership
- **Filename**: `scifi-background.mp4` (and optionally `scifi-background.webm`)
- **Optional poster**: `scifi-poster.jpg`

**Specifications:**
- Duration: 8 seconds (seamless loop)
- Resolution: 1920x1080 (or 1280x720 for smaller file size)
- Frame rate: 24-30fps
- Codec: H.264 (MP4), VP9 (WebM)
- File size target: < 5MB

**Visual Style:**
- Synthwave/retrowave aesthetic
- Neon colors: magenta (#ff00ff), cyan (#00ffff), deep purple (#1a0030)
- Grid lines, scan lines, CRT effects
- Slow-moving geometric patterns
- Subtle glow and bloom effects

**Example scenes:**
- Neon grid scrolling toward horizon
- Synthwave sun with scan lines
- Floating geometric shapes with glow
- Starfield with warp effect
- Retro computer terminal effects

---

## Creating Seamless Loops

### Using AI Video Generators
1. Runway ML, Pika, or similar
2. Prompt example for Calm: "Japanese zen garden with gentle rain, moss stones, soft focus, peaceful, 8 second loop"
3. Prompt example for Sci-Fi: "Synthwave neon grid, retrowave, 80s aesthetic, magenta cyan purple, slow motion, 8 second loop"

### Using Stock Video
1. Find ~8 second clip on Pexels, Pixabay, or similar
2. Trim to exact 8 seconds
3. Apply cross-fade at loop point
4. Export with seamless loop

### FFmpeg Commands

**Create seamless loop from longer video:**
```bash
# Extract 8 seconds starting at 10s mark
ffmpeg -i source.mp4 -ss 10 -t 8 -c copy clip.mp4

# Add fade for seamless loop (optional)
ffmpeg -i clip.mp4 -vf "fade=t=out:st=7:d=1" -c:v libx264 -crf 23 output.mp4
```

**Convert to WebM:**
```bash
ffmpeg -i calm-background.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 calm-background.webm
```

**Create poster image:**
```bash
ffmpeg -i calm-background.mp4 -vf "select=eq(n\,0)" -q:v 2 calm-poster.jpg
```

---

## Verification Checklist

- [ ] `calm-background.mp4` exists and plays smoothly
- [ ] `scifi-background.mp4` exists and plays smoothly
- [ ] Videos loop seamlessly (no jump/stutter)
- [ ] File sizes are reasonable (< 5MB each)
- [ ] Videos are muted (no audio track) or audio will be ignored
- [ ] WebM versions created for better compression (optional)
- [ ] Poster images created for loading state (optional)

## Notes

- Videos should be calm/subtle - they're backgrounds, not the focus
- The app applies overlay effects on top of videos
- Reduced motion users won't see videos (accessibility)
- Mobile browsers may not autoplay videos in some cases
