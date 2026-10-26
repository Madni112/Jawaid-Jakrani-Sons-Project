import { Toaster, useToasterStore } from 'react-hot-toast';
import Navigation from './Navigation/Routing';
import { ModalProvider } from './Context/Modal';
import { useEffect, useRef } from 'react';
import { initializeSocket } from './service/socket';
import { AuthProvider, useAuth } from './Context/Auth';
import Alert from './pages/Alert';
import { applyAccentColor, getSavedAccentColor } from './constant/themeConfig';
import { triggerFeedbackSound } from './utils/audioFeedback';

const ToastSoundHandler = () => {
  const { toasts } = useToasterStore();
  const { userEmail } = useAuth();
  const seenToasts = useRef<Set<string>>(new Set());

  useEffect(() => {
    toasts.forEach((t) => {
      if (t.visible && !seenToasts.current.has(t.id)) {
        seenToasts.current.add(t.id);
        if (t.type === 'error') {
          triggerFeedbackSound('warning', userEmail);
        } else {
          triggerFeedbackSound('notification', userEmail);
        }
      }
    });

    if (seenToasts.current.size > 80) {
      const activeIds = new Set(toasts.map((t) => t.id));
      seenToasts.current.forEach((id) => {
        if (!activeIds.has(id)) seenToasts.current.delete(id);
      });
    }
  }, [toasts, userEmail]);

  return null;
};

function App() {
  useEffect(() => {
    applyAccentColor(getSavedAccentColor());
    initializeSocket();
  }, []);
  return (
    <AuthProvider>
      <ModalProvider>
        <Navigation />
        <Toaster
          position="top-center"
          containerStyle={{ zIndex: 999999 }}
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: '13px',
              fontWeight: 500,
              padding: '12px 16px',
              borderRadius: '8px',
              maxWidth: '500px',
            },
            success: {
              duration: 3500,
            },
            error: {
              duration: 5000,
            },
          }}
        />
        <ToastSoundHandler />
        <Alert />
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;


