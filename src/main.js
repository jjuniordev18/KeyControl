import './assets/styles.css';
import { initFirebase, isFirebaseEnabled } from './js/firebase.js';
import { setupEventListeners, renderGroups, filtrar, refreshRow, setCurrentKeyItem, checkMobileView, renderStats, getStats } from './js/ui.js';
import { saveState, getKeyState, updateKeyState, loadStateFromFirebase } from './js/state.js';
import { KEY_GROUPS, getAllKeys, findKeyByCod } from './js/data.js';
import { exportarCSV, exportarPDF } from './js/export.js';
import { nowLocalForInput, formatLocalFromInput, abrirModal, fecharModal, toggleTheme, loadTheme, previewFile, resizeImageToDataURL } from './js/utils.js';

const ADMIN_PASSWORD = 'admin#2026!';
let isAdmin = false;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error);
}

initFirebase();
loadTheme();
setupEventListeners();
renderStats();
checkMobileView();
window.addEventListener('resize', checkMobileView);

loadCustomKeys();

if (isFirebaseEnabled()) {
  loadStateFromFirebase().then(loaded => {
    if (loaded) {
      renderGroups();
      filtrar();
    }
  });
}

renderGroups();

document.getElementById('btnAdmin').addEventListener('click', () => {
  if (isAdmin) {
    isAdmin = false;
    document.getElementById('btnNovoAtivo').style.display = 'none';
    document.getElementById('btnNovoGrupo').style.display = 'none';
    document.getElementById('btnAdmin').textContent = '🔐';
    document.getElementById('btnAdmin').title = 'Modo Admin';
  } else {
    document.getElementById('adminModal').style.display = 'flex';
  }
});

document.getElementById('btnAdminLogin').addEventListener('click', () => {
  const password = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('adminError');

  if (password === ADMIN_PASSWORD) {
    isAdmin = true;
    document.getElementById('adminModal').style.display = 'none';
    document.getElementById('btnNovoAtivo').style.display = 'inline-flex';
    document.getElementById('btnNovoGrupo').style.display = 'inline-flex';
    document.getElementById('btnAdmin').textContent = '🔓';
    document.getElementById('btnAdmin').title = 'Admin ativo';
    document.getElementById('adminPassword').value = '';
    errorEl.style.display = 'none';
  } else {
    errorEl.textContent = 'Senha incorreta!';
    errorEl.style.display = 'block';
  }
});

document.getElementById('adminPassword').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('btnAdminLogin').click();
  }
});

document.querySelector('.modal-close[data-action="fechar-admin"]').addEventListener('click', () => {
  document.getElementById('adminModal').style.display = 'none';
});

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;

  switch (action) {
    case 'fechar-modal':
      const target = btn.dataset.target;
      if (target) fecharModal(target);
      break;

    case 'export-csv':
      exportarCSV();
      break;

    case 'export-pdf':
      exportarPDF();
      break;

    case 'confirmar-retirada':
      confirmarRetirada();
      break;

    case 'confirmar-devolucao':
      confirmarDevolucao();
      break;

    case 'salvar-ativo':
      if (!isAdmin) {
        alert('⚠️ Apenas o admin pode adicionar ativos!');
        return;
      }
      salvarNovoAtivo();
      break;

    case 'salvar-grupo':
      if (!isAdmin) {
        alert('⚠️ Apenas o admin pode criar grupos!');
        return;
      }
      salvarNovoGrupo();
      break;
  }
});

document.getElementById('btnNovoAtivo').addEventListener('click', () => {
  if (!isAdmin) {
    alert('⚠️ Apenas o admin pode adicionar ativos!');
    return;
  }
  document.getElementById('novoCodigo').value = '';
  document.getElementById('novoNome').value = '';
  document.getElementById('novoLocal').value = '';
  document.getElementById('novoGrupo').value = '';
  document.getElementById('novoObs').value = '';
  abrirModal('modalNovoAtivo');
});

