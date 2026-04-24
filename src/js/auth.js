import { getAuth, isFirebaseEnabled } from './firebase.js';
import { setCurrentUser } from './state.js';

export function mostrarErro(elementId, mensagem) {
  const el = document.getElementById(elementId);
  el.textContent = mensagem;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 5000);
}

export async function mostrarApp(user) {
  setCurrentUser(user);
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';

  const nome = user.displayName || user.email?.split('@')[0] || 'Usuário';
  const email = user.email || '';
  const initials = nome.charAt(0).toUpperCase();

  document.getElementById('userName').textContent = nome;
  document.getElementById('userName').style.display = 'inline';
  document.getElementById('userInitials').textContent = initials;
  document.getElementById('dropdownEmail').textContent = email;

  const syncEl = document.getElementById('syncStatus');
  if (syncEl) {
    syncEl.innerHTML = isFirebaseEnabled() ? '🟢 Online' : '📴 Offline (local)';
    syncEl.title = isFirebaseEnabled() ? 'Sincronizando com Firebase' : 'Dados salvos apenas neste dispositivo';
  }

  if (isFirebaseEnabled()) {
    const { loadStateFromFirebase } = await import('./state.js');
    const loaded = await loadStateFromFirebase(user.uid);
    if (loaded) {
      const { renderGroups } = await import('./ui.js');
      renderGroups();
    }
  }

  const { renderGroups } = await import('./ui.js');
  renderGroups();
}

export function setupAuthListeners() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!isFirebaseEnabled()) {
        if (password.length >= 6) {
          mostrarApp({ email, displayName: email.split('@')[0] });
        } else {
          mostrarErro('loginError', 'Senha deve ter pelo menos 6 caracteres (modo demo)');
        }
        return;
      }

      try {
        const auth = getAuth();
        const result = await auth.signInWithEmailAndPassword(email, password);
        mostrarApp(result.user);
      } catch (error) {
        let msg = 'Erro ao fazer login';
        if (error.code === 'auth/user-not-found') msg = 'Usuário não encontrado';
        else if (error.code === 'auth/wrong-password') msg = 'Senha incorreta';
        else if (error.code === 'auth/invalid-email') msg = 'E-mail inválido';
        else if (error.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Tente mais tarde.';
        mostrarErro('loginError', msg);
      }
    });
  }

  const btnGoogle = document.getElementById('btnGoogle');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      if (!isFirebaseEnabled()) {
        mostrarApp({ email: 'demo@keycontrol.app', displayName: 'Usuário Demo' });
        return;
      }

      try {
        const auth = getAuth();
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await auth.signInWithPopup(provider);
        mostrarApp(result.user);
      } catch (error) {
        console.error('Erro Google Sign-In:', error);
        let msg = 'Erro ao conectar com Google';
        if (error.code === 'auth/popup-closed-by-user') msg = 'Login cancelado';
        else if (error.code === 'auth/popup-blocked') msg = 'Popup bloqueado. Permita popups neste site.';
        mostrarErro('loginError', msg);
      }
    });
  }

  const showRegister = document.getElementById('showRegister');
  if (showRegister) {
    showRegister.addEventListener('click', () => {
      document.getElementById('registerScreen').style.display = 'flex';
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('regNome').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const confirm = document.getElementById('regConfirm').value;

      if (password !== confirm) {
        mostrarErro('registerError', 'As senhas não conferem');
        return;
      }

      if (!isFirebaseEnabled()) {
        mostrarErro('registerError', 'Cadastro não disponível no modo demo');
        return;
      }

      try {
        const auth = getAuth();
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: nome });
        mostrarApp(result.user);
        document.getElementById('registerScreen').style.display = 'none';
      } catch (error) {
        let msg = 'Erro ao criar conta';
        if (error.code === 'auth/email-already-in-use') msg = 'E-mail já cadastrado';
        else if (error.code === 'auth/weak-password') msg = 'Senha muito fraca';
        else if (error.code === 'auth/invalid-email') msg = 'E-mail inválido';
        mostrarErro('registerError', msg);
      }
    });
  }
}

export function logout() {
  if (isFirebaseEnabled()) {
    const auth = getAuth();
    auth.signOut();
  }
  window.location.reload();
}
