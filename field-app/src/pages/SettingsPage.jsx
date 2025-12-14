import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Heart, User, Phone, Droplet, Pill, AlertTriangle, Save, Trash } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' }
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { language, setLanguage, medicalId, updateMedicalId, clearMedicalId } = useSettingsStore();
  const { logout, user } = useAuthStore();
  
  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    i18n.changeLanguage(langCode);
  };
  
  const handleMedicalChange = (field, value) => {
    updateMedicalId({ [field]: value });
  };
  
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      window.location.href = '/login';
    }
  };
  
  return (
    <div className="p-4 pb-20">
      <h2 className="text-2xl font-bold text-center mb-6">
        {t('settings.title')}
      </h2>
      
      {/* Language Selection */}
      <div className="card bg-base-200 mb-6">
        <div className="card-body">
          <h3 className="card-title text-lg">
            <Globe className="w-5 h-5" />
            {t('settings.language')}
          </h3>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`btn btn-sm ${
                  language === lang.code ? 'btn-primary' : 'btn-outline'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Medical ID */}
      <div className="card bg-base-200 mb-6">
        <div className="card-body">
          <h3 className="card-title text-lg">
            <Heart className="w-5 h-5 text-error" />
            {t('settings.medicalId')}
          </h3>
          <p className="text-sm text-base-content/60 mb-4">
            This information may be shared during emergencies
          </p>
          
          {/* Blood Type */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <Droplet className="w-4 h-4" />
                {t('settings.bloodType')}
              </span>
            </label>
            <select
              value={medicalId.bloodType}
              onChange={(e) => handleMedicalChange('bloodType', e.target.value)}
              className="select select-bordered"
            >
              <option value="">Select...</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Allergies */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t('settings.allergies')}
              </span>
            </label>
            <input
              type="text"
              value={medicalId.allergies}
              onChange={(e) => handleMedicalChange('allergies', e.target.value)}
              placeholder="Penicillin, Peanuts, etc."
              className="input input-bordered"
            />
          </div>
          
          {/* Medications */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <Pill className="w-4 h-4" />
                {t('settings.medications')}
              </span>
            </label>
            <input
              type="text"
              value={medicalId.medications}
              onChange={(e) => handleMedicalChange('medications', e.target.value)}
              placeholder="Insulin, Blood pressure medication, etc."
              className="input input-bordered"
            />
          </div>
          
          {/* Medical Conditions */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">{t('settings.conditions')}</span>
            </label>
            <textarea
              value={medicalId.conditions}
              onChange={(e) => handleMedicalChange('conditions', e.target.value)}
              placeholder="Diabetes, Heart condition, etc."
              className="textarea textarea-bordered h-20"
            />
          </div>
          
          {/* Emergency Contact */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t('settings.emergencyContact')}
              </span>
            </label>
            <input
              type="tel"
              value={medicalId.emergencyContact}
              onChange={(e) => handleMedicalChange('emergencyContact', e.target.value)}
              placeholder="07X XXX XXXX"
              className="input input-bordered"
            />
          </div>
          
          {/* Clear Medical Info */}
          <button
            onClick={clearMedicalId}
            className="btn btn-outline btn-error btn-sm mt-2"
          >
            <Trash className="w-4 h-4" />
            Clear Medical Info
          </button>
        </div>
      </div>
      
      {/* Account Info */}
      <div className="card bg-base-200 mb-6">
        <div className="card-body">
          <h3 className="card-title text-lg">
            <User className="w-5 h-5" />
            Account
          </h3>
          
          <div className="space-y-2 text-sm">
            <p><span className="text-base-content/60">Username:</span> {user?.username}</p>
            <p><span className="text-base-content/60">Name:</span> {user?.full_name}</p>
            <p><span className="text-base-content/60">Role:</span> {user?.role}</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="btn btn-error btn-outline mt-4"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* App Version */}
      <div className="text-center text-sm text-base-content/50 mt-6">
        <p>Project Aegis v2.0</p>
        <p>Offline-First Disaster Response System</p>
      </div>
    </div>
  );
};

export default SettingsPage;
