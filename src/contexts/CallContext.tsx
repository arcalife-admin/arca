'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';

export type CallStatus = 'dialing' | 'ringing' | 'connected' | 'ended' | 'hold';

interface CallData {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientInitials: string;
  startTime: Date;
  duration: number;
  status: CallStatus;
}

interface CallContextType {
  currentCall: CallData | null;
  isCallInProgress: boolean;
  showFloatingButton: boolean;
  isCallMenuOpen: boolean;
  callHasPriority: boolean;

  // Actions
  startCall: (patientData: {
    id: string;
    name: string;
    phone: string;
    initials: string;
  }) => void;
  endCall: () => void;
  putOnHold: () => void;
  resumeCall: () => void;
  setShowFloatingButton: (show: boolean) => void;
  setCallMenuOpen: (open: boolean) => void;
  setCallHasPriority: (value: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);
  const [showFloatingButtonState, setShowFloatingButtonState] = useState(false);
  const [isCallMenuOpen, setIsCallMenuOpen] = useState(false);
  const [callHasPriority, setCallHasPriorityState] = useState(true);
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isCallInProgress = currentCall !== null && currentCall.status !== 'ended';

  const setCallHasPriority = (value: boolean) => {
    setCallHasPriorityState(value);
  };

  const setShowFloatingButton = (show: boolean) => {
    setShowFloatingButtonState(show);
    if (show) {
      setCallHasPriority(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('call-priority'));
      }
    }
  };

  const setCallMenuOpen = (open: boolean) => {
    setIsCallMenuOpen(open);
  };

  const startCall = (patientData: {
    id: string;
    name: string;
    phone: string;
    initials: string;
  }) => {
    const newCall: CallData = {
      id: Date.now().toString(),
      patientId: patientData.id,
      patientName: patientData.name,
      patientPhone: patientData.phone,
      patientInitials: patientData.initials,
      startTime: new Date(),
      duration: 0,
      status: 'dialing',
    };

    setCurrentCall(newCall);
    setShowFloatingButton(true);

    // Simulate call progression
    setTimeout(() => {
      setCurrentCall(prev => prev ? { ...prev, status: 'ringing' } : null);
    }, 2000);

    setTimeout(() => {
      setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
    }, 5000);
  };

  const endCall = () => {
    if (currentCall) {
      setCurrentCall(prev => prev ? { ...prev, status: 'ended' } : null);

      // Clean up after 2 seconds
      setTimeout(() => {
        setCurrentCall(null);
        setShowFloatingButton(false);
        setIsCallMenuOpen(false);
      }, 2000);
    }
  };

  const putOnHold = () => {
    if (currentCall && currentCall.status === 'connected') {
      setCurrentCall(prev => prev ? { ...prev, status: 'hold' } : null);
    }
  };

  const resumeCall = () => {
    if (currentCall && currentCall.status === 'hold') {
      setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
    }
  };

  // Call duration timer
  useEffect(() => {
    if (currentCall?.status === 'connected' || currentCall?.status === 'hold') {
      callIntervalRef.current = setInterval(() => {
        setCurrentCall(prev => {
          if (prev && prev.status !== 'ended') {
            return { ...prev, duration: prev.duration + 1 };
          }
          return prev;
        });
      }, 1000);
    } else if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
    }

    return () => {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
      }
    };
  }, [currentCall?.status]);

  // Cross-context communication
  useEffect(() => {
    function onRadioPriority() {
      setCallHasPriority(false);
    }
    function onTimerPriority() {
      setCallHasPriority(false);
    }
    function onCallPriority() {
      // optional: reinforce own priority
    }

    window.addEventListener('radio-priority', onRadioPriority);
    window.addEventListener('timer-priority', onTimerPriority);
    window.addEventListener('call-priority', onCallPriority);

    return () => {
      window.removeEventListener('radio-priority', onRadioPriority);
      window.removeEventListener('timer-priority', onTimerPriority);
      window.removeEventListener('call-priority', onCallPriority);
    };
  }, []);

  // Load state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('call-state');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setShowFloatingButtonState(data.showFloatingButton ?? false);
        // Don't restore active calls on page reload
      } catch { }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(
      'call-state',
      JSON.stringify({ showFloatingButton: showFloatingButtonState })
    );
  }, [showFloatingButtonState]);

  const value: CallContextType = {
    currentCall,
    isCallInProgress,
    showFloatingButton: showFloatingButtonState,
    isCallMenuOpen,
    callHasPriority,
    startCall,
    endCall,
    putOnHold,
    resumeCall,
    setShowFloatingButton,
    setCallMenuOpen,
    setCallHasPriority,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
} 