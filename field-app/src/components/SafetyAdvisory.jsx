import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, AlertTriangle } from 'lucide-react';

const SafetyAdvisory = ({ disasterType }) => {
  const { t } = useTranslation();
  
  if (!disasterType) return null;
  
  const advisory = t(`advisories.${disasterType}`, { returnObjects: true });
  
  if (!advisory || typeof advisory === 'string') return null;
  
  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-warning">
          <Shield className="w-6 h-6" />
          {t('advisories.title')}
        </h2>
        
        <h3 className="text-lg font-semibold mt-2">
          {advisory.title}
        </h3>
        
        <ul className="space-y-2 mt-3">
          {advisory.advice && advisory.advice.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-warning mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        
        <div className="alert alert-warning mt-4">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">
            {t('common.emergency')}: <strong>119</strong> | 
            Disaster Management: <strong>117</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SafetyAdvisory;
