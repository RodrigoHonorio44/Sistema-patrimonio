import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FiLayers, 
  FiLogOut, 
  FiMessageCircle, 
  FiPieChart, 
  FiChevronLeft, 
  FiChevronRight 
} from "react-icons/fi";

export default function Sidebar({ userData, handleLogout }) {
  const [isExpanded, setIsExpanded] = useState(true); // Estado para expandir/recolher
  const location = useLocation();
  const whatsappLink = "https://wa.me/55219XXXXXXXX";

  const isActive = (path) => location.pathname === path;

  return (
    <aside 
      className={`bg-[#F1F5F9] border-r border-slate-200 flex flex-col h-full transition-all duration-300 ease-in-out relative ${
        isExpanded ? "w-72" : "w-20"
      }`}
    >
      {/* BOTÃO DE EXPANDIR/RECOLHER (FLUTUANTE) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-28 bg-blue-600 text-white rounded-full p-1 shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        {isExpanded ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
      </button>

      {/* LOGO */}
      <div className="h-24 flex items-center px-6 border-b border-slate-200 bg-white overflow-hidden whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="min-w-[40px] h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">
            R
          </div>
          {isExpanded && (
            <span className="text-xl font-black italic tracking-tighter">
              RODHON<span className="text-blue-600">SYSTEM</span>
            </span>
          )}
        </div>
      </div>

      {/* LINKS DE NAVEGAÇÃO */}
      <nav className="p-3 flex-1 space-y-2 overflow-y-auto overflow-x-hidden">
        <SidebarLink 
          to="/gestao-chefia" 
          icon={<FiLayers size={22} />} 
          label="Início" 
          active={isActive("/gestao-chefia")} 
          isExpanded={isExpanded}
        />

        {(userData?.role === "analista" || userData?.role === "admin") && (
          <SidebarLink 
            to="/dashboard" 
            icon={<FiPieChart size={22} />} 
            label="Painel Técnico" 
            active={isActive("/dashboard")} 
            isExpanded={isExpanded}
          />
        )}
      </nav>

      {/* RODAPÉ: SUPORTE + SAIR */}
      <div className="p-3 border-t border-slate-200 space-y-1 bg-white/50">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          title="Suporte Técnico"
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-500 hover:text-green-600 hover:bg-green-50 transition-all font-black uppercase text-[11px] tracking-widest group overflow-hidden whitespace-nowrap"
        >
          <FiMessageCircle size={22} className="min-w-[22px] group-hover:rotate-12 transition-transform" />
          {isExpanded && <span>Suporte Técnico</span>}
        </a>

        <button
          onClick={handleLogout}
          title="Sair do Sistema"
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black uppercase text-[11px] tracking-widest overflow-hidden whitespace-nowrap"
        >
          <FiLogOut size={22} className="min-w-[22px]" />
          {isExpanded && <span>Sair do Sistema</span>}
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ to, icon, label, active, isExpanded }) {
  return (
    <Link
      to={to}
      title={!isExpanded ? label : ""}
      className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all overflow-hidden whitespace-nowrap ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
          : "text-slate-500 hover:bg-slate-200"
      }`}
    >
      <div className="min-w-[22px]">{icon}</div>
      {isExpanded && (
        <span className="text-[11px] font-black uppercase tracking-widest">
          {label}
        </span>
      )}
    </Link>
  );
}