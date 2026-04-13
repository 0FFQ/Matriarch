import { useState, useCallback, useEffect, useRef } from 'react';
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
 */
const useWindowPosition = (windowId, isOpen = false) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const hasLoadedRef = useRef(false);

  // При открытии окна загружаем позицию
  useEffect(() => {
    if (isOpen) {
      const positions = loadPositions();
      const saved = positions[windowId];
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        x.set(saved.x);
        y.set(saved.y);
      } else {
        x.set(0);
        y.set(0);
      }
      hasLoadedRef.current = true;
    }
  }, [isOpen, windowId, x, y]);

  const handleDragEnd = useCallback(() => {
    const newOffset = {
      x: x.get(),
      y: y.get(),
    };

    const positions = loadPositions();
    positions[windowId] = newOffset;
    savePositions(positions);
  }, [windowId, x, y]);

  const resetPosition = useCallback(() => {
    x.set(0);
    y.set(0);
    const positions = loadPositions();
    delete positions[windowId];
    savePositions(positions);
  }, [windowId, x, y]);

  return {
    x,
    y,
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
