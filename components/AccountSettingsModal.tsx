import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AccountSettingsModalProps {
  onClose: () => void;
  activeWorkspaceName: string;
}

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ onClose, activeWorkspaceName }) => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && name.trim() !== user.name) {
      updateUser({ name: name.trim() });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
      >
        <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-2xl shadow-2xl p-8 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Настройки аккаунта</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
              <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Имя</label>
                  <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors"
                  />
              </div>
              <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                  <input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:outline-none transition-colors opacity-60 cursor-not-allowed"
                  />
              </div>

              <div className="flex items-center justify-end gap-4">
                <AnimatePresence>
                {isSaved && (
                    <motion.p
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="text-green-400 text-sm font-semibold"
                    >
                        Сохранено!
                    </motion.p>
                )}
                </AnimatePresence>
                  <button type="submit" className="px-6 py-2 bg-accent hover:bg-accent-dark text-dark-bg font-bold rounded-lg transition-colors">
                      Сохранить
                  </button>
              </div>
          </form>

        </div>
      </motion.div>
    </>
  );
};

export default AccountSettingsModal;
