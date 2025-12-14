import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useEmergencyStore = create(
  persist(
    (set, get) => ({
      isEmergencyActive: false,
      emergencyId: null,
      locations: [],
      startTime: null,
      medicalIdSent: false,
      
      activateEmergency: (emergencyId) => {
        set({
          isEmergencyActive: true,
          emergencyId,
          startTime: Date.now(),
          locations: [],
          medicalIdSent: false
        });
      },
      
      addLocation: (location) => {
        const { locations } = get();
        set({
          locations: [...locations, {
            ...location,
            timestamp: Date.now()
          }]
        });
      },
      
      markMedicalIdSent: () => {
        set({ medicalIdSent: true });
      },
      
      deactivateEmergency: () => {
        set({
          isEmergencyActive: false,
          emergencyId: null,
          locations: [],
          startTime: null,
          medicalIdSent: false
        });
      },
      
      getLatestLocation: () => {
        const { locations } = get();
        return locations.length > 0 ? locations[locations.length - 1] : null;
      }
    }),
    {
      name: 'aegis-emergency'
    }
  )
);
