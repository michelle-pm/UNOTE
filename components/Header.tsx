import React from 'react';
import { Menu, Plus, Undo2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
  onAddWidget: () => void;
  showAddWidgetButton: boolean;
  onUndo: () => void;
  canUndo: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, onToggleSidebar, onAddWidget, showAddWidgetButton, onUndo, canUndo }) => {
  return (
    <header className="sticky top-0 flex-shrink-0 flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border z-20 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-lg">
      <div className="flex items-center gap-4">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onToggleSidebar} 
          className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </motion.button>
        <h1 className="text-xl font-bold truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Undo"
        >
          <Undo2 size={20} />
        </motion.button>
        {showAddWidgetButton && (
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={onAddWidget} 
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-dark-bg font-semibold rounded-full transition-colors"
            aria-label="Add Widget"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Виджет</span>
          </motion.button>
        )}
      </div>
    </header>
  );
};

export default Header;