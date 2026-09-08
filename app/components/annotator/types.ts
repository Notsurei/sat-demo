export type HighlightColor = 'yellow' | 'blue' | 'green' | 'pink';
export type DrawColor = '#2563eb' | '#dc2626' | '#111';
export type AnnotMode = 'none' | 'highlight' | 'draw';

export interface AnnotatorState {
  mode: AnnotMode;
  color: HighlightColor | DrawColor;
  passageId: string | null;
}

export interface AnnotatorProps {
  passageId: string;
  passageContent?: string;
  enabled?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}