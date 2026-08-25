import React, { useState, useEffect } from 'react';
import { Users, X, Check, AlertCircle, Shield, KeyRound, Phone, Briefcase, Building } from 'lucide-react';
import { Profile, UserRole } from '../../types/database';
import { DataStore } from '../../lib/dataStore';

interface ColaboradorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: Profile) => void;
  profileToEdit?: Profile | null;
}

export const ColaboradorModal: React.FC<ColaboradorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  profileToEdit,
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('Vision@2026');
  const [cargo, setCargo] = useState('');
  const [role, setRole] = useState<UserRole>('TECNICO');
  const [empresa, setEmpresa] = useState('VISION CONTROLS');
  const [telefone, setTelefone] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profileToEdit) {
      setNome(profileToEdit.nome || '');
      setEmail(profileToEdit.email || '');
      setCargo(profileToEdit.cargo || '');
      setRole(profileToEdit.role || 'TECNICO');
      setEmpresa(profileToEdit.empresa || 'VISION CONTROLS');
      setTelefone(profileToEdit.telefone || '');
      setAtivo(profileToEdit.ativo !== false);
    } else {
      setNome('');
      setEmail('');
      setSenha('Vision@2026');
      setCargo('');
      setRole('TECNICO');
      setEmpresa('VISION CONTROLS');
      setTelefone('');
      setAtivo(true);
    }
    setError(null);
  }, [profileToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('O nome completo é obrigatório.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail corporativo válido.');
      return;
    }
    if (!profileToEdit && (!senha || senha.length < 6)) {
      setError('A senha provisória deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (profileToEdit) {
        // Edit existing
        const updated = await DataStore.saveProfile({
          id: profileToEdit.id,
          nome: nome.trim(),
          cargo: cargo.trim() || undefined,
          role,
          empresa: empresa.trim() || 'VISION CONTROLS',
          telefone: telefone.trim() || undefined,
          ativo,
        });
        setIsSubmitting(false);
        onSuccess(updated);
        onClose();
      } else {
        // Create new via Edge Function / DataStore
        const res = await DataStore.createColaborador({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          senha: senha.trim(),
          cargo: cargo.trim() || undefined,
          role,
          empresa: empresa.trim() || 'VISION CONTROLS',
          telefone: telefone.trim() || undefined,
          ativo,
        });

        if (!res.success || !res.profile) {
          throw new Error(res.error || 'Não foi possível cadastrar o usuário');
        }

        setIsSubmitting(false);
        onSuccess(res.profile);
        onClose();
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Erro ao processar cadastro do usuário.');
    }
  };

  return (
    <div
      id="modal-colaborador-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-colaborador-content"
        className="w-full max-w-xl bg-[#1C222A] border border-[#2C343E] rounded-[6px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2C343E] bg-[#14181D]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-condensed font-bold uppercase tracking-wider text-[#ECEFF1]">
                {profileToEdit ? 'Editar Colaborador / Usuário' : 'Novo Colaborador — Equipe Vision'}
              </h3>
              <p className="text-[11px] font-mono text-[#94A3B8]">
                Controle de Acesso e Permissões (RBAC)
              </p>
            </div>
          </div>
          <button
            id="btn-close-colaborador-modal"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#ECEFF1] p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-[#E5484D]/10 border border-[#E5484D]/40 rounded-[4px] flex items-center gap-2 text-xs text-[#FF6B6B]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome Completo */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
              Nome Completo <span className="text-[#E5484D]">*</span>
            </label>
            <input
              id="input-colab-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Alan Silva"
              required
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* E-mail */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                E-mail Corporativo <span className="text-[#E5484D]">*</span>
              </label>
              <input
                id="input-colab-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!profileToEdit}
                placeholder="nome@visioncontrols.com.br"
                required
                className={`w-full bg-[#14181D] border border-[#2C343E] text-xs rounded-[3px] px-3 py-2 outline-none transition-colors ${
                  profileToEdit
                    ? 'text-[#6B7683] bg-[#0E1217] cursor-not-allowed border-dashed'
                    : 'text-[#ECEFF1] focus:border-[#F5A623]'
                }`}
              />
              {profileToEdit && (
                <span className="text-[10px] text-[#6B7683] mt-0.5 block">
                  E-mail de autenticação gerenciado pelo Supabase Auth.
                </span>
              )}
            </div>

            {/* Senha provisória (apenas criação) */}
            {!profileToEdit ? (
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                  Senha Provisória <span className="text-[#E5484D]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-colab-senha"
                    type="text"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Vision@2026"
                    required
                    minLength={6}
                    className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs font-mono rounded-[3px] px-3 py-2 outline-none transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                  Status da Conta
                </label>
                <div className="flex items-center gap-3 pt-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="input-colab-ativo"
                      type="checkbox"
                      checked={ativo}
                      onChange={(e) => setAtivo(e.target.checked)}
                      className="accent-[#2ECC71] w-4 h-4 rounded"
                    />
                    <span className={`text-xs font-mono font-bold ${ativo ? 'text-[#2ECC71]' : 'text-[#6B7683]'}`}>
                      {ativo ? 'USUÁRIO ATIVO' : 'INATIVO / DESATIVADO'}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cargo / Função Real */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                Cargo / Ocupação
              </label>
              <input
                id="input-colab-cargo"
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Técnico de Campo Climatização"
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2 outline-none transition-colors"
              />
            </div>

            {/* Perfil no Sistema (Role) */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                Perfil de Acesso (RBAC) <span className="text-[#E5484D]">*</span>
              </label>
              <select
                id="select-colab-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                required
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2 outline-none transition-colors font-mono"
              >
                <option value="ADMIN">ADMIN (Adriano — Acesso Total)</option>
                <option value="GESTOR">GESTOR (Luiz — Gerência & Processos)</option>
                <option value="ENCARREGADO">ENCARREGADO (Arthur — Campo & Supervisão)</option>
                <option value="TECNICO">TECNICO (Alan — Apontamento em Campo)</option>
                <option value="VISUALIZADOR">VISUALIZADOR (AMBEV — Consulta/Auditoria)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Empresa */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                Empresa <span className="text-[#E5484D]">*</span>
              </label>
              <input
                id="input-colab-empresa"
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="VISION CONTROLS"
                required
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2 outline-none transition-colors"
              />
            </div>

            {/* Telefone / WhatsApp */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                WhatsApp / Telefone
              </label>
              <input
                id="input-colab-telefone"
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="+55 21 98888-7777"
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs font-mono rounded-[3px] px-3 py-2 outline-none transition-colors"
              />
            </div>
          </div>

          {!profileToEdit && (
            <div className="p-3 bg-[#14181D] border border-[#2C343E] rounded-[4px] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#ECEFF1] block">Usuário Ativo de Imediato</span>
                <span className="text-[11px] text-[#94A3B8]">Habilita login e apontamentos no sistema</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="checkbox-novo-colab-ativo"
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#2C343E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2ECC71]"></div>
              </label>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2C343E]">
            <button
              id="btn-cancel-colab"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono font-semibold text-[#94A3B8] hover:text-[#ECEFF1] bg-[#14181D] hover:bg-[#232B35] border border-[#2C343E] rounded-[3px] transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-colab"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-black bg-[#38BDF8] hover:bg-[#7DD3FC] rounded-[3px] transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Salvando...'
                  : profileToEdit
                  ? 'Atualizar Colaborador'
                  : 'Criar Colaborador'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
