import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_PROFILES } from '../lib/mockData';
import { getRoleBadge } from '../utils/formatters';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Por favor, informe seu e-mail corporativo.');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Credenciais inválidas.');
    }
  };

  const handleQuickLogin = async (profileEmail: string) => {
    setError(null);
    setEmail(profileEmail);
    const res = await login(profileEmail);
    if (res.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#14181D] flex flex-col justify-center items-center p-4 selection:bg-[#F5A623]/30">
      <div className="w-full max-w-md">
        {/* Brand Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[4px] bg-[#1C222A] border border-[#2C343E] text-[#F5A623] font-mono font-bold text-2xl shadow-xl mb-3">
            VC
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold tracking-widest text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-[2px] border border-[#F5A623]/30">
              IVCA
            </span>
            <span className="text-xs font-mono text-[#6B7683]">•</span>
            <span className="text-xs font-mono tracking-wider text-[#94A3B8]">
              AMBEV — CERVEJARIA RJ
            </span>
          </div>

          <h1 className="text-2xl text-[#ECEFF1] tracking-tight">
            <span className="font-light text-[#94A3B8]">Integração</span>{' '}
            <strong className="font-bold text-[#F5A623]">Vision Controls AmBev</strong>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1.5 max-w-xs mx-auto">
            Gestão de manutenção e confiabilidade do parque de ar-condicionado industrial
          </p>
        </div>

        {/* Login Container */}
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-6 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-[3px] bg-[#E5484D]/15 border border-[#E5484D]/40 flex items-start gap-2.5 text-xs text-[#FF8787]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] mb-1.5">
                E-mail Corporativo
              </label>
              <input
                id="input-login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome.sobrenome@visioncontrols.com.br"
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2.5 outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94A3B8]">
                  Senha
                </label>
                <span className="text-[10px] text-[#6B7683]">Supabase Auth</span>
              </div>
              <input
                id="input-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2.5 outline-none transition-colors font-mono"
              />
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-[3px] bg-[#F5A623] hover:bg-[#D98E1A] text-[#14181D] font-condensed text-sm font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <span>{isLoading ? 'Autenticando...' : 'Acessar Painel IVCA'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Profiles (Field & Management Demo) */}
          <div className="mt-6 pt-5 border-t border-[#2C343E]">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] mb-2.5 text-center">
              Acesso Rápido — Equipe Designada
            </p>
            <div className="space-y-1.5">
              {INITIAL_PROFILES.map((prof) => {
                const badge = getRoleBadge(prof.role);
                return (
                  <button
                    key={prof.id}
                    id={`btn-quick-login-${prof.id}`}
                    type="button"
                    onClick={() => handleQuickLogin(prof.email)}
                    className="w-full p-2 rounded-[3px] bg-[#14181D] hover:bg-[#232B35] border border-[#2C343E] hover:border-[#3E4A59] text-left flex items-center justify-between transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#ECEFF1] group-hover:text-[#F5A623] truncate">
                        {prof.nome}
                      </p>
                      <p className="text-[10px] font-mono text-[#6B7683] truncate">{prof.email}</p>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-[2px] border ${badge.badgeClass} shrink-0 ml-2`}
                    >
                      {prof.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 text-center border-t border-[#2C343E]/50">
            <p className="text-[11px] text-[#6B7683]">
              Sistema restrito Vision Controls. Usuários são provisionados pela administração.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
