'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  useTeams, useCreateTeam, useInviteMember, useRemoveMember, useDeleteTeam,
  type Team,
} from '@/hooks/useTeams'
import { useAppStore } from '@/store/useAppStore'
import {
  Users, Plus, Trash2, UserMinus, Crown, Shield, User,
  ChevronDown, ChevronUp, Loader2, Building2,
} from 'lucide-react'

const ROLE_ICON: Record<string, React.ReactNode> = {
  admin:     <Crown  className="h-3.5 w-3.5 text-amber-500" />,
  organizer: <Shield className="h-3.5 w-3.5 text-blue-500"  />,
  member:    <User   className="h-3.5 w-3.5 text-gray-400"  />,
}
const ROLE_BADGE: Record<string, string> = {
  admin:     'bg-amber-50  text-amber-700  border-amber-200',
  organizer: 'bg-blue-50   text-blue-700   border-blue-200',
  member:    'bg-gray-50   text-gray-600   border-gray-200',
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function CreateTeamModal({ onClose }: { onClose: () => void }) {
  const addToast = useAppStore(s => s.addToast)
  const { mutate: create, isPending } = useCreateTeam()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    create({ name: name.trim(), description: desc.trim() || undefined }, {
      onSuccess: () => { addToast({ type: 'success', title: 'Team created!' }); onClose() },
      onError:   (e: Error) => addToast({ type: 'error', title: e.message }),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">Create a team</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Team name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Engineering"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              placeholder="Optional"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-gray-200 text-gray-600 rounded-lg text-sm
                         font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                         text-white rounded-lg text-sm font-semibold flex items-center
                         justify-center gap-2 transition-colors"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create team
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TeamCard({ team }: { team: Team }) {
  const { data: session } = useSession()
  const addToast = useAppStore(s => s.addToast)
  const [expanded,    setExpanded]    = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState<'organizer' | 'member'>('member')

  const { mutate: invite,  isPending: inviting  } = useInviteMember()
  const { mutate: remove,  isPending: removing  } = useRemoveMember()
  const { mutate: delTeam, isPending: deleting  } = useDeleteTeam()

  const isOwner = team.owner._id === session?.user?.id
  const myRole  = team.members.find(m => m.user._id === session?.user?.id)?.role ?? 'member'
  const isAdmin = isOwner || myRole === 'admin'

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    invite(
      { teamId: team._id, email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => { addToast({ type: 'success', title: 'Member invited!' }); setInviteEmail('') },
        onError:   (e: Error) => addToast({ type: 'error', title: e.message }),
      },
    )
  }

  const handleRemove = (email: string) => {
    if (!confirm(`Remove ${email} from the team?`)) return
    remove(
      { teamId: team._id, email },
      {
        onSuccess: () => addToast({ type: 'success', title: 'Member removed' }),
        onError:   (e: Error) => addToast({ type: 'error', title: e.message }),
      },
    )
  }

  const handleDelete = () => {
    if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return
    delTeam(team._id, {
      onSuccess: () => addToast({ type: 'success', title: 'Team deleted' }),
      onError:   (e: Error) => addToast({ type: 'error', title: e.message }),
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Card header */}
      <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{team.name}</h3>
            {team.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{team.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">
              {team.members.length} member{team.members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete team"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400
                         hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setExpanded(x => !x)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400
                       hover:bg-gray-50 transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100">

          {/* Members list */}
          <div className="p-4 sm:p-5 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Members</p>
            {team.members.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-2"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center
                                  text-xs font-semibold text-blue-700 overflow-hidden flex-shrink-0">
                    {m.user?.image
                      ? <img src={m.user.image} alt="" className="h-full w-full object-cover" />
                      : getInitials(m.name ?? m.email)
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {m.name ?? m.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-400 truncate hidden sm:block">{m.email}</p>
                  </div>
                </div>

                {/* Role badge + remove */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs px-1.5 sm:px-2 py-0.5
                                    rounded-full border font-medium ${ROLE_BADGE[m.role]}`}>
                    {ROLE_ICON[m.role]}
                    <span className="hidden sm:inline">{m.role}</span>
                  </span>
                  {isAdmin && m.email !== team.owner.email && m.email !== session?.user?.email && (
                    <button
                      onClick={() => handleRemove(m.email)}
                      disabled={removing}
                      title="Remove member"
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400
                                 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Invite form */}
          {isAdmin && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Invite member
              </p>
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                {/* Email input takes full width on mobile */}
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  type="email"
                  placeholder="member@example.com"
                  className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                />
                {/* Role + button row */}
                <div className="flex gap-2">
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as 'organizer' | 'member')}
                    className="h-9 px-2 rounded-lg border border-gray-200 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="member">Member</option>
                    <option value="organizer">Organizer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="h-9 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                               text-white rounded-lg text-sm font-medium flex items-center
                               gap-1.5 transition-colors whitespace-nowrap"
                  >
                    {inviting
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Plus className="h-3.5 w-3.5" />
                    }
                    Invite
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default function TeamsPage() {
  const { data: teams = [], isLoading } = useTeams()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="p-4 sm:p-6 w-full max-w-3xl mx-auto space-y-5 sm:space-y-6">

      {/* Page header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Teams</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Collaborate with your team on meetings and documents
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 bg-blue-600
                     hover:bg-blue-700 text-white rounded-lg text-sm font-medium
                     transition-colors flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden xs:inline">New team</span>
          <span className="xs:hidden">New</span>
        </button>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-blue-300" />
          </div>
          <h3 className="font-semibold text-gray-900">No teams yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-6">Create a team to collaborate with others</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-700
                       text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" /> Create team
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map(t => <TeamCard key={t._id} team={t} />)}
        </div>
      )}

      {showCreate && <CreateTeamModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}