// Fix: Import `ReactElement` to resolve the "Cannot find namespace 'JSX'" error.
import type { ReactElement } from 'react';

export enum Step {
  PREPARE = 'PREPARE',
  DESIGN = 'DESIGN',
  FINALIZE = 'FINALIZE',
}

export interface HistoryItem {
    id: string;
    timestamp: string;
    finalAd: { url: string; };
    sceneDescription: string;
    videoPrompt: string;
}