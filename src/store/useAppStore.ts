'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Toast {
  id:       string
  type:     'success' | 'error' | 'info' | 'warning'
  title:    string
  message?: string
}

export interface ActiveTeam {
  id:   string
  name: string
  slug: string
  role: 'admin' | 'organizer' | 'member'
}

interface AppState {

  // ── Mobile sidebar (open/close overlay) ──────────────────────────────────
  sidebarOpen:      boolean
  toggleSidebar:    () => void
  closeSidebar:     () => void

  // ── Desktop sidebar (collapsed icon-only mode) ───────────────────────────
  desktopCollapsed:    boolean
  setDesktopCollapsed: (v: boolean) => void

  // ── Active team ───────────────────────────────────────────────────────────
  activeTeam:      ActiveTeam | null
  setActiveTeam:   (team: ActiveTeam | null) => void
  clearActiveTeam: () => void

  // ── Toasts ────────────────────────────────────────────────────────────────
  toasts:      Toast[]
  addToast:    (t: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({

      // ── Mobile sidebar ────────────────────────────────────────────────────
      sidebarOpen: false,

      toggleSidebar: () =>
        set(s => ({ sidebarOpen: !s.sidebarOpen })),

      closeSidebar: () =>
        set({ sidebarOpen: false }),

      // ── Desktop collapse ──────────────────────────────────────────────────
      desktopCollapsed: false,

      setDesktopCollapsed: (v: boolean) =>
        set({ desktopCollapsed: v }),

      // ── Active team ───────────────────────────────────────────────────────
      activeTeam: null,

      setActiveTeam: (team) =>
        set({ activeTeam: team }),

      clearActiveTeam: () =>
        set({ activeTeam: null }),

      // ── Toasts ────────────────────────────────────────────────────────────
      toasts: [],

      addToast: (t) => {
        const id = Math.random().toString(36).slice(2)
        set(s => ({ toasts: [...s.toasts, { ...t, id }] }))
        setTimeout(() => {
          set(s => ({ toasts: s.toasts.filter(x => x.id !== id) }))
        }, 4500)
      },

      removeToast: (id) =>
        set(s => ({ toasts: s.toasts.filter(x => x.id !== id) })),

    }),
    {
      name: 'meetflow-app-store',
      partialize: (s) => ({
        desktopCollapsed: s.desktopCollapsed,
        activeTeam:       s.activeTeam,
      }),
    }
  )
)