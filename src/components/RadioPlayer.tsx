'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadio, stations } from '@/contexts/RadioContext';
import { useTimer } from '@/contexts/TimerContext';

export default function RadioPlayer() {
  const {
    currentStationIndex,
    isPlaying,
    volume,
    isRadioMenuOpen,
    currentStation,
    showFloatingButton,
    togglePlay,
    nextStation,
    prevStation,
    setVolume,
    setRadioMenuOpen,
    setStation,
  } = useRadio();

  return (
    <>
      {/* Floating Radio Button */}
      {showFloatingButton && (
        <motion.button
          onClick={() => setRadioMenuOpen(!isRadioMenuOpen)}
          className="fixed right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
          style={{
            bottom: 24,     // always at bottom
            zIndex: 50      // always under timer
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-xl">🎧</span>
          {isPlaying && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.button>

      )}

      {/* Radio Menu Popup */}
      <AnimatePresence>
        {isRadioMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-6 z-40 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">🎧 Radio Player</h3>
                <button
                  onClick={() => setRadioMenuOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-blue-100 mt-1">
                {currentStation.name}
              </p>
            </div>

            {/* Controls */}
            <div className="p-4 space-y-4">
              {/* Play/Pause Button */}
              <div className="flex justify-center">
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="text-2xl">
                    {isPlaying ? '⏸️' : '▶️'}
                  </span>
                </button>
              </div>

              {/* Station Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prevStation}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  ⏮️
                </button>
                <span className="text-sm text-gray-600 font-medium">
                  {currentStationIndex + 1} / {stations.length}
                </span>
                <button
                  onClick={nextStation}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  ⏭️
                </button>
              </div>

              {/* Volume Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>🔊 Volume</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Station List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Stations</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {stations.map((station, index) => (
                    <button
                      key={index}
                      onClick={() => setStation(index)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${index === currentStationIndex
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{station.name}</span>
                        {index === currentStationIndex && (
                          <span className="text-blue-600">●</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isRadioMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRadioMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black bg-opacity-25"
          />
        )}
      </AnimatePresence>
    </>
  );
} 