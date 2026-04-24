import { KEY_GROUPS, getAllKeys, findKeyByCod } from './data.js';
import { getKeyState, updateKeyState, saveState } from './state.js';

const normalize = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

let currentFilter = 'all';

export function getStats() {
  const all = getAllKeys().length;
  let disponivel = 0;
  let retirada = 0;
  
  Object.values(KEY_GROUPS).forEach(group => {
    group.keys.forEach(key => {
      const st = getKeyState(key.cod)?.status;
      if (st === 'RETIRADA') {
        retirada++;
      } else {
        disponivel++;
      }
    });
  });
  
  return { all, disponivel, retirada };
}

export function renderStats() {
  const stats = getStats();
  const container = document.getElementById('statsBar');
  if (!container) return;
  
  container.innerHTML = `
    <div class="stat-item" data-filter="all">
      <span class="stat-num">${stats.all}</span>
      <span class="stat-label">Total</span>
    </div>
    <div class="stat-item" data-filter="disponivel">
      <span class="stat-num">${stats.disponivel}</span>
      <span class="stat-label">Disponíveis</span>
    </div>
    <div class="stat-item" data-filter="retirada">
      <span class="stat-num">${stats.retirada}</span>
      <span class="stat-label">Retiradas</span>
    </div>
  `;
  
  container.querySelectorAll('.stat-item').forEach(item => {
    item.addEventListener('click', () => {
      const filter = item.dataset.filter;
      setFilter(filter);
    });
  });
  
  updateFilterUI();
}

export function setFilter(filter) {
  currentFilter = filter;
  updateFilterUI();
  filtrar();
}

function updateFilterUI() {
  const container = document.getElementById('statsBar');
  if (!container) return;
  
  container.querySelectorAll('.stat-item').forEach(item => {
    item.classList.toggle('active', item.dataset.filter === currentFilter);
  });
}

export function tagLocal(local) {
  const isInside = /DENTRO/i.test(local);
  return `<span class="tag ${isInside ? 'in' : 'out'}">${isInside ? '🔒' : '🔓'} ${local}</span>`;
}

export function statusBadge(text) {
  if (!text) return '<span class="tag" style="background:var(--bg-elevated);color:var(--text-muted)">—</span>';
  const isRet = text === 'RETIRADA';
  return `<span class="tag ${isRet ? 'retirada' : 'ativo'}">${isRet ? '🔴 RETIRADA' : '🟢 Ativo'}</span>`;
}

export function actionButtons(cod) {
  const st = getKeyState(cod)?.status || '';
  if (st === 'RETIRADA') {
    return `<div class="actions row-actions">
      <button class="btn btn-outline" data-act="detalhes" data-cod="${cod}" style="padding:6px 10px;font-size:13px">👁️</button>
      <button class="btn btn-success" data-act="devolver" data-cod="${cod}" style="padding:6px 10px;font-size:13px">✅ Devolver</button>
    </div>`;
  }
  return `<div class="actions row-actions">
    <button class="btn btn-outline" data-act="detalhes" data-cod="${cod}" style="padding:6px 10px;font-size:13px">👁️</button>
    <button class="btn btn-danger" data-act="retirar" data-cod="${cod}" style="padding:6px 10px;font-size:13px">🔑 Retirar</button>
  </div>`;
}

function row(item) {
  const s = getKeyState(item.cod) || {};
  const local = s.local || item.local;
  const nome = s.nome || item.nome;
  const key = (nome + ' ' + local);
  const keyNorm = normalize(key);
  const obsVal = s.obs || '';
  const disabled = s.status === 'RETIRADA' ? 'disabled' : '';
  const statusHtml = `<select class="status" data-cod="${item.cod}" ${disabled}>
    <option value="">—</option>
    <option value="Ativo" ${s.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
    <option value="Manutenção" ${s.status === 'Manutenção' ? 'selected' : ''}>Manutenção</option>
    <option value="Inativo" ${s.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
    <option value="RETIRADA" ${s.status === 'RETIRADA' ? 'selected' : ''} disabled>RETIRADA</option>
  </select>`;

  return `<tr data-key="${key}" data-key-norm="${keyNorm}" data-cod="${item.cod}">
    <td><strong class="mono">${nome}</strong></td>
    <td>${tagLocal(local)}</td>
    <td><div class="obs-view" data-cod="${item.cod}" title="${obsVal.replace(/"/g, '&quot;')}">${obsVal ? obsVal.substring(0, 50) + (obsVal.length > 50 ? '...' : '') : '—'}</div></td>
    <td>${statusHtml}${statusBadge(s.status)}</td>
    <td>${actionButtons(item.cod)}</td>
  </tr>`;
}

function keyCard(item) {
  const s = getKeyState(item.cod) || {};
  const nome = s.nome || item.nome;
  const local = s.local || item.local;
  const status = s.status;
  const statusText = status === 'RETIRADA' ? '🔴 RETIRADA' : (status ? '🟢 ' + status : '🟢 Ativo');
  const obs = s.obs || '';
  
  const actions = status === 'RETIRADA' 
    ? `<button class="btn btn-success" data-act="devolver" data-cod="${item.cod}">✅ Devolver</button>`
    : `<button class="btn btn-danger" data-act="retirar" data-cod="${item.cod}">🔑 Retirar</button>`;
  
  return `<div class="key-card" data-key="${nome} ${local}" data-key-norm="${normalize(nome + ' ' + local)}" data-cod="${item.cod}">
    <div class="key-card-header">
      <span class="key-card-title">${nome}</span>
      <span class="tag ${status === 'RETIRADA' ? 'retirada' : 'ativo'}">${statusText}</span>
    </div>
    <div class="key-card-local">${local}</div>
    ${obs ? `<div class="obs-view" style="margin-bottom:8px">${obs.substring(0, 60)}${obs.length > 60 ? '...' : ''}</div>` : ''}
    <div class="key-card-actions">
      <button class="btn btn-outline" data-act="detalhes" data-cod="${item.cod}">👁️</button>
      ${actions}
    </div>
  </div>`;
}

