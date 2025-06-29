
import React, { useState, useEffect } from 'react';
import { logger, LogCategory, LogLevel } from '../services/logger';

interface DebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isVisible, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState<LogCategory | 'ALL'>('ALL');
  const [filterLevel, setFilterLevel] = useState<LogLevel>(LogLevel.DEBUG);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    const updateLogs = () => {
      const filteredLogs = logger.getLogs(
        filterCategory === 'ALL' ? undefined : filterCategory,
        filterLevel
      );
      setLogs(filteredLogs.slice(-100)); // Show last 100 logs
    };

    updateLogs();

    if (autoRefresh) {
      const interval = setInterval(updateLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [isVisible, filterCategory, filterLevel, autoRefresh]);

  const handleExportLogs = () => {
    const logsJson = logger.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'text-gray-600';
      case LogLevel.INFO: return 'text-blue-600';
      case LogLevel.WARN: return 'text-yellow-600';
      case LogLevel.ERROR: return 'text-red-600';
      default: return 'text-black';
    }
  };

  const getCategoryColor = (category: LogCategory) => {
    const colors: Record<LogCategory, string> = {
      [LogCategory.APP]: 'bg-purple-100',
      [LogCategory.GEMINI]: 'bg-green-100',
      [LogCategory.CHARACTER]: 'bg-blue-100',
      [LogCategory.GAME]: 'bg-yellow-100',
      [LogCategory.AUDIO]: 'bg-pink-100',
      [LogCategory.UI]: 'bg-indigo-100',
      [LogCategory.STORAGE]: 'bg-orange-100',
      [LogCategory.API]: 'bg-red-100',
      [LogCategory.PERFORMANCE]: 'bg-gray-100',
    };
    return colors[category] || 'bg-gray-100';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-bold">Debug Panel - Application Logs</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-1">Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as LogCategory | 'ALL')}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="ALL">All Categories</option>
              {Object.values(LogCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Min Level:</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(Number(e.target.value) as LogLevel)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={LogLevel.DEBUG}>Debug</option>
              <option value={LogLevel.INFO}>Info</option>
              <option value={LogLevel.WARN}>Warning</option>
              <option value={LogLevel.ERROR}>Error</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="autoRefresh" className="text-sm">Auto Refresh</label>
          </div>

          <button
            onClick={handleExportLogs}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Export Logs
          </button>

          <button
            onClick={() => {
              logger.clearLogs();
              setLogs([]);
            }}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Clear Logs
          </button>

          <span className="text-sm text-gray-600">
            Showing {logs.length} logs
          </span>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="border rounded p-2 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`font-bold ${getLevelColor(log.level)}`}>
                    {LogLevel[log.level]}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(log.category)}`}>
                    {log.category}
                  </span>
                </div>
                <div className="font-medium mb-1">{log.message}</div>
                {log.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600 text-xs">
                      Show Data
                    </summary>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
                {log.stackTrace && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-red-600 text-xs">
                      Show Stack Trace
                    </summary>
                    <pre className="mt-1 p-2 bg-red-50 rounded text-xs overflow-auto">
                      {log.stackTrace}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
