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

export const loadMidtransSnap = (clientKey: string, isProduction: boolean = false): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(MIDTRANS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if (window.snap) {
        resolve();
      } else {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Midtrans Snap script')));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = MIDTRANS_SCRIPT_ID;
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.async = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load Midtrans Snap script'));
    };

    document.body.appendChild(script);
  });
};

export const payWithSnap = (snapToken: string, callbacks?: SnapCallbacks): void => {
  if (!window.snap) {
    throw new Error('Midtrans Snap script is not loaded');
  }
  document.body.style.pointerEvents = 'auto';
  window.snap.pay(snapToken, callbacks);
};