export function renderGroups() {
  const container = document.getElementById('groupsContainer');
  container.innerHTML = '';

  Object.entries(KEY_GROUPS).forEach(([groupKey, group]) => {
    const section = document.createElement('section');
    section.className = 'group';
    section.dataset.group = group.name;

    section.innerHTML = `
      <div class="group-header">${group.icon} ${group.name}</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width:28%">Nome</th>
              <th style="width:18%">Local</th>
              <th style="width:32%">Observações</th>
              <th style="width:12%">Status</th>
              <th style="width:10%">Ações</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="mobile-cards"></div>
    `;

    const tbody = section.querySelector('tbody');
    tbody.innerHTML = group.keys.map(row).join('');
    
    const mobileContainer = section.querySelector('.mobile-cards');
    mobileContainer.innerHTML = group.keys.map(keyCard).join('');
    
    container.appendChild(section);
  });

  filtrar();
  checkMobileView();
}

export function checkMobileView() {
  const isMobile = window.innerWidth <= 600;
  document.querySelectorAll('.group').forEach(g => {
    g.classList.toggle('mobile-view', isMobile);
  });
}

export function filtrar() {
  const q = document.getElementById('q').value;
  const qNorm = normalize(q);

  document.querySelectorAll('tbody tr').forEach(tr => {
    const baseNorm = tr.getAttribute('data-key-norm') || '';
    const cod = tr.getAttribute('data-cod');
    const obs = normalize(getKeyState(cod)?.obs || '');
    const st = getKeyState(cod)?.status || '';
    const who = normalize((getKeyState(cod)?.retiraNome || '') + ' ' + (getKeyState(cod)?.retiraEmpresa || ''));
    
    const hitSearch = (baseNorm + ' ' + obs + ' ' + st + ' ' + who).includes(qNorm);
    const hitFilter = currentFilter === 'all' || 
      (currentFilter === 'disponivel' && st !== 'RETIRADA') ||
      (currentFilter === 'retirada' && st === 'RETIRADA');
    
    tr.style.display = (hitSearch && hitFilter) ? '' : 'none';
  });
  
  document.querySelectorAll('.key-card').forEach(card => {
    const keyNorm = card.getAttribute('data-key-norm') || '';
    const cod = card.getAttribute('data-cod');
    const obs = normalize(getKeyState(cod)?.obs || '');
    const st = getKeyState(cod)?.status || '';
    const who = normalize((getKeyState(cod)?.retiraNome || '') + ' ' + (getKeyState(cod)?.retiraEmpresa || ''));
    
    const hitSearch = (keyNorm + ' ' + obs + ' ' + st + ' ' + who).includes(qNorm);
    const hitFilter = currentFilter === 'all' || 
      (currentFilter === 'disponivel' && st !== 'RETIRADA') ||
      (currentFilter === 'retirada' && st === 'RETIRADA');
    
    card.style.display = (hitSearch && hitFilter) ? '' : 'none';
  });
}

export function refreshRow(cod) {
  const item = findKeyByCod(cod);
  if (!item) return;

  const s = getKeyState(cod) || {};
  const itemWithState = { ...item, ...s };

  const tr = document.querySelector(`tr[data-cod="${cod}"]`);
  if (tr) {
    const newRow = document.createElement('tbody');
    newRow.innerHTML = row(itemWithState);
    tr.outerHTML = newRow.firstElementChild.outerHTML;
  }
  
  const card = document.querySelector(`.key-card[data-cod="${cod}"]`);
  if (card) {
    card.outerHTML = keyCard(itemWithState);
  }
  
  filtrar();
}

export function setupEventListeners() {
  document.addEventListener('change', e => {
    if (e.target.matches('select.status')) {
      const cod = e.target.getAttribute('data-cod');
      const val = e.target.value;
      const currentStatus = getKeyState(cod)?.status;

      if (currentStatus === 'RETIRADA') {
        e.target.value = 'RETIRADA';
        return;
      }

      updateKeyState(cod, { status: val });
      const td = e.target.parentElement;
      td.querySelectorAll('.tag').forEach(el => el.remove());
      td.insertAdjacentHTML('beforeend', statusBadge(val));
    }
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;

    const cod = btn.getAttribute('data-cod');
    const item = findKeyByCod(cod);
    if (!item) return;

    if (btn.dataset.act === 'retirar' || btn.dataset.act === 'detalhes') {
      window.dispatchEvent(new CustomEvent('open-retirar-modal', { detail: item }));
    } else if (btn.dataset.act === 'devolver') {
      window.dispatchEvent(new CustomEvent('open-devolver-modal', { detail: item }));
    }
  });

  document.getElementById('q').addEventListener('input', filtrar);
}

export function setCurrentKeyItem(item) {
  window.currentKeyItem = item;
}