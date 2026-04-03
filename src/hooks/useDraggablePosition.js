import { useState, useCallback, useEffect } from 'react';

/**
 * Хук для сохранения и восстановления позиции перетаскиваемых панелей
 * @param {string} key - ключ для localStorage
 * @param {boolean} isOpen - открыта ли панель
 * @returns {{ position: {x: number, y: number} | null, savePosition: Function, resetPosition: Function }}
 */
export const useDraggablePosition = (key, isOpen) => {
  const [position, setPosition] = useState(null);

  // Загрузка позиции при открытии
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          setPosition(JSON.parse(saved));
        } else {
          // Начальная позиция — 0, 0 (стандартное место панели)
          setPosition({ x: 0, y: 0 });
        }
      } catch {
        setPosition({ x: 0, y: 0 });
      }
    }
  }, [key, isOpen]);

  // Сохранение позиции
  const savePosition = useCallback((x, y) => {
    const pos = { x, y };
    setPosition(pos);
    try {
      localStorage.setItem(key, JSON.stringify(pos));
    } catch {
      // Игнорируем ошибки localStorage
    }
  }, [key]);

  // Сброс позиции
  const resetPosition = useCallback(() => {
    setPosition(null);
    try {
      localStorage.removeItem(key);
    } catch {
      // Игнорируем
    }
  }, [key]);

  return { position, savePosition, resetPosition };
};
