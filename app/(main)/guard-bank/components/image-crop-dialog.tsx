"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ImageCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropApplied: (file: File) => void;
}

export function ImageCropDialog({ isOpen, onClose, imageSrc, onCropApplied }: ImageCropDialogProps) {
  const cropImageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    const img = cropImageRef.current;
    if (!img) return;

    const container = img.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const cropWidth = 180;
    const cropHeight = 240;
    
    const cropLeft = (containerWidth - cropWidth) / 2;
    const cropTop = (containerHeight - cropHeight) / 2;
    
    const renderedWidth = img.clientWidth;
    const renderedHeight = img.clientHeight;
    
    const scaledWidth = renderedWidth * zoom;
    const scaledHeight = renderedHeight * zoom;
    
    const imageCenterX = containerWidth / 2 + offset.x;
    const imageCenterY = containerHeight / 2 + offset.y;
    
    const imageLeft = imageCenterX - scaledWidth / 2;
    const imageTop = imageCenterY - scaledHeight / 2;
    
    const sx = (cropLeft - imageLeft) * (img.naturalWidth / scaledWidth);
    const sy = (cropTop - imageTop) * (img.naturalHeight / scaledHeight);
    
    const sWidth = cropWidth * (img.naturalWidth / scaledWidth);
    const sHeight = cropHeight * (img.naturalHeight / scaledHeight);
    
    const canvas = document.createElement("canvas");
    canvas.width = 360;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    try {
      ctx.drawImage(
        img,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], "cropped_headshot.jpg", {
            type: "image/jpeg",
            lastModified: Date.now()
          });
          onCropApplied(croppedFile);
        }
      }, "image/jpeg", 0.9);
    } catch (error) {
      console.error("Canvas drawing failed:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white p-6 rounded-lg shadow-xl font-sans border border-slate-100">
        <DialogHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold text-slate-800">Free Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div 
            className="w-full h-[300px] bg-[#9e9e9e] relative overflow-hidden select-none cursor-move rounded-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {imageSrc && (
              <img 
                ref={cropImageRef}
                src={imageSrc}
                alt="Crop Source"
                crossOrigin="anonymous"
                className="absolute pointer-events-none max-w-none origin-center"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                  width: "auto",
                  height: "240px",
                  objectFit: "contain",
                }}
              />
            )}
            
            {/* Spotlight overlay with crop box container and grid lines */}
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[240px] border border-white/95 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] rounded-sm"
            >
              {/* 3x3 Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/30 col-span-1 row-span-1"></div>
                <div className="border-r border-b border-white/30 col-span-1 row-span-1"></div>
                <div className="border-b border-white/30 col-span-1 row-span-1"></div>
                <div className="border-r border-b border-white/30 col-span-1 row-span-1"></div>
                <div className="border-r border-b border-white/30 col-span-1 row-span-1"></div>
                <div className="border-b border-white/30 col-span-1 row-span-1"></div>
                <div className="border-r border-white/30 col-span-1 row-span-1"></div>
                <div className="border-r border-white/30 col-span-1 row-span-1"></div>
                <div className="col-span-1 row-span-1"></div>
              </div>
            </div>
          </div>
          
          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800">
              Zoom: {Math.round(zoom * 100)}%
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0064cb]"
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-5 text-slate-700 border-slate-200 hover:bg-slate-50 font-semibold cursor-pointer rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApplyCrop}
              className="h-10 px-5 bg-[#0064cb] hover:bg-[#0052ae] text-white font-semibold flex items-center gap-1.5 cursor-pointer rounded-lg border-none"
            >
              <Check className="w-4 h-4" />
              Apply Crop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
