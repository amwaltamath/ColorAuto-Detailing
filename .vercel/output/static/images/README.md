# Images Directory

## How to Add Photos

1. **Place your image files in the appropriate folders below**
2. **Reference them in your .astro files** using `/images/folder/filename.jpg`

## Directory Structure

```
images/
├── logo.png                    # Your ColorAuto logo
├── hero-car.jpg               # Homepage background (1920x1080)
├── shop-exterior.jpg          # Your shop location photo
│
├── services/                   # Service-related photos
│   ├── auto-detailing.jpg
│   ├── paint-protection.jpg
│   ├── ceramic-coating.jpg
│   ├── window-tinting.jpg
│   └── color-ppf.jpg
│
├── gallery/                    # Before/after and showcase photos
│   ├── before-after-1.jpg
│   ├── before-after-2.jpg
│   ├── showcase-1.jpg
│   └── showcase-2.jpg
│
└── team/                       # Team member photos
    └── team-photo.jpg
```

## Recommended Image Sizes

- **Logo**: 200x200px (PNG with transparency)
- **Hero/Background**: 1920x1080px
- **Service Cards**: 800x600px
- **Gallery**: 1200x800px
- **Thumbnails**: 400x300px

## Usage Examples

### In Homepage (src/pages/index.astro)
```astro
<img src="/images/services/auto-detailing.jpg" alt="Auto Detailing" />
```

### In Services Page
```astro
<img src="/images/services/paint-protection.jpg" alt="Paint Protection Film" />
```

### In Navigation (for logo)
```astro
<img src="/images/logo.png" alt="ColorAuto" class="h-12" />
```

## Next Steps

1. Add your photos to the folders above
2. Check the IMAGE_GUIDE.md in the project root for detailed integration instructions
3. Update your pages to reference the images

---

**Tip**: Compress images before uploading (use TinyPNG.com or similar) to keep your site fast!
