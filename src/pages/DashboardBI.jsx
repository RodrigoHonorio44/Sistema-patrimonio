import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import { FiRefreshCw, FiBarChart2 } from "react-icons/fi";

// Importação dos seus novos componentes
import SidebarPowerBi from "../components/SidebarPowerBi";
import DashboardOS from "../components/DashboardOS";
import DashboardCenso from "../components/DashboardCenso";

const DashboardBI = () => {
  // Controle de Navegação e UI
  const [abaAtiva, setAbaAtiva] = useState("os"); // 'os' ou 'censo'
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [loading, setLoading] = useState(true);

  // Estados de Dados Brutos
  const [dadosGeral, setDadosGeral] = useState({
    chamados: [],
    baixas: [],
    inventario: []
  });

  // IDs das Planilhas (Verifique se o GID do Censo está correto)
  const ID_DOC = "1L-TNSA0e-YAjzK_HU_vWGAJFZVqk6t2L3lIQeEDPcMI";
  const PROXY = "https://api.allorigins.win/raw?url=";
  const BASE_CSV = `https://docs.google.com/spreadsheets/d/${ID_DOC}/export?format=csv`;

  const LINKS = {
    CHAMADOS: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=0")}`,
    BAIXADOS: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=416525153")}`,
    // Certifique-se de que este GID é o da aba do seu CENSO/INVENTÁRIO
    INVENTARIO: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=123456789")}`, 
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const respostas = await Promise.all(
        Object.values(LINKS).map((url) => fetch(url).then((r) => r.text()))
      );
      
      const datasets = respostas.map(
        (csv) => Papa.parse(csv, { header: true, skipEmptyLines: "greedy" }).data
      );

      setDadosGeral({
        chamados: datasets[0],
        baixas: datasets[1],
        inventario: datasets[2],
      });
    } catch (e) {
      console.error("Erro ao carregar Sheets:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <FiRefreshCw className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-slate-600 font-bold">Sincronizando BI Maricá...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* 1. Barra Lateral */}
      <SidebarPowerBi 
        abaAtiva={abaAtiva} 
        setAbaAtiva={setAbaAtiva} 
        aberta={sidebarAberta} 
        setAberta={setSidebarAberta} 
      />

      {/* 2. Conteúdo Principal */}
      <main className={`flex-1 transition-all duration-300 p-4 md:p-8 ${sidebarAberta ? "ml-64" : "ml-20"}`}>
        
        {/* Header Superior Interno */}
        <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FiBarChart2 className="text-blue-600" /> 
            {abaAtiva === 'os' ? 'Analytics de Chamados' : 'Censo Patrimonial'}
          </h1>
          <button onClick={carregarDados} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <FiRefreshCw className="text-slate-500" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto">
          {abaAtiva === "os" ? (
            <DashboardOS 
                chamados={dadosGeral.chamados} 
                baixas={dadosGeral.baixas} 
            />
          ) : (
            <DashboardCenso 
                inventario={dadosGeral.inventario} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardBI;
