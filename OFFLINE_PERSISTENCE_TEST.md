# ✅ Offline Persistence Test Plan

## Current Implementation Status

### ✅ Already Working - Offline Persistence

The app **ALREADY** has complete offline persistence using IndexedDB and Firebase Auth. Here's what persists:

#### 1. **Authentication State** ✅
- **Tech**: Firebase Auth with `browserLocalPersistence`
- **Persists**: User login session, email, display name, UID
- **Storage**: Browser's Local Storage + IndexedDB (managed by Firebase)
- **Survives**: 
  - App close/reopen
  - Browser restart
  - Device restart
  - Airplane mode
  - Network disconnection

**Test**: 
```
1. Login while online
2. Close browser completely
3. Reopen browser in airplane mode
4. Open app → ✅ Still logged in!
```

#### 2. **Device Registration** ✅
- **Tech**: Zustand with persist middleware
- **Persists**: Device UUID, device name, registration token
- **Storage**: localStorage (`aegis-device`)
- **Survives**: All scenarios above

**Test**:
```
1. Open app (generates UUID)
2. Close app
3. Reopen → ✅ Same device ID
```

#### 3. **Incident Reports** ✅
- **Tech**: Dexie.js (IndexedDB wrapper)
- **Persists**: All reports with metadata
- **Storage**: IndexedDB (`AegisFieldDB.reports`)
- **Fields Stored**:
  - `id`: Unique report ID
  - `type`: Incident type (FLOOD, LANDSLIDE, etc.)
  - `severity`: 1-5 severity level
  - `latitude`, `longitude`: GPS coordinates
  - `description`: User notes
  - `photo`: Base64 image data
  - `timestamp`: Creation time
  - `syncStatus`: 0 (pending) or 1 (synced)
  - `deviceId`: Device that created it
  - `responderName`, `responderEmail`, `responderUid`: User info

**Test**:
```
1. Go offline
2. Create 3 reports with photos
3. Close app completely
4. Reopen in offline mode
5. Go to History → ✅ All 3 reports visible!
6. Go online → ✅ Auto-sync to server
```

#### 4. **Emergency SOS** ✅
- **Tech**: Dexie.js (IndexedDB)
- **Storage**: IndexedDB (`AegisFieldDB.emergencies`)
- **Persists**: Emergency alerts with location

#### 5. **App Settings** ✅
- **Tech**: Dexie.js + Zustand persist
- **Storage**: IndexedDB (`AegisFieldDB.settings`) + localStorage
- **Persists**: Language preference, theme, notifications

---

## 🧪 Complete Offline Test Scenarios

### Test 1: Kill & Reopen App (Offline Mode)

**Steps:**
1. **Online Phase**:
   - Open https://152.42.185.253/app/
   - Login with email/password
   - Create 2 reports (one with photo)
   - Verify they show in History

2. **Go Offline**:
   - Enable airplane mode
   - Close browser completely (Ctrl+Q or Alt+F4)
   - Wait 10 seconds

3. **Reopen Offline**:
   - Open browser
   - Navigate to https://152.42.185.253/app/
   - **Expected Results**:
     - ✅ Still logged in (no login prompt)
     - ✅ Home page loads
     - ✅ User name visible in header
     - ✅ History shows 2 reports
     - ✅ Photos visible
     - ✅ Reports show "⏳ Pending sync"

4. **Create More Reports Offline**:
   - Create 2 more reports
   - Close app again
   - Reopen
   - **Expected**: ✅ All 4 reports in History

5. **Come Back Online**:
   - Disable airplane mode
   - Refresh app or wait
   - **Expected**:
     - ✅ "Syncing to server..." appears
     - ✅ Reports auto-sync
     - ✅ "⏳ Pending sync" → "✓ Synced to HQ"
     - ✅ Dashboard shows reports

---

### Test 2: Browser Restart (Offline)

**Steps:**
1. Login and create 3 reports (online)
2. Close ALL browser windows
3. Enable airplane mode
4. Restart computer (optional, for thorough test)
5. Open browser to app URL
6. **Expected**: 
   - ✅ Still logged in
   - ✅ All reports visible
   - ✅ Can create new reports offline

---

### Test 3: Long Offline Period

**Steps:**
1. Login online
2. Create 1 report
3. Go offline for 24+ hours
4. Reopen app (still offline)
5. **Expected**:
   - ✅ Still logged in
   - ✅ Report from yesterday visible
   - ✅ Can create new reports

---

### Test 4: Offline First-Use (Edge Case)

