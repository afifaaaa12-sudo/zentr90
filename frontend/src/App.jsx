import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { UserProvider } from './context/user.context';
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <UserProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </UserProvider>
  );
};

export default App;
      