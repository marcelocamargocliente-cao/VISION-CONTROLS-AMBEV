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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../lib/dataStore';
import { VwAgingParadas } from '../../types/database';

export const AppLayout: React.FC = () => {
  const { user, logout, switchDemoUser, allProfiles, canManageCadastros, canCreateOccurrence } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [paradosCount, setParadosCount] = useState<number>(2);
  const [recentes, setRecentes] = useState<VwAgingParadas[]>([]);
  const [recentesOpen, setRecentesOpen] = useState(true);

  useEffect(() => {
    DataStore.getVwKpis().then((k) => {
      setParadosCount(k.parados);
    });
    DataStore.getVwAgingParadas().then((aging) => {
      setRecentes(aging.slice(0, 2)); // Máximo 2 itens
    });
  }, [location.pathname]);

  const navItems = [
    { to: '/', label: 'Dashboard', num: '01', icon: LayoutDashboard, exact: true },
    { to: '/equipamentos', label: 'Equipamentos', num: '02', icon: Cpu },
    {
      to: '/ocorrencias',
      label: 'Ocorrências',
      num: '03',
      icon: AlertTriangle,
      badge: paradosCount > 0 ? `${paradosCount}` : undefined,
    },
    { to: '/pecas-pendentes', label: 'Peças', num: '04', icon: Package },
    { to: '/orcamentos', label: 'Orçamentos', num: '05', icon: FileText },
    ...(canManageCadastros
      ? [{ to: '/cadastros', label: 'Cadastros', num: '06', icon: Settings2 }]
      : []),
  ];

  const firstName = user?.nome ? user.nome.split(' ')[0] : 'Adriano';

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#0D1117] font-body text-[#E6EDF3]">
      {/* DESKTOP SIDEBAR (240px) - Flexbox 100vh sem scroll */}
      <aside className="no-print hidden md:flex w-60 border-r border-[#30363D] bg-[#0D1117] flex-col shrink-0 select-none z-30 h-screen overflow-hidden">
        {/* Brand Header (Max 48px + Saudação compacta, shrink-0) */}
        <div className="px-3 py-2.5 border-b border-[#30363D] shrink-0">
          <div className="flex items-center gap-2.5 h-[34px]">
            <div className="w-7 h-7 bg-gradient-to-br from-[#2F81F7] to-[#58A6FF] flex items-center justify-center font-display font-bold text-white rounded-lg shadow-md shadow-[#2F81F7]/25 text-xs tracking-tight shrink-0">
              VC
            </div>
            <div className="min-w-0">
              <h1 className="text-[9px] font-display font-bold tracking-widest text-[#58A6FF] leading-none uppercase">
                INTEGRAÇÃO
              </h1>
              <h2 className="text-[11px] font-display font-extrabold tracking-tight text-[#E6EDF3] leading-tight uppercase truncate">
                VISION CONTROLS
              </h2>
            </div>
          </div>

          {/* User Welcome Greeting: fonte 12px, margem mínima */}
          <div className="mt-1 pt-1 border-t border-[#30363D]/60 flex items-center justify-between">
            <p className="text-[12px] font-body font-normal text-[#8B949E] truncate">
              Bom dia, <span className="text-[#E6EDF3] font-semibold">{firstName}</span> 👋
            </p>
          </div>
        </div>

        {/* Quick Action Button: Altura 32px, fonte 12px (shrink-0) */}
        {canCreateOccurrence && (
          <div className="px-2.5 py-1.5 border-b border-[#30363D] bg-[#161B22]/60 shrink-0">
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

        {/* Navigation Sections (flex-1, overflow-hidden) */}
        <nav className="flex-1 py-1.5 overflow-hidden px-2 flex flex-col justify-between min-h-0">
          <div className="overflow-hidden">
            <div className="px-2.5 mb-1 text-[9px] font-body font-bold text-[#8B949E] tracking-wider uppercase">
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
                          ? 'bg-[#2F81F7]/15 text-[#58A6FF] border border-[#2F81F7]/30 shadow-sm shadow-[#2F81F7]/10 font-semibold'
                          : 'text-[#8B949E] hover:bg-[#161B22] hover:text-[#E6EDF3]'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[9px] font-mono text-[#8B949E] w-3.5">{item.num}</span>
                    <span className="truncate text-[12px]">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-[#F85149] text-white px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold leading-none animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Section: RECENTES (shrink-0, max-height 120px, overflow-hidden) */}
          <div className="pt-1.5 border-t border-[#30363D] shrink-0 max-h-[120px] overflow-hidden">
            <button
              onClick={() => setRecentesOpen(!recentesOpen)}
              className="w-full px-2.5 mb-1 flex items-center justify-between text-[9px] font-body font-bold text-[#8B949E] tracking-wider uppercase hover:text-[#E6EDF3]"
            >
              <span>Recentes</span>
              {recentesOpen ? (
                <ChevronDown className="w-2.5 h-2.5 text-[#8B949E]" />
              ) : (
                <ChevronRight className="w-2.5 h-2.5 text-[#8B949E]" />
              )}
            </button>

            {recentesOpen && (
              <div className="space-y-1">
                {recentes.length === 0 ? (
                  <p className="px-2 py-0.5 text-[10px] text-[#8B949E] italic">Sem ocorrências ativas</p>
                ) : (
                  recentes.slice(0, 2).map((item) => (
                    <div
                      key={item.ocorrencia_id}
                      onClick={() => navigate(`/ocorrencias/${item.ocorrencia_id}`)}
                      className="px-2 py-1 rounded-lg bg-[#161B22] hover:bg-[#1C2128] border border-[#30363D]/60 hover:border-[#2F81F7]/40 text-[11px] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F85149] shrink-0 animate-pulse" />
                          <span className="font-mono font-medium text-[#E6EDF3] group-hover:text-[#58A6FF] truncate text-[11px]">
                            OS #{item.ocorrencia_numero} · TAG {item.tag}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#F85149] shrink-0 font-bold">
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

        {/* User Profile Footer (shrink-0): Altura ~40px, sempre visível no rodapé da sidebar */}
        <div className="p-2 border-t border-[#30363D] bg-[#161B22]/40 relative shrink-0">
          <button
            id="btn-user-profile-menu"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-full h-[40px] flex items-center justify-between px-2 py-1 rounded-lg hover:bg-[#161B22] transition-all text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2F81F7] to-[#58A6FF] border border-[#2F81F7]/30 flex items-center justify-center font-display font-bold text-[11px] text-white shrink-0 shadow-sm">
                {user?.nome ? user.nome.charAt(0) : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-body font-bold text-[#E6EDF3] truncate">{user?.nome || 'Adriano Coelho Pinto'}</p>
                <p className="text-[9px] font-mono text-[#58A6FF] uppercase truncate leading-none">
                  {user?.role || 'ADMIN'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-[#8B949E] shrink-0" />
          </button>

          {userDropdownOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-1.5 bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-xl">
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-[#8B949E] border-b border-[#30363D] mb-1">
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
                      ? 'bg-[#2F81F7]/20 text-[#58A6FF] font-bold border border-[#2F81F7]/30'
                      : 'text-[#E6EDF3] hover:bg-[#21262D]'
                  }`}
                >
                  <span className="truncate">{p.nome}</span>
                  <span className="text-[9px] font-mono text-[#8B949E] ml-1">{p.role}</span>
                </button>
              ))}
              <div className="border-t border-[#30363D] mt-1 pt-1">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-2 py-1.5 text-[11px] text-[#F85149] hover:bg-[#F85149]/10 rounded-lg flex items-center gap-1.5 transition-colors font-body font-medium"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sair do sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* MOBILE HEADER */}
        <header className="no-print h-12 md:hidden border-b border-[#30363D] bg-[#161B22] flex items-center justify-between px-3 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded-lg bg-[#0D1117] border border-[#30363D] text-[#8B949E]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-gradient-to-br from-[#2F81F7] to-[#58A6FF] flex items-center justify-center font-display font-bold text-white rounded-md text-[11px]">
                VC
              </div>
              <span className="text-xs font-display font-bold text-[#E6EDF3] tracking-tight uppercase">
                IVCA AMBEV RJ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-[#3FB950]/15 text-[#3FB950] px-2 py-0.5 rounded-full border border-[#3FB950]/30 font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse" />
              ONLINE
            </span>
          </div>
        </header>

        {/* MOBILE SLIDEOUT MENU */}
        {mobileMenuOpen && (
          <div className="no-print md:hidden fixed inset-0 top-12 bg-[#0D1117]/95 backdrop-blur-md z-50 p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-3">
              <p className="text-[12px] font-body font-medium text-[#8B949E]">
                Bom dia, <span className="text-[#E6EDF3] font-bold">{firstName}</span> 👋
              </p>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between p-2.5 rounded-lg text-[12px] font-body ${
                          isActive
                            ? 'bg-[#2F81F7]/20 text-[#58A6FF] font-bold border border-[#2F81F7]/30'
                            : 'text-[#E6EDF3] bg-[#161B22]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span className="text-[9px] font-mono text-[#8B949E]">{item.num}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#F85149] text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#161B22] p-3 rounded-xl border border-[#30363D] space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-display font-bold text-[#E6EDF3]">{user?.nome}</p>
                  <p className="text-[9px] font-mono text-[#58A6FF]">{user?.role}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="px-2.5 py-1 text-[11px] text-[#F85149] bg-[#0D1117] rounded-lg border border-[#F85149]/30"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCROLLABLE VIEWPORT (overflow-hidden by default for 100vh fit) */}
        <main className="flex-1 overflow-hidden min-w-0 bg-[#0D1117] flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
