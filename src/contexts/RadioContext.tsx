'use client';

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from 'react';

const stations = [
  { name: 'NPO Radio 1', stream: 'https://icecast.omroep.nl/radio1-bb-mp3' },
  { name: 'NPO Radio 2', stream: 'https://icecast.omroep.nl/radio2-bb-mp3' },
  { name: 'NPO 3FM', stream: 'https://icecast.omroep.nl/3fm-bb-mp3' },
  {
    name: 'Radio 10',
    stream: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO10.mp3',
  },
  { name: 'Radio 538', stream: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO538.mp3' },
  { name: 'Qmusic', stream: 'https://icecast-qmusicnl-cdp.triple-it.nl/Qmusic_nl_live_96.mp3' },
  { name: 'Sky Radio', stream: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SKYRADIO.mp3' },
];

interface RadioContextType {
  currentStationIndex: number;
  isPlaying: boolean;
  volume: number;
  isRadioMenuOpen: boolean;
  currentStation: typeof stations[0];
  showFloatingButton: boolean;
  radioHasPriority: boolean;
  setRadioHasPriority: (value: boolean) => void;
  togglePlay: () => void;
  nextStation: () => void;
  prevStation: () => void;
  setVolume: (volume: number) => void;
  setRadioMenuOpen: (open: boolean) => void;
  setStation: (index: number) => void;
  setShowFloatingButton: (show: boolean) => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export function RadioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [isRadioMenuOpen, setIsRadioMenuOpen] = useState(false);
  const [showFloatingButton, setShowFloatingButtonState] = useState(false);
  const [radioHasPriority, setRadioHasPriorityState] = useState(true);

  const currentStation = stations[currentStationIndex];

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const nextStation = () => {
    setCurrentStationIndex((prev) => (prev + 1) % stations.length);
  };

  const prevStation = () => {
    setCurrentStationIndex((prev) =>
      (prev - 1 + stations.length) % stations.length
    );
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const setRadioMenuOpen = (open: boolean) => {
    setIsRadioMenuOpen(open);
  };

  const setStation = (index: number) => {
    setCurrentStationIndex(index);
  };

  const setRadioHasPriority = (value: boolean) => {
    setRadioHasPriorityState(value);
  };

  const setShowFloatingButton = (show: boolean) => {
    setShowFloatingButtonState(show);
    if (show) {
      setRadioHasPriority(true);
      // Defer call to timer to avoid circular import
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('radio-priority'));
      }
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('radio-state');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setCurrentStationIndex(data.currentStationIndex ?? 0);
        setIsPlaying(data.isPlaying ?? false);
        setVolumeState(data.volume ?? 0.5);
        setShowFloatingButtonState(data.showFloatingButton ?? true);
      } catch { }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'radio-state',
      JSON.stringify({ currentStationIndex, isPlaying, volume, showFloatingButton })
    );
  }, [currentStationIndex, isPlaying, volume, showFloatingButton]);

  useEffect(() => {
    const audio = (audioRef.current = new Audio());
    audio.volume = volume;
    if (isPlaying) {
      audio.src = currentStation.stream;
      audio.load();
      audio.play().catch(console.error);
    }
    return () => audio.pause();
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.src = currentStation.stream;
    if (isPlaying) {
      audioRef.current.load();
      audioRef.current.play().catch(console.error);
    }
  }, [currentStationIndex]);

  const value: RadioContextType = {
    currentStationIndex,
    isPlaying,
    volume,
    isRadioMenuOpen,
    currentStation,
    showFloatingButton,
    radioHasPriority,
    setRadioHasPriority,
    togglePlay,
    nextStation,
    prevStation,
    setVolume,
    setRadioMenuOpen,
    setStation,
    setShowFloatingButton,
  };

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (!context) throw new Error('useRadio must be used within RadioProvider');
  return context;
}

export { stations };
