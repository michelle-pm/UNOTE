import React, { useMemo, useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Widget, WidgetType, PlanData, PieData, LineData, TextData, WidgetData, TitleData, ChecklistData, ImageData, ArticleData, FolderData, TableData } from '../types';
import WidgetWrapper from './WidgetWrapper';
import FolderWidget from './widgets/FolderWidget';
import { WIDGET_DEFAULTS } from '../constants';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Lazy load widget components to split code and reduce build memory usage
const PlanWidget = lazy(() => import('./widgets/PlanWidget'));
const PieWidget = lazy(() => import('./widgets/PieWidget'));
const LineWidget = lazy(() => import('./widgets/LineWidget'));
const TextWidget = lazy(() => import('./widgets/TextWidget'));
const TitleWidget = lazy(() => import('./widgets/TitleWidget'));
const ChecklistWidget = lazy(() => import('./widgets/ChecklistWidget'));
const ImageWidget = lazy(() => import('./widgets/ImageWidget'));
const ArticleWidget = lazy(() => import('./widgets/ArticleWidget'));
const TableWidget = lazy(() => import('./widgets/TableWidget'));


interface DashboardProps {
  widgets: Widget[];
  layouts: {[key: string]: Layout[]};
  onLayoutChange: (layout: Layout[], allLayouts: {[key: string]: Layout[]}) => void;
  onChildrenLayoutChange: (folderId: string, allLayouts: { [key: string]: Layout[] }) => void;
  onRemoveWidget: (id: string) => void;
  onUpdateWidgetData: (id: string, data: WidgetData) => void;
  onToggleFolder: (id: string) => void;
  onInitiateAddWidget: (parentId?: string) => void;
  theme: 'light' | 'dark';
  draggingWidgetId: string | null;
  onDragStart: (layout: Layout[], oldItem: Layout) => void;
  onDragStop: () => void;
  onResizeStop: () => void;
  setDraggingWidgetId: (id: string | null) => void;
  gridCols: { [key: string]: number };
  isEditable: boolean;
}

