import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertModal, AlertType, AlertButton } from '../components/common/AlertModal';

export interface ShowAlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  icon?: string;
  buttons?: AlertButton[];
  onClose?: () => void;
}

interface AlertContextType {
  showAlert: (options: ShowAlertOptions) => void;
  showWarning: (title: string, message?: string, onOk?: () => void) => void;
  showError: (title: string, message?: string, onOk?: () => void) => void;
  showSuccess: (title: string, message?: string, onOk?: () => void) => void;
  showInfo: (title: string, message?: string, onOk?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    isDestructive?: boolean
  ) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<ShowAlertOptions & { visible: boolean }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback((options: ShowAlertOptions) => {
    setAlertState({
      visible: true,
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      icon: options.icon,
      buttons: options.buttons,
      onClose: () => {
        if (options.onClose) options.onClose();
        setAlertState((prev) => ({ ...prev, visible: false }));
      },
    });
  }, []);

  const showWarning = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      showAlert({
        title,
        message,
        type: 'warning',
        icon: '⚠️',
        buttons: [
          {
            text: 'Mengerti',
            style: 'primary',
            onPress: onOk,
          },
        ],
      });
    },
    [showAlert]
  );

  const showError = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      showAlert({
        title,
        message,
        type: 'error',
        icon: '❌',
        buttons: [
          {
            text: 'Tutup',
            style: 'destructive',
            onPress: onOk,
          },
        ],
      });
    },
    [showAlert]
  );

  const showSuccess = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      showAlert({
        title,
        message,
        type: 'success',
        icon: '🎉',
        buttons: [
          {
            text: 'Selesai',
            style: 'primary',
            onPress: onOk,
          },
        ],
      });
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      showAlert({
        title,
        message,
        type: 'info',
        icon: '💡',
        buttons: [
          {
            text: 'OK',
            style: 'primary',
            onPress: onOk,
          },
        ],
      });
    },
    [showAlert]
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      confirmText = 'Konfirmasi',
      cancelText = 'Batal',
      isDestructive = false
    ) => {
      showAlert({
        title,
        message,
        type: 'confirm',
        icon: isDestructive ? '⚠️' : '❓',
        buttons: [
          {
            text: cancelText,
            style: 'cancel',
            onPress: onCancel,
          },
          {
            text: confirmText,
            style: isDestructive ? 'destructive' : 'primary',
            onPress: onConfirm,
          },
        ],
      });
    },
    [showAlert]
  );

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showWarning,
        showError,
        showSuccess,
        showInfo,
        showConfirm,
        hideAlert,
      }}
    >
      {children}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        icon={alertState.icon}
        buttons={alertState.buttons}
        onClose={alertState.onClose || hideAlert}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
