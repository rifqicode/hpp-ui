export interface SnapCallbacks {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: SnapCallbacks) => void;
    };
  }
}

const MIDTRANS_SCRIPT_ID = 'midtrans-snap-script';
let loadingSnap: Promise<void> | null = null;

export const loadMidtransSnap = (clientKey: string, isProduction: boolean = false): Promise<void> => {
  if (!clientKey) return Promise.reject(new Error('Konfigurasi pembayaran belum tersedia. Silakan coba lagi nanti.'));
  if (loadingSnap) return loadingSnap;
  loadingSnap = new Promise<void>((resolve, reject) => {
    if (window.snap) {
      resolve();
      return;
    }

    document.getElementById(MIDTRANS_SCRIPT_ID)?.remove();

    const script = document.createElement('script');
    script.id = MIDTRANS_SCRIPT_ID;
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    const timer = window.setTimeout(() => {
      script.remove();
      reject(new Error('Layanan pembayaran belum merespons. Periksa koneksi lalu coba lagi.'));
    }, 15_000);

    script.onload = () => {
      window.clearTimeout(timer);
      if (window.snap) resolve();
      else { script.remove(); reject(new Error('Layanan pembayaran gagal dimuat. Silakan coba lagi.')); }
    };

    script.onerror = () => {
      window.clearTimeout(timer);
      script.remove();
      reject(new Error('Layanan pembayaran gagal dimuat. Periksa koneksi lalu coba lagi.'));
    };

    document.body.appendChild(script);
  }).catch((error) => { loadingSnap = null; throw error; });
  return loadingSnap;
};

export const payWithSnap = (snapToken: string, callbacks?: SnapCallbacks): void => {
  if (!window.snap) {
    throw new Error('Midtrans Snap script is not loaded');
  }
  window.snap.pay(snapToken, callbacks);
};
