import { useCallback, useEffect, useRef, useState } from 'react';
import { useMotionValue } from 'framer-motion';

const STORAGE_KEY = 'matriarch_window_positions';

const loadPositions = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

const savePositions = (positions) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (e) {
    console.warn('Не удалось сохранить позиции окон:', e);
  }
};

/**
 * Хук для сохранения и восстановления позиции перетаскиваемого окна.
 * Использует useMotionValue для избежания конфликта с drag.
 */
const useWindowPosition = (windowId, isOpen = false) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const windowIdRef = useRef(windowId);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Обновляем ref windowId
  useEffect(() => {
    windowIdRef.current = windowId;
  }, [windowId]);

  // Подписываемся на изменения motion values для сохранения в state
  useEffect(() => {
    const unsubX = x.on('change', (latest) => {
      setPosition(prev => ({ ...prev, x: latest }));
    });
    const unsubY = y.on('change', (latest) => {
      setPosition(prev => ({ ...prev, y: latest }));
    });
    return () => {
      unsubX();
      unsubY();
    };
  }, [x, y]);

  // При открытии окна загружаем позицию
  useEffect(() => {
    if (isOpen) {
      const positions = loadPositions();
      const saved = positions[windowId];
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        x.set(saved.x);
        y.set(saved.y);
        setPosition({ x: saved.x, y: saved.y });
      } else {
        x.set(0);
        y.set(0);
        setPosition({ x: 0, y: 0 });
      }
    }
  }, [isOpen, windowId, x, y]);

  const handleDragStart = useCallback(() => {
    // Drag начался
  }, []);

  const handleDragEnd = useCallback((event, info) => {
    // framer-motion уже обновил motion values через drag
    // Просто читаем и сохраняем финальную позицию
    const newPos = {
      x: x.get(),
      y: y.get(),
    };

    const positions = loadPositions();
    positions[windowIdRef.current] = newPos;
    savePositions(positions);
  }, [x, y]);

  const resetPosition = useCallback(() => {
    x.set(0);
    y.set(0);
    const positions = loadPositions();
    delete positions[windowIdRef.current];
    savePositions(positions);
  }, [x, y]);

  return {
    x,
    y,
    position,
    handleDragStart,
    handleDragEnd,
    resetPosition,
  };
};

export const resetAllWindowPositions = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Не удалось сбросить позиции окон:', e);
  }
};

export default useWindowPosition;
