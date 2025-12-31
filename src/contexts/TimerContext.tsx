'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';

interface TimerSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  completed: boolean; // true if stopped, false if reset
  laps?: TimerLap[]; // pause laps within the session
}

interface TimerLap {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  lapNumber: number;
}

interface TimerContextType {
  time: number;
  isRunning: boolean;
  showFloatingButton: boolean;
  isTimerMenuOpen: boolean;
  timerHasPriority: boolean;
  timerLogs: TimerSession[];
  currentLaps: TimerLap[];
  setTimerHasPriority: (value: boolean) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  setShowFloatingButton: (show: boolean) => void;
  setTimerMenuOpen: (open: boolean) => void;
  clearTimerLogs: () => void;
  deleteSelectedLogs: (logIds: string[]) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showFloatingButtonState, setShowFloatingButtonState] = useState(false);
  const [timerHasPriority, setTimerHasPriorityState] = useState(true);
  const [isTimerMenuOpen, setTimerMenuOpen] = useState(false);
  const [timerLogs, setTimerLogs] = useState<TimerSession[]>([]);
  const [currentLaps, setCurrentLaps] = useState<TimerLap[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionRef = useRef<TimerSession | null>(null);

  const setTimerHasPriority = (value: boolean) => {
    setTimerHasPriorityState(value);
  };

  const setShowFloatingButton = (show: boolean) => {
    setShowFloatingButtonState(show);
    if (show) {
      setTimerHasPriority(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timer-priority'));
      }
    }
  };

  // Load timer logs from localStorage
  useEffect(() => {
    const storedLogs = localStorage.getItem('timer-logs');
    if (storedLogs) {
      try {
        const logs = JSON.parse(storedLogs);
        // Convert date strings back to Date objects
        const parsedLogs = logs.map((log: any) => ({
          ...log,
          startTime: new Date(log.startTime),
          endTime: log.endTime ? new Date(log.endTime) : undefined,
        }));
        setTimerLogs(parsedLogs);
      } catch (error) {
        console.error('Failed to load timer logs:', error);
      }
    }
  }, []);

  // Save timer logs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('timer-logs', JSON.stringify(timerLogs));
  }, [timerLogs]);

  // Clear timer logs function
  const clearTimerLogs = () => {
    setTimerLogs([]);
    localStorage.removeItem('timer-logs');
  };

  // Delete selected logs function
  const deleteSelectedLogs = (logIds: string[]) => {
    setTimerLogs(prev => prev.filter(log => !logIds.includes(log.id)));
  };

  // Cross-context communication
  useEffect(() => {
    function onRadioPriority() {
      setTimerHasPriority(false);
    }
    function onTimerPriority() {
      // optional: reinforce own priority
    }

    window.addEventListener('radio-priority', onRadioPriority);
    window.addEventListener('timer-priority', onTimerPriority);

    return () => {
      window.removeEventListener('radio-priority', onRadioPriority);
      window.removeEventListener('timer-priority', onTimerPriority);
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('timer-state');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setShowFloatingButtonState(data.showFloatingButton ?? false);
      } catch { }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'timer-state',
      JSON.stringify({ showFloatingButton: showFloatingButtonState })
    );
  }, [showFloatingButtonState]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => {
    setIsRunning((prev) => {
      const newIsRunning = !prev;

      if (newIsRunning) {
        // Starting timer
        if (!currentSessionRef.current) {
          // Create new session if none exists
          const newSession: TimerSession = {
            id: Date.now().toString(),
            startTime: new Date(),
            duration: 0,
            completed: false,
            laps: [],
          };
          currentSessionRef.current = newSession;
          setCurrentLaps([]);
        }
        // If session exists, we're resuming after a pause
      } else {
        // Pausing timer - create a lap
        if (currentSessionRef.current && time > 0) {
          const lapEndTime = new Date();
          const lapStartTime = currentLaps.length > 0
            ? new Date(currentLaps[currentLaps.length - 1].endTime.getTime() + 1000)
            : currentSessionRef.current.startTime;

          const lapDuration = Math.floor((lapEndTime.getTime() - lapStartTime.getTime()) / 1000);

          const newLap: TimerLap = {
            id: Date.now().toString(),
            startTime: lapStartTime,
            endTime: lapEndTime,
            duration: lapDuration,
            lapNumber: currentLaps.length + 1,
          };

          setCurrentLaps(prev => [...prev, newLap]);
        }
      }

      return newIsRunning;
    });
  };

  const resetTimer = () => {
    // If there's a current session and some time was recorded, save it
    if (currentSessionRef.current && time > 0) {
      const endTime = new Date();

      // If we have laps, this was a session with pauses
      let finalSession: TimerSession;

      if (currentLaps.length > 0) {
        // Add the final lap if timer was running
        let finalLaps = [...currentLaps];
        if (isRunning) {
          const lapStartTime = currentLaps.length > 0
            ? new Date(currentLaps[currentLaps.length - 1].endTime.getTime() + 1000)
            : currentSessionRef.current.startTime;

          const finalLapDuration = Math.floor((endTime.getTime() - lapStartTime.getTime()) / 1000);

          const finalLap: TimerLap = {
            id: Date.now().toString(),
            startTime: lapStartTime,
            endTime: endTime,
            duration: finalLapDuration,
            lapNumber: currentLaps.length + 1,
          };

          finalLaps = [...finalLaps, finalLap];
        }

        finalSession = {
          ...currentSessionRef.current,
          endTime: endTime,
          duration: time,
          completed: false, // marked as incomplete because it was reset
          laps: finalLaps,
        };
      } else {
        // No laps, just a simple session
        finalSession = {
          ...currentSessionRef.current,
          endTime: endTime,
          duration: time,
          completed: false,
        };
      }

      setTimerLogs(prev => [finalSession, ...prev]);
    }

    currentSessionRef.current = null;
    setCurrentLaps([]);
    setTime(0);
    setIsRunning(false);
  };

  const value: TimerContextType = {
    time,
    isRunning,
    showFloatingButton: showFloatingButtonState,
    isTimerMenuOpen,
    timerHasPriority,
    timerLogs,
    currentLaps,
    setTimerHasPriority,
    toggleTimer,
    resetTimer,
    setShowFloatingButton,
    setTimerMenuOpen,
    clearTimerLogs,
    deleteSelectedLogs,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within TimerProvider');
  return context;
}