document.getElementById('btnNovoGrupo').addEventListener('click', () => {
  if (!isAdmin) {
    alert('⚠️ Apenas o admin pode criar grupos!');
    return;
  }
  document.getElementById('novoNomeGrupo').value = '';
  document.getElementById('novoIconeGrupo').value = '';
  abrirModal('modalNovoGrupo');
});

function salvarNovoAtivo() {
  const codigo = document.getElementById('novoCodigo').value.trim();
  const nome = document.getElementById('novoNome').value.trim();
  const local = document.getElementById('novoLocal').value.trim();
  const grupo = document.getElementById('novoGrupo').value;
  const obs = document.getElementById('novoObs').value.trim();

  if (!codigo || !nome || !local || !grupo) {
    alert('⚠️ Preencha todos os campos obrigatórios!');
    return;
  }

  if (!KEY_GROUPS[grupo]) {
    KEY_GROUPS[grupo] = { name: grupo, icon: '📁', keys: [] };
  }

  const novoAtivo = { cod: codigo, nome: nome, local: local };
  KEY_GROUPS[grupo].keys.push(novoAtivo);

  const customKeys = JSON.parse(localStorage.getItem('keycontrol-custom-keys') || '[]');
  customKeys.push({ ...novoAtivo, grupo, obs });
  localStorage.setItem('keycontrol-custom-keys', JSON.stringify(customKeys));

  renderGroups();
  filtrar();
  fecharModal('modalNovoAtivo');
  alert('✅ Ativo cadastrado com sucesso!');
}

function salvarNovoGrupo() {
  const nomeGrupo = document.getElementById('novoNomeGrupo').value.trim();
  const iconGrupo = document.getElementById('novoIconeGrupo').value.trim() || '📁';

  if (!nomeGrupo) {
    alert('⚠️ Digite o nome do grupo!');
    return;
  }

  const keyGrupo = nomeGrupo.toLowerCase().replace(/\s+/g, '_');
  
  if (KEY_GROUPS[keyGrupo]) {
    alert('⚠️ Grupo já existe!');
    return;
  }

  KEY_GROUPS[keyGrupo] = { 
    name: nomeGrupo, 
    icon: iconGrupo, 
    keys: [] 
  };

  const customGroups = JSON.parse(localStorage.getItem('keycontrol-custom-groups') || '[]');
  customGroups.push({ key: keyGrupo, name: nomeGrupo, icon: iconGrupo });
  localStorage.setItem('keycontrol-custom-groups', JSON.stringify(customGroups));

  renderGroups();
  filtrar();
  fecharModal('modalNovoGrupo');
  
  const grupoSelect = document.getElementById('novoGrupo');
  const newOption = document.createElement('option');
  newOption.value = keyGrupo;
  newOption.textContent = `${iconGrupo} ${nomeGrupo}`;
  grupoSelect.appendChild(newOption);
  
  alert('✅ Grupo criado com sucesso!');
}

function loadCustomKeys() {
  const customKeys = JSON.parse(localStorage.getItem('keycontrol-custom-keys') || '[]');
  customKeys.forEach(item => {
    const grupo = item.grupo;
    if (!KEY_GROUPS[grupo]) {
      KEY_GROUPS[grupo] = { name: grupo, icon: '📁', keys: [] };
    }
    KEY_GROUPS[grupo].keys.push({
      cod: item.cod,
      nome: item.nome,
      local: item.local
    });
  });

  const customGroups = JSON.parse(localStorage.getItem('keycontrol-custom-groups') || '[]');
  customGroups.forEach(item => {
    KEY_GROUPS[item.key] = { name: item.name, icon: item.icon, keys: [] };
  });

  const grupoSelect = document.getElementById('novoGrupo');
  if (grupoSelect) {
    customGroups.forEach(item => {
      const option = document.createElement('option');
      option.value = item.key;
      option.textContent = `${item.icon} ${item.name}`;
      grupoSelect.appendChild(option);
    });
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    fecharModal('modalRetirar');
    fecharModal('modalDevolver');
    fecharModal('modalNovoAtivo');
    fecharModal('modalNovoGrupo');
    document.getElementById('adminModal').style.display = 'none';
  }
});

