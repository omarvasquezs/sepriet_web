export type TopAlertType = 'success' | 'error' | 'warning' | 'info';

export interface TopAlertData {
  id: string;
  type: TopAlertType;
  message: string;
  title?: string;
  duration?: number; // ms, defaults to 5000
}

export const showTopAlert = (
  message: string,
  type: TopAlertType = 'success',
  title?: string,
  duration: number = 5000
) => {
  const alertData: TopAlertData = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    message,
    title,
    duration,
  };

  window.dispatchEvent(
    new CustomEvent<TopAlertData>('sepriet:top-alert', { detail: alertData })
  );
};

export const dismissTopAlert = () => {
  window.dispatchEvent(new CustomEvent('sepriet:top-alert-dismiss'));
};
