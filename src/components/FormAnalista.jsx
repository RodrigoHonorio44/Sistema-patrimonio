import React from "react";
import { Calendar, ShieldCheck, AlertCircle, User } from "lucide-react";

const FormAnalista = ({ dados, setDados, onSubmit, loading, requisitos }) => {
  // Validações em tempo real para os avisos
  const temSobrenome = dados.nome.trim().split(" ").length >= 2;
  const senhaValida = dados.senha.length >= 6;

  return (
    <div className="bg-white p-8 rounded-4xl shadow-xl border-2 border-blue-500 mb-8 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-blue-600 font-black uppercase text-xs flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
          Cadastro de Equipe de TI (Analista)
        </h2>
        <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">
          <ShieldCheck size={12} /> Licenciamento Ativo
        </div>
      </div>

      <form
        onSubmit={(e) => onSubmit(e, "analista")}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        autoComplete="off"
      >
        {/* TRUQUE ANTI-PREENCHIMENTO */}
        <input style={{ display: "none" }} type="text" name="fake-user" />
        <input style={{ display: "none" }} type="password" name="fake-pass" />

        {/* NOME COM AVISO DE SOBRENOME */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Nome Completo
          </label>
          <input
            type="text"
            name="nome_analista"
            autoComplete="new-password"
            placeholder="Ex: João Silva"
            required
            className={`p-4 rounded-2xl outline-none transition-all font-bold ${
              dados.nome && !temSobrenome
                ? "bg-amber-50 ring-2 ring-amber-400"
                : "bg-slate-50 focus:ring-2 ring-blue-500"
            }`}
            value={dados.nome}
            onChange={(e) => setDados({ ...dados, nome: e.target.value })}
          />
          {dados.nome && !temSobrenome && (
            <span className="text-[9px] text-amber-600 font-bold flex items-center gap-1 ml-2 mt-1">
              <AlertCircle size={10} /> Digite o nome completo (Nome e
              Sobrenome)
            </span>
          )}
        </div>

        {/* EMAIL */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            E-mail Corporativo
          </label>
          <input
            type="email"
            name="email_analista"
            autoComplete="new-password"
            placeholder="analista@email.com"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all font-bold"
            value={dados.email}
            onChange={(e) => setDados({ ...dados, email: e.target.value })}
          />
        </div>

        {/* MATRÍCULA */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Matrícula TI
          </label>
          <input
            type="text"
            placeholder="000000"
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all font-bold"
            value={dados.matricula}
            onChange={(e) => setDados({ ...dados, matricula: e.target.value })}
          />
        </div>

        {/* SENHA PROVISÓRIA COM AVISO DE TAMANHO */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Senha Provisória
          </label>
          <input
            type="password"
            name="pass_analista"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            className={`p-4 rounded-2xl outline-none transition-all font-bold ${
              dados.senha && !senhaValida
                ? "bg-red-50 ring-2 ring-red-400"
                : "bg-slate-50 focus:ring-2 ring-blue-500"
            }`}
            value={dados.senha}
            onChange={(e) => setDados({ ...dados, senha: e.target.value })}
          />
          {dados.senha && !senhaValida && (
            <span className="text-[9px] text-red-600 font-bold flex items-center gap-1 ml-2 mt-1">
              <AlertCircle size={10} /> A senha deve ter no mínimo 6 dígitos
            </span>
          )}
        </div>

        {/* CONFIGURAÇÃO DE LICENÇA */}
        <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-4xl border border-dashed border-slate-200">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-blue-600 uppercase ml-2 flex items-center gap-1">
              <Calendar size={12} /> Definir Prazo de Acesso (Licença)
            </label>
            <select
              required
              className="p-4 bg-white rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 transition-all font-bold text-sm text-slate-700 cursor-pointer shadow-sm"
              value={dados.prazoLicenca || "30"}
              onChange={(e) =>
                setDados({ ...dados, prazoLicenca: e.target.value })
              }
            >
              <option value="7">Degustação (07 Dias)</option>
              <option value="30">Mensal (30 Dias)</option>
              <option value="90">Trimestral (90 Dias)</option>
              <option value="365">Anual (365 Dias)</option>
              <option value="9999">Vitalício (Ilimitado)</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-slate-500 p-2">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                Segurança Ativada
              </p>
              <p className="text-[11px] leading-tight font-medium">
                O analista será obrigado a trocar a senha no{" "}
                <span className="text-blue-600 font-bold italic">
                  PRIMEIRO ACESSO
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          // O botão agora habilita se houver texto nos campos, permitindo que o Firebase/Submit valide
          disabled={loading || !dados.nome || !dados.email || !dados.senha}
          className="md:col-span-2 lg:col-span-4 bg-blue-600 text-white font-black py-5 rounded-2xl uppercase text-xs tracking-[0.2em] disabled:opacity-50 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading
            ? "Configurando Licença..."
            : "Finalizar Cadastro & Ativar Acesso"}
        </button>
      </form>
    </div>
  );
};

export default FormAnalista;
