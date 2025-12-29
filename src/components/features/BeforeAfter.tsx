import React, { useRef, useState, useEffect } from 'react';

type BeforeAfterProps = {
  beforeSrc: string;
  afterSrc: string;
  alt?: string;
  initialSplit?: number; // 0..1
};

export default function BeforeAfter({ beforeSrc, afterSrc, alt = 'Before / After', initialSplit = 0.5 }: BeforeAfterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(initialSplit);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const stopDrag = () => setDragging(false);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
    };
  }, []);

  const updateSplitFromEvent = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    setSplit(x / rect.width);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    updateSplitFromEvent(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    updateSplitFromEvent(e.clientX);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    updateSplitFromEvent(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    updateSplitFromEvent(e.touches[0].clientX);
  };

  const handleXPercent = `${Math.round(split * 100)}%`;

  return (
    <div className="w-full" aria-label={alt}>
      <div
        ref={containerRef}
        className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg bg-gray-200 select-none"
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
      >
        {/* After image as base */}
        <img src={afterSrc} alt={`${alt} after`} className="absolute inset-0 w-full h-full object-cover" />

        {/* Before image clipped */}
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: handleXPercent }}
        >
          <img src={beforeSrc} alt={`${alt} before`} className="w-full h-full object-cover" />
        </div>

        {/* Handle */}
        <div
          className="absolute inset-y-0"
          style={{ left: handleXPercent }}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 bg-white/80 h-full"
          />
          <button
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white text-gray-800 px-3 py-1 rounded-full shadow border border-gray-200 text-xs font-semibold"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            aria-label="Drag to compare"
          >
            Drag
          </button>
        </div>
      </div>
      <div className="text-center mt-2 text-sm text-gray-600">Slide to compare before vs after</div>
    </div>
  );
}