const EmptyDashboard: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <div className="max-w-md">
        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text">Ваше пространство пока пусто</h2>
        <p className="mt-4 text-lg text-light-text-secondary dark:text-dark-text/60">
          Начните создавать свой идеальный дашборд, добавив первый виджет.
        </p>
      </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ 
    widgets, layouts, onLayoutChange, onChildrenLayoutChange, onRemoveWidget, onUpdateWidgetData, 
    onToggleFolder, onInitiateAddWidget, theme,
    draggingWidgetId, onDragStart, onDragStop, onResizeStop, setDraggingWidgetId, gridCols,
    isEditable
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const synchronizedWidgets = useMemo(() => {
    const widgetMap = new Map(widgets.map(w => [w.id, w]));
    return widgets.map(widget => {
      if (widget.type === WidgetType.Line) {
        const lineData = widget.data as LineData;
        const newSeries = lineData.series.map(s => {
          const newData = s.data.map(point => {
            if (point.dependency) {
              const sourceWidget = widgetMap.get(point.dependency.widgetId) as Widget | undefined;
              if (sourceWidget && (sourceWidget.type === WidgetType.Plan || sourceWidget.type === WidgetType.Pie)) {
                const sourceValue = (sourceWidget.data as PlanData | PieData)[point.dependency.dataKey];
                if (typeof sourceValue === 'number' && sourceValue !== point.y) {
                  return { ...point, y: sourceValue };
                }
              }
            }
            return point;
          });
          return { ...s, data: newData };
        });
        return { ...widget, data: { ...lineData, series: newSeries }};
      }
      return widget;
    });
  }, [widgets]);

  const isAnythingDragging = !!draggingWidgetId;

  const renderWidget = useCallback((widget: Widget, allWidgets: Widget[]) => {
    const updateData = (data: WidgetData) => onUpdateWidgetData(widget.id, data);
    
    switch (widget.type) {
      case WidgetType.Plan:
        return <PlanWidget data={widget.data as PlanData} updateData={updateData} />;
      case WidgetType.Pie:
        return <PieWidget data={widget.data as PieData} updateData={updateData} />;
      case WidgetType.Line:
        return <LineWidget data={widget.data as LineData} updateData={updateData} allWidgets={allWidgets} currentWidgetId={widget.id} />;
      case WidgetType.Text:
        return <TextWidget data={widget.data as TextData} updateData={updateData} />;
      case WidgetType.Title:
        return <TitleWidget data={widget.data as TitleData} updateData={updateData} />;
      case WidgetType.Checklist:
        return <ChecklistWidget data={widget.data as ChecklistData} updateData={updateData} />;
      case WidgetType.Image:
        return <ImageWidget data={widget.data as ImageData} updateData={updateData} />;
      case WidgetType.Article:
        return <ArticleWidget data={widget.data as ArticleData} updateData={updateData} />;
      case WidgetType.Table:
        return <TableWidget data={widget.data as TableData} updateData={updateData} />;
      case WidgetType.Folder:
        return <FolderWidget 
            widget={widget}
            allWidgets={allWidgets}
            renderWidget={renderWidget}
            onUpdateWidgetData={onUpdateWidgetData}
            onRemoveWidget={onRemoveWidget}
            onInitiateAddWidget={onInitiateAddWidget}
            onChildrenLayoutChange={onChildrenLayoutChange}
            onToggleFolder={onToggleFolder}
            theme={theme}
            onDragStart={onDragStart}
            onDragStop={onDragStop}
            onResizeStop={onResizeStop}
            setDraggingWidgetId={setDraggingWidgetId}
            isAnythingDragging={isAnythingDragging}
            isMobile={isMobile}
            isEditable={isEditable}
        />;
      default:
        return <div>Unknown widget type</div>;
    }
  }, [onUpdateWidgetData, onRemoveWidget, onInitiateAddWidget, onChildrenLayoutChange, onToggleFolder, theme, onDragStart, onDragStop, onResizeStop, setDraggingWidgetId, isAnythingDragging, isMobile, isEditable]);
  
  const processedLayouts = useMemo(() => {
    const newLayouts = JSON.parse(JSON.stringify(layouts));
    Object.keys(newLayouts).forEach(bp => {
      newLayouts[bp] = newLayouts[bp]?.map((item: Layout) => {
        const widget = widgets.find(w => w.id === item.i);
        if (widget) {
          const defaults = WIDGET_DEFAULTS[widget.type];
          return { ...item, minW: defaults.minW, minH: defaults.minH };
        }
        return item;
      }) || [];
    });
    
    if (draggingWidgetId) {
      const draggingWidget = widgets.find(w => w.id === draggingWidgetId);
      if (draggingWidget?.parentId) {
        const parentId = draggingWidget.parentId;
        Object.keys(newLayouts).forEach(bp => {
          const parentLayout = newLayouts[bp] as Layout[] | undefined;
          const parentItem = parentLayout?.find((l: Layout) => l.i === parentId);
          if (parentItem) {
            parentItem.isDraggable = false;
            parentItem.isResizable = false;
          }
        });
      }
    }
    return newLayouts;
  }, [layouts, widgets, draggingWidgetId]);

  const topLevelWidgets = synchronizedWidgets.filter(widget => !widget.parentId);

  if (synchronizedWidgets.length === 0) {
    return <EmptyDashboard />;
  }

  return (
    <div className="h-full">
      <ResponsiveGridLayout
        className={`layout cursor-default ${isAnythingDragging ? 'is-dragging' : ''}`}
        layouts={processedLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={gridCols}
        rowHeight={50}
        compactType={"vertical"}
        onLayoutChange={onLayoutChange}
        onDragStart={onDragStart}
        onDragStop={onDragStop}
        onResizeStop={onResizeStop}
        draggableHandle=".drag-handle"
        draggableCancel=".no-drag, input, textarea, button, select, .nested-grid"
        isDroppable={true}
        margin={[16, 16]}
        isBounded={true}
        isDraggable={isEditable && !isMobile}
        isResizable={isEditable && !isMobile}
      >
        {topLevelWidgets.map(widget => (
          <div key={widget.id} id={`widget-${widget.id}`} style={{ overflow: 'visible' }}>
            <WidgetWrapper
              onRemove={() => onRemoveWidget(widget.id)}
              widgetId={widget.id}
              widgetTitle={widget.data.title || 'widget'}
              onTitleChange={(newTitle) => onUpdateWidgetData(widget.id, {...widget.data, title: newTitle})}
              theme={theme}
              isFolder={widget.type === WidgetType.Folder}
              folderData={widget.type === WidgetType.Folder ? (widget.data as FolderData) : undefined}
              folderColor={widget.type === WidgetType.Folder ? (widget.data as FolderData).color : undefined}
              onFolderColorChange={widget.type === WidgetType.Folder ? (newColor) => onUpdateWidgetData(widget.id, { ...widget.data, color: newColor }) : undefined}
              onFolderToggle={() => onToggleFolder(widget.id)}
              onFolderAddWidget={widget.type === WidgetType.Folder ? () => onInitiateAddWidget(widget.id) : undefined}
              isNested={false}
              isEditable={isEditable}
            >
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-400">Загрузка виджета...</div>}>
                {renderWidget(widget, synchronizedWidgets)}
              </Suspense>
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default React.memo(Dashboard);