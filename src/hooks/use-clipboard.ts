'use client';

import { create } from 'zustand';
import { Appointment } from '@/types/appointment';

type ClipboardAction = 'copy' | 'cut' | null;

interface ClipboardState {
  clipboardData: {
    appointment: Appointment;
    action: ClipboardAction;
  } | null;
  setClipboardData: (data: { appointment: Appointment; action: ClipboardAction } | null) => void;
}

export const useClipboard = create<ClipboardState>((set) => ({
  clipboardData: null,
  setClipboardData: (data) => set({ clipboardData: data }),
})); 