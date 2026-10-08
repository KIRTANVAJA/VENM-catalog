import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Maximize2,
  Minimize2,
  RotateCw,
  Sliders,
  Sparkles,
  Move,
  ZoomIn,
  Crop,
  RefreshCw
} from 'lucide-react';

const ASPECT_RATIOS = [
  { label: '3:4 (Garment Look)', value: '3:4', w: 3, h: 4 },
  { label: '1:1 (Square)', value: '1:1', w: 1, h: 1 },
  { label: '16:9 (Hero Banner)', value: '16:9', w: 16, h: 9 },
  { label: '4:5 (Instagram)', value: '4:5', w: 4, h: 5 },
  { label: 'Free / Original', value: 'free', w: 0, h: 0 }
];

const ImageAdjusterModal = ({ isOpen, imageUrl, onSave, onClose, defaultAspect = '3:4' }) => {
  const [aspect, setAspect] = useState(defaultAspect);
  const [fitMode, setFitMode] = useState('cover'); // 'cover' | 'contain' | 'custom'
  const [zoom, setZoom] = useState(100); // 100% to 300%
  const [posX, setPosX] = useState(50); // 0% to 100% (50% = center)
  const [posY, setPosY] = useState(50); // 0% to 100% (50% = center)
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      img.onload = () => {
        imgRef.current = img;
        renderCanvas();
      };
    }
  }, [isOpen, imageUrl, aspect, fitMode, zoom, posX, posY, rotation, bgColor]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    const selectedAspectObj = ASPECT_RATIOS.find((a) => a.value === aspect) || ASPECT_RATIOS[0];

    // Determine canvas target dimensions
    let targetW = 900;
    let targetH = 1200;

    if (selectedAspectObj.value === 'free') {
      targetW = img.naturalWidth || 800;
      targetH = img.naturalHeight || 1000;
    } else {
      targetW = 900;
      targetH = Math.round(900 * (selectedAspectObj.h / selectedAspectObj.w));
    }

    canvas.width = targetW;
    canvas.height = targetH;

    // Fill canvas background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetW, targetH);

    ctx.save();
    ctx.translate(targetW / 2, targetH / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const zoomScale = zoom / 100;
    const origW = img.naturalWidth || 800;
    const origH = img.naturalHeight || 1000;

    let drawW = targetW;
    let drawH = targetH;

    if (fitMode === 'contain') {
      const scale = Math.min(targetW / origW, targetH / origH) * zoomScale;
      drawW = origW * scale;
      drawH = origH * scale;
    } else {
      // Cover mode
      const scale = Math.max(targetW / origW, targetH / origH) * zoomScale;
      drawW = origW * scale;
      drawH = origH * scale;
    }

    // Offset calculation based on posX and posY percentages
    const offsetX = ((posX - 50) / 100) * (drawW - targetW);
    const offsetY = ((posY - 50) / 100) * (drawH - targetH);

    ctx.drawImage(img, -drawW / 2 - offsetX, -drawH / 2 - offsetY, drawW, drawH);
    ctx.restore();
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const dataUrl = canvas.toDataURL('image/webp', 0.92);
        onSave(dataUrl);
        setIsProcessing(false);
        onClose();
      } catch (err) {
        // Fallback to jpeg if webp unsupported
        const fallbackUrl = canvas.toDataURL('image/jpeg', 0.9);
        onSave(fallbackUrl);
        setIsProcessing(false);
        onClose();
      }
    }, 100);
  };

  const handleReset = () => {
    setAspect(defaultAspect);
    setFitMode('cover');
    setZoom(100);
    setPosX(50);
    setPosY(50);
    setRotation(0);
    setBgColor('#ffffff');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div
        className="relative w-full max-w-4xl bg-white text-neutral-900 border border-neutral-300 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 bg-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <Crop className="w-5 h-5 text-lime-400" />
            <div>
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block">
                ADMIN IMAGE ADJUSTER & FITTER
              </span>
              <h3 className="text-base font-black tracking-wider uppercase text-white">
                ADJUST IMAGE RATIO & FIT
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left: Interactive Canvas Preview */}
          <div className="lg:col-span-7 bg-neutral-950 p-6 flex flex-col items-center justify-center relative min-h-[340px]">
            <div className="relative max-w-full max-h-[460px] flex items-center justify-center border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[440px] object-contain shadow-md"
              />
            </div>

            <div className="mt-4 flex items-center gap-4 text-[10px] font-mono text-neutral-400 uppercase">
              <span>Aspect Ratio: {aspect}</span>
              <span>•</span>
              <span>Fit: {fitMode}</span>
              <span>•</span>
              <span>Zoom: {zoom}%</span>
            </div>
          </div>

          {/* Right: Manual Adjustment Control Panel */}
          <div className="lg:col-span-5 p-6 space-y-6 bg-neutral-50 border-l border-neutral-200 overflow-y-auto">
            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-widest text-neutral-700 uppercase font-bold flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5 text-neutral-900" />
                <span>1. ASPECT RATIO PRESET</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                {ASPECT_RATIOS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setAspect(item.value)}
                    className={`py-2 px-2.5 text-left border transition-all ${
                      aspect === item.value
                        ? 'bg-neutral-900 text-white border-black font-bold'
                        : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fit Mode */}
            <div className="space-y-2 border-t border-neutral-200 pt-4">
              <label className="text-[10px] font-mono tracking-widest text-neutral-700 uppercase font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-neutral-900" />
                <span>2. FIT STRATEGY</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setFitMode('cover')}
                  className={`py-2 px-2 text-center border transition-all ${
                    fitMode === 'cover'
                      ? 'bg-neutral-900 text-white border-black font-bold'
                      : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                  }`}
                >
                  COVER (CROP & FILL)
                </button>
                <button
                  type="button"
                  onClick={() => setFitMode('contain')}
                  className={`py-2 px-2 text-center border transition-all ${
                    fitMode === 'contain'
                      ? 'bg-neutral-900 text-white border-black font-bold'
                      : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                  }`}
                >
                  CONTAIN (FIT ENTIRE)
                </button>
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="space-y-1.5 border-t border-neutral-200 pt-4 font-mono">
              <div className="flex items-center justify-between text-[10px] text-neutral-700 font-bold uppercase">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-neutral-900" />
                  <span>ZOOM & SCALE</span>
                </span>
                <span>{zoom}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="250"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-neutral-900 cursor-pointer"
              />
            </div>

            {/* Position Controls (Focal Point X/Y) */}
            <div className="space-y-3 border-t border-neutral-200 pt-4 font-mono">
              <label className="text-[10px] tracking-widest text-neutral-700 uppercase font-bold flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-neutral-900" />
                <span>POSITION & PAN OFFSET</span>
              </label>

              <div className="space-y-2 text-[10px] text-neutral-600">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>HORIZONTAL (X):</span>
                    <span>{posX}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={posX}
                    onChange={(e) => setPosX(Number(e.target.value))}
                    className="w-full accent-neutral-900 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>VERTICAL (Y):</span>
                    <span>{posY}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={posY}
                    onChange={(e) => setPosY(Number(e.target.value))}
                    className="w-full accent-neutral-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Rotation Controls */}
            <div className="space-y-2 border-t border-neutral-200 pt-4 font-mono">
              <div className="flex items-center justify-between text-[10px] text-neutral-700 font-bold uppercase">
                <span className="flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-neutral-900" />
                  <span>ROTATE</span>
                </span>
                <span>{rotation}°</span>
              </div>

              <div className="flex items-center gap-2">
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setRotation(deg)}
                    className={`flex-1 py-1.5 text-xs border ${
                      rotation === deg
                        ? 'bg-neutral-900 text-white font-bold'
                        : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2 text-xs font-mono font-bold uppercase border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RESET ALL ADJUSTMENTS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-200 bg-white flex items-center justify-between font-mono">
          <button
            type="button"
            onClick={onClose}
            className="btn-venm-secondary text-xs px-5 py-2.5 uppercase font-bold"
          >
            CANCEL
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing}
            className="btn-venm-primary bg-lime-400 text-neutral-900 hover:bg-lime-300 text-xs px-6 py-2.5 uppercase font-extrabold flex items-center gap-2 shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>{isProcessing ? 'PROCESSING...' : 'APPLY & SAVE ADJUSTED IMAGE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageAdjusterModal;
