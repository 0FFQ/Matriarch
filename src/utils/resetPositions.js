


export const resetWindowPositions = () => {
  try {
    localStorage.removeItem('matriarch_window_positions');
    console.log('✅ Все позиции окон сброшены');
  } catch (e) {
    console.error('❌ Ошибка при сбросе позиций:', e);
  }
};

export default resetWindowPositions;
