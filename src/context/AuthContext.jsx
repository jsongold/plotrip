import { createContext, useContext } from 'react';

const GUEST_USER = { id: 'guest', email: 'guest@plotrip.local' };

const noop = async () => ({});

const GUEST_STATE = {
  session: null,
  user: GUEST_USER,
  isAuthenticated: true,
  isInitializing: false,
  isSubmitting: false,
  error: '',
  message: '',
  pendingEmail: '',
  lastAuthMethod: '',
  signInWithGoogle: noop,
  sendMagicLink: noop,
  sendEmailOtp: noop,
  verifyEmailOtp: noop,
  signOut: noop,
  clearFeedback: () => {},
};

const AuthContext = createContext(GUEST_STATE);

export function AuthProvider({ children }) {
  return <AuthContext.Provider value={GUEST_STATE}>{children}</AuthContext.Provider>;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}

export function useAuth() {
  return useContext(AuthContext);
}
