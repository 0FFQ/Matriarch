import { useState, useCallback, useMemo } from 'react';


const useMessageSelection = (messages = [], currentUserId = '') => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  
  const toggleMessage = useCallback((messageId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  }, []);

  
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

  
  const selectAll = useCallback(() => {
    if (!messages || messages.length === 0) return;
    const allIds = new Set(messages.map(m => m.id));
    setSelectedIds(allIds);
    setIsSelectionMode(true);
  }, [messages]);

  
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, []);

  
  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  
  const exitSelectionMode = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, []);

  
  const selectedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    return messages.filter(m => selectedIds.has(m.id));
  }, [messages, selectedIds]);

  
  const isSelected = useCallback((messageId) => {
    return selectedIds.has(messageId);
  }, [selectedIds]);

  
  const selectionStats = useMemo(() => {
    if (!messages || messages.length === 0) {
      return { total: 0, own: 0, others: 0 };
    }
    const selected = messages.filter(m => selectedIds.has(m.id));
    const ownCount = selected.filter(m => m.senderId === currentUserId).length;
    return {
      total: selected.length,
      own: ownCount,
      others: selected.length - ownCount,
    };
  }, [messages, selectedIds, currentUserId]);

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
