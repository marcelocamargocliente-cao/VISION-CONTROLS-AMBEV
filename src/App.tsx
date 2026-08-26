import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Equipamentos } from './pages/Equipamentos';
import { EquipamentoDetalhe } from './pages/EquipamentoDetalhe';
import { Ocorrencias } from './pages/Ocorrencias';
import { NovaOcorrencia } from './pages/NovaOcorrencia';
import { OcorrenciaDetalhe } from './pages/OcorrenciaDetalhe';
import { Orcamentos } from './pages/Orcamentos';
import { Cadastros } from './pages/Cadastros';

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
            <Route index element={<Dashboard />} />
            <Route path="equipamentos" element={<Equipamentos />} />
            <Route path="equipamentos/:id" element={<EquipamentoDetalhe />} />
            <Route path="ocorrencias" element={<Ocorrencias />} />
            <Route path="ocorrencias/nova" element={<NovaOcorrencia />} />
            <Route path="ocorrencias/:id" element={<OcorrenciaDetalhe />} />
            <Route path="orcamentos" element={<Orcamentos />} />
            <Route path="cadastros" element={<Cadastros />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
