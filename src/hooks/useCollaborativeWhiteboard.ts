import { useState, useCallback } from 'react';

export type WhiteboardTool = 'select' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'freehand' | 'sticky';

export interface WhiteboardElement {
  id: string;
  type: WhiteboardTool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
  text?: string;
  color: string;
  strokeWidth: number;
  fill?: string;
  userId: string;
  locked: boolean;
}

export interface WhiteboardState {
  id: string;
  name: string;
  elements: WhiteboardElement[];
  zoom: number;
  panX: number;
  panY: number;
  createdAt: Date;
}

export function useCollaborativeWhiteboard() {
  const [boards, setBoards] = useState<WhiteboardState[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<WhiteboardTool>('select');
  const [strokeColor, setStrokeColor] = useState('#06b6d4');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillColor, setFillColor] = useState('transparent');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const createBoard = useCallback((name: string) => {
    const board: WhiteboardState = {
      id: crypto.randomUUID(),
      name,
      elements: [],
      zoom: 1,
      panX: 0,
      panY: 0,
      createdAt: new Date(),
    };
    setBoards(prev => [...prev, board]);
    setActiveBoardId(board.id);
    return board;
  }, []);

  const addElement = useCallback((boardId: string, element: Omit<WhiteboardElement, 'id'>) => {
    const full: WhiteboardElement = { ...element, id: crypto.randomUUID() };
    setBoards(prev => prev.map(b =>
      b.id === boardId ? { ...b, elements: [...b.elements, full] } : b
    ));
    return full;
  }, []);

  const updateElement = useCallback((boardId: string, elementId: string, updates: Partial<WhiteboardElement>) => {
    setBoards(prev => prev.map(b =>
      b.id === boardId ? {
        ...b,
        elements: b.elements.map(e => e.id === elementId ? { ...e, ...updates } : e),
      } : b
    ));
  }, []);

  const deleteElement = useCallback((boardId: string, elementId: string) => {
    setBoards(prev => prev.map(b =>
      b.id === boardId ? { ...b, elements: b.elements.filter(e => e.id !== elementId) } : b
    ));
    if (selectedElementId === elementId) setSelectedElementId(null);
  }, [selectedElementId]);

  const setZoom = useCallback((boardId: string, zoom: number) => {
    setBoards(prev => prev.map(b =>
      b.id === boardId ? { ...b, zoom: Math.min(3, Math.max(0.1, zoom)) } : b
    ));
  }, []);

  const setPan = useCallback((boardId: string, panX: number, panY: number) => {
    setBoards(prev => prev.map(b =>
      b.id === boardId ? { ...b, panX, panY } : b
    ));
  }, []);

  const clearBoard = useCallback((boardId: string) => {
    setBoards(prev => prev.map(b =>
      b.id === boardId ? { ...b, elements: [] } : b
    ));
  }, []);

  const deleteBoard = useCallback((boardId: string) => {
    setBoards(prev => prev.filter(b => b.id !== boardId));
    if (activeBoardId === boardId) setActiveBoardId(null);
  }, [activeBoardId]);

  const getActiveBoard = useCallback(() => {
    return boards.find(b => b.id === activeBoardId) || null;
  }, [boards, activeBoardId]);

  return {
    boards,
    activeBoardId,
    selectedTool,
    strokeColor,
    strokeWidth,
    fillColor,
    selectedElementId,
    setActiveBoardId,
    setSelectedTool,
    setStrokeColor,
    setStrokeWidth,
    setFillColor,
    setSelectedElementId,
    createBoard,
    addElement,
    updateElement,
    deleteElement,
    setZoom,
    setPan,
    clearBoard,
    deleteBoard,
    getActiveBoard,
  };
}