document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) {
      fecharModal('modalRetirar');
      fecharModal('modalDevolver');
      fecharModal('modalNovoAtivo');
      fecharModal('modalNovoGrupo');
      document.getElementById('adminModal').style.display = 'none';
    }
  });
});

const toggleThemeBtn = document.getElementById('toggleTheme');
if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener('click', toggleTheme);
}

window.addEventListener('open-retirar-modal', e => {
  abrirModalRetirar(e.detail);
});

window.addEventListener('open-devolver-modal', e => {
  abrirModalDevolver(e.detail);
});

function abrirModalRetirar(item) {
  setCurrentKeyItem(item);
  const s = getKeyState(item.cod) || {};

  document.getElementById('retirarTitle').textContent = `🔑 Retirar: ${item.nome}`;
  document.getElementById('retirarInfo').innerHTML = `<strong>${item.nome}</strong><br><span style="color:var(--text-muted)">${item.local}</span>`;

  const nomeEl = document.getElementById('retiraNome');
  const empEl = document.getElementById('retiraEmpresa');
  const obsEl = document.getElementById('retiraObs');
  const localEl = document.getElementById('retiraLocal');
  const fotoEl = document.getElementById('retiraFoto');
  const dtEl = document.getElementById('retiraDataHora');
  const prev = document.getElementById('retiraPreview');

  const isDisponivel = s.status !== 'RETIRADA';
  
  if (isDisponivel) {
    nomeEl.value = '';
    empEl.value = '';
    obsEl.value = '';
    localEl.value = item.local;
    fotoEl.value = '';
    prev.textContent = 'Nenhuma foto selecionada';
    prev.innerHTML = '';
  } else {
    nomeEl.value = s.retiraNome || '';
    empEl.value = s.retiraEmpresa || '';
    obsEl.value = s.obs || '';
    localEl.value = s.local || item.local;
    if (s.fotoRetirada) {
      const img = new Image();
      img.src = s.fotoRetirada;
      img.alt = 'Foto da retirada';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '160px';
      img.style.borderRadius = 'var(--radius-lg)';
      prev.innerHTML = '';
      prev.appendChild(img);
    }
  }
  dtEl.value = isDisponivel ? nowLocalForInput() : (s.retiraDataHora || nowLocalForInput());

  const isRetirada = s.status === 'RETIRADA';
  [nomeEl, empEl, dtEl].forEach(el => el.disabled = isRetirada);
  
  if (localEl) {
    localEl.disabled = isRetirada || !isAdmin;
    localEl.style.backgroundColor = (!isRetirada && isAdmin) ? 'var(--bg-input)' : 'var(--bg-main)';
  }
  
  if (obsEl) {
    obsEl.disabled = true;
    obsEl.style.backgroundColor = 'var(--bg-muted)';
    obsEl.title = 'Este campo é apenas para visualização do histórico';
  }
  
  if (fotoEl) {
    fotoEl.disabled = isRetirada;
  }
  
  document.getElementById('btnConfirmarRetirada').style.display = isRetirada ? 'none' : '';

  validarRetirada();
  abrirModal('modalRetirar');
}

function abrirModalDevolver(item) {
  setCurrentKeyItem(item);

  document.getElementById('devolverTitle').textContent = `✅ Devolver: ${item.nome}`;
  document.getElementById('devolverInfo').innerHTML = `<strong>${item.nome}</strong><br><span style="color:var(--text-muted)">${item.local}</span>`;

  document.getElementById('devolveNome').value = '';
  document.getElementById('devolveObs').value = '';
  document.getElementById('devolveFoto').value = '';
  document.getElementById('devolvePreview').textContent = 'Selecione uma foto';
  document.getElementById('devolvePreview').innerHTML = '';
  document.getElementById('devolveDataHora').value = nowLocalForInput();

  validarDevolucao();
  abrirModal('modalDevolver');
}

const retiraFotoInput = document.getElementById('retiraFoto');
if (retiraFotoInput) {
  retiraFotoInput.addEventListener('change', e => previewFile(e.target, 'retiraPreview'));
}

