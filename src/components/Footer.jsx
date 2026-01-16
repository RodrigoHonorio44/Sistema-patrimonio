import React from "react";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  // Pegamos o ano atual automaticamente
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="mt-auto py-8 flex flex-col items-center justify-center gap-2">
      {/* Elemento Visual de Divisão */}
      <div className="flex items-center gap-2 text-slate-300 mb-2">
        <div className="h-px w-12 bg-slate-200"></div>
        <ShieldCheck size={16} className="text-blue-500/50" />
        <div className="h-px w-12 bg-slate-200"></div>
      </div>

      {/* Texto de Copyright */}
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] text-center px-4">
        &copy; {anoAtual} <span className="text-slate-500">Rodhon System</span>
        <span className="mx-2">|</span>
        Unidade Maricá
      </p>

      {/* Tag de Tecnologia (opcional) */}
      <p className="text-[7px] font-black text-blue-400 uppercase tracking-[0.5em] mt-1">
        Technology Solutions
      </p>
    </footer>
  );
}
