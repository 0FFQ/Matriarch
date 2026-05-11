import React from 'react';
import SocialFeatures from './SocialFeatures';


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
