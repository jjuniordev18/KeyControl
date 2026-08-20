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

let unsubscribeSnapshot = null;

export function subscribeToFirebase() {
  if (!isFirebaseEnabled()) return;

  const db = getDb();
  if (!db) return;

  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }

  unsubscribeSnapshot = db.collection('keys').doc('shared-state')
    .onSnapshot((doc) => {
      if (!doc.exists) return;

      const remoteData = doc.data();
      const remoteState = remoteData.data;
      if (!remoteState || typeof remoteState !== 'object') return;

      const remoteTs = remoteData.updatedAt?.toMillis() || 0;
      const localTs = state._lastSaved || 0;

      if (remoteTs > localTs) {
        const changedKeys = [];
        for (const key in remoteState) {
          if (key.startsWith('_')) continue;
          const oldVal = JSON.stringify(state[key]);
          const newVal = JSON.stringify(remoteState[key]);
          if (oldVal !== newVal) changedKeys.push(key);
        }

        state = { ...remoteState, _lastSaved: remoteTs };
        localStorage.setItem(STATE_KEY, JSON.stringify(state));

        if (changedKeys.length > 0) {
          console.log('📥 Sync recebido do Firebase:', changedKeys);
          const syncEl = document.getElementById('syncStatus');
          if (syncEl) {
            syncEl.innerHTML = '📥 Atualizado por outro dispositivo';
            setTimeout(() => { syncEl.innerHTML = '🟢 Online'; }, 3000);
          }
          window.dispatchEvent(new CustomEvent('firebase-sync', { detail: { changedKeys } }));
        }
      }
    }, (error) => {
      console.warn('Erro no listener Firebase:', error);
      const syncEl = document.getElementById('syncStatus');
      if (syncEl) syncEl.innerHTML = '⚠️ Sync com erro';
    });
}

export function unsubscribeFirebase() {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
}

export function getKeyState(cod) {
  return state[cod] || {};
}

export function updateKeyState(cod, updates) {
  state[cod] = { ...state[cod], ...updates };
  state._lastSaved = Date.now();
  saveState();
}