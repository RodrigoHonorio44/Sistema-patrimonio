import React from "react";
import {
  FiCalendar,
  FiLock,
  FiInfo,
  FiShield,
  FiUser,
  FiHash,
} from "react-icons/fi";

const FormUsuario = ({ dados, setDados, onSubmit, loading }) => {
  // Validação local para habilitar o botão
  const isFormValid =
    dados.nome &&
    dados.email &&
    dados.senha?.length >= 6 &&
    dados.unidade &&
    dados.cargoH &&
    dados.matricula;

  return (
    <div className="bg-white p-8 rounded-4xl shadow-xl border-2 border-slate-900 mb-8 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-slate-900 font-black uppercase text-xs flex items-center gap-2">
          <span className="w-2 h-2 bg-slate-900 rounded-full animate-pulse"></span>
          Cadastro de Funcionário (Unidade)
        </h2>
        <span className="text-[9px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter text-slate-500">
          Licenciamento SaaS Individual
        </span>
      </div>

      <form
        onSubmit={(e) => onSubmit(e, "usuario")}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        autoComplete="off"
      >
        {/* HONEYPOT ANTI-AUTOFILL */}
        <input
          style={{ display: "none" }}
          type="text"
          name="prevent_autofill_user"
        />
        <input
          style={{ display: "none" }}
          type="password"
          name="prevent_autofill_pass"
        />

        {/* NOME */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
            <FiUser size={10} /> Nome Completo
          </label>
          <input
            type="text"
            placeholder="Ex: João Silva"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-slate-900 transition-all font-bold text-sm"
            value={dados.nome}
            onChange={(e) => setDados({ ...dados, nome: e.target.value })}
          />
        </div>

        {/* EMAIL */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            E-mail Institucional
          </label>
          <input
            type="email"
            placeholder="email@empresa.com"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-slate-900 transition-all font-bold text-sm"
            value={dados.email}
            onChange={(e) => setDados({ ...dados, email: e.target.value })}
          />
        </div>

        {/* MATRÍCULA */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
            <FiHash size={10} /> Matrícula
          </label>
          <input
            type="text"
            placeholder="000000"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-slate-900 transition-all font-bold text-sm"
            value={dados.matricula}
            onChange={(e) => setDados({ ...dados, matricula: e.target.value })}
          />
        </div>

        {/* UNIDADE */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Unidade Hospitalar
          </label>
          <select
            className="p-4 bg-slate-50 rounded-2xl outline-none border-none focus:ring-2 ring-slate-900 transition-all cursor-pointer font-bold shadow-sm text-sm"
            required
            value={dados.unidade}
            onChange={(e) => setDados({ ...dados, unidade: e.target.value })}
          >
            <option value="">Selecione a Unidade...</option>
            <option value="Hospital Conde">Hospital Conde</option>
            <option value="Upa Inoã">Upa Inoã</option>
            <option value="Upa Santa Rita">Upa Santa Rita</option>
            <option value="Samu Barroco">Samu Barroco</option>
            <option value="Samu Centro">Samu Centro</option>
            <option value="Samu Ponta Negra">Samu Ponta Negra</option>
          </select>
        </div>

        {/* CARGO */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Cargo / Função
          </label>
          <select
            className="p-4 bg-slate-50 rounded-2xl outline-none border-none focus:ring-2 ring-slate-900 transition-all cursor-pointer font-bold shadow-sm text-sm"
            required
            value={dados.cargoH}
            onChange={(e) => setDados({ ...dados, cargoH: e.target.value })}
          >
            <option value="">Selecione o Cargo...</option>
            <option value="Administrativo">Administrativo</option>
            <option value="Chefia">Chefia</option>
            <option value="Diretor(a)">Diretor(a)</option>
            <option value="Enfermeiro(a)">Enfermeiro(a)</option>
            <option value="Recepcionista">Recepcionista</option>
            <option value="Supervisao">Supervisão</option>
            <option value="Tecnico(a) de Enfermagem">
              Técnico(a) de Enfermagem
            </option>
          </select>
        </div>

        {/* SENHA */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Senha Provisória (Mín. 6 chars)
          </label>
          <input
            type="password"
            placeholder="••••••••"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-slate-900 transition-all font-bold text-sm"
            value={dados.senha}
            onChange={(e) => setDados({ ...dados, senha: e.target.value })}
          />
        </div>

        {/* CONFIGURAÇÃO DE LICENÇA */}
        <div className="lg:col-span-3 bg-slate-900/5 p-6 rounded-4xl border border-dashed border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-900 uppercase ml-2 flex items-center gap-1">
              <FiCalendar /> Tempo de Licença
            </label>
            <select
              required
              className="p-4 bg-white rounded-2xl outline-none border-2 border-transparent focus:border-slate-900 transition-all font-black text-xs cursor-pointer shadow-sm"
              value={dados.prazoLicenca || "30"}
              onChange={(e) =>
                setDados({ ...dados, prazoLicenca: e.target.value })
              }
            >
              <option value="7">Trial (07 Dias)</option>
              <option value="30">Padrão (30 Dias)</option>
              <option value="90">Trimestral (90 Dias)</option>
              <option value="365">Anual (365 Dias)</option>
              <option value="9999">Vitalício</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm border border-slate-100">
              <FiShield size={22} className="text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-[10px] font-black text-slate-900 uppercase">
                Segurança SaaS Ativa
              </div>
              <p className="text-[11px] text-slate-500 leading-tight mt-1">
                Acesso limitado a <b>uma sessão por vez</b>. O login em um novo
                dispositivo derrubará os outros.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="lg:col-span-3 bg-slate-900 text-white font-black py-5 rounded-2xl uppercase text-xs tracking-[0.2em] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-100 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sincronizando...
            </div>
          ) : (
            "Salvar Funcionário e Ativar App"
          )}
        </button>
      </form>
    </div>
  );
};

export default FormUsuario;
