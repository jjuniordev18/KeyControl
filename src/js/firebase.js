const firebaseConfig = {
  apiKey: "AIzaSyDxIhkN7e7uWg-DPmC3FNVPYIlYgWoD4sw",
  authDomain: "keycontrol-e830c.firebaseapp.com",
  projectId: "keycontrol-e830c",
  storageBucket: "keycontrol-e830c.firebasestorage.app",
  messagingSenderId: "774899212422",
  appId: "1:774899212422:web:832ca4389984fb1a00b107",
  measurementID: "G-5MNBFRQWSV"
};

let db = null;
let auth = null;
let useFirebase = false;
let currentUserId = null;

export function initFirebase() {
  try {
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      useFirebase = true;
      currentUserId = getOrCreateDeviceId();
      console.log("✅ Firebase inicializado! Device ID:", currentUserId);
      return true;
    }
  } catch (e) {
    console.warn("⚠️ Erro ao inicializar Firebase:", e);
  }
  return false;
}

function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem('keycontrol-device-id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('keycontrol-device-id', deviceId);
  }
  return deviceId;
}

export function getCurrentUserId() {
  return currentUserId;
}

export function getDb() {
  return db;
}

export function getAuth() {
  return auth;
}

export function isFirebaseEnabled() {
  return useFirebase;
}