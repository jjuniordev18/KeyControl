import { getDb, isFirebaseEnabled, getCurrentUserId } from './firebase.js';

const STATE_KEY = 'keycontrol-state-v12';

export let state = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');

export function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));

  if (isFirebaseEnabled()) {
    const db = getDb();
    if (!db) {
      console.warn('⚠️ Firestore não disponível');
      return;
    }

    const syncEl = document.getElementById('syncStatus');
    if (syncEl) syncEl.innerHTML = '🔄 Salvando...';

    db.collection('keys').doc('shared-state')
      .set({
        data: state,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        version: 'v12',
        lastDevice: getCurrentUserId()
      }, { merge: true })
      .then(() => {
        if (syncEl) {
          syncEl.innerHTML = '✅ Sincronizado';
          setTimeout(() => { syncEl.innerHTML = '🟢 Online'; }, 2000);
        }
        console.log('📤 Estado salvo no Firebase');
      })
      .catch(e => {
        console.warn('Erro ao salvar no Firebase:', e);
        if (syncEl) syncEl.innerHTML = '⚠️ Offline (local)';
      });
  }
}

export async function loadStateFromFirebase() {
  if (!isFirebaseEnabled()) return false;
  
  const db = getDb();
  if (!db) return false;
  
  try {
    const doc = await db.collection('keys').doc('shared-state').get();
    if (doc.exists) {
      const remoteData = doc.data();
      const remoteState = remoteData.data;
      if (remoteState && typeof remoteState === 'object') {
        const localTs = state._lastSaved || 0;
        const remoteTs = remoteData.updatedAt?.toMillis() || 0;
        if (remoteTs > localTs) {
          state = { ...remoteState, _lastSaved: remoteTs };
          localStorage.setItem(STATE_KEY, JSON.stringify(state));
          console.log('📥 Estado carregado do Firebase');
          return true;
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar do Firebase:', e);
  }
  return false;
}

export function getKeyState(cod) {
  return state[cod] || {};
}

export function updateKeyState(cod, updates) {
  state[cod] = { ...state[cod], ...updates };
  state._lastSaved = Date.now();
  saveState();
}