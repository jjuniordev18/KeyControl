export function nowLocalForInput() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export function formatLocalFromInput(dtLocal) {
  try {
    const [d, t] = dtLocal.split('T');
    const [Y, M, D] = d.split('-').map(Number);
    const [h, m] = (t || '00:00').split(':').map(Number);
    const date = new Date(Y, M - 1, D, h, m, 0);
    return date.toLocaleString('pt-BR');
  } catch (e) {
    return dtLocal;
  }
}

export function abrirModal(id) {
  document.getElementById(id).style.display = 'flex';
}

export function fecharModal(id) {
  document.getElementById(id).style.display = 'none';
}

export function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('keycontrol-theme', next);

  const btn = document.getElementById('toggleTheme');
  if (btn) {
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
  }
}

export function loadTheme() {
  const saved = localStorage.getItem('keycontrol-theme');
  let theme = saved || 'light';
  
  if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'dark';
  }
  
  document.documentElement.setAttribute('data-theme', theme);

  const btn = document.getElementById('toggleTheme');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

export async function resizeImageToDataURL(file, maxDim = 1280, mime = 'image/jpeg', quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width, h = img.height;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const nw = Math.round(w * scale), nh = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = nw;
      canvas.height = nh;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, nw, nh);
      try {
        const data = canvas.toDataURL(mime, quality);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function previewFile(input, previewId) {
  const box = document.getElementById(previewId);
  const file = input.files?.[0];

  if (!file) {
    box.textContent = previewId === 'retiraPreview' ? 'Nenhuma foto selecionada' : 'Selecione uma foto';
    box.innerHTML = '';
    return;
  }

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => URL.revokeObjectURL(url);
  img.src = url;
  img.alt = 'Preview';
  img.style.maxWidth = '100%';
  img.style.maxHeight = '160px';
  img.style.borderRadius = 'var(--radius-sm)';
  box.innerHTML = '';
  box.appendChild(img);
}
