import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, Check, X, LogOut, Settings, Save, Sun, Moon, Share2 } from 'lucide-react';
import { Workspace, User } from '../types';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onSave: () => void;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onWorkspaceCreate: () => void;
  onWorkspaceDelete: (id: string) => void;
  onWorkspaceRename: (id: string, newName: string) => void;
  onWorkspaceSelect: (id: string) => void;
  user: User | null;
  onLogout: () => void;
  onOpenAccountSettings: () => void;
  onShare: () => void;
  isEditable: boolean;
  isOwner: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  theme, toggleTheme, onSave, workspaces, activeWorkspaceId, onWorkspaceCreate,
  onWorkspaceDelete, onWorkspaceRename, onWorkspaceSelect, user, onLogout, onOpenAccountSettings,
  onShare, isEditable, isOwner
}) => {
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const handleRenameStart = (workspace: Workspace) => {
    setEditingWorkspaceId(workspace.id);
    setNewWorkspaceName(workspace.name);
  };

  const handleRenameSave = () => {
    if (editingWorkspaceId && newWorkspaceName.trim()) {
      onWorkspaceRename(editingWorkspaceId, newWorkspaceName.trim());
    }
    setEditingWorkspaceId(null);
  };

  return (
    <motion.aside
      key="sidebar"
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 h-full w-72 bg-light-bg-secondary/80 dark:bg-dark-bg-secondary/80 backdrop-blur-lg z-40 flex flex-col p-4 border-r border-light-border dark:border-dark-border"
    >
      <div className="flex-shrink-0 mb-6">
        <h2 className="text-2xl font-bold">Dashy</h2>
      </div>

      <div className="flex-grow overflow-y-auto pr-2">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Пространства</h3>
        <ul className="space-y-1">
          {workspaces.map(ws => (
            <li key={ws.id} className="group flex items-center">
              {editingWorkspaceId === ws.id ? (
                <>
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={e => setNewWorkspaceName(e.target.value)}
                    onBlur={handleRenameSave}
                    onKeyDown={e => e.key === 'Enter' && handleRenameSave()}
                    className="flex-grow bg-black/10 dark:bg-white/10 p-2 rounded-md focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleRenameSave} className="p-2 text-green-500"><Check size={16} /></button>
                  <button onClick={() => setEditingWorkspaceId(null)} className="p-2 text-red-500"><X size={16} /></button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onWorkspaceSelect(ws.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${
                      activeWorkspaceId === ws.id
                        ? 'bg-accent text-dark-bg font-semibold'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {ws.name}
                  </button>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditable && <button onClick={() => handleRenameStart(ws)} className="p-2"><Edit3 size={14} /></button>}
                    {isOwner && workspaces.length > 1 && (
                      <button onClick={() => onWorkspaceDelete(ws.id)} className="p-2 text-red-500"><Trash2 size={14} /></button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <button onClick={onWorkspaceCreate} className="w-full flex items-center gap-2 p-2 mt-2 text-sm text-gray-400 hover:text-accent">
          <Plus size={16} />
          <span>Новое пространство</span>
        </button>
      </div>

      <div className="flex-shrink-0 border-t border-light-border dark:border-dark-border pt-4 mt-4">
        {isOwner && (
            <button onClick={onShare} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors mb-2">
              <Share2 size={20} />
              <span>Поделиться</span>
            </button>
        )}
        <button onClick={onSave} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors mb-2">
          <Save size={20} />
          <span>Сохранить как PNG</span>
        </button>
        <div className="flex items-center justify-between p-2 rounded-md">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === 'dark' ? 'Темная тема' : 'Светлая тема'}</span>
          </div>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>

        <div className="border-t border-light-border dark:border-dark-border pt-4 mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-8 h-8 rounded-full bg-accent text-dark-bg flex items-center justify-center font-bold">
                 {user?.name?.[0]?.toUpperCase() || 'U'}
             </div>
             <div className="flex flex-col overflow-hidden">
                <span className="font-semibold truncate">{user?.name}</span>
                <span className="text-xs text-gray-400 truncate">{user?.email}</span>
             </div>
          </div>
          <div className="flex items-center">
            <button onClick={onOpenAccountSettings} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"><Settings size={18} /></button>
            <button onClick={onLogout} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"><LogOut size={18} /></button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;