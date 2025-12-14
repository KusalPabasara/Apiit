import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      language: 'en',
      theme: 'aegis',
      medicalId: {
        bloodType: '',
        allergies: '',
        medications: '',
        conditions: '',
        emergencyContact: ''
      },
      
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      
      updateMedicalId: (updates) => {
        set((state) => ({
          medicalId: { ...state.medicalId, ...updates }
        }));
      },
      
      clearMedicalId: () => {
        set({
          medicalId: {
            bloodType: '',
            allergies: '',
            medications: '',
            conditions: '',
            emergencyContact: ''
          }
        });
      }
    }),
    {
      name: 'aegis-settings'
    }
  )
);
