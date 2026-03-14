import { useState, useRef, useCallback, useEffect } from 'react';

const PPF_COLORS = [
  { key: 'yellow', name: 'Yellow', hex: '#f1ce42' },
  { key: 'orange', name: 'Molten Orange', hex: '#e68508' },
  { key: 'red', name: 'Monza Red', hex: '#dd2911' },
  { key: 'gray', name: 'Heritage Grey', hex: '#afafaf' },
  { key: 'green', name: 'Moss Green', hex: '#515745' },
  { key: 'black', name: 'Obsidian Black', hex: '#1a1a1a' },
  { key: 'beach_blue', name: 'South Beach Blue', hex: '#02bac7' },
  { key: 'plum', name: 'Ultra Plum', hex: '#33132c' },
  { key: 'silver', name: 'Bond Silver', hex: '#b4b4b4' },
  { key: 'white', name: 'Pearl White', hex: '#f0f0f0' },
  { key: 'abyss_blue', name: 'Abyss Blue', hex: '#021635' },
  { key: 'battle_green', name: 'Battle Green', hex: '#0a3608' },
  { key: 'satin_midnight', name: 'Satin Midnight', hex: '#252525' },
  { key: 'satin_thermal', name: 'Satin Thermal Beige', hex: '#bbad60' },
  { key: 'gray_black', name: 'Grey Black', hex: '#858585' },
  { key: 'satin_tarmac', name: 'Satin Tarmac', hex: '#3a3a3a' },
];

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

// sRGB luminance
function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export default function ColorPPFVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<typeof PPF_COLORS[0] | null>(null);
  const [intensity, setIntensity] = useState(70);
  const [hasImage, setHasImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_DIMENSION = 1200;

  const drawOriginal = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
  }, []);

  const applyColor = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img || !selectedColor) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw original image first
    drawOriginal();

    const w = canvas.width;
    const h = canvas.height;

    // Get the original image pixels
    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    const [cr, cg, cb] = hexToRgb(selectedColor.hex);
    const blend = intensity / 100;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (a < 10) continue; // skip fully transparent

      // Get pixel luminance to preserve lighting/shadows
      const lum = luminance(r, g, b) / 255;

      // Tint: blend original with the target color scaled by luminance
      const tintR = cr * lum;
      const tintG = cg * lum;
      const tintB = cb * lum;

      // Mix original and tinted based on intensity
      pixels[i] = Math.round(r * (1 - blend) + tintR * blend);
      pixels[i + 1] = Math.round(g * (1 - blend) + tintG * blend);
      pixels[i + 2] = Math.round(b * (1 - blend) + tintB * blend);
    }

    ctx.putImageData(imageData, 0, 0);
  }, [selectedColor, intensity, drawOriginal]);

  useEffect(() => {
    if (hasImage && selectedColor) {
      applyColor();
    } else if (hasImage) {
      drawOriginal();
    }
  }, [hasImage, selectedColor, intensity, applyColor, drawOriginal]);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setHasImage(true);
        setSelectedColor(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadImage(file);
  }, [loadImage]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  }, [loadImage]);

  const handleReset = () => {
    setHasImage(false);
    setSelectedColor(null);
    setFileName('');
    originalImageRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `colorppf-${selectedColor?.key || 'preview'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Upload Area */}
      {!hasImage && (
        <div
          className={`border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-700">
                {isDragging ? 'Drop your photo here' : 'Upload a photo of your vehicle'}
              </p>
              <p className="text-gray-500 mt-1">Drag & drop or click to browse</p>
              <p className="text-sm text-gray-400 mt-2">JPG, PNG, or WebP • Max 10MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Visualizer */}
      {hasImage && (
        <div className="space-y-6">
          {/* Canvas / Preview */}
          <div className="bg-gray-100 rounded-2xl p-4 flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto rounded-xl shadow-lg"
              style={{ maxHeight: '500px' }}
            />
          </div>

          {/* File info + actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500 truncate max-w-xs">{fileName}</p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Upload New Photo
              </button>
              {selectedColor && (
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition"
                >
                  Download Preview
                </button>
              )}
            </div>
          </div>

          {/* Color Selection */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Choose a Color PPF</h3>
            <p className="text-sm text-gray-500 mb-4">Select a color to preview on your vehicle</p>

            <div className="flex flex-wrap gap-3 mb-6">
              {PPF_COLORS.map((color) => (
                <button
                  key={color.key}
                  onClick={() => setSelectedColor(color)}
                  title={color.name}
                  className={`group relative w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                    selectedColor?.key === color.key
                      ? 'border-orange-500 ring-2 ring-orange-300 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {selectedColor?.key === color.key && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-5 h-5 drop-shadow-md" fill="none" stroke={luminance(...hexToRgb(color.hex)) > 128 ? '#000' : '#fff'} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>

            {selectedColor && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Selected: <span className="text-orange-600">{selectedColor.name}</span>
                  </span>
                  <button
                    onClick={() => { setSelectedColor(null); drawOriginal(); }}
                    className="text-sm text-gray-500 hover:text-gray-700 transition"
                  >
                    Clear color
                  </button>
                </div>
                <div>
                  <label className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Color Intensity</span>
                    <span className="font-medium">{intensity}%</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-gray-400">
            This is a digital preview for reference only. Actual Color PPF results may vary. Visit us for physical samples.
          </p>
        </div>
      )}
    </div>
  );
}
