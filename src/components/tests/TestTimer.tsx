import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TestTimerProps {
  totalTime: number; // in seconds
  isActive: boolean;
  onTimeUp?: () => void;
  showWarning?: boolean;
}

const TestTimer: React.FC<TestTimerProps> = ({ 
  totalTime, 
  isActive, 
  onTimeUp,
  showWarning = true 
}) => {
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [hasCalledTimeUp, setHasCalledTimeUp] = useState(false);

  // Reset timer when totalTime or isActive changes
  useEffect(() => {
    setTimeLeft(totalTime);
    setHasCalledTimeUp(false);
  }, [totalTime, isActive]);

  useEffect(() => {
    if (!isActive || hasCalledTimeUp) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTimeLeft = Math.max(0, prev - 1);
        
        // Call onTimeUp only once when timer reaches 0
        if (newTimeLeft === 0 && prev > 0 && !hasCalledTimeUp) {
          setHasCalledTimeUp(true);
          setTimeout(() => onTimeUp?.(), 100); // Small delay to prevent race conditions
        }
        
        return newTimeLeft;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, hasCalledTimeUp, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    return Math.min(100, Math.max(0, progress)); // Clamp between 0-100%
  };

  const isWarningTime = timeLeft <= 30 && timeLeft > 10; // Last 30 seconds but not critical
  const isCriticalTime = timeLeft <= 10; // Last 10 seconds

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${
      isCriticalTime ? 'bg-red-50 border-red-200' : 
      isWarningTime ? 'bg-yellow-50 border-yellow-200' : 
      'bg-blue-50 border-blue-200'
    }`}>
      <Clock className={`h-5 w-5 ${
        isCriticalTime ? 'text-red-600' : 
        isWarningTime ? 'text-yellow-600' : 
        'text-blue-600'
      }`} />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className={`font-mono text-lg font-bold ${
            isCriticalTime ? 'text-red-600' : 
            isWarningTime ? 'text-yellow-600' : 
            'text-blue-600'
          }`}>
            {formatTime(timeLeft)}
          </span>
          {showWarning && (isWarningTime || isCriticalTime) && (
            <span className={`text-xs font-medium ${
              isCriticalTime ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {isCriticalTime ? 'Time Almost Up!' : 'Warning: 30s left'}
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              isCriticalTime ? 'bg-red-500' : 
              isWarningTime ? 'bg-yellow-500' : 
              'bg-blue-500'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TestTimer;