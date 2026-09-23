import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  Package,
  FileText,
  Settings2,
  PlusCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Stamp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../lib/dataStore';
import { VwAgingParadas } from '../../types/database';
import { ErrorBoundary } from '../ErrorBoundary';

export const AppLayout: React.FC = () => {
  const { user, logout, switchDemoUser, allProfiles, canManageCadastros, canCreateOccurrence } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ocorrenciasAbertas, setOcorrenciasAbertas] = useState<number>(0);
  const [recentes, setRecentes] = useState<VwAgingParadas[]>([]);
  const [recentesOpen, setRecentesOpen] = useState(true);

  useEffect(() => {
    // Conta ocorrências que não estão concluídas nem canceladas
    DataStore.getOcorrencias().then((occs) => {
      const abertas = occs.filter(
        (o) => o.status !== 'CONCLUIDA' && o.status !== 'CANCELADA'
      ).length;
      setOcorrenciasAbertas(abertas);
    });
    DataStore.getVwAgingParadas().then((aging) => {
      setRecentes(aging.slice(0, 2));
    });
  }, [location.pathname]);

  // Fecha o menu lateral ao trocar de rota
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: '/', label: 'Dashboard', short: 'Painel', num: '01', icon: LayoutDashboard, exact: true },
    { to: '/equipamentos', label: 'Equipamentos', short: 'Equip.', num: '02', icon: Cpu },
    {
      to: '/ocorrencias',
      label: 'Ocorrências',
      short: 'Ocorr.',
      num: '03',
      icon: AlertTriangle,
      badge: ocorrenciasAbertas > 0 ? `${ocorrenciasAbertas}` : undefined,
    },
    { to: '/orcamentos', label: 'Orçamentos', short: 'Orçam.', num: '04', icon: FileText },
    { to: '/ppac', label: 'PPAC', short: 'PPAC', num: '05', icon: Stamp },
    ...(canManageCadastros
      ? [{ to: '/cadastros', label: 'Cadastros', short: 'Config', num: '06', icon: Settings2 }]
      : []),
  ];

  const firstName = user?.nome ? user.nome.split(' ')[0] : 'Adriano';
  const isNovaOcorrenciaRoute = location.pathname.includes('/ocorrencias/nova');

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#F0F2F5] font-body text-[#1A1A1A]">
      {/* ============================================================
          DESKTOP SIDEBAR (240px) — inalterada
          ============================================================ */}
      <aside className="no-print hidden md:flex w-60 border-r border-[#152238] bg-[#1B2A4A] flex-col shrink-0 select-none z-30 h-screen overflow-hidden">
        <div className="px-3 py-2.5 border-b border-[#152238] shrink-0">
          <div className="flex items-center gap-2.5 h-[34px]">
            <div className="w-7 h-7 bg-[#243656] flex items-center justify-center font-display font-bold text-white rounded-lg shadow-md shadow-black/20 text-xs tracking-tight shrink-0 border border-white/10">
              VC
            </div>
            <div className="min-w-0">
              <h1 className="text-[9px] font-display font-bold tracking-widest text-[#CBD5E1] leading-none uppercase">
                INTEGRAÇÃO
              </h1>
              <h2 className="text-[11px] font-display font-extrabold tracking-tight text-white leading-tight uppercase truncate">
                VISION CONTROLS
              </h2>
            </div>
          </div>

          <div className="mt-1 pt-1 border-t border-[#152238] flex items-center justify-between">
            <p className="text-[12px] font-body font-normal text-[#94A3B8] truncate">
              Bom dia, <span className="text-white font-semibold">{firstName}</span> 👋
            </p>
          </div>
        </div>

        {canCreateOccurrence && (
          <div className="px-2.5 py-1.5 border-b border-[#152238] bg-[#152238]/80 shrink-0">
            <button
              id="btn-sidebar-nova-ocorrencia"
              onClick={() => navigate('/ocorrencias/nova')}
              className="btn-nova-ocorrencia w-full h-[32px] !py-0 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nova Ocorrência</span>
            </button>
          </div>
        )}

        <nav className="flex-1 py-1.5 overflow-hidden px-2 flex flex-col justify-between min-h-0">
          <div className="overflow-hidden">
            <div className="px-2.5 mb-1 text-[9px] font-body font-bold text-[#93C5FD] tracking-wider uppercase">
              Menu Principal
            </div>
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      `h-[32px] flex items-center gap-2 px-2.5 rounded-lg text-[13px] font-body font-medium transition-all ${
                        isActive
                          ? 'bg-[#243656] text-white border-l-[3px] border-l-[#60A5FA] shadow-sm font-semibold pl-[9px]'
                          : 'text-[#CBD5E1] hover:bg-[#1E3461] hover:text-white border-l-[3px] border-l-transparent pl-[9px]'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[9px] font-mono text-[#94A3B8] w-3.5">{item.num}</span>
                    <span className="truncate text-[12px]">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-[#DC2626] text-white px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold leading-none animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div className="pt-1.5 border-t border-[#152238] shrink-0 max-h-[120px] overflow-hidden">
            <button
              onClick={() => setRecentesOpen(!recentesOpen)}
              className="w-full px-2.5 mb-1 flex items-center justify-between text-[9px] font-body font-bold text-[#93C5FD] tracking-wider uppercase hover:text-white"
            >
              <span>Recentes</span>
              {recentesOpen ? (
                <ChevronDown className="w-2.5 h-2.5 text-[#94A3B8]" />
              ) : (
                <ChevronRight className="w-2.5 h-2.5 text-[#94A3B8]" />
              )}
            </button>

            {recentesOpen && (
              <div className="space-y-1">
                {recentes.length === 0 ? (
                  <p className="px-2 py-0.5 text-[10px] text-[#94A3B8] italic">Sem ocorrências ativas</p>
                ) : (
                  recentes.slice(0, 2).map((item) => (
                    <div
                      key={item.ocorrencia_id}
                      onClick={() => navigate(`/ocorrencias/${item.ocorrencia_id}`)}
                      className="px-2 py-1 rounded-lg bg-[#152238] hover:bg-[#1E3461] border border-[#1E3461] hover:border-[#243656] text-[11px] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F85149] shrink-0 animate-pulse" />
                          <span className="font-mono font-medium text-[#CBD5E1] group-hover:text-white truncate text-[11px]">
                            OS {item.ocorrencia_numero} · AMBEV {item.patrimonio_ref || item.tag_sap || item.tag}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#FCA5A5] shrink-0 font-bold">
                          {item.dias_parado}d
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="p-2 border-t border-[#152238] bg-[#152238]/60 relative shrink-0">
          <button
            id="btn-user-profile-menu"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-full h-[40px] flex items-center justify-between px-2 py-1 rounded-lg hover:bg-[#1E3461] transition-all text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#243656] border border-white/10 flex items-center justify-center font-display font-bold text-[11px] text-white shrink-0 shadow-sm">
                {user?.nome ? user.nome.charAt(0) : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-body font-bold text-white truncate">{user?.nome || 'Adriano Coelho Pinto'}</p>
                <p className="text-[9px] font-mono text-[#CBD5E1] uppercase truncate leading-none">
                  {user?.role || 'ADMIN'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-[#8B949E] shrink-0" />
          </button>

          {userDropdownOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-1.5 bg-[#152238] border border-[#243656] rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-xl">
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-[#93C5FD] border-b border-[#243656] mb-1">
                Alternar Perfil Demo
              </div>
              {allProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    switchDemoUser(p.id);
                    setUserDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-[11px] rounded-lg flex items-center justify-between transition-colors ${
                    p.id === user?.id
                      ? 'bg-[#243656] text-white font-bold border border-[#60A5FA]/30'
                      : 'text-[#CBD5E1] hover:bg-[#243656]'
                  }`}
                >
                  <span className="truncate">{p.nome}</span>
                  <span className="text-[9px] font-mono text-[#94A3B8] ml-1">{p.role}</span>
                </button>
              ))}
              <div className="border-t border-[#243656] mt-1 pt-1">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-2 py-1.5 text-[11px] text-[#FCA5A5] hover:bg-[#DC2626]/10 rounded-lg flex items-center gap-1.5 transition-colors font-body font-medium"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sair do sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================================
          CONTAINER PRINCIPAL
          ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* MOBILE HEADER (slim, 52px) */}
        <header className="no-print h-[52px] md:hidden border-b border-[#152238] bg-[#1B2A4A] flex items-center justify-between px-3 shrink-0 z-20 safe-top">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-10 h-10 -ml-1 rounded-lg text-white flex items-center justify-center shrink-0 active:bg-[#152238] transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="min-w-0 leading-tight">
              <span className="block text-[13px] font-display font-bold text-white tracking-tight uppercase truncate">
                IVCA AMBEV RJ
              </span>
              <span className="block text-[9px] text-[#CBD5E1] truncate">
                Integração Vision Controls
              </span>
            </div>
          </div>

          <span className="text-[9px] bg-[#3FB950]/15 text-[#3FB950] px-2 py-0.5 rounded-full border border-[#3FB950]/30 font-mono font-bold flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse" />
            ONLINE
          </span>
        </header>

        {/* VIEWPORT DE CONTEÚDO */}
        <main className="flex-1 overflow-hidden min-w-0 min-h-0 bg-[var(--bg-app)] flex flex-col">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>

      </div>

      {/* FAB — Nova Ocorrência (mobile), some na própria tela de criação */}
      {canCreateOccurrence && !isNovaOcorrenciaRoute && (
        <button
          onClick={() => navigate('/ocorrencias/nova')}
          className="fab md:hidden flex items-center justify-center"
          aria-label="Nova ocorrência"
        >
          <PlusCircle className="w-6 h-6" strokeWidth={2.2} />
        </button>
      )}

      {/* ============================================================
          DRAWER LATERAL RETRÁTIL (mobile) — navegação + perfil
          ============================================================ */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] flex"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="sheet-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <aside
            className="drawer-panel relative w-[78%] max-w-[300px] h-full bg-[#1B2A4A] border-r border-[#152238] flex flex-col safe-top"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do drawer */}
            <div className="px-4 py-3 border-b border-[#152238] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-[#243656] flex items-center justify-center font-display font-bold text-white rounded-lg text-[12px] shrink-0 border border-white/10">
                  VC
                </div>
                <div className="min-w-0 leading-tight">
                  <span className="block text-[12px] font-display font-extrabold text-white tracking-tight uppercase truncate">
                    Vision Controls
                  </span>
                  <span className="block text-[10px] text-[#CBD5E1] truncate">
                    Bom dia, {firstName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 rounded-lg bg-[#152238] border border-[#243656] text-[#CBD5E1] flex items-center justify-center shrink-0"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navegação (Dashboard oculto no mobile) */}
            <nav className="flex-1 overflow-y-auto scroll-fluido p-3 space-y-1">
              {canCreateOccurrence && (
                <button
                  onClick={() => {
                    navigate('/ocorrencias/nova');
                    setDrawerOpen(false);
                  }}
                  className="btn-nova-ocorrencia w-full h-11 mb-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nova Ocorrência</span>
                </button>
              )}

              {navItems
                .filter((item) => item.to !== '/')
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        `h-12 flex items-center gap-3 px-3 rounded-xl text-[14px] font-medium transition-colors ${
                          isActive
                            ? 'bg-[#243656] text-white font-semibold border-l-[3px] border-l-[#60A5FA]'
                            : 'text-[#CBD5E1] active:bg-[#1E3461]'
                        }`
                      }
                    >
                      <Icon className="w-[20px] h-[20px] shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="bg-[#DC2626] text-white px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
            </nav>

            {/* Rodapé: perfil, troca de usuário e sair */}
            <div className="border-t border-[#152238] p-3 shrink-0 safe-bottom">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl active:bg-[#161B22] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#243656] flex items-center justify-center font-display font-bold text-[15px] text-white shrink-0 border border-white/10">
                  {user?.nome ? user.nome.charAt(0) : 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-display font-bold text-white truncate">{user?.nome || 'Adriano Coelho Pinto'}</p>
                  <p className="text-[10px] font-mono text-[#CBD5E1] uppercase">{user?.role || 'ADMIN'}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#CBD5E1] shrink-0 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {userDropdownOpen && (
                <div className="mt-2 space-y-1">
                  <p className="px-2 text-[9px] font-mono uppercase tracking-wider text-[#93C5FD] mb-1">
                    Alternar Perfil Demo
                  </p>
                  {allProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchDemoUser(p.id);
                        setUserDropdownOpen(false);
                        setDrawerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-[13px] rounded-lg flex items-center justify-between transition-colors ${
                        p.id === user?.id
                          ? 'bg-[#243656] text-white font-bold border border-[#60A5FA]/30'
                          : 'text-[#CBD5E1] active:bg-[#1E3461]'
                      }`}
                    >
                      <span className="truncate">{p.nome}</span>
                      <span className="text-[10px] font-mono text-[#94A3B8] ml-2 shrink-0">{p.role}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  logout();
                  setDrawerOpen(false);
                  navigate('/login');
                }}
                className="w-full mt-2 px-3 py-2.5 text-[13px] font-semibold text-[#FCA5A5] bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-xl flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do sistema</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
