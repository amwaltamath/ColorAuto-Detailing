# Image Integration Guide - ColorAuto

## Directory Structure

Create this structure in your project:

```
public/
└── images/
    ├── logo.png                    # ColorAuto logo
    ├── hero-car.jpg               # Homepage hero background
    ├── shop-exterior.jpg          # Contact page shop photo
    ├── services/
    │   ├── auto-detailing.jpg
    │   ├── paint-protection.jpg
    │   ├── ceramic-coating.jpg
    │   ├── window-tinting.jpg
    │   └── color-ppf.jpg
    ├── gallery/
    │   ├── before-after-1.jpg
    │   ├── before-after-2.jpg
    │   └── showcase-*.jpg
    └── team/
        └── team-photo.jpg
```

## How to Add Images to Each Page

### 1. Homepage Hero Image
**File:** `src/pages/index.astro`
**Location:** Hero section background

```astro
<!-- BEFORE (line ~7) -->
<section class="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20">

<!-- AFTER -->
<section class="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20">
  <div class="absolute inset-0 opacity-30">
    <img src="/images/hero-car.jpg" alt="Professional Car Detailing" class="w-full h-full object-cover" />
  </div>
  <div class="relative z-10">
```

### 2. Service Cards with Images
**File:** `src/pages/index.astro`
**Location:** Services section cards

```astro
<!-- Add to each service card (line ~42-70) -->
<div class="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden">
  <img src="/images/services/auto-detailing.jpg" 
       alt="Auto Detailing Service" 
       class="w-full h-48 object-cover rounded-lg mb-4 -mx-8 -mt-8" />
  <div class="text-4xl mb-4">✨</div>
  <h3 class="text-2xl font-bold mb-3 text-gray-800">Auto Detailing</h3>
  <p class="text-gray-600">
    Professional hand wash, clay treatment...
  </p>
</div>
```

### 3. Services Page Images
**File:** `src/pages/services.astro`
**Location:** Each service section

```astro
<!-- Add to Paint Protection Film section (around line 20) -->
<div class="bg-white p-8 rounded-lg shadow-lg" id="ppf">
  <div class="relative mb-6">
    <img src="/images/services/paint-protection.jpg" 
         alt="Paint Protection Film Installation" 
         class="w-full h-64 object-cover rounded-lg" />
  </div>
  <h2 class="text-2xl font-bold mb-4 text-blue-600">Paint Protection Film</h2>
  ...
</div>
```

### 4. Before/After Gallery
**Create new file:** `src/pages/our-work.astro`

```astro
---
import PublicLayout from '../layouts/PublicLayout.astro';
---

<PublicLayout title="Our Work - ColorAuto">
  <div class="max-w-7xl mx-auto px-4 py-12">
    <h1 class="text-4xl font-bold text-center mb-12">Our Work</h1>
    
    <!-- Gallery Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <img src="/images/gallery/before-after-1.jpg" alt="Detailing Result" class="w-full h-64 object-cover" />
        <div class="p-4">
          <h3 class="font-bold text-lg">Full Detail Service</h3>
          <p class="text-gray-600 text-sm">2024 BMW 3 Series</p>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <img src="/images/gallery/before-after-2.jpg" alt="Ceramic Coating" class="w-full h-64 object-cover" />
        <div class="p-4">
          <h3 class="font-bold text-lg">Ceramic Coating</h3>
          <p class="text-gray-600 text-sm">2023 Tesla Model 3</p>
        </div>
      </div>
      
      <!-- Add more gallery items -->
    </div>
  </div>
</PublicLayout>
```

### 5. Contact Page Shop Photo
**File:** `src/pages/contact.astro`
**Location:** Location section

```astro
<!-- Update the location section (around line 95) -->
<div class="bg-white p-8 rounded-lg shadow-lg">
  <img src="/images/shop-exterior.jpg" 
       alt="ColorAuto Detailing Location" 
       class="w-full h-48 object-cover rounded-lg mb-4" />
  <h3 class="text-2xl font-bold mb-4 text-blue-600">📍 Location</h3>
  <p class="text-gray-700 text-lg font-semibold">ColorAuto Detailing</p>
  ...
</div>
```

### 6. Logo in Navigation
**File:** `src/components/common/Navigation.astro`

```astro
<!-- Replace text logo with image (line ~7) -->
<div class="flex items-center space-x-2">
  <img src="/images/logo.png" alt="ColorAuto" class="h-12" />
  <span class="text-xs text-gray-600 tracking-wider hidden md:block">PROFESSIONAL CAR DETAILING</span>
</div>
```

## Image Optimization Tips

### Recommended Image Sizes
- **Hero images**: 1920x1080px (landscape)
- **Service cards**: 800x600px
- **Gallery photos**: 1200x800px
- **Logo**: 200x200px (PNG with transparency)
- **Thumbnails**: 400x300px

### Compression
- Use tools like TinyPNG, ImageOptim, or Squoosh
- Aim for < 200KB for large images, < 50KB for thumbnails
- Use WebP format for better compression (with JPG fallback)

### Astro Image Component (Advanced)
For automatic optimization, use Astro's Image component:

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/hero-car.jpg'; // Store in src/assets/
---

<Image src={heroImage} alt="Hero" width={1920} height={1080} />
```

## Quick Start Steps

1. **Create directory**: `public/images/` in your project
2. **Add your photos** to the appropriate subdirectories
3. **Reference them** using `/images/filename.jpg` in your `.astro` files
4. **Rebuild**: `npm run build` to verify images load
5. **Test**: Check `http://localhost:4322` to see images

## Example: Adding Your First Image Now

1. Put a photo in: `public/images/hero-car.jpg`
2. Open `src/pages/index.astro`
3. Find line ~7 (the hero section)
4. Add the image as shown in section #1 above
5. Save and refresh your browser

---

Need help with a specific page or image placement? Let me know!
