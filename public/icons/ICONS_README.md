# Icon Generation Instructions

The source SVG icon is located at: `icon.svg`

## Required Icon Files

You need to generate the following PNG files from the SVG:

1. `icon-192.png` - 192x192 pixels
2. `icon-512.png` - 512x512 pixels
3. `icon-maskable.png` - 512x512 pixels (with safe zone)

## Generation Methods

### Method 1: ImageMagick (Recommended)

```bash
# Install ImageMagick if not already installed
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick
# Windows: Download from https://imagemagick.org/

# Generate icons
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png
convert icon.svg -resize 512x512 icon-maskable.png
```

### Method 2: Inkscape

```bash
# Install Inkscape: https://inkscape.org/release/

inkscape icon.svg --export-type=png --export-width=192 --export-filename=icon-192.png
inkscape icon.svg --export-type=png --export-width=512 --export-filename=icon-512.png
inkscape icon.svg --export-type=png --export-width=512 --export-filename=icon-maskable.png
```

### Method 3: Online Tools

1. Go to [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload `icon.svg`
3. Generate and download icons
4. Extract the following files to this directory:
   - `android-chrome-192x192.png` → rename to `icon-192.png`
   - `android-chrome-512x512.png` → rename to `icon-512.png`
   - Use the maskable icon generator for `icon-maskable.png`

### Method 4: GIMP

1. Open GIMP
2. File → Open → Select `icon.svg`
3. Set width/height to 192 or 512
4. Export as PNG

### Method 5: Photoshop

1. Open `icon.svg` in Photoshop
2. Set document size to 192x192 or 512x512
3. Export as PNG-24

## Maskable Icon

The maskable icon should have a safe zone where important content is kept within the center 80% of the canvas.

For the maskable version, you can either:
- Use the same icon (it already has padding)
- Generate with [Maskable.app](https://maskable.app/)

## Verification

After generation, verify:
- [ ] All three PNG files exist in this directory
- [ ] Icons are sharp and clear
- [ ] No transparency issues
- [ ] Colors match the SVG source

## Notes

- The SVG is designed with a safe zone for maskable icons
- All icons use the same quantum timer design
- The cyan/teal glow should be visible in all versions
- Background is dark (matching the Sci-Fi theme)
