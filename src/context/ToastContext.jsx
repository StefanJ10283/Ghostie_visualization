import { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((t) => ({ ...t, open: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={toast.severity} variant="filled" sx={{ borderRadius: '10px' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
