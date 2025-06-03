
import { create } from 'zustand';

interface TestSession {
  id: string;
  testType: string;
  startTime: Date;
  responses: any[];
  currentPhase: string;
  timeLeft: number;
}

interface StoreState {
  currentTestSession: TestSession | null;
  testHistory: any[];
  userProgress: any;
  setCurrentTestSession: (session: TestSession | null) => void;
  addResponse: (response: any) => void;
  updateTimeLeft: (time: number) => void;
  setCurrentPhase: (phase: string) => void;
  setUserProgress: (progress: any) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  currentTestSession: null,
  testHistory: [],
  userProgress: null,
  
  setCurrentTestSession: (session) => set({ currentTestSession: session }),
  
  addResponse: (response) => set((state) => ({
    currentTestSession: state.currentTestSession ? {
      ...state.currentTestSession,
      responses: [...state.currentTestSession.responses, response]
    } : null
  })),
  
  updateTimeLeft: (time) => set((state) => ({
    currentTestSession: state.currentTestSession ? {
      ...state.currentTestSession,
      timeLeft: time
    } : null
  })),
  
  setCurrentPhase: (phase) => set((state) => ({
    currentTestSession: state.currentTestSession ? {
      ...state.currentTestSession,
      currentPhase: phase
    } : null
  })),
  
  setUserProgress: (progress) => set({ userProgress: progress }),
}));
