// Утилита для сброса всех позиций окон
// Запустить в консоли браузера: import('./src/utils/resetPositions.js').then(m => m.default())

export const resetWindowPositions = () => {
  try {
    localStorage.removeItem('matriarch_window_positions');
    console.log('✅ Все позиции окон сброшены');
  } catch (e) {
    console.error('❌ Ошибка при сбросе позиций:', e);
  }
};

export default resetWindowPositions;
