import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import { initTheme } from './lib/theme';
import { initAnalytics } from './lib/analytics';
import './lib/filters/builtin';
import { AuthProvider } from './context/AuthContext';

initTheme();
initAnalytics();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
