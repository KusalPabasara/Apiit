import React from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, AlertCircle, Shield, Heart, Flame, Anchor } from 'lucide-react';

const EMERGENCY_CONTACTS = [
  { id: 'national', number: '119', icon: AlertCircle, color: 'error' },
  { id: 'disaster', number: '117', icon: Shield, color: 'warning' },
  { id: 'police', number: '118', icon: Shield, color: 'info' },
  { id: 'fire', number: '110', icon: Flame, color: 'error' },
  { id: 'ambulance', number: '1990', icon: Heart, color: 'success' },
  { id: 'coast', number: '118', icon: Anchor, color: 'info' },
];

export const EmergencyContacts = () => {
  const { t } = useTranslation();
  
  const handleCall = (number) => {
    window.location.href = `tel:${number}`;
  };
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center mb-6">
        {t('contacts.title')}
      </h2>
      
      <div className="space-y-3">
        {EMERGENCY_CONTACTS.map((contact) => {
          const Icon = contact.icon;
          return (
            <button
              key={contact.id}
              onClick={() => handleCall(contact.number)}
              className={`w-full btn btn-lg justify-between btn-${contact.color} btn-outline`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-6 h-6" />
                <span className="font-medium">{t(`contacts.${contact.id}`)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{contact.number}</span>
                <Phone className="w-5 h-5" />
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="alert alert-info mt-6">
        <AlertCircle className="w-5 h-5" />
        <div>
          <p className="text-sm">
            These contacts are always available offline. 
            Tap to call directly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;
