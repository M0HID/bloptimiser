"use client";

import { useState, useRef, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function PolylineDrawer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [input, setInput] = useState('');
  const [polylines, setPolylines] = useState<number[][][]>([]);
  const [sliderValue, setSliderValue] = useState([0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastDrawnIndex, setLastDrawnIndex] = useState(0);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const parseInput = () => {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed) && parsed.every(Array.isArray)) {
        const canvasSize = Math.min(dimensions.width, dimensions.height) * 0.8;
        const scaleFactor = canvasSize / 125; // Map 0-125 to 0-canvasSize

        const scaled = parsed.map(polyline =>
          polyline.map(point => [point[0] * scaleFactor, point[1] * scaleFactor])
        );

        setPolylines(scaled);
        setSliderValue([parsed.length]);
      } else {
        alert('Invalid input format. Please provide a valid array of arrays.');
      }
    } catch (error) {
      alert('Error parsing input. Please check your JSON format.');
    }
  };

  const drawPolylines = (ctx: CanvasRenderingContext2D, currentPolylineCount: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;

    for (let i = 0; i < currentPolylineCount; i++) {
      const polyline = polylines[i];
      if (!polyline) continue;

      ctx.beginPath();
      polyline.forEach((point, index) => {
        const [x, y] = point;
        const canvasX = x;
        const canvasY = ctx.canvas.height - y;
        if (index === 0) {
          ctx.moveTo(canvasX, canvasY);
        } else {
          ctx.lineTo(canvasX, canvasY);
        }
      });
      ctx.stroke();
    }
  };

  const animateDrawing = (polylineIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let progress = 0;
    let lastTimestamp: number | null = null;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const elapsed = timestamp - lastTimestamp;

      if (elapsed >= 20) {
        progress += 0.05;
        drawPolylines(ctx, polylineIndex);
        ctx.beginPath();
        const polyline = polylines[polylineIndex];
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;

        const pointsToDraw = Math.floor(polyline.length * progress);
        polyline.slice(0, pointsToDraw + 1).forEach((point, index) => {
          const [x, y] = point;
          const canvasX = x;
          const canvasY = ctx.canvas.height - y;
          if (index === 0) {
            ctx.moveTo(canvasX, canvasY);
          } else {
            ctx.lineTo(canvasX, canvasY);
          }
        });
        ctx.stroke();

        lastTimestamp = timestamp;
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setLastDrawnIndex(polylineIndex + 1);
        }
      } else {
        requestAnimationFrame(animate);
      }
    };

    setIsAnimating(true);
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (polylines.length > 0 && !isAnimating) {
      if (sliderValue[0] > lastDrawnIndex) {
        // Animate only the added polyline
        animateDrawing(sliderValue[0] - 1);
      } else {
        // Redraw static polylines when moving slider backwards
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          drawPolylines(ctx, sliderValue[0]);
        }
        setLastDrawnIndex(sliderValue[0]);
      }
    }
  }, [sliderValue, polylines]);

  return (
    <div className="flex flex-col min-h-screen p-4 space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
      <div className="w-full lg:w-4/5 aspect-square">
        <canvas
          ref={canvasRef}
          width={Math.min(dimensions.width, dimensions.height) * 0.8}
          height={Math.min(dimensions.width, dimensions.height) * 0.8}
          className="border border-gray-300"
        />
      </div>
      <div className="flex flex-col w-full space-y-4 lg:w-1/5">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your array of arrays here..."
          className="w-full h-48"
        />
        <div className="flex gap-2">
          <Button 
            onClick={parseInput} 
            disabled={isAnimating}
            className="w-full"
          >
            Draw Polylines
          </Button>
        </div>
        <Slider
          value={sliderValue}
          onValueChange={(value) => {
            setSliderValue(value);
            if (!isAnimating && value[0] <= lastDrawnIndex) {
              const ctx = canvasRef.current?.getContext('2d');
              if (ctx) {
                drawPolylines(ctx, value[0]);
              }
              setLastDrawnIndex(value[0]);
            }
          }}
          max={polylines.length}
          step={1}
          className="w-full max-w-md"
        />
        <div>Showing {sliderValue[0]} out of {polylines.length} polylines</div>
      </div>
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
