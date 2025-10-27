import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Crown, ChevronDown } from 'lucide-react';
import { Workspace } from '../types';
import { useAuth } from '../contexts/AuthContext';

// This is a mock function, in a real app this would be an API call.
const getAllUsers = (): { [email: string]: { name: string } } => {
  const users = localStorage.getItem('users');
  if (users) {
    const parsedUsers = JSON.parse(users);
    const userMap: { [email: string]: { name: string } } = {};
    for (const email in parsedUsers) {
      userMap[email] = { name: parsedUsers[email].name };
    }
    return userMap;
  }
  return {};
};

interface ShareModalProps {
  workspace: Workspace;
  onClose: () => void;
  onUpdateWorkspace: (updatedWorkspace: Workspace) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ workspace, onClose, onUpdateWorkspace }) => {
  const { user: currentUser } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'visitor'>('visitor');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const allUsers = useMemo(() => getAllUsers(), []);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailToInvite = inviteEmail.trim().toLowerCase();
    if (!emailToInvite) return;
    if (emailToInvite === currentUser?.email) {
      setError("Вы не можете пригласить самого себя.");
      return;
    }
    if (workspace.members[emailToInvite] || workspace.owner === emailToInvite) {
      setError("Этот пользователь уже имеет доступ.");
      return;
    }
    if (!allUsers[emailToInvite]) {
      setError("Пользователь с таким email не найден.");
      return;
    }

    const updatedWorkspace = {
      ...workspace,
      members: {
        ...workspace.members,
        [emailToInvite]: inviteRole,
      },
    };
    onUpdateWorkspace(updatedWorkspace);
    setSuccess(`Пользователь ${emailToInvite} приглашен.`);
    setInviteEmail('');
  };

  const handleRoleChange = (email: string, role: 'editor' | 'visitor') => {
    const updatedWorkspace = {
      ...workspace,
      members: { ...workspace.members, [email]: role },
    };
    onUpdateWorkspace(updatedWorkspace);
  };

  const handleRemoveUser = (email: string) => {
    const { [email]: _, ...remainingMembers } = workspace.members;
    const updatedWorkspace = { ...workspace, members: remainingMembers };
    onUpdateWorkspace(updatedWorkspace);
  };

  const members = Object.entries(workspace.members);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
      >
        <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-2xl shadow-2xl p-8 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold">Поделиться "{workspace.name}"</h2>
                <p className="text-sm text-light-text-secondary dark:text-dark-text/60">Управляйте доступом к вашему пространству</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleInvite} className="flex items-center gap-2 mb-6">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Email пользователя"
              className="flex-grow w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors"
              required
            />
            <div className="relative">
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'editor' | 'visitor')} className="appearance-none w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors pr-8">
                    <option value="visitor">Посетитель</option>
                    <option value="editor">Редактор</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button type="submit" className="p-3 bg-accent hover:bg-accent-dark text-dark-bg font-bold rounded-lg transition-colors">
              <UserPlus size={20} />
            </button>
          </form>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4 text-center">{success}</p>}

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {/* Owner */}
            <div className="flex items-center justify-between p-2 rounded-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                        <Crown size={16} className="text-accent" />
                    </div>
                    <div>
                        <p className="font-semibold">{allUsers[workspace.owner]?.name || workspace.owner}</p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text/60">{workspace.owner}</p>
                    </div>
                </div>
                <p className="text-sm font-semibold text-light-text-secondary dark:text-dark-text/60">Владелец</p>
            </div>

            {/* Members */}
            {members.map(([email, role]) => (
              <div key={email} className="flex items-center justify-between p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center font-bold">
                        {allUsers[email]?.name?.[0]?.toUpperCase() || email[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold">{allUsers[email]?.name || email}</p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text/60">{email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select value={role} onChange={e => handleRoleChange(email, e.target.value as 'editor' | 'visitor')} className="appearance-none text-sm p-2 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors pr-8">
                            <option value="visitor">Посетитель</option>
                            <option value="editor">Редактор</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <button onClick={() => handleRemoveUser(email)} className="p-2 text-red-500/80 hover:text-red-500 rounded-full hover:bg-red-500/10">
                        <X size={16} />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ShareModal;
