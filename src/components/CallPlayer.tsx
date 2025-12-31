'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '@/contexts/CallContext';
import { Phone, PhoneOff, Pause, Play, X } from 'lucide-react';

function formatCallDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function CallPlayer() {
  const {
    currentCall,
    isCallInProgress,
    showFloatingButton,
    isCallMenuOpen,
    endCall,
    putOnHold,
    resumeCall,
    setCallMenuOpen,
  } = useCall();

  if (!isCallInProgress || !showFloatingButton) {
    return null;
  }

  const getStatusIcon = () => {
    switch (currentCall?.status) {
      case 'dialing':
        return '📞';
      case 'ringing':
        return '📞';
      case 'connected':
        return '🟢';
      case 'hold':
        return '⏸️';
      case 'ended':
        return '📵';
      default:
        return '📞';
    }
  };

  const getStatusColor = () => {
    switch (currentCall?.status) {
      case 'dialing':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'ringing':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'connected':
        return 'bg-green-600 hover:bg-green-700';
      case 'hold':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'ended':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  return (
    <>
      {/* Floating Call Button */}
      <motion.button
        onClick={() => setCallMenuOpen(!isCallMenuOpen)}
        className={`fixed right-6 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${getStatusColor()}`}
        style={{
          bottom: 168,    // above timer and radio
          zIndex: 70      // highest priority when active
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-xl">{getStatusIcon()}</span>

        {/* Call duration overlay for connected calls */}
        {currentCall?.status === 'connected' && (
          <motion.div
            className="absolute bottom-full mb-2 px-2 py-1 bg-white bg-opacity-90 backdrop-blur-sm text-gray-800 text-xs font-mono rounded shadow-md border border-gray-300"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.3 }}
          >
            {formatCallDuration(currentCall.duration)}
          </motion.div>
        )}

        {/* Pulse effect for active calls */}
        {(currentCall?.status === 'connected' || currentCall?.status === 'ringing') && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Call Menu Popup */}
      <AnimatePresence>
        {isCallMenuOpen && currentCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-56 right-6 z-[80] w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className={`text-white p-4 ${getStatusColor().split(' ')[0]} bg-opacity-90`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">📞 Call in Progress</h3>
                <button
                  onClick={() => setCallMenuOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm opacity-90">{currentCall.patientName}</p>
                <p className="text-xs opacity-75">{currentCall.patientPhone}</p>
              </div>
            </div>

            {/* Call Info & Controls */}
            <div className="p-4 space-y-4">
              {/* Patient Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-blue-600">
                    {currentCall.patientInitials}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{currentCall.patientName}</p>
                  <p className="text-sm text-gray-600">
                    Status:
                    <span className={`ml-1 font-medium ${currentCall.status === 'connected' ? 'text-green-600' :
                      currentCall.status === 'hold' ? 'text-orange-600' :
                        currentCall.status === 'ringing' ? 'text-yellow-600' :
                          currentCall.status === 'dialing' ? 'text-blue-600' :
                            'text-red-600'
                      }`}>
                      {currentCall.status === 'hold' ? 'On Hold' :
                        currentCall.status.charAt(0).toUpperCase() + currentCall.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Call Duration */}
              {(currentCall.status === 'connected' || currentCall.status === 'hold') && (
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-gray-700">
                    {formatCallDuration(currentCall.duration)}
                  </div>
                  <p className="text-xs text-gray-500">Call duration</p>
                </div>
              )}

              {/* Call Status Messages */}
              {currentCall.status === 'dialing' && (
                <div className="text-center py-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Dialing...</span>
                  </div>
                </div>
              )}

              {currentCall.status === 'ringing' && (
                <div className="text-center py-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Ringing...</span>
                  </div>
                </div>
              )}

              {/* Call Controls */}
              <div className="flex justify-center gap-3">
                {currentCall.status === 'connected' && (
                  <>
                    <button
                      onClick={putOnHold}
                      className="p-3 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-full transition-colors"
                      title="Put on hold"
                    >
                      <Pause className="w-5 h-5" />
                    </button>
                    <button
                      onClick={endCall}
                      className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      title="End call"
                    >
                      <PhoneOff className="w-5 h-5" />
                    </button>
                  </>
                )}

                {currentCall.status === 'hold' && (
                  <>
                    <button
                      onClick={resumeCall}
                      className="p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors"
                      title="Resume call"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                    <button
                      onClick={endCall}
                      className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      title="End call"
                    >
                      <PhoneOff className="w-5 h-5" />
                    </button>
                  </>
                )}

                {(currentCall.status === 'dialing' || currentCall.status === 'ringing') && (
                  <button
                    onClick={endCall}
                    className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    title="Cancel call"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                )}

                {currentCall.status === 'ended' && (
                  <div className="text-center py-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-red-600">Call Ended</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {currentCall.status === 'connected' && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                      📝 Add Note
                    </button>
                    <button className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                      📅 Schedule Follow-up
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isCallMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCallMenuOpen(false)}
            className="fixed inset-0 z-[75] bg-black bg-opacity-25"
          />
        )}
      </AnimatePresence>
    </>
  );
} 