import { create } from 'zustand';

export type ToastTone = 'info' | 'warning';

export interface Toast {
  /** Changes on every show() so a repeated message still re-triggers the host. */
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toast: Toast | null;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>(set => ({
  toast: null,
  show: (message, tone = 'info') =>
    set({ toast: { id: nextId++, message, tone } }),
  hide: () => set({ toast: null }),
}));
