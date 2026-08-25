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
    <div className="h-screen w-full flex overflow-hidden bg-[#0A0E1A] font-sans text-gray-200">
      {/* DESKTOP SIDEBAR (240px) - Flexbox 100vh sem scroll */}
      <aside className="no-print hidden md:flex w-60 border-r border-blue-500/15 bg-[#111827] flex-col shrink-0 select-none z-30 h-screen overflow-hidden">
        {/* Brand Header (Max 48px + Saudação compacta, shrink-0) */}
        <div className="px-3 py-2 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5 h-[34px]">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-mono font-bold text-white rounded-lg shadow-md shadow-blue-500/20 text-xs tracking-tight shrink-0">
              VC
            </div>
            <div className="min-w-0">
              <h1 className="text-[9px] font-semibold tracking-widest text-blue-400 leading-none uppercase">
                INTEGRAÇÃO
              </h1>
              <h2 className="text-[11px] font-bold tracking-tight text-white leading-tight uppercase truncate">
                VISION CONTROLS
              </h2>
            </div>
          </div>

          {/* User Welcome Greeting: fonte 12px, margem mínima */}
          <div className="mt-1 pt-1 border-t border-white/[0.04] flex items-center justify-between">
            <p className="text-[12px] font-medium text-gray-300 truncate">
              Bom dia, <span className="text-white font-bold">{firstName}</span> 👋
            </p>
          </div>
        </div>

        {/* Quick Action Button: Altura 32px, fonte 12px (shrink-0) */}
        {canCreateOccurrence && (
          <div className="px-2.5 py-1.5 border-b border-white/[0.06] bg-[#0A0E1A]/40 shrink-0">
            <button
              id="btn-sidebar-nova-ocorrencia"
              onClick={() => navigate('/ocorrencias/nova')}
              className="w-full h-[32px] flex items-center justify-center gap-1.5 px-2 rounded-md btn-primary-gradient text-white text-[12px] font-bold tracking-wider uppercase transition-all shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nova Ocorrência</span>
            </button>
          </div>
        )}

        {/* Navigation Sections (flex-1, overflow-hidden) */}
        <nav className="flex-1 py-1.5 overflow-hidden px-2 flex flex-col justify-between min-h-0">
          <div className="overflow-hidden">
            <div className="px-2.5 mb-1 text-[9px] font-bold text-gray-400 tracking-wider uppercase">
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
                      `h-[32px] flex items-center gap-2 px-2.5 rounded-md text-[12px] font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10 font-semibold'
                          : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[9px] font-mono text-gray-500 w-3.5">{item.num}</span>
                    <span className="truncate text-[12px]">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold leading-none animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Section: RECENTES (shrink-0, max-height 120px, overflow-hidden) */}
          <div className="pt-1.5 border-t border-white/[0.06] shrink-0 max-h-[120px] overflow-hidden">
            <button
              onClick={() => setRecentesOpen(!recentesOpen)}
              className="w-full px-2.5 mb-1 flex items-center justify-between text-[9px] font-bold text-gray-400 tracking-wider uppercase hover:text-gray-300"
            >
              <span>Recentes</span>
              {recentesOpen ? (
                <ChevronDown className="w-2.5 h-2.5 text-gray-500" />
              ) : (
                <ChevronRight className="w-2.5 h-2.5 text-gray-500" />
              )}
            </button>

            {recentesOpen && (
              <div className="space-y-1">
                {recentes.length === 0 ? (
                  <p className="px-2 py-0.5 text-[10px] text-gray-400 italic">Sem ocorrências ativas</p>
                ) : (
                  recentes.slice(0, 2).map((item) => (
                    <div
                      key={item.ocorrencia_id}
                      onClick={() => navigate(`/ocorrencias/${item.ocorrencia_id}`)}
                      className="px-2 py-1 rounded-md bg-[#0A0E1A]/40 hover:bg-blue-950/40 border border-transparent hover:border-blue-500/20 text-[11px] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                          <span className="font-mono font-semibold text-gray-200 group-hover:text-blue-400 truncate text-[11px]">
                            OS #{item.ocorrencia_numero} · TAG {item.tag}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-red-400 shrink-0 font-bold">
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
        <div className="p-2 border-t border-white/[0.06] bg-[#0A0E1A]/80 relative shrink-0">
          <button
            id="btn-user-profile-menu"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-full h-[40px] flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/[0.05] transition-all text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-600 to-purple-600 border border-blue-400/30 flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-sm">
                {user?.nome ? user.nome.charAt(0) : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{user?.nome || 'Adriano Coelho Pinto'}</p>
                <p className="text-[9px] font-mono text-blue-400 uppercase truncate leading-none">
                  {user?.role || 'ADMIN'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
          </button>

          {userDropdownOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-1.5 bg-[#111827] border border-blue-500/30 rounded-lg shadow-2xl p-1 z-50 backdrop-blur-xl">
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-gray-400 border-b border-white/[0.06] mb-0.5">
                Alternar Perfil Demo
              </div>
              {allProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    switchDemoUser(p.id);
                    setUserDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded flex items-center justify-between transition-colors ${
                    p.id === user?.id
                      ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/20'
                      : 'text-gray-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="truncate">{p.nome}</span>
                  <span className="text-[9px] font-mono text-gray-400 ml-1">{p.role}</span>
                </button>
              ))}
              <div className="border-t border-white/[0.06] mt-0.5 pt-0.5">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/10 rounded flex items-center gap-1.5 transition-colors"
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
        <header className="no-print h-12 md:hidden border-b border-white/[0.06] bg-[#111827] flex items-center justify-between px-3 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded-md bg-[#0A0E1A] border border-blue-500/20 text-gray-300"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-mono font-bold text-white rounded text-[11px]">
                VC
              </div>
              <span className="text-xs font-bold text-white tracking-tight uppercase">
                IVCA AMBEV RJ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>
        </header>

        {/* MOBILE SLIDEOUT MENU */}
        {mobileMenuOpen && (
          <div className="no-print md:hidden fixed inset-0 top-12 bg-[#0A0E1A]/95 backdrop-blur-md z-50 p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-3">
              <p className="text-[12px] font-medium text-gray-400">
                Bom dia, <span className="text-white font-bold">{firstName}</span> 👋
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
                        `flex items-center justify-between p-2.5 rounded-md text-[12px] ${
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                            : 'text-gray-300 bg-[#111827]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span className="text-[9px] font-mono text-gray-500">{item.num}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-red-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#111827] p-3 rounded-lg border border-white/[0.06] space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-white">{user?.nome}</p>
                  <p className="text-[9px] font-mono text-blue-400">{user?.role}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="px-2.5 py-1 text-[11px] text-red-400 bg-[#0A0E1A] rounded border border-red-500/30"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCROLLABLE VIEWPORT (overflow-hidden by default for 100vh fit) */}
        <main className="flex-1 overflow-hidden min-w-0 bg-[#0A0E1A] flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
