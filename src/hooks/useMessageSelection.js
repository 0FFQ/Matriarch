import { useState, useCallback, useMemo } from 'react';

/**
 * Хук для управления выбором сообщений
 * @param {Array} messages - Массив всех сообщений
 * @returns {Object} Методы и состояние для управления выбором
 */
const useMessageSelection = (messages = []) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Переключить выбор сообщения
  const toggleMessage = useCallback((messageId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      // Если больше ничего не выбрано — выходим из режима выбора
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  }, []);

  // Выбрать сообщение (добавить)
  const selectMessage = useCallback((messageId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.add(messageId);
      if (!isSelectionMode) {
        setIsSelectionMode(true);
      }
      return next;
    });
  }, [isSelectionMode]);

  // Снять выбор с сообщения
  const deselectMessage = useCallback((messageId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(messageId);
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  }, []);

  // Выбрать все сообщения
  const selectAll = useCallback(() => {
    if (!messages || messages.length === 0) return;
    const allIds = new Set(messages.map(m => m.id));
    setSelectedIds(allIds);
    setIsSelectionMode(true);
  }, [messages]);

  // Снять все выборы
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, []);

  // Начать режим выбора
  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  // Выйти из режима выбора
  const exitSelectionMode = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, []);

  // Получение выбранных сообщений
  const selectedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    return messages.filter(m => selectedIds.has(m.id));
  }, [messages, selectedIds]);

  // Проверка, выбрано ли сообщение
  const isSelected = useCallback((messageId) => {
    return selectedIds.has(messageId);
  }, [selectedIds]);

  // Разделение выбранных сообщений на свои и чужие
  const selectionStats = useMemo(() => {
    if (!messages || messages.length === 0) {
      return { total: 0, own: 0, others: 0 };
    }
    const selected = messages.filter(m => selectedIds.has(m.id));
    return {
      total: selected.length,
      own: selected.filter(m => m.isOwn).length,
      others: selected.filter(m => !m.isOwn).length,
    };
  }, [messages, selectedIds]);

  return {
    selectedIds,
    selectedMessages,
    isSelectionMode,
    toggleMessage,
    selectMessage,
    deselectMessage,
    selectAll,
    deselectAll,
    enterSelectionMode,
    exitSelectionMode,
    isSelected,
    selectionStats,
  };
};

export default useMessageSelection;
