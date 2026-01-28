/**
 * Dashboard Widgets Hook
 *
 * Manages widget visibility and order for the admin dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/services/logger';

export type WidgetId = 
  | 'system-health'
  | 'real-time-metrics'
  | 'user-stats'
  | 'sync-stats'
  | 'security-overview'
  | 'recent-events'
  | 'user-growth-chart'
  | 'sync-performance-chart';

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  order: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'system-health', visible: true, order: 0 },
  { id: 'real-time-metrics', visible: true, order: 1 },
  { id: 'user-stats', visible: true, order: 2 },
  { id: 'sync-stats', visible: true, order: 3 },
  { id: 'security-overview', visible: true, order: 4 },
  { id: 'recent-events', visible: true, order: 5 },
  { id: 'user-growth-chart', visible: true, order: 6 },
  { id: 'sync-performance-chart', visible: true, order: 7 },
];

const STORAGE_KEY = 'admin-dashboard-widgets';

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WidgetConfig[];
        // Validate and merge with defaults
        const validWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
          const storedWidget = parsed.find(w => w.id === defaultWidget.id);
          return storedWidget || defaultWidget;
        });
        setWidgets(validWidgets);
      }
    } catch (error) {
      logger.error('Failed to load widget preferences', { error });
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever widgets change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
      } catch (error) {
        logger.error('Failed to save widget preferences', { error });
      }
    }
  }, [widgets, isLoaded]);

  const toggleWidget = useCallback((widgetId: WidgetId) => {
    setWidgets(prev => 
      prev.map(w => 
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
    );
  }, []);

  const setWidgetOrder = useCallback((widgetId: WidgetId, newOrder: number) => {
    setWidgets(prev => {
      const updated = [...prev];
      const widgetIndex = updated.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) return prev;

      const oldOrder = updated[widgetIndex].order;
      
      // Update the moved widget
      updated[widgetIndex] = { ...updated[widgetIndex], order: newOrder };

      // Adjust other widgets
      updated.forEach((w, i) => {
        if (i !== widgetIndex) {
          if (oldOrder < newOrder) {
            // Moving down
            if (w.order > oldOrder && w.order <= newOrder) {
              w.order -= 1;
            }
          } else {
            // Moving up
            if (w.order >= newOrder && w.order < oldOrder) {
              w.order += 1;
            }
          }
        }
      });

      return updated.sort((a, b) => a.order - b.order);
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
  }, []);

  const getVisibleWidgets = useCallback(() => {
    return widgets
      .filter(w => w.visible)
      .sort((a, b) => a.order - b.order);
  }, [widgets]);

  const isWidgetVisible = useCallback((widgetId: WidgetId) => {
    const widget = widgets.find(w => w.id === widgetId);
    return widget?.visible ?? true;
  }, [widgets]);

  return {
    widgets,
    visibleWidgets: getVisibleWidgets(),
    isLoaded,
    toggleWidget,
    setWidgetOrder,
    resetToDefaults,
    isWidgetVisible,
  };
}