const devolveFotoInput = document.getElementById('devolveFoto');
if (devolveFotoInput) {
  devolveFotoInput.addEventListener('change', e => {
    previewFile(e.target, 'devolvePreview');
    validarDevolucao();
  });
}

['retiraNome', 'retiraEmpresa', 'retiraDataHora'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', validarRetirada);
});

['devolveNome', 'devolveDataHora', 'devolveFoto'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', validarDevolucao);
});

function validarRetirada() {
  const ok = document.getElementById('retiraNome').value.trim() &&
    document.getElementById('retiraEmpresa').value.trim() &&
    document.getElementById('retiraDataHora').value;
  document.getElementById('btnConfirmarRetirada').disabled = !ok;
}

function validarDevolucao() {
  const nome = document.getElementById('devolveNome').value.trim();
  const dt = document.getElementById('devolveDataHora').value;
  const file = document.getElementById('devolveFoto').files?.[0];
  const ok = nome && dt && file;
  document.getElementById('btnConfirmarDevolucao').disabled = !ok;
}

async function confirmarRetirada() {
  const nome = document.getElementById('retiraNome').value.trim();
  const emp = document.getElementById('retiraEmpresa').value.trim();
  const obs = document.getElementById('retiraObs').value.trim();
  const local = document.getElementById('retiraLocal')?.value.trim();
  const dt = document.getElementById('retiraDataHora').value;
  const file = document.getElementById('retiraFoto').files?.[0];

  if (!nome || !emp || !dt) {
    alert('⚠️ Preencha Nome, Empresa e Data/Hora para retirar a chave.');
    return;
  }

  const item = window.currentKeyItem;
  const cod = item.cod;

  updateKeyState(cod, {
    nome: item.nome,
    local: local || item.local,
    retiraNome: nome,
    retiraEmpresa: emp,
    retiraDataHora: dt,
    status: 'RETIRADA',
    ts: new Date().toISOString()
  });

  const extra = `Retirada por: ${nome} (${emp}) em ${formatLocalFromInput(dt)}`;
  const currentObs = getKeyState(cod)?.obs || '';
  updateKeyState(cod, { obs: [extra, currentObs].filter(Boolean).join(' | ') });

  if (file) {
    try {
      const foto = await resizeImageToDataURL(file);
      updateKeyState(cod, { fotoRetirada: foto });
    } catch (e) {
      console.warn('Falha ao processar imagem da retirada:', e);
    }
  }

  refreshRow(cod);
  fecharModal('modalRetirar');
}

async function confirmarDevolucao() {
  const quemDevolve = document.getElementById('devolveNome').value.trim();
  const obsUser = document.getElementById('devolveObs').value.trim();
  const dt = document.getElementById('devolveDataHora').value;
  const file = document.getElementById('devolveFoto').files?.[0];

  if (!quemDevolve) {
    alert('⚠️ Informe o nome de quem está devolvendo a chave.');
    return;
  }
  if (!file) {
    alert('⚠️ A foto da devolução é obrigatória.');
    return;
  }
  if (!dt) {
    alert('⚠️ A data/hora da devolução é obrigatória.');
    return;
  }

  const item = window.currentKeyItem;
  const cod = item.cod;
  const quemRetirou = getKeyState(cod)?.retiraNome || 'Desconhecido';
  const historicoAnterior = getKeyState(cod)?.obs || '';

  updateKeyState(cod, {
    devolveNome: quemDevolve,
    devolveDataHora: dt,
    status: 'Ativo',
    obs: `${historicoAnterior}\n✅ Devolvida em ${formatLocalFromInput(dt)} por ${quemDevolve}. ${obsUser || ''}`.trim(),
    retornaNome: '',
    retornaEmpresa: '',
    retornaDataHora: '',
    fotoRetirada: ''
  });

  if (file) {
    try {
      const foto = await resizeImageToDataURL(file);
      updateKeyState(cod, { fotoDevolucao: foto });
    } catch (e) {
      console.warn('Falha ao processar imagem da devolução:', e);
    }
  }

  refreshRow(cod);
  fecharModal('modalDevolver');
}

console.log('🚀 KeyControl carregado!');
