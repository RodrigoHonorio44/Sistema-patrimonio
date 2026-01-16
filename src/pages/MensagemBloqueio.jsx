import React from "react";
import { LogOut, MessageCircle, ShieldAlert } from "lucide-react";
import { auth } from "../api/Firebase";
import { signOut } from "firebase/auth";

export default function MensagemBloqueio() {
  const handleLogout = async () => {
    try {
      // 1. Limpa absolutamente todas as travas do navegador
      sessionStorage.clear();

      // 2. Desloga do Firebase
      await signOut(auth);

      // 3. FORÇA o redirecionamento recarregando a página do zero
      // Isso reseta o App.js e garante que ele não te jogue de volta pra cá
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro ao deslogar:", error);
      sessionStorage.clear();
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans antialiased">
      <div className="max-w-md w-full text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-red-100 border border-red-50 flex flex-col items-center relative overflow-hidden">
          {/* Detalhe estético de fundo */}
          <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>

          {/* Ícone de Alerta Crítico */}
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 animate-pulse shadow-inner">
            <ShieldAlert size={48} className="text-red-600" />
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-4">
            Acesso <span className="text-red-600">Suspenso</span>
          </h1>

          <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl mb-8">
            <p className="text-red-800 text-sm font-black leading-relaxed">
              Sua conta foi desativada manualmente pelo administrador do Rodhon
              System.
            </p>
          </div>

          <p className="text-slate-500 font-medium leading-relaxed mb-8 text-sm">
            Se houve um equívoco ou se você precisa solicitar a reativação das
            suas credenciais, entre em contato com o suporte de TI agora.
          </p>

          <div className="w-full space-y-3">
            {/* Link direto para o WhatsApp */}
            <a
              href="https://wa.me/55219XXXXXXXX?text=Olá, meu acesso ao Rodhon System foi suspenso e gostaria de verificar o motivo."
              target="_blank"
              rel="noreferrer"
              className="w-full bg-red-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
            >
              <MessageCircle size={18} /> Contatar Suporte
            </a>

            <button
              onClick={handleLogout}
              className="w-full bg-white text-slate-400 font-black py-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
            >
              <LogOut size={18} /> Voltar para o Login
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">
            Rodhon System | Security Layer
          </p>
          <div className="px-3 py-1 bg-slate-200 rounded-full text-[8px] font-black text-slate-500 uppercase">
            Status: Restrito
          </div>
        </div>
      </div>
    </div>
  );
}