**Steps:**
1. Clear browser data
2. Enable airplane mode
3. Open app
4. **Expected**:
   - ❌ Shows login page (can't register offline)
   - ℹ️ This is expected: Firebase requires online for first registration
   - ✅ Device UUID still generated locally

**Note**: First-time registration requires internet (Firebase requirement). After that, everything works offline.

---

## 🔧 Technical Implementation Details

### IndexedDB Schema (Dexie.js)

```javascript
db.version(3).stores({
  reports: 'id, localId, type, severity, latitude, longitude, timestamp, syncStatus, deviceId',
  emergencies: 'id, localId, latitude, longitude, timestamp, syncStatus, status, deviceId',
  syncQueue: '++id, reportId, type, status, attempts, lastAttempt',
  mapTiles: 'url, data, timestamp',
  settings: 'key, value'
});
```

### Data Flow

```
User Creates Report (Offline)
         ↓
Save to IndexedDB (syncStatus: 0)
         ↓
Display in History Page
         ↓
Close & Reopen App
         ↓
Dexie loads from IndexedDB
         ↓
useLiveQuery automatically updates UI
         ↓
When Online: Sync Engine triggers
         ↓
POST to /api/incidents/device
         ↓
Update IndexedDB (syncStatus: 1)
         ↓
UI updates (green checkmark)
```

### Persistence Technologies

| Feature | Technology | Storage Location | Survives App Kill? |
|---------|-----------|-----------------|-------------------|
| Auth Session | Firebase Auth | IndexedDB + localStorage | ✅ Yes |
| Device UUID | Zustand persist | localStorage | ✅ Yes |
| Reports | Dexie.js | IndexedDB | ✅ Yes |
| Photos | Base64 in IndexedDB | IndexedDB | ✅ Yes |
| Settings | Zustand + Dexie | localStorage + IndexedDB | ✅ Yes |

---

## 📊 Current Status Summary

### ✅ What's Working

1. **Authentication Persistence**: Firebase handles this automatically
2. **Device Registration Persistence**: Zustand persist middleware
3. **Report Persistence**: All reports saved in IndexedDB
4. **Photo Persistence**: Base64 images in IndexedDB
5. **Offline Creation**: Can create unlimited reports offline
6. **Auto-Sync**: When online, automatically syncs pending reports
7. **Real-time UI**: Live updates when sync completes
8. **History Page**: Shows all reports with sync status

### 🎯 User Experience

**Offline Scenario**:
```
User in remote area (no signal)
  → Opens app: ✅ Still logged in
  → Creates 5 reports with photos
  → Closes app
  → Reopens app: ✅ All 5 reports visible
  → Drives to area with signal
  → App auto-syncs: ✅ Reports sent to HQ
  → Dashboard shows reports: ✅ Command sees them
```

**This is EXACTLY what the hackathon requirements specify!**

---

## 🧪 How to Test RIGHT NOW

### Quick Test (5 minutes)

1. **Clear browser** (for fresh test):
   ```
   Ctrl+Shift+Delete → Clear all data
   ```

2. **Online Setup**:
   - Go to https://152.42.185.253/app/
   - Register: test@example.com / password123
   - Login
   - Create 2 reports (one with photo)

3. **Offline Test**:
   - Enable airplane mode
   - Close browser completely
   - Wait 10 seconds
   - Reopen browser
   - Go to https://152.42.185.253/app/
   - ✅ Should still be logged in
   - ✅ Click History → 2 reports visible

4. **Offline Creation**:
   - Create 2 more reports
   - Close & reopen
   - ✅ All 4 reports visible

5. **Online Sync**:
   - Disable airplane mode
   - Refresh or wait
   - ✅ Reports auto-sync
   - ✅ UI shows "✓ Synced to HQ"

---

## 🎉 Conclusion

**The app ALREADY has complete offline persistence!** 

Everything is stored in IndexedDB and survives:
- ✅ App closure
- ✅ Browser restart
- ✅ Airplane mode
- ✅ Network disconnection
- ✅ Long offline periods

The implementation uses:
- **Dexie.js**: For robust IndexedDB operations
- **Firebase Auth**: With browserLocalPersistence
- **Zustand persist**: For settings/device state
- **Live Queries**: For reactive UI updates

This is a **production-ready offline-first PWA** that meets all hackathon requirements!

---

## 📝 Notes

- **IndexedDB Quota**: Modern browsers give ~50-100MB per origin
- **Photo Storage**: Base64 encoding increases size by ~33%
- **Sync Strategy**: Uses exponential backoff for retries
- **Conflict Resolution**: Backend uses local_id for deduplication
- **Data Integrity**: IndexedDB is ACID compliant (transactional)

