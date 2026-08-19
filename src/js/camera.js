let videoEl = null;
let stream = null;
let canvas = null;

function getElements() {
  return {
    overlay: document.getElementById('cameraOverlay'),
    video: document.getElementById('cameraVideo'),
    btnCapture: document.getElementById('cameraCaptureBtn'),
    btnClose: document.getElementById('cameraCloseBtn'),
    flash: document.getElementById('cameraFlash'),
  };
}

function isCameraSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

async function startStream(video) {
  const constraints = {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  };

  stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
      resolve();
    };
  });
}

function stopStream() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  if (videoEl) {
    videoEl.srcObject = null;
    videoEl = null;
  }
}

function captureFrame(video) {
  if (!canvas) canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], 'foto_' + Date.now() + '.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      resolve(file);
    }, 'image/jpeg', 0.85);
  });
}

function flashEffect(flashEl) {
  if (!flashEl) return Promise.resolve();
  flashEl.classList.add('active');
  return new Promise(r => setTimeout(() => {
    flashEl.classList.remove('active');
    r();
  }, 200));
}

export async function openCamera() {
  if (!isCameraSupported()) return null;

  const { overlay, video, btnCapture, btnClose, flash } = getElements();
  if (!overlay || !video) return null;

  videoEl = video;

  return new Promise((resolve) => {
    let closed = false;
    const finish = (file) => {
      if (closed) return;
      closed = true;
      cleanup();
      resolve(file);
    };

    const cleanup = () => {
      stopStream();
      overlay.style.display = 'none';
      btnCapture.removeEventListener('click', onCapture);
      btnClose.removeEventListener('click', onClose);
      overlay.removeEventListener('click', onBackdrop);
    };

    const onCapture = () => {
      btnCapture.disabled = true;
      flashEffect(flash).then(() => captureFrame(video)).then(finish);
    };

    const onClose = () => finish(null);

    const onBackdrop = (e) => {
      if (e.target === overlay) finish(null);
    };

    btnCapture.addEventListener('click', onCapture);
    btnClose.addEventListener('click', onClose);
    overlay.addEventListener('click', onBackdrop);

    overlay.style.display = 'flex';

    startStream(video).catch((err) => {
      console.warn('getUserMedia falhou, usando fallback:', err);
      cleanup();
      resolve(null);
    });
  });
}

export function openFilePicker() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', () => {
      const file = input.files?.[0] || null;
      document.body.removeChild(input);
      resolve(file);
    }, { once: true });

    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      resolve(null);
    }, { once: true });

    input.click();
  });
}

export async function capturePhoto() {
  if (isCameraSupported()) {
    const file = await openCamera();
    if (file) return file;
  }
  return openFilePicker();
}
