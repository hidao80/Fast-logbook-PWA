import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import './i18n/index';
import App from './App';
import ConfigApp from './ConfigApp';

const router = createHashRouter([
  { path: '/', element: <App /> },
  { path: '/config', element: <ConfigApp /> },
]);

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
