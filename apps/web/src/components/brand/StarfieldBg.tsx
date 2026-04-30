"use client";

import React, { useEffect, useRef } from "react";

export default function StarfieldBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w: number, h: number;
    const stars: { x: number; y: number; r: number; d: number; a: number }[] = [];
    const numStars = 150;

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }

    function initStars() {
      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.5,
          d: Math.random() * numStars,
          a: Math.random() * Math.PI * 2,
        });
      }
    }

    let animationId: number;
    function animate() {
      ctx!.clearRect(0, 0, w, h);
      ctx!.fillStyle = "#050B15";
      ctx!.fillRect(0, 0, w, h);

      for (let i = 0; i < numStars; i++) {
        const s = stars[i];
        s.a += 0.005;
        const flicker = 0.5 + 0.5 * Math.sin(s.a);
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0, 234, 255, ${flicker * 0.8})`;
        ctx!.fill();
      }

      animationId = requestAnimationFrame(animate);
    }

    resize();
    initStars();
    animate();

    window.addEventListener("resize", () => {
      resize();
      initStars();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
}
