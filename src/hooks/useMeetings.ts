'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

async function fetchMeetings(filter?: string) {
  const url = filter ? `/api/meetings?${filter}` : '/api/meetings'
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch meetings');
  return res.json();
}

async function fetchMeeting(id: string) {
  const res = await fetch(`/api/meetings/${id}`);
  if (!res.ok) throw new Error('Failed to fetch meeting');
  return res.json();
}

async function createMeeting(data: unknown) {
  const res = await fetch('/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create meeting');
  return res.json();
}

async function updateMeeting({ id, data }: { id: string; data: unknown }) {
  const res = await fetch(`/api/meetings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update meeting');
  return res.json();
}

async function deleteMeeting(id: string) {
  const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete meeting');
  return res.json();
}

export function useMeetings(filter?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['meetings', filter],
    queryFn: () => fetchMeetings(filter),
  });
  // API returns a plain array — not { meetings: [] }
  return { meetings: Array.isArray(data) ? data : [], isLoading, error };
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: () => fetchMeeting(id),
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMeeting,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting updated!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting deleted.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}