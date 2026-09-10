import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';

// Carregamento sob demanda — cada página só baixa quando acessada.
// Abertura inicial no celular fica bem mais leve.
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Equipamentos = lazy(() => import('./pages/Equipamentos').then((m) => ({ default: m.Equipamentos })));
const EquipamentoDetalhe = lazy(() => import('./pages/EquipamentoDetalhe').then((m) => ({ default: m.EquipamentoDetalhe })));
const Ocorrencias = lazy(() => import('./pages/Ocorrencias').then((m) => ({ default: m.Ocorrencias })));
const NovaOcorrencia = lazy(() => import('./pages/NovaOcorrencia').then((m) => ({ default: m.NovaOcorrencia })));
const OcorrenciaDetalhe = lazy(() => import('./pages/OcorrenciaDetalhe').then((m) => ({ default: m.OcorrenciaDetalhe })));
const Orcamentos = lazy(() => import('./pages/Orcamentos').then((m) => ({ default: m.Orcamentos })));
const Cadastros = lazy(() => import('./pages/Cadastros').then((m) => ({ default: m.Cadastros })));

// Detecta viewport de celular (mesmo breakpoint do Tailwind md: 768px)
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

const PageLoader: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-[var(--bg-app)] text-[#8B949E] font-mono text-xs">
    <div className="flex items-center gap-2">
      <span className="led-dot led-ok animate-ping" />
      <span>Carregando...</span>
    </div>
  </div>
);

// Rota inicial: no desktop mostra o Dashboard; no celular ele fica oculto
// (não fica bom em tela pequena) e cai direto em Equipamentos.
const HomeRoute: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <Navigate to="/equipamentos" replace />;
  return (
    <Suspense fallback={<PageLoader />}>
      <Dashboard />
    </Suspense>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#14181D] flex items-center justify-center text-[#94A3B8] font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="led-dot led-ok animate-ping" />
          <span>Iniciando sistema IVCA Vision Controls...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1A1F28', color: '#E6EDF3', border: '1px solid #30363D' } }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeRoute />} />
            <Route path="equipamentos" element={<Suspense fallback={<PageLoader />}><Equipamentos /></Suspense>} />
            <Route path="equipamentos/:id" element={<Suspense fallback={<PageLoader />}><EquipamentoDetalhe /></Suspense>} />
            <Route path="ocorrencias" element={<Suspense fallback={<PageLoader />}><Ocorrencias /></Suspense>} />
            <Route path="ocorrencias/nova" element={<Suspense fallback={<PageLoader />}><NovaOcorrencia /></Suspense>} />
            <Route path="ocorrencias/:id" element={<Suspense fallback={<PageLoader />}><OcorrenciaDetalhe /></Suspense>} />
            <Route path="orcamentos" element={<Suspense fallback={<PageLoader />}><Orcamentos /></Suspense>} />
            <Route path="cadastros" element={<Suspense fallback={<PageLoader />}><Cadastros /></Suspense>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
