/**
 * Вспомогательные функции для поиска и сортировки
 */

/**
 * Получает поле для сортировки в зависимости от типа контента
 * @param {string} sortBy - строка сортировки (например, 'popularity.desc')
 * @param {string} type - тип контента ('movie' или 'tv')
 * @returns {string} поле для сортировки
 */
export const getSortField = (sortBy, type = 'movie') => {
  const field = sortBy.split('.')[0];
  if (type === 'tv' && field === 'primary_release_date') {
    return 'first_air_date';
  }
  if (field === 'title') return 'original_title';
  return field;
};

/**
 * Сортирует результаты по указанному полю
 * @param {Array} results - массив результатов
 * @param {string} sortBy - строка сортировки (например, 'popularity.desc')
 * @returns {Array} отсортированный массив
 */
export const sortResults = (results, sortBy) => {
  const [field, order] = sortBy.split('.');
  const sorted = [...results].sort((a, b) => {
    if (field === 'popularity' || field === 'vote_average') {
      return order === 'desc' ? b[field] - a[field] : a[field] - b[field];
    }
    if (field === 'primary_release_date') {
      const dateA = new Date(a[field] || 0);
      const dateB = new Date(b[field] || 0);
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    }
    if (field === 'title') {
      const titleA = a.title || a.name || '';
      const titleB = b.title || b.name || '';
      return order === 'desc'
        ? titleB.localeCompare(titleA, 'ru')
        : titleA.localeCompare(titleB, 'ru');
    }
    return 0;
  });
  return sorted;
};
