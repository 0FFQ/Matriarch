import React, { useEffect, useRef } from 'react';

const InteractiveAtom = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const isDarkRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // Оптимизация: отключаем прозрачность canvas
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Уменьшаем количество частиц для производительности
    const PARTICLE_COUNT = Math.min(8000, Math.floor((width * height) / 150));

    const createParticles = () => {
      const particles = new Array(PARTICLE_COUNT);
      const sphereRadius = Math.min(width, height) * 0.20;
      const isDark = isDarkRef.current;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / PARTICLE_COUNT);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

        const randomFactor = Math.random();
        const radiusMultiplier = randomFactor < 0.1
          ? 0.5 + Math.random() * 0.3
          : 0.85 + Math.random() * 0.15;

        const phiRandom = (Math.random() - 0.5) * 0.08;
        const thetaRandom = (Math.random() - 0.5) * 0.08;

        const adjustedPhi = phi + phiRandom;
        const adjustedTheta = theta + thetaRandom;

        const x = sphereRadius * Math.sin(adjustedPhi) * Math.cos(adjustedTheta) * radiusMultiplier;
        const y = sphereRadius * Math.sin(adjustedPhi) * Math.sin(adjustedTheta) * radiusMultiplier;
        const z = sphereRadius * Math.cos(adjustedPhi) * radiusMultiplier;

        const colorType = Math.random();
        let r, g, b, a, size;

        if (isDark) {
          if (colorType < 0.15) {
            r = 255; g = 255; b = 255;
            a = Math.random() * 0.5 + 0.5;
            size = Math.random() * 1.5 + 1.2;
          } else if (colorType < 0.5) {
            r = 230 + (Math.random() * 25) | 0;
            g = 230 + (Math.random() * 25) | 0;
            b = 230 + (Math.random() * 25) | 0;
            a = Math.random() * 0.4 + 0.35;
            size = Math.random() * 1.3 + 1;
          } else {
            r = 170 + (Math.random() * 40) | 0;
            g = 170 + (Math.random() * 40) | 0;
            b = 170 + (Math.random() * 40) | 0;
            a = Math.random() * 0.35 + 0.25;
            size = Math.random() * 1.2 + 0.9;
          }
        } else {
          if (colorType < 0.15) {
            r = 10; g = 10; b = 10;
            a = Math.random() * 0.5 + 0.5;
            size = Math.random() * 1.5 + 1.2;
          } else if (colorType < 0.5) {
            r = 30 + (Math.random() * 40) | 0;
            g = 30 + (Math.random() * 40) | 0;
            b = 30 + (Math.random() * 40) | 0;
            a = Math.random() * 0.45 + 0.35;
            size = Math.random() * 1.3 + 1;
          } else {
            r = 80 + (Math.random() * 60) | 0;
            g = 80 + (Math.random() * 60) | 0;
            b = 80 + (Math.random() * 60) | 0;
            a = Math.random() * 0.4 + 0.25;
            size = Math.random() * 1.2 + 0.9;
          }
        }

        particles[i] = { x, y, z, baseX: x, baseY: y, baseZ: z, size, r, g, b, a };
      }

      return particles;
    };

    const checkTheme = () => {
      const newIsDark = document.body.classList.contains('dark') || !document.body.classList.contains('light');
      isDarkRef.current = newIsDark;
      particlesRef.current = createParticles();
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particlesRef.current = createParticles();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    const animate = () => {
      if (!ctx) return;

      // Оптимизация: используем fillRect вместо clearRect
      ctx.fillStyle = isDarkRef.current ? '#000000' : '#f5f2ed';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      timeRef.current += 0.008;

      const rotationY = timeRef.current * 0.3;
      const rotationX = timeRef.current * 0.15;

      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);

      const particles = particlesRef.current;
      const len = particles.length;

      // Оптимизация: кэшируем вычисления
      for (let i = 0; i < len; i++) {
        const p = particles[i];
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        p.displayX = centerX + x1;
        p.displayY = centerY + y2;
        p.displayZ = z2;
      }

      // Оптимизация: отрисовка с сортировкой по Z
      const sortedIndices = new Uint16Array(len);
      for (let i = 0; i < len; i++) sortedIndices[i] = i;
      
      sortedIndices.sort((a, b) => particles[a].displayZ - particles[b].displayZ);

      for (let i = 0; i < len; i++) {
        const idx = sortedIndices[i];
        const p = particles[idx];
        const normalizedZ = p.displayZ + 200;
        const scale = 1 / (1 + normalizedZ / 400);
        const screenSize = Math.max(0.5, Math.min(p.size * scale, p.size * 2));

        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.a})`;
        ctx.beginPath();
        ctx.arc(p.displayX, p.displayY, screenSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
};

export default InteractiveAtom;
