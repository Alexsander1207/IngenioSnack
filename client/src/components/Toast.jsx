import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

let addToastHandler = null;

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let timer = null;

    addToastHandler = (msg, type) => {
      const id = Date.now();
      // Reemplaza el array para mostrar solo la notificación actual
      setToasts([{ id, msg, type }]);
      
      // Reinicia el temporizador de 3 segundos
      if (timer) clearTimeout(timer);
      
      timer = setTimeout(() => {
        setToasts([]);
      }, 3000);
    };

    return () => {
      addToastHandler = null;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div id="toast-container" className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle size={18} />}
          {t.type === 'error' && <XCircle size={18} />}
          {t.type === 'warning' && <AlertCircle size={18} />}
          {t.type === 'info' && <Info size={18} />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
};

export const useToast = () => {
  const toast = (msg, type = 'info') => {
    if (addToastHandler) addToastHandler(msg, type);
  };
  return { toast };
};
