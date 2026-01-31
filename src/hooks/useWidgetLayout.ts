import { useState, useEffect, useCallback } from 'react';

export interface Widget {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
}

export interface WidgetLayout {
  widgets: Widget[];
  lastUpdated: string;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'ticket-status', title: 'Ticket Status', visible: true, order: 0, size: 'large' },
  { id: 'alert-status', title: 'Alert Status', visible: true, order: 1, size: 'small' },
  { id: 'availability', title: 'Device Health', visible: true, order: 2, size: 'medium' },
  { id: 'recent-alerts', title: 'Recent Alerts', visible: true, order: 3, size: 'medium' },
  { id: 'ticket-activity', title: 'Ticket Activity', visible: true, order: 4, size: 'medium' },
  { id: 'customer-tickets', title: 'Customer Tickets', visible: true, order: 5, size: 'medium' },
  { id: 'critical-tickets', title: 'Critical Tickets', visible: true, order: 6, size: 'large' },
];

const STORAGE_KEY = 'vanguard-widget-layout';

export function useWidgetLayout() {
  const [layout, setLayout] = useState<WidgetLayout>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load widget layout:', e);
    }
    return { widgets: DEFAULT_WIDGETS, lastUpdated: new Date().toISOString() };
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  // Persist layout to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch (e) {
      console.error('Failed to save widget layout:', e);
    }
  }, [layout]);

  // Toggle widget visibility
  const toggleWidget = useCallback((widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      ),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Reorder widgets
  const reorderWidgets = useCallback((sourceIndex: number, destinationIndex: number) => {
    setLayout(prev => {
      const widgets = [...prev.widgets];
      const [removed] = widgets.splice(sourceIndex, 1);
      widgets.splice(destinationIndex, 0, removed);
      
      // Update order values
      const updatedWidgets = widgets.map((w, i) => ({ ...w, order: i }));
      
      return {
        widgets: updatedWidgets,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  // Change widget size
  const setWidgetSize = useCallback((widgetId: string, size: Widget['size']) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === widgetId ? { ...w, size } : w
      ),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setLayout({
      widgets: DEFAULT_WIDGETS,
      lastUpdated: new Date().toISOString(),
    });
  }, []);

  // Get visible widgets in order
  const visibleWidgets = layout.widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  // Get widget by ID
  const getWidget = useCallback((widgetId: string) => {
    return layout.widgets.find(w => w.id === widgetId);
  }, [layout.widgets]);

  // Check if widget is visible
  const isWidgetVisible = useCallback((widgetId: string) => {
    const widget = layout.widgets.find(w => w.id === widgetId);
    return widget?.visible ?? true;
  }, [layout.widgets]);

  return {
    layout,
    widgets: layout.widgets,
    visibleWidgets,
    isCustomizing,
    setIsCustomizing,
    toggleWidget,
    reorderWidgets,
    setWidgetSize,
    resetLayout,
    getWidget,
    isWidgetVisible,
  };
}
