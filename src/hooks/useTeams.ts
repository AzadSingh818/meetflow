'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface TeamMember {
  user:     { _id: string; name: string; email: string; image?: string }
  email:    string
  name?:    string
  role:     'admin' | 'organizer' | 'member'
  joinedAt: string
}

export interface Team {
  _id:          string
  name:         string
  slug:         string
  description?: string
  owner:        { _id: string; name: string; email: string; image?: string }
  members:      TeamMember[]
  createdAt:    string
}

// ── Fetchers ─────────────────────────────────────────────────────────────
async function fetchTeams(): Promise<Team[]> {
  const res = await fetch('/api/teams')
  if (!res.ok) throw new Error('Failed to fetch teams')
  return res.json()
}

async function fetchTeam(id: string): Promise<Team> {
  const res = await fetch(`/api/teams/${id}`)
  if (!res.ok) throw new Error('Team not found')
  return res.json()
}

async function createTeam(data: { name: string; description?: string }): Promise<Team> {
  const res = await fetch('/api/teams', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

async function updateTeam({ id, ...data }: { id: string; name?: string; description?: string }): Promise<Team> {
  const res = await fetch(`/api/teams/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

async function deleteTeam(id: string): Promise<void> {
  const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error((await res.json()).error)
}

async function inviteMember(payload: { teamId: string; email: string; role: string }): Promise<Team> {
  const res = await fetch(`/api/teams/${payload.teamId}/members`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: payload.email, role: payload.role }),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

async function removeMember(payload: { teamId: string; email: string }): Promise<void> {
  const res = await fetch(`/api/teams/${payload.teamId}/members?email=${encodeURIComponent(payload.email)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error((await res.json()).error)
}

// ── Hooks ─────────────────────────────────────────────────────────────────
export function useTeams() {
  return useQuery({ queryKey: ['teams'], queryFn: fetchTeams })
}

export function useTeam(id: string) {
  return useQuery({ queryKey: ['teams', id], queryFn: () => fetchTeam(id), enabled: !!id })
}

export function useCreateTeam() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createTeam, onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }) })
}

export function useUpdateTeam() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: updateTeam, onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }) })
}

export function useDeleteTeam() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteTeam, onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }) })
}

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: inviteMember, onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }) })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: removeMember, onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }) })
}