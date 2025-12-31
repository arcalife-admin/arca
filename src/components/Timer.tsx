'use client';

import { useTimer } from '@/contexts/TimerContext';
import { useRadio } from '@/contexts/RadioContext';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(seconds: number) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function Timer() {
  const {
    time,
    isRunning,
    showFloatingButton,
    isTimerMenuOpen,
    toggleTimer,
    resetTimer,
    setTimerMenuOpen,
  } = useTimer();

  return (
    <>
      {showFloatingButton && (
        <motion.button
          onClick={() => setTimerMenuOpen(!isTimerMenuOpen)}
          className="fixed right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
          style={{
            bottom: 96,     // always above radio
            zIndex: 60      // always on top
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ⏱️
          {showFloatingButton && isRunning && (
            <motion.div
              className="absolute bottom-full mb-2 px-2 py-1 bg-white bg-opacity-70 backdrop-blur-sm text-gray-800 text-xs font-mono rounded shadow-md border border-gray-300"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.3 }}
            >
              {formatTime(time)}
            </motion.div>
          )}

          {isRunning && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.button>

      )}

      <AnimatePresence>
        {isTimerMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-40 right-6 z-[55] w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">⏱️ Timer</h3>
              <button onClick={() => setTimerMenuOpen(false)}>✕</button>
            </div>

            <div className="text-center text-3xl font-mono mb-4">{formatTime(time)}</div>

            <div className="flex justify-center gap-4">
              <button
                onClick={toggleTimer}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                {isRunning ? '⏸️ Pause' : '▶️ Start'}
              </button>
              <button
                onClick={resetTimer}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                🔄 Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isTimerMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTimerMenuOpen(false)}
            className="fixed inset-0 z-50 bg-black bg-opacity-25"
          />
        )}
      </AnimatePresence>
    </>
  );
}
