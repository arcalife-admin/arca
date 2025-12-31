'use client';

import { useRadio, stations } from '@/contexts/RadioContext';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function RadioPageContent() {
  const {
    currentStationIndex,
    isPlaying,
    volume,
    currentStation,
    showFloatingButton,
    togglePlay,
    nextStation,
    prevStation,
    setVolume,
    setStation,
    setShowFloatingButton,
  } = useRadio();

  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embed') === '1';
  const [parentFloatingButtonState, setParentFloatingButtonState] = useState<boolean | null>(null);
  const [parentRadioState, setParentRadioState] = useState<{
    isPlaying: boolean;
    currentStationIndex: number;
    volume: number;
  } | null>(null);

  // Sync with parent window's full radio state when embedded
  useEffect(() => {
    if (isEmbedded && window.parent !== window) {
      // Request current state from parent
      window.parent.postMessage({
        type: 'requestFloatingButtonState',
        component: 'radio'
      }, '*');

      window.parent.postMessage({
        type: 'requestRadioState'
      }, '*');

      // Listen for response from parent
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'floatingButtonState' && event.data.component === 'radio') {
          setParentFloatingButtonState(event.data.show);
        } else if (event.data?.type === 'radioState') {
          setParentRadioState({
            isPlaying: event.data.isPlaying,
            currentStationIndex: event.data.currentStationIndex,
            volume: event.data.volume
          });
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isEmbedded]);

  const handleFloatingButtonToggle = () => {
    const newState = isEmbedded && parentFloatingButtonState !== null ? !parentFloatingButtonState : !showFloatingButton;

    if (isEmbedded && window.parent !== window) {
      // Update parent window
      window.parent.postMessage({
        type: 'toggleFloatingButton',
        component: 'radio',
        show: newState
      }, '*');
      // Update local state for immediate UI feedback
      setParentFloatingButtonState(newState);
    } else {
      // Normal mode - update local context
      setShowFloatingButton(newState);
    }
  };

  const handleTogglePlay = () => {
    if (isEmbedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'radioAction',
        action: 'togglePlay'
      }, '*');
    } else {
      togglePlay();
    }
  };

  const handleNextStation = () => {
    if (isEmbedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'radioAction',
        action: 'nextStation'
      }, '*');
    } else {
      nextStation();
    }
  };

  const handlePrevStation = () => {
    if (isEmbedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'radioAction',
        action: 'prevStation'
      }, '*');
    } else {
      prevStation();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (isEmbedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'radioAction',
        action: 'setVolume',
        value: newVolume
      }, '*');
    } else {
      setVolume(newVolume);
    }
  };

  const handleStationChange = (index: number) => {
    if (isEmbedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'radioAction',
        action: 'setStation',
        value: index
      }, '*');
    } else {
      setStation(index);
    }
  };

  // Use parent state if available, otherwise use local context state
  const currentToggleState = isEmbedded && parentFloatingButtonState !== null ? parentFloatingButtonState : showFloatingButton;
  const currentIsPlaying = isEmbedded && parentRadioState ? parentRadioState.isPlaying : isPlaying;
  const currentStationIdx = isEmbedded && parentRadioState ? parentRadioState.currentStationIndex : currentStationIndex;
  const currentVolume = isEmbedded && parentRadioState ? parentRadioState.volume : volume;
  const currentStationData = stations[currentStationIdx];

  return (
    <main className="flex flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-bold">🎧 Dutch Radio Player</h1>
      <p className="text-lg">Now playing: {currentStationData.name}</p>

      {/* Floating Button Toggle */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Floating Radio Button</h3>
            <p className="text-xs text-gray-500">Show/hide the radio player in the bottom-right corner</p>
          </div>
          <button
            onClick={handleFloatingButtonToggle}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${currentToggleState ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            aria-pressed={currentToggleState}
          >
            <span
              className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-200 ${currentToggleState ? 'translate-x-6' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handlePrevStation}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ⏮️ Previous
        </button>
        <button
          onClick={handleTogglePlay}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {currentIsPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <button
          onClick={handleNextStation}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Next ⏭️
        </button>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <label htmlFor="volume">🔊 Volume</label>
        <input
          id="volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={currentVolume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-sm text-gray-600">{Math.round(currentVolume * 100)}%</span>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Available Stations</h3>
        <div className="grid grid-cols-3 gap-2">
          {stations.map((station, index) => (
            <button
              key={index}
              onClick={() => handleStationChange(index)}
              className={`px-3 py-2 text-sm rounded ${index === currentStationIdx
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
                }`}
            >
              {station.name}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function RadioPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <RadioPageContent />
    </Suspense>
  );
}
