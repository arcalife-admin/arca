'use client';

import { useTimer } from '@/contexts/TimerContext';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

function formatTime(seconds: number) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function TimerLogItem({
  session,
  isSelected,
  onToggleSelect,
  onDelete
}: {
  session: any;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusColor = session.completed ? 'text-green-600' : 'text-orange-600';
  const statusText = session.completed ? 'Completed' : 'Reset';
  const statusIcon = session.completed ? '✓' : '↻';
  const hasLaps = session.laps && session.laps.length > 0;

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm transition-colors ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
      }`}>
      <div className="flex items-center gap-3 mb-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${statusColor} flex items-center gap-1`}>
              {statusIcon} {statusText}
            </span>
            {hasLaps && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {isExpanded ? '▼' : '▶'} {session.laps.length} laps
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-lg font-mono font-bold text-gray-700">
              {formatTime(session.duration)}
            </span>
            <button
              onClick={onDelete}
              className="text-red-500 hover:text-red-700 text-sm"
              title="Delete this log"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1 ml-7">
        <div>
          <span className="font-medium">Started:</span> {formatDateTime(session.startTime)}
        </div>
        {session.endTime && (
          <div>
            <span className="font-medium">Ended:</span> {formatDateTime(session.endTime)}
          </div>
        )}
      </div>

      {/* Laps dropdown */}
      {hasLaps && isExpanded && (
        <div className="mt-3 ml-7 border-l-2 border-gray-200 pl-3">
          <h4 className="text-xs font-medium text-gray-600 mb-2">Session Laps:</h4>
          <div className="space-y-2">
            {session.laps.map((lap: any, index: number) => (
              <div key={lap.id} className="text-xs bg-gray-50 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Lap {lap.lapNumber}</span>
                  <span className="font-mono font-bold text-gray-600">
                    {formatTime(lap.duration)}
                  </span>
                </div>
                <div className="text-gray-500 mt-1">
                  {formatDateTime(lap.startTime)} → {formatDateTime(lap.endTime)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimerPageContent() {
  const {
    time,
    isRunning,
    toggleTimer,
    resetTimer,
    showFloatingButton,
    setShowFloatingButton,
    timerLogs,
    clearTimerLogs,
    deleteSelectedLogs,
  } = useTimer();

  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embed') === '1';
  const [parentFloatingButtonState, setParentFloatingButtonState] = useState<boolean | null>(null);
  const [parentTimerState, setParentTimerState] = useState<{
    time: number;
    isRunning: boolean;
  } | null>(null);

  // Selection state for logs
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: 'default' | 'destructive';
    icon?: 'warning' | 'delete' | 'info';
    confirmText?: string;
  }>({
    open: false,
    title: '',
    description: '',
    action: () => { },
  });

  // Sync with parent window's full timer state when embedded
  useEffect(() => {
    if (isEmbedded && window.parent !== window) {
      // Request current state from parent
      window.parent.postMessage({
        type: 'requestFloatingButtonState',
        component: 'timer'
      }, '*');

      window.parent.postMessage({
        type: 'requestTimerState'
      }, '*');

      // Listen for response from parent and live updates
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'floatingButtonState' && event.data.component === 'timer') {
          setParentFloatingButtonState(event.data.show);
        } else if (event.data?.type === 'timerState') {
          setParentTimerState({
            time: event.data.time,
            isRunning: event.data.isRunning
          });
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isEmbedded]);

  // Helper function to show confirmation modal
  const showConfirmation = (config: {
    title: string;
    description: string;
    action: () => void;
    variant?: 'default' | 'destructive';
    icon?: 'warning' | 'delete' | 'info';
    confirmText?: string;
  }) => {
    setConfirmationModal({
      open: true,
      ...config,
    });
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(timerLogs.map(log => log.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleToggleSelect = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
    setSelectAll(newSelected.size === timerLogs.length);
  };

  const handleDeleteSelected = () => {
    if (selectedLogs.size === 0) return;

    const count = selectedLogs.size;
    showConfirmation({
      title: 'Delete Selected Logs',
      description: `Are you sure you want to delete ${count} selected log${count > 1 ? 's' : ''}? This action cannot be undone.`,
      action: () => {
        deleteSelectedLogs(Array.from(selectedLogs));
        setSelectedLogs(new Set());
        setSelectAll(false);
      },
      variant: 'destructive',
      icon: 'delete',
      confirmText: 'Delete'
    });
  };

  const handleDeleteSingle = (logId: string) => {
    showConfirmation({
      title: 'Delete Timer Log',
      description: 'Are you sure you want to delete this timer log? This action cannot be undone.',
      action: () => {
        deleteSelectedLogs([logId]);
        const newSelected = new Set(selectedLogs);
        newSelected.delete(logId);
        setSelectedLogs(newSelected);
        setSelectAll(false);
      },
      variant: 'destructive',
      icon: 'delete',
      confirmText: 'Delete'
    });
  };

  const handleFloatingButtonToggle = () => {
    const newState = isEmbedded && parentFloatingButtonState !== null ? !parentFloatingButtonState : !showFloatingButton;

    if (isEmbedded && window.parent !== window) {
      // Update parent window
      window.parent.postMessage({
        type: 'toggleFloatingButton',
        component: 'timer',
        show: newState
      }, '*');
      // Update local state for immediate UI feedback
      setParentFloatingButtonState(newState);
    } else {
      // Normal mode - update local context
      setShowFloatingButton(newState);
    }
  };

  const handleToggleTimer = () => {
    if (isEmbedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'timerAction',
        action: 'toggleTimer'
      }, '*');
    } else {
      toggleTimer();
    }
  };

  const handleResetTimer = () => {
    if (isEmbedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'timerAction',
        action: 'resetTimer'
      }, '*');
    } else {
      resetTimer();
    }
  };

  const handleClearLogs = () => {
    showConfirmation({
      title: 'Clear All Timer Logs',
      description: 'Are you sure you want to clear all timer logs? This will permanently delete all your timer history and cannot be undone.',
      action: () => {
        clearTimerLogs();
        setSelectedLogs(new Set());
        setSelectAll(false);
      },
      variant: 'destructive',
      icon: 'delete',
      confirmText: 'Clear All'
    });
  };

  // Use parent state if available, otherwise use local context state
  const currentToggleState = isEmbedded && parentFloatingButtonState !== null ? parentFloatingButtonState : showFloatingButton;
  const currentTime = isEmbedded && parentTimerState ? parentTimerState.time : time;
  const currentIsRunning = isEmbedded && parentTimerState ? parentTimerState.isRunning : isRunning;

  return (
    <main className="flex flex-col items-center p-6 gap-6 max-w-4xl mx-auto">

      <div className="mt-6 flex items-center gap-4 bg-white border border-gray-200 shadow-md rounded p-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Floating Timer</h3>
          <p className="text-xs text-gray-500">Show/hide floating timer button</p>
        </div>
        <button
          onClick={handleFloatingButtonToggle}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${currentToggleState ? 'bg-purple-500' : 'bg-gray-300'}`}
        >
          <span
            className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-200 ${currentToggleState ? 'translate-x-6' : 'translate-x-0'}`}
          />
        </button>
      </div>

      <h1 className="text-2xl font-bold">⏱️ Timer Page</h1>
      <p className="text-5xl font-mono">{formatTime(currentTime)}</p>

      <div className="flex gap-4">
        <button
          onClick={handleToggleTimer}
          className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          {currentIsRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={handleResetTimer}
          className="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Reset
        </button>
      </div>

      {/* Timer Logs Section */}
      <div className="w-full max-w-2xl mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Timer Logs</h2>
          <div className="flex items-center gap-2">
            {timerLogs.length > 0 && (
              <>
                {selectedLogs.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                  >
                    Delete Selected ({selectedLogs.size})
                  </button>
                )}
                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {timerLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">📝 No timer sessions yet</p>
            <p className="text-sm mt-2">Start a timer to see your session history here</p>
          </div>
        ) : (
          <>
            {/* Select All option */}
            <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700 cursor-pointer" onClick={handleSelectAll}>
                Select all ({timerLogs.length} logs)
              </label>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {timerLogs.map((session) => (
                <TimerLogItem
                  key={session.id}
                  session={session}
                  isSelected={selectedLogs.has(session.id)}
                  onToggleSelect={() => handleToggleSelect(session.id)}
                  onDelete={() => handleDeleteSingle(session.id)}
                />
              ))}
            </div>
          </>
        )}

        {timerLogs.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Total sessions: {timerLogs.length} |
            Completed: {timerLogs.filter(s => s.completed).length} |
            Reset: {timerLogs.filter(s => !s.completed).length}
            {selectedLogs.size > 0 && ` | Selected: ${selectedLogs.size}`}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmationModal.open}
        onOpenChange={(open) => setConfirmationModal(prev => ({ ...prev, open }))}
        title={confirmationModal.title}
        description={confirmationModal.description}
        onConfirm={confirmationModal.action}
        variant={confirmationModal.variant}
        icon={confirmationModal.icon}
        confirmText={confirmationModal.confirmText}
      />

    </main>
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <TimerPageContent />
    </Suspense>
  );
}
