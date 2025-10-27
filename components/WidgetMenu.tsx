import React from 'react';
import { motion } from 'framer-motion';
import { WidgetType } from '../types';
import { LayoutDashboard, Type, BarChart2, PieChart, ListChecks, Image, FileText, Newspaper, Columns, Folder } from 'lucide-react';

interface WidgetMenuProps {
  onSelect: (type: WidgetType) => void;
  onClose: () => void;
}

const widgetOptions = [
  { type: WidgetType.Plan, label: 'План', icon: LayoutDashboard },
  { type: WidgetType.Pie, label: 'Диаграмма', icon: PieChart },
  { type: WidgetType.Line, label: 'График', icon: BarChart2 },
  { type: WidgetType.Text, label: 'Заметка', icon: Type },
  { type: WidgetType.Title, label: 'Заголовок', icon: FileText },
  { type: WidgetType.Checklist, label: 'Список дел', icon: ListChecks },
  { type: WidgetType.Image, label: 'Изображение', icon: Image },
  { type: WidgetType.Article, label: 'Статья', icon: Newspaper },
  { type: WidgetType.Table, label: 'Таблица', icon: Columns },
  { type: WidgetType.Folder, label: 'Папка', icon: Folder },
];

const WidgetMenu: React.FC<WidgetMenuProps> = ({ onSelect, onClose }) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
      >
        <div className="bg-light-bg-secondary/60 dark:bg-dark-bg-secondary/60 backdrop-blur-lg rounded-xl p-4 shadow-2xl border border-white/10">
          <h3 className="text-lg font-semibold mb-4 px-2">Выберите виджет</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {widgetOptions.map(option => (
              <button
                key={option.type}
                onClick={() => onSelect(option.type as WidgetType)}
                className="flex flex-col items-center justify-center p-4 rounded-lg text-center hover:bg-accent/20 dark:hover:bg-accent/10 transition-colors group"
              >
                <div className="p-3 bg-accent/10 rounded-full mb-2 group-hover:bg-accent/20">
                    <option.icon size={24} className="text-accent dark:text-accent-dark" />
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default WidgetMenu;