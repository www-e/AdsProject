import type { HistoryItem } from './types';

const HISTORY_KEY = 'cgiAdStudioHistory';

export type NewHistoryItemData = Omit<HistoryItem, 'id' | 'timestamp'>;

export const getHistory = (): HistoryItem[] => {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
        console.error("Failed to parse history from localStorage", error);
        localStorage.removeItem(HISTORY_KEY);
        return [];
    }
};

export const saveHistory = (history: HistoryItem[]): void => {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error("Failed to save history to localStorage", error);
    }
}

export const addToHistory = (itemData: NewHistoryItemData): HistoryItem[] => {
    const history = getHistory();
    const newItem: HistoryItem = {
        ...itemData,
        id: new Date().toISOString() + Math.random(), // Add random to avoid collisions
        timestamp: new Date().toISOString(),
    };
    const newHistory = [newItem, ...history];
    saveHistory(newHistory);
    return newHistory;
};

export const clearHistory = (): void => {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error("Failed to clear history from localStorage", error);
    }
};