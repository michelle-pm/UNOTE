import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from 'react-grid-layout';
import { v4 as uuidv4 } from 'uuid';
import html2canvas from 'html2canvas';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { Widget, WidgetType, Workspace, WidgetData, FolderData, PlanData, PieData, LineData } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import useTheme from './hooks/useTheme';
import { WIDGET_DEFAULTS } from './constants';
import { getRandomGradient, getRandomFolderColor } from './utils/colors';
import { useAuth } from './contexts/AuthContext';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WidgetMenu from './components/WidgetMenu';
import AuthPage from './components/AuthPage';
import AccountSettingsModal from './components/AccountSettingsModal';
import ShareModal from './components/ShareModal';


const DEFAULT_WORKSPACE_ID = 'default-workspace';
const MAX_HISTORY_LENGTH = 20;

// Grid layout constants
const GRID_COLS = { lg: 12, md: 10, sm: 6, xs: 2, xxs: 1 };
export const NESTED_GRID_COLS = { lg: 24, md: 20, sm: 12, xs: 4, xxs: 2 };


const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>(() => JSON.parse(localStorage.getItem('all_workspaces') || '[]'));
  
  // Debounced effect for saving to localStorage
  useEffect(() => {
      const handler = setTimeout(() => {
          localStorage.setItem('all_workspaces', JSON.stringify(allWorkspaces));
      }, 300); // 300ms debounce delay

      return () => {
          clearTimeout(handler);
      };
  }, [allWorkspaces]);

  const userWorkspaces = useMemo(() => {
      if (!user) return [];
      return allWorkspaces.filter(ws => ws.owner === user.email || (ws.members && user.email && ws.members[user.email]));
  }, [allWorkspaces, user]);
  
  const [activeWorkspaceId, setActiveWorkspaceId] = useLocalStorage<string | null>('activeWorkspaceId', null, user?.email);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWidgetMenuOpen, setIsWidgetMenuOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [addWidgetParentId, setAddWidgetParentId] = useState<string | null>(null);
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);

  const [history, setHistory] = useState<{ workspaces: Workspace[]; }[]>([]);
  const [scrollToWidgetId, setScrollToWidgetId] = useState<string | null>(null);
  
  const pushStateToHistory = useCallback(() => {
    setHistory(prev => {
        const newHistory = [...prev, { workspaces: allWorkspaces }];
        if (newHistory.length > MAX_HISTORY_LENGTH) {
            return newHistory.slice(1);
        }
        return newHistory;
    });
  }, [allWorkspaces]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setAllWorkspaces(lastState.workspaces);
    setHistory(prev => prev.slice(0, -1));
  }, [history]);


  useEffect(() => {
    if (!isAuthenticated) return;
    if (userWorkspaces.length > 0 && !userWorkspaces.find(ws => ws.id === activeWorkspaceId)) {
      setActiveWorkspaceId(userWorkspaces[0].id);
    }
  }, [userWorkspaces, activeWorkspaceId, setActiveWorkspaceId, isAuthenticated]);
  
  const activeWorkspace = useMemo(() => userWorkspaces.find(ws => ws.id === activeWorkspaceId), [userWorkspaces, activeWorkspaceId]);

  const currentUserRole = useMemo(() => {
    if (!activeWorkspace || !user) return null;
    if (activeWorkspace.owner === user.email) return 'owner';
    return activeWorkspace.members[user.email] || null;
  }, [activeWorkspace, user]);

  const isEditable = currentUserRole === 'owner' || currentUserRole === 'editor';

  useEffect(() => {
      if (scrollToWidgetId) {
          const widgetElement = document.getElementById(`widget-${scrollToWidgetId}`);
          if (widgetElement) {
              const rect = widgetElement.getBoundingClientRect();
              if (rect.bottom > window.innerHeight || rect.top < 0) {
                  widgetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
          }
          setScrollToWidgetId(null);
      }
  }, [scrollToWidgetId, activeWorkspace?.widgets]);


  const updateActiveWorkspace = useCallback((updater: (ws: Workspace) => Workspace) => {
    setAllWorkspaces(prevWorkspaces =>
      prevWorkspaces.map(ws => (ws.id === activeWorkspaceId ? updater(ws) : ws))
    );
  }, [activeWorkspaceId]);
  
  const handleInitiateAddWidget = useCallback((parentId: string | null = null) => {
      if (!isEditable) return;
      setAddWidgetParentId(parentId);
      setIsWidgetMenuOpen(true);
  }, [isEditable]);

  const handleCloseWidgetMenu = useCallback(() => {
    setIsWidgetMenuOpen(false);
    setAddWidgetParentId(null);
  }, []);

    const isColliding = (item: Layout, items: Layout[]): boolean => {
        for (const existingItem of items) {
            if (
                item.x < existingItem.x + existingItem.w &&
                item.x + item.w > existingItem.x &&
                item.y < existingItem.y + existingItem.h &&
                item.y + item.h > existingItem.y
            ) {
                return true;
            }
        }
        return false;
    };

  const handleAddWidget = useCallback((type: WidgetType) => {
    if (!isEditable) return;
    pushStateToHistory();
    const defaults = WIDGET_DEFAULTS[type];
    
    let widgetData = { ...defaults.data };
    const isGradientWidget = type === WidgetType.Plan || type === WidgetType.Pie || type === WidgetType.Line;
    
    if(isGradientWidget) {
        widgetData = { ...widgetData, ...getRandomGradient(), userSetColors: false };
    }
    if (type === WidgetType.Folder) {
        widgetData = { ...widgetData, color: getRandomFolderColor() };
    }

    const newWidget: Widget = {
      id: uuidv4(),
      type,
      data: widgetData,
      minW: defaults.minW,
      minH: defaults.minH,
      parentId: addWidgetParentId || undefined,
    };

    updateActiveWorkspace(ws => {
      let widgetsToUpdate = [...ws.widgets];
      
      if (addWidgetParentId) {
        const parentFolderIndex = widgetsToUpdate.findIndex(w => w.id === addWidgetParentId);
        if (parentFolderIndex > -1) {
            const parentFolder = widgetsToUpdate[parentFolderIndex] as Widget & { data: FolderData };
            const childrenLayouts = parentFolder.data.childrenLayouts || {};
            
            const breakpoints = Object.keys(NESTED_GRID_COLS) as Array<keyof typeof NESTED_GRID_COLS>;
            breakpoints.forEach(breakpoint => {
                if (!childrenLayouts[breakpoint]) childrenLayouts[breakpoint] = [];
                const layout = childrenLayouts[breakpoint] as Layout[];
                
                const nestedDefaults = {
                    w: defaults.w * 2,
                    h: defaults.h * 2,
                    minW: defaults.minW * 2,
                    minH: defaults.minH * 2,
                };

                const newLayoutItemDefaults = { i: newWidget.id, ...nestedDefaults };

                let newX = 0;
                let newY = 0;
                let positionFound = false;
                const gridWidth = NESTED_GRID_COLS[breakpoint];

                for (let y = 0; !positionFound; y++) {
                    for (let x = 0; x <= gridWidth - newLayoutItemDefaults.w; x++) {
                        const newItem = { ...newLayoutItemDefaults, x, y };
                        if (!isColliding(newItem, layout)) {
                            newX = x;
                            newY = y;
                            positionFound = true;
                            break;
                        }
                    }
                    if (y > 200) { // Safeguard
                        let maxY = 0;
                        layout.forEach(l => { maxY = Math.max(maxY, l.y + l.h); });
                        newX = 0;
                        newY = maxY;
                        break;
                    }
                }
                layout.push({ ...newLayoutItemDefaults, x: newX, y: newY });
            });
            
            widgetsToUpdate[parentFolderIndex] = {
                ...parentFolder,
                data: { ...parentFolder.data, childrenLayouts }
            };

            return { ...ws, widgets: [...widgetsToUpdate, newWidget], layouts: ws.layouts };
        }
        return ws; // Parent not found, do nothing
      } else {
         const newLayouts = JSON.parse(JSON.stringify(ws.layouts));
         const breakpoints = Object.keys(GRID_COLS) as Array<keyof typeof GRID_COLS>;
         
         breakpoints.forEach(breakpoint => {
            if (!newLayouts[breakpoint]) newLayouts[breakpoint] = [];
            const layout = newLayouts[breakpoint] as Layout[];
            const newLayoutItemDefaults = { i: newWidget.id, w: defaults.w, h: defaults.h, minW: defaults.minW, minH: defaults.minH };
            
            let newX = 0, newY = 0, positionFound = false;
            const gridWidth = GRID_COLS[breakpoint];

            for (let y = 0; !positionFound; y++) {
                for (let x = 0; x <= gridWidth - newLayoutItemDefaults.w; x++) {
                    const newItem = { ...newLayoutItemDefaults, x, y };
                    if (!isColliding(newItem, layout)) {
                        newX = x; newY = y; positionFound = true; break;
                    }
                }
                if (y > 200) { // Safeguard
                    let maxY = 0;
                    layout.forEach(l => { maxY = Math.max(maxY, l.y + l.h); });
                    newX = 0; newY = maxY; break;
                }
            }
            layout.push({ ...newLayoutItemDefaults, x: newX, y: newY });
         });
         return { ...ws, widgets: [...widgetsToUpdate, newWidget], layouts: newLayouts };
      }
    });
    setScrollToWidgetId(newWidget.id);
    handleCloseWidgetMenu();
  }, [updateActiveWorkspace, addWidgetParentId, handleCloseWidgetMenu, pushStateToHistory, isEditable]);
  
  const handleRemoveWidget = useCallback((id: string) => {
    if (!isEditable) return;
    pushStateToHistory();
    updateActiveWorkspace(ws => {
      const widgetToRemove = ws.widgets.find(w => w.id === id);
      let currentWidgets = [...ws.widgets];

      if (widgetToRemove?.parentId) {
        const parentFolderIndex = currentWidgets.findIndex(w => w.id === widgetToRemove.parentId);
        if (parentFolderIndex > -1) {
          const parentFolder = currentWidgets[parentFolderIndex] as Widget & { data: FolderData };
          if (parentFolder.data.childrenLayouts) {
            const newChildrenLayouts = { ...parentFolder.data.childrenLayouts };
            Object.keys(newChildrenLayouts).forEach(bp => {
              if (newChildrenLayouts[bp]) {
                newChildrenLayouts[bp] = newChildrenLayouts[bp].filter(l => l.i !== id);
              }
            });
            const updatedParent = {
              ...parentFolder,
              data: { ...parentFolder.data, childrenLayouts: newChildrenLayouts }
            };
            currentWidgets[parentFolderIndex] = updatedParent;
          }
        }
      }

      const widgetsToRemove = new Set([id]);
      if (widgetToRemove?.type === WidgetType.Folder) {
          ws.widgets.forEach(w => {
              if (w.parentId === id) {
                  widgetsToRemove.add(w.id);
              }
          });
      }

      const finalWidgets = currentWidgets.filter(w => !widgetsToRemove.has(w.id));
      
      return { ...ws, widgets: finalWidgets };
    });
  }, [updateActiveWorkspace, pushStateToHistory, isEditable]);

  const handleUpdateWidgetData = useCallback((id:string, data: WidgetData) => {
      if (!isEditable) return;
      updateActiveWorkspace(ws => ({
          ...ws,
          widgets: ws.widgets.map(w => w.id === id ? { ...w, data } : w)
      }));
  }, [updateActiveWorkspace, isEditable]);

  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    if (!isEditable) return;
    updateActiveWorkspace(ws => {
      const updatedLayouts = allLayouts; // No need for deep copy, react-grid-layout provides new object
      const newWidgets = ws.widgets.map(widget => {
        if (widget.type === WidgetType.Folder) {
          const layoutItem = layout.find(l => l.i === widget.id);
          const folderData = widget.data as FolderData;
          if (layoutItem && !folderData.isCollapsed) {
            return { ...widget, data: { ...folderData, expandedH: layoutItem.h } };
          }
        }
        return widget;
      });
      return { ...ws, widgets: newWidgets, layouts: updatedLayouts };
    });
  }, [updateActiveWorkspace, isEditable]);

  const handleChildrenLayoutChange = useCallback((folderId: string, allChildrenLayouts: { [key: string]: Layout[] }) => {
    if (!isEditable) return;
    updateActiveWorkspace(ws => {
      const folderIndex = ws.widgets.findIndex(w => w.id === folderId);
      if (folderIndex === -1) return ws;

      const folder = ws.widgets[folderIndex] as Widget & { data: FolderData };
      const newWidgets = [...ws.widgets];
      const newLayouts = JSON.parse(JSON.stringify(ws.layouts));

      const updatedFolderData = { ...folder.data, childrenLayouts: allChildrenLayouts };
      
      Object.keys(GRID_COLS).forEach(breakpoint => {
        const childrenLayout = allChildrenLayouts[breakpoint];
        const folderLayoutItem = newLayouts[breakpoint]?.find((l: Layout) => l.i === folderId);
        
        if (folderLayoutItem && !folder.data.isCollapsed) {
          let newHeight = WIDGET_DEFAULTS[WidgetType.Folder].h;

          if (childrenLayout && childrenLayout.length > 0) {
            const PARENT_ROW_HEIGHT = 50;
            const PARENT_MARGIN_Y = 16;
            const NESTED_ROW_HEIGHT = 21;
            const NESTED_MARGIN_Y = 8;
            // Increased header height to be safer with multiline titles.
            const FOLDER_HEADER_PX = 68;
            // Total vertical padding: 8px from FolderWidget pt-2, and 8px top/bottom from grid containerPadding.
            const FOLDER_VERTICAL_PADDING_PX = 24;

            const maxRows = Math.max(0, ...childrenLayout.map(l => l.y + l.h));
            const contentPixelHeight = maxRows * NESTED_ROW_HEIGHT + (maxRows > 0 ? (maxRows - 1) * NESTED_MARGIN_Y : 0) + FOLDER_VERTICAL_PADDING_PX;
            
            const totalPixelHeight = contentPixelHeight + FOLDER_HEADER_PX;

            newHeight = Math.ceil((totalPixelHeight + PARENT_MARGIN_Y) / (PARENT_ROW_HEIGHT + PARENT_MARGIN_Y));
          }
          
          folderLayoutItem.h = Math.max(WIDGET_DEFAULTS[WidgetType.Folder].h, newHeight);
          updatedFolderData.expandedH = folderLayoutItem.h;
        }
      });

      newWidgets[folderIndex] = { ...folder, data: updatedFolderData };

      return { ...ws, widgets: newWidgets, layouts: newLayouts };
    });
  }, [updateActiveWorkspace, isEditable]);
  
  const handleToggleFolder = useCallback((widgetId: string) => {
      if (!isEditable) return;
      pushStateToHistory();
      updateActiveWorkspace(ws => {
          const folder = ws.widgets.find(w => w.id === widgetId && w.type === WidgetType.Folder);
          if (!folder) return ws;

          const folderData = folder.data as FolderData;
          const newIsCollapsed = !folderData.isCollapsed;

          let newWidgets = [...ws.widgets];
          const newLayouts = JSON.parse(JSON.stringify(ws.layouts));
          const collapsedH = folder.minH || WIDGET_DEFAULTS[WidgetType.Folder].minH;

          const folderWidgetIndex = newWidgets.findIndex(w => w.id === widgetId);
          newWidgets[folderWidgetIndex] = {
              ...folder,
              data: { ...folderData, isCollapsed: newIsCollapsed },
          };

          Object.keys(newLayouts).forEach(bp => {
              const layout = newLayouts[bp] as Layout[];
              const folderItem = layout.find((l: Layout) => l.i === widgetId);
              if (!folderItem) return;

              const oldH = newIsCollapsed ? (folderData.expandedH || folderItem.h) : collapsedH;
              const newH = newIsCollapsed ? collapsedH : (folderData.expandedH || folderItem.h);

              if (oldH === newH) return;

              const y_below = folderItem.y + oldH;
              
              layout.forEach((item: Layout) => {
                  if (item.y >= y_below) {
                      item.y += newH - oldH;
                  }
              });

              folderItem.h = newH;
          });

          return { ...ws, widgets: newWidgets, layouts: newLayouts };
      });
  }, [updateActiveWorkspace, pushStateToHistory, isEditable]);
    
  const handleDragStart = useCallback((layout: Layout[], oldItem: Layout) => {
      if (!isEditable) return;
      setDraggingWidgetId(oldItem.i);
  }, [isEditable]);
  const handleDragStop = useCallback(() => {
      if (!isEditable) return;
      pushStateToHistory();
      setDraggingWidgetId(null);
  }, [pushStateToHistory, isEditable]);
   const handleResizeStop = useCallback(() => {
      if (!isEditable) return;
      pushStateToHistory();
  }, [pushStateToHistory, isEditable]);

  const handleAddWorkspace = () => {
      if (!user) return;
      pushStateToHistory();
      const newWorkspace: Workspace = {
          id: uuidv4(),
          name: `Новое пространство ${userWorkspaces.length + 1}`,
          owner: user.email,
          members: {},
          widgets: [],
          layouts: {},
      };
      setAllWorkspaces(prev => [...prev, newWorkspace]);
      setActiveWorkspaceId(newWorkspace.id);
  };

  const handleRemoveWorkspace = (id: string) => {
      if (currentUserRole !== 'owner') return;
      pushStateToHistory();
      setAllWorkspaces(prev => {
          const newWorkspaces = prev.filter(ws => ws.id !== id);
          if (activeWorkspaceId === id) {
              const nextWorkspace = userWorkspaces.filter(ws => ws.id !== id)[0];
              setActiveWorkspaceId(nextWorkspace?.id || null);
          }
          return newWorkspaces;
      });
  };

  const handleRenameWorkspace = (id: string, newName: string) => {
      if (!isEditable) return;
      pushStateToHistory();
      setAllWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, name: newName } : ws));
  };

  const handleUpdateWorkspace = (updatedWorkspace: Workspace) => {
      if (currentUserRole !== 'owner') return;
      pushStateToHistory();
      setAllWorkspaces(prev => prev.map(ws => ws.id === updatedWorkspace.id ? updatedWorkspace : ws));
  };
  
  const handleSaveAsPng = useCallback(() => {
    const dashboardElement = document.querySelector('.react-grid-layout') as HTMLElement;
    if (dashboardElement) {
        html2canvas(dashboardElement, {
            backgroundColor: theme === 'dark' ? '#1E202B' : '#FDF8F8',
            useCORS: true,
            scale: 2,
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `${activeWorkspace?.name || 'dashboard'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  }, [theme, activeWorkspace]);

  if (!isAuthenticated) {
    return (
        <div className={`min-h-screen font-sans ${theme === 'light' ? 'bg-light-bg text-light-text' : 'bg-dark-bg text-dark-text'} aurora-background grainy-bg`}>
            <AuthPage />
        </div>
    );
  }

  if (!activeWorkspace) {
    return (
        <div className={`min-h-screen font-sans ${theme === 'light' ? 'bg-light-bg text-light-text' : 'bg-dark-bg text-dark-text'} aurora-background grainy-bg flex items-center justify-center`}>
            <p>Загрузка рабочего пространства... или создайте новое.</p>
             <button onClick={handleAddWorkspace} className="ml-4 px-4 py-2 bg-accent text-dark-bg font-semibold rounded-full">
                Создать
            </button>
        </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col ${theme === 'light' ? 'bg-light-bg text-light-text' : 'bg-dark-bg text-dark-text'} aurora-background grainy-bg`}>
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/30 z-30 backdrop-blur-sm"
            />
            <Sidebar 
                theme={theme} 
                toggleTheme={toggleTheme}
                onSave={handleSaveAsPng}
                workspaces={userWorkspaces}
                activeWorkspaceId={activeWorkspaceId}
                onWorkspaceCreate={handleAddWorkspace}
                onWorkspaceDelete={handleRemoveWorkspace}
                onWorkspaceRename={handleRenameWorkspace}
                onWorkspaceSelect={setActiveWorkspaceId}
                user={user}
                onLogout={logout}
                onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
                onShare={() => setIsShareModalOpen(true)}
                isEditable={isEditable}
                isOwner={currentUserRole === 'owner'}
            />
          </>
        )}
      </AnimatePresence>
      <div className={`flex flex-col flex-grow h-screen transition-all duration-500 ${isSidebarOpen ? 'pointer-events-none' : ''}`}>
          <Header
            title={activeWorkspace.name}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onAddWidget={() => handleInitiateAddWidget()}
            showAddWidgetButton={isEditable}
            onUndo={handleUndo}
            canUndo={history.length > 0 && isEditable}
          />
          <main className="flex-grow overflow-y-auto" onClick={(e) => {
             const target = e.target as HTMLElement;
             if (target.classList.contains('layout')) {
                handleCloseWidgetMenu();
             }
          }}>
            <div className="p-4">
              <Dashboard
                widgets={activeWorkspace.widgets}
                layouts={activeWorkspace.layouts}
                onLayoutChange={handleLayoutChange}
                onChildrenLayoutChange={handleChildrenLayoutChange}
                onRemoveWidget={handleRemoveWidget}
                onUpdateWidgetData={handleUpdateWidgetData}
                onToggleFolder={handleToggleFolder}
                onInitiateAddWidget={handleInitiateAddWidget}
                theme={theme}
                draggingWidgetId={draggingWidgetId}
                onDragStart={handleDragStart}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
                setDraggingWidgetId={setDraggingWidgetId}
                gridCols={GRID_COLS}
                isEditable={isEditable}
              />
            </div>
          </main>
      </div>
      
       <AnimatePresence>
        {isAccountSettingsOpen && (
          <AccountSettingsModal 
            onClose={() => setIsAccountSettingsOpen(false)} 
            activeWorkspaceName={activeWorkspace?.name || 'Дашборд'}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShareModalOpen && activeWorkspace && (
            <ShareModal
                workspace={activeWorkspace}
                onClose={() => setIsShareModalOpen(false)}
                onUpdateWorkspace={handleUpdateWorkspace}
            />
        )}
      </AnimatePresence>

       <AnimatePresence>
        {isWidgetMenuOpen && (
          <WidgetMenu onSelect={handleAddWidget} onClose={handleCloseWidgetMenu} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;