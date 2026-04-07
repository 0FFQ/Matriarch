import React from 'react';
import SocialFeatures from './SocialFeatures';

/**
 * Компонент интеграции социальных функций
 * @param {Object} messenger - объект мессенджера
 * @param {function} onSelectSharedContent - обработчик выбора контента
 * @param {Object} t - объект с переводами
 */
const SocialIntegration = ({ messenger, onSelectSharedContent, t }) => {
  return (
    <SocialFeatures
      t={t}
      {...messenger}
      onSelectSharedContent={onSelectSharedContent}
    />
  );
};

export default SocialIntegration;
