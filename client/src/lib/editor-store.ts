import { create } from 'zustand';

interface EditorStore {
  html: string;
  setHtml: (html: string) => void;
  selectedElement: HTMLElement | null;
  setSelectedElement: (element: HTMLElement | null) => void;
  history: string[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  html: '<!DOCTYPE html><html><head><title>Visual HTML Editor</title></head><body></body></html>',
  setHtml: (html) => {
    const { history, currentIndex } = get();
    const newHistory = [...history.slice(0, currentIndex + 1), html];
    set({ 
      html,
      history: newHistory,
      currentIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false
    });
  },
  selectedElement: null,
  setSelectedElement: (element) => set({ selectedElement: element }),
  history: ['<!DOCTYPE html><html><head><title>Visual HTML Editor</title></head><body></body></html>'],
  currentIndex: 0,
  canUndo: false,
  canRedo: false,
  undo: () => {
    const { history, currentIndex } = get();
    if (currentIndex > 0) {
      set({
        currentIndex: currentIndex - 1,
        html: history[currentIndex - 1],
        canUndo: currentIndex - 1 > 0,
        canRedo: true
      });
    }
  },
  redo: () => {
    const { history, currentIndex } = get();
    if (currentIndex < history.length - 1) {
      set({
        currentIndex: currentIndex + 1,
        html: history[currentIndex + 1],
        canUndo: true,
        canRedo: currentIndex + 1 < history.length - 1
      });
    }
  }
}));
