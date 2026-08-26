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
    <div className="min-h-screen bg-[var(--bg-input)] flex flex-col justify-center items-center p-4 selection:bg-[#F5A623]/30">
      <div className="w-full max-w-md">
        {/* Brand Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[4px] card border border-[#2C343E]   font-bold text-2xl shadow-xl mb-3">
            VC
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs  font-bold tracking-widest  bg-[#F5A623]/10 px-2 py-0.5 rounded-[2px] border border-[#F5A623]/30">
              IVCA
            </span>
            <span className="text-xs  ">•</span>
            <span className="text-xs  tracking-wider ">
              AMBEV — CERVEJARIA RJ
            </span>
          </div>

          <h1 className="text-2xl  tracking-tight">
            <span className="font-light ">Integração</span>{' '}
            <strong className="font-bold ">Vision Controls AmBev</strong>
          </h1>
          <p className="text-xs  mt-1.5 max-w-xs mx-auto">
            Gestão de manutenção e confiabilidade do parque de ar-condicionado industrial
          </p>
        </div>

        {/* Login Container */}
        <div className="card border border-[#2C343E] rounded-[4px] p-6 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-[3px] bg-[#E5484D]/15 border border-[#E5484D]/40 flex items-start gap-2.5 text-xs ">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px]  uppercase tracking-wider  mb-1.5">
                E-mail Corporativo
              </label>
              <input
                id="input-login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome.sobrenome@visioncontrols.com.br"
                className="w-full bg-[var(--bg-input)] border border-[#2C343E] focus:border-[#F5A623]  text-xs rounded-[3px] px-3 py-2.5 outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px]  uppercase tracking-wider ">
                  Senha
                </label>
                <span className="text-[10px] ">Supabase Auth</span>
              </div>
              <input
                id="input-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[var(--bg-input)] border border-[#2C343E] focus:border-[#F5A623]  text-xs rounded-[3px] px-3 py-2.5 outline-none transition-colors "
              />
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-[3px] bg-[#F5A623] hover:bg-[#D98E1A]  font-condensed text-sm font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <span>{isLoading ? 'Autenticando...' : 'Acessar Painel IVCA'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Profiles (Field & Management Demo) */}
          <div className="mt-6 pt-5 border-t border-[#2C343E]">
            <p className="text-[10px]  uppercase tracking-wider  mb-2.5 text-center">
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
                    className="w-full p-2 rounded-[3px] bg-[var(--bg-input)] hover:bg-[#232B35] border border-[#2C343E] hover:border-[#3E4A59] text-left flex items-center justify-between transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium  group-hover: truncate">
                        {prof.nome}
                      </p>
                      <p className="text-[10px]   truncate">{prof.email}</p>
                    </div>
                    <span
                      className={`text-[9px]  px-2 py-0.5 rounded-[2px] border ${badge.badgeClass} shrink-0 ml-2`}
                    >
                      {prof.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 text-center border-t border-[#2C343E]/50">
            <p className="text-[11px] ">
              Sistema restrito Vision Controls. Usuários são provisionados pela administração.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
