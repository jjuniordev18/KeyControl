import { KEY_GROUPS } from './data.js';
import { getKeyState } from './state.js';
import { formatLocalFromInput } from './utils.js';

export function coletarLinhasVisiveis() {
  const out = [];

  document.querySelectorAll('.group').forEach(g => {
    const grupo = g.getAttribute('data-group');
    g.querySelectorAll('tbody tr').forEach(tr => {
      if (tr.style.display === 'none') return;

      const cod = tr.getAttribute('data-cod');
      const tds = tr.querySelectorAll('td');
      const nome = tds[0].innerText.trim();
      const local = tds[1].innerText.trim();
      const s = getKeyState(cod) || {};
      const obsInp = tr.querySelector('.obs-view')?.textContent.trim() || s.obs || '';
      const status = s.status || tr.querySelector('select.status')?.value || '';
      const who = s.retiraNome || '';
      const emp = s.retiraEmpresa || '';
      const dtr = s.retiraDataHora ? formatLocalFromInput(s.retiraDataHora) : '';
      const dtd = s.devolveDataHora ? formatLocalFromInput(s.devolveDataHora) : '';
      const quemDev = s.devolveNome || '';

      out.push({
        grupo,
        nome,
        local,
        obs: obsInp,
        status,
        retirada_por: who,
        empresa: emp,
        data_hora_retirada: dtr,
        data_hora_devolucao: dtd,
        devolvido_por: quemDev
      });
    });
  });

  return out;
}

export function toCSV(rows) {
  const sep = ';';
  const lines = [];

  lines.push(['Grupo', 'Nome', 'Local', 'Observações', 'Status', 'Retirada por', 'Empresa', 'Data Retirada', 'Data Devolução', 'Devolvido por'].join(sep));

  rows.forEach(o => {
    const safe = v => (v ?? '').toString().replaceAll('\n', ' ').replaceAll(sep, ',');
    lines.push([
      o.grupo,
      safe(o.nome),
      safe(o.local),
      safe(o.obs),
      safe(o.status),
      safe(o.retirada_por),
      safe(o.empresa),
      safe(o.data_hora_retirada),
      safe(o.data_hora_devolucao),
      safe(o.devolvido_por)
    ].join(sep));
  });

  return '\uFEFF' + lines.join('\n');
}

export function exportarCSV() {
  const rows = coletarLinhasVisiveis();
  if (!rows.length) {
    alert('ℹ️ Não há linhas para exportar.');
    return;
  }

  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.download = `KeyControl-Export-${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function exportarPDF() {
  window.print();
}
