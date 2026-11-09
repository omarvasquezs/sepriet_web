import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { TopAlertData } from '../utils/topAlert';

export const TopAlertBanner: React.FC = () => {
  const [alert, setAlert] = useState<TopAlertData | null>(null);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleTopAlert = (e: CustomEvent<TopAlertData>) => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }

      const alertData = e.detail;
      setAlert(alertData);
      setIsClosing(false);

      const duration = alertData.duration || 5000;
      dismissTimerRef.current = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          setAlert(null);
          setIsClosing(false);
        }, 320);
      }, duration);
    };

    const handleDismiss = () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      setIsClosing(true);
      setTimeout(() => {
        setAlert(null);
        setIsClosing(false);
      }, 320);
    };

    window.addEventListener('sepriet:top-alert' as any, handleTopAlert);
    window.addEventListener('sepriet:top-alert-dismiss' as any, handleDismiss);

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      window.removeEventListener('sepriet:top-alert' as any, handleTopAlert);
      window.removeEventListener('sepriet:top-alert-dismiss' as any, handleDismiss);
    };
  }, []);

  if (!alert) {
    return null;
  }

  const durationSec = ((alert.duration || 5000) / 1000).toFixed(1);

  // Background and border colors by alert type
  let bgGradient = 'linear-gradient(90deg, #15803d 0%, #16a34a 100%)';
  let IconComponent = CheckCircle2;

  if (alert.type === 'error') {
    bgGradient = 'linear-gradient(90deg, #b91c1c 0%, #dc2626 100%)';
    IconComponent = AlertCircle;
  } else if (alert.type === 'warning') {
    bgGradient = 'linear-gradient(90deg, #b45309 0%, #d97706 100%)';
    IconComponent = AlertCircle;
  } else if (alert.type === 'info') {
    bgGradient = 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)';
    IconComponent = Info;
  }

  const handleManualClose = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    setIsClosing(true);
    setTimeout(() => {
      setAlert(null);
      setIsClosing(false);
    }, 320);
  };

  return (
    <div
      role="alert"
      className={`top-alert-banner ${isClosing ? 'closing' : 'opening'}`}
      style={{
        background: bgGradient,
      }}
    >
      <div className="top-alert-inner">
        <div className="top-alert-content">
          <div className="top-alert-icon-wrap">
            <IconComponent size={19} color="#ffffff" />
          </div>
          <div className="top-alert-text">
            {alert.title && (
              <span className="top-alert-badge">{alert.title}</span>
            )}
            <span className="top-alert-message">{alert.message}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualClose}
          className="top-alert-close-btn"
          title="Cerrar notificación"
          aria-label="Cerrar notificación"
        >
          <X size={15} color="#ffffff" />
        </button>
      </div>

      {/* 5-second countdown progress bar */}
      <div
        className="top-alert-progress"
        style={{
          animationDuration: `${durationSec}s`,
        }}
      />
    </div>
  );
};
