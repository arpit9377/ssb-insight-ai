
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'

const PUBLISHABLE_KEY = "pk_test_cXVpZXQtd3Jlbi05My5jbGVyay5hY2NvdW50cy5kZXYk"

if (!PUBLISHABLE_KEY) {
  console.warn('Clerk publishable key not configured. Authentication features will be disabled.');
}

const AppWithProviders = () => {
  if (PUBLISHABLE_KEY) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    );
  }

  // Render app without Clerk when no valid key is provided
  return <App />;
};

createRoot(document.getElementById("root")!).render(<AppWithProviders />);
