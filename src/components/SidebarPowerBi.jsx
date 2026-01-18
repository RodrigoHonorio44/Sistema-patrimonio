import React from "react";
import { 
  FiClipboard, 
  FiBox, 
  FiChevronLeft, 
  FiChevronRight,
  FiMessageCircle
} from "react-icons/fi";

const SidebarPowerBi = ({ abaAtiva, setAbaAtiva, aberta, setAberta }) => {
  const whatsappLink = "https://wa.me/55219XXXXXXXX"; // Link do seu suporte

  const menus = [
    { id: "os", label: "PowerBI OS", icon: <FiClipboard size={22} /> },
    { id: "censo", label: "PowerBI Censo", icon: <FiBox size={22} /> },
  ];

  return (
    <aside 
      className={`bg-[#F1F5F9] border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out relative z-50
        ${aberta ? "w-72" : "w-20"} 
        h-screen sticky top-0`} // h-screen e sticky garantem que ela ocupe a altura toda e não suba
    >
      {/* BOTÃO DE EXPANDIR/RECOLHER (FLUTUANTE) */}
      <button
        onClick={() => setAberta(!aberta)}
        className="absolute -right-3 top-28 bg-blue-600 text-white rounded-full p-1 shadow-lg hover:bg-blue-700 transition-colors z-[60]"
      >
        {aberta ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
      </button>

      {/* LOGO RODHON SYSTEM */}
      <div className="h-24 flex items-center px-6 border-b border-slate-200 bg-white overflow-hidden whitespace-nowrap flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="min-w-[40px] h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">
            R
          </div>
          {aberta && (
            <span className="text-xl font-black italic tracking-tighter">
              RODHON<span className="text-blue-600">SYSTEM</span>
            </span>
          )}
        </div>
      </div>

      {/* LINKS DE NAVEGAÇÃO */}
      <nav className="p-3 flex-1 space-y-2 mt-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {menus.map((item) => (
          <button
            key={item.id}
            onClick={() => setAbaAtiva(item.id)}
            title={!aberta ? item.label : ""}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all overflow-hidden whitespace-nowrap ${
              abaAtiva === item.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            <div className="min-w-[22px]">{item.icon}</div>
            {aberta && (
              <span className="text-[11px] font-black uppercase tracking-widest text-left">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* RODAPÉ (IGUAL AO SEU PADRÃO) */}
      <div className="p-3 border-t border-slate-200 space-y-1 bg-white/50 flex-shrink-0">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-500 hover:text-green-600 hover:bg-green-50 transition-all font-black uppercase text-[11px] tracking-widest group overflow-hidden whitespace-nowrap"
        >
          <FiMessageCircle size={22} className="min-w-[22px]" />
          {aberta && <span>Suporte Técnico</span>}
        </a>
      </div>
    </aside>
  );
};

export default SidebarPowerBi;