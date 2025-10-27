import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Trash2, MoreVertical, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { FolderData } from '../types';
import { folderColors } from '../utils/colors';

// Helper to change RGBA opacity.
const changeRgbaOpacity = (rgba: string, newOpacity: number) => {
    if (rgba && rgba.startsWith('rgba')) {
        return rgba.replace(/[\d\.]+\)$/, `${newOpacity})`);
    }
    return rgba; // Return original if not a valid rgba string
};

interface WidgetWrapperProps {
  children: React.ReactNode;
  onRemove: () => void;
  widgetId: string;
  widgetTitle: string;
  onTitleChange: (newTitle: string) => void;
  theme: 'light' | 'dark';
  isFolder?: boolean;
  folderData?: FolderData;
  folderColor?: string;
  onFolderColorChange?: (color: string) => void;
  onFolderToggle?: () => void;
  onFolderAddWidget?: () => void;
  isNested?: boolean;
  isEditable: boolean;
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  children, onRemove, widgetId, widgetTitle, onTitleChange, theme,
  isFolder, folderData, folderColor, onFolderColorChange, onFolderToggle, onFolderAddWidget,
  isNested, isEditable
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(widgetTitle);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempTitle(widgetTitle);
  }, [widgetTitle]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleBlur = () => {
    if (tempTitle.trim() !== '') {
      onTitleChange(tempTitle);
    } else {
      setTempTitle(widgetTitle); // Revert if empty
    }
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleTitleBlur();
      } else if (e.key === 'Escape') {
          setTempTitle(widgetTitle);
          setIsEditingTitle(false);
      }
  };
  
  const handleDoubleClick = () => {
    if (isEditable) {
      setIsEditingTitle(true);
    }
  };

  const baseBackgroundColor = isNested
    ? (theme === 'dark' ? '#292C3A' : '#FFFFFF')
    : (theme === 'dark' ? 'rgba(41, 44, 58, 0.8)' : 'rgba(255, 255, 255, 0.8)');
    
  const backgroundColor = isFolder ? (folderColor || baseBackgroundColor) : baseBackgroundColor;

  const folderBackgroundStyle = isFolder ? {
    background: `radial-gradient(circle at top left, ${changeRgbaOpacity(backgroundColor, 0.4)}, transparent 70%), ${backgroundColor}`
  } : {};


  return (
    <div 
        className="relative w-full h-full flex flex-col transition-shadow duration-300 shadow-lg shadow-black/5 rounded-2xl"
    >
        <div
            className="absolute inset-0 w-full h-full rounded-2xl -z-10"
            style={{ 
                ...folderBackgroundStyle,
                backgroundColor: isFolder ? undefined : backgroundColor,
                backdropFilter: isNested ? 'none' : 'blur(20px)',
                border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
            }}
        />

        <div className={`drag-handle flex items-center p-4 ${isEditable && !isFolder ? 'cursor-grab' : 'cursor-default'} h-[60px] flex-shrink-0`}>
          <div className="flex-grow flex items-center gap-2 overflow-hidden" onDoubleClick={handleDoubleClick}>
            {isFolder && onFolderToggle && (
                <button onClick={onFolderToggle} className="p-1 rounded-full hover:bg-white/10 no-drag">
                  {folderData?.isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
            )}
            {isEditingTitle && isEditable ? (
              <input
                ref={titleInputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="w-full text-base font-bold bg-transparent focus:outline-none p-1 -m-1 rounded-md bg-black/10 dark:bg-white/10 no-drag"
              />
            ) : (
              <h3 className="text-base font-bold truncate select-none">{widgetTitle}</h3>
            )}
          </div>
          {isEditable && (
            <div className="flex items-center gap-1 ml-auto">
                {isFolder ? (
                    <>
                        {onFolderAddWidget && (
                            <button onClick={onFolderAddWidget} className="no-drag p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                <Plus size={18} />
                            </button>
                        )}
                        <div className="relative no-drag" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                <MoreVertical size={18} />
                            </button>
                            <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full right-0 mt-2 w-48 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg shadow-xl z-50 overflow-hidden"
                                >
                                    {onFolderColorChange && (
                                        <div className="p-2">
                                        <button onClick={() => setIsColorPickerOpen(!isColorPickerOpen)} className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 rounded-md">
                                            Изменить цвет
                                        </button>
                                        <AnimatePresence>
                                        {isColorPickerOpen && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="grid grid-cols-4 gap-2 p-2 mt-1"
                                            >
                                                {folderColors.map(color => (
                                                    <div key={color} onClick={() => onFolderColorChange(color)} className="w-8 h-8 rounded-full cursor-pointer border-2" style={{ backgroundColor: color, borderColor: folderColor === color ? '#0070f3' : 'transparent' }}></div>
                                                ))}
                                            </motion.div>
                                        )}
                                        </AnimatePresence>
                                        </div>
                                    )}
                                    <div className="p-2 border-t border-light-border dark:border-dark-border">
                                        <button onClick={onRemove} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md">
                                            <Trash2 size={16} />
                                            <span>Удалить папку</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    </>
                ) : (
                    <>
                        <button onClick={onRemove} className="no-drag p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                            <Trash2 size={18} />
                        </button>
                        <GripVertical className="cursor-grab text-gray-400" size={20} />
                    </>
                )}
            </div>
          )}
        </div>
        <div className="px-4 pb-4 flex-grow overflow-auto">
          {children}
        </div>
    </div>
  );
};

export default React.memo(WidgetWrapper);