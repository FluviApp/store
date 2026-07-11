import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import './theme/fluvi.css'; // 👈 estilos centrales (glass celeste)
import App from './App.jsx';

import { ConfigProvider } from 'antd';
import { antdTheme } from './theme/antdTheme.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LoadScript } from '@react-google-maps/api';
import { AuthProvider } from './context/AuthContext.jsx'; // 👈 CORREGIDO aquí

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={antdTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider> {/* 👈 Envuelves aquí tu App + LoadScript */}
          <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={['places', 'drawing']}
          >
            <App />
          </LoadScript>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>
);
