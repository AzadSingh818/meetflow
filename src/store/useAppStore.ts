'use client'

import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
}

interface AppState {

  // SIDEBAR
  sidebarOpen: boolean
  toggleSidebar: () => void

  // TOASTS
  toasts: Toast[]

  addToast: (t: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({

  // SIDEBAR STATE
  sidebarOpen: true,

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  // TOASTS
  toasts: [],

  addToast: (t) => {

    const id = Math.random().toString(36).slice(2)

    set((s) => ({
      toasts: [...s.toasts, { ...t, id }]
    }))

    setTimeout(() => {

      set((s) => ({
        toasts: s.toasts.filter((x) => x.id !== id)
      }))

    }, 4500)

  },

  removeToast: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((x) => x.id !== id)
    })),
}))