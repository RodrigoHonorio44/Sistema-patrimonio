import React from "react";
import { Clock, RefreshCw, MessageCircle, LogOut } from "lucide-react";
import { auth } from "../api/Firebase";
import { useNavigate } from "react-router-dom";

export default function LicencaExpirada() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-amber-100 border border-amber-50 flex flex-col items-center">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-8 animate-bounce">
            <Clock size={48} className="text-amber-500" />
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-4">
            Licença <span className="text-amber-500">Expirada</span>
          </h1>

          <p className="text-slate-500 font-medium leading-relaxed mb-8">
            O prazo de validade do seu plano{" "}
            <span className="font-bold text-amber-600">chegou ao fim</span>.
            Para continuar acessando seus dados, realize a renovação.
          </p>

          <div className="w-full space-y-3">
            <a
              href="https://wa.me/55219XXXXXXXX?text=Olá, minha licença no Rodhon System expirou e gostaria de renovar."
              target="_blank"
              rel="noreferrer"
              className="w-full bg-amber-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
            >
              <RefreshCw size={18} /> Renovar Agora
            </a>

            <button
              onClick={handleLogout}
              className="w-full bg-white text-slate-400 font-black py-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all"
            >
              <LogOut size={18} /> Sair
            </button>
          </div>
        </div>
        <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">
          Rodhon System | Billing Dept
        </p>
      </div>
    </div>
  );
}
