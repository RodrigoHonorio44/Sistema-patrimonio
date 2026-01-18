import React, { useState, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";
import {
  FiActivity, FiLayers, FiFilter, FiCalendar, FiTrash2, 
  FiTrendingUp, FiClock
} from "react-icons/fi";

const DashboardOS = ({ chamados = [], baixas = [] }) => {
  // Estados de Filtro
  const [filtroUnidade, setFiltroUnidade] = useState("TODAS");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // --- Funções de Apoio ---
  const normalizar = useCallback((texto = "") =>
    texto?.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "", []
  );

  const getVal = useCallback((obj, term) => {
    if (!obj) return "";
    const key = Object.keys(obj).find((k) => normalizar(k).includes(normalizar(term)));
    return key ? String(obj[key] || "").trim() : "";
  }, [normalizar]);

  const parseDataComp = (dataStr) => {
    if (!dataStr || dataStr === "N/A") return null;
    try {
      const apenasData = dataStr.trim().split(/[\s,]+/)[0];
      if (apenasData.includes("/")) {
        const [d, m, a] = apenasData.split("/");
        return new Date(`${a.length === 2 ? `20${a}` : a}-${m}-${d}T12:00:00`);
      }
      return new Date(apenasData + "T12:00:00");
    } catch (e) { return null; }
  };

  // --- Lógica de Processamento ---
  const statsProcessados = useMemo(() => {
    const dInicio = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
    const dFim = dataFim ? new Date(dataFim + "T23:59:59") : null;

    const cFiltrados = (chamados || []).filter(item => {
      const u = getVal(item, "unidade");
      const matchU = filtroUnidade === "TODAS" || normalizar(u) === normalizar(filtroUnidade);
      const dObj = parseDataComp(getVal(item, "Data"));
      let matchD = true;
      if (dInicio && dObj) matchD = matchD && dObj >= dInicio;
      if (dFim && dObj) matchD = matchD && dObj <= dFim;
      return matchU && matchD;
    });

    const bFiltradas = (baixas || []).filter(item => {
      const u = getVal(item, "unidade");
      const matchU = filtroUnidade === "TODAS" || normalizar(u) === normalizar(filtroUnidade);
      const dObj = parseDataComp(getVal(item, "Data da Baixa") || getVal(item, "Data"));
      let matchD = true;
      if (dInicio && dObj) matchD = matchD && dObj >= dInicio;
      if (dFim && dObj) matchD = matchD && dObj <= dFim;
      return matchU && matchD;
    });

    const nFechados = cFiltrados.filter(c => normalizar(getVal(c, "status")).includes("FECHADO")).length;
    
    const porUnidade = cFiltrados.reduce((acc, c) => {
      const u = getVal(c, "unidade") || "N/A";
      acc[u] = (acc[u] || 0) + 1;
      return acc;
    }, {});

    const rankingBaixas = bFiltradas.reduce((acc, b) => {
      const eq = getVal(b, "equipamento") || getVal(b, "descricao") || "N/A";
      const chave = `${eq}|${getVal(b, "unidade")}`;
      acc[chave] = (acc[chave] || 0) + 1;
      return acc;
    }, {});

    return {
      total: cFiltrados.length,
      fechados: nFechados,
      abertos: cFiltrados.length - nFechados,
      baixasCount: bFiltradas.length,
      dadosGrafico: Object.keys(porUnidade).map(k => ({ name: k, total: porUnidade[k] })).sort((a,b) => b.total - a.total),
      top10: Object.entries(rankingBaixas).map(([k, v]) => ({ nome: k.split('|')[0], unidade: k.split('|')[1], total: v })).sort((a,b) => b.total - a.total).slice(0, 10)
    };
  }, [chamados, baixas, filtroUnidade, dataInicio, dataFim, getVal, normalizar]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Filtros */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2"><FiFilter /> Unidade</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" 
            value={filtroUnidade} 
            onChange={(e) => setFiltroUnidade(e.target.value)}
          >
            <option value="TODAS">TODAS AS UNIDADES</option>
            {[...new Set(chamados.map(c => getVal(c, "unidade")))].filter(Boolean).map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2"><FiCalendar /> Período</label>
          <div className="flex gap-2">
            <input type="date" className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            <input type="date" className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>
      </section>

      {/* Cards de Métricas */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total OS" value={statsProcessados.total} color="blue" icon={FiLayers} />
        <MetricCard label="Concluídos" value={statsProcessados.fechados} color="emerald" icon={FiActivity} />
        <MetricCard label="SLA Médio" value="24h 15m" color="amber" icon={FiClock} />
        <MetricCard label="Baixas" value={statsProcessados.baixasCount} color="rose" icon={FiTrash2} />
      </section>

      {/* Seção de Gráficos e Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Barras - Protegido contra erro de Width/Height */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="font-black mb-6 flex items-center gap-2 text-slate-700">
            <FiLayers className="text-blue-500" /> Chamados por Unidade
          </h3>
          <div className="flex-1 w-full min-h-[300px]">
            {statsProcessados.dadosGrafico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsProcessados.dadosGrafico} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="total" fill="#2563eb" radius={[6,6,0,0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <FiLayers size={40} className="opacity-20" />
                <p className="font-bold italic">Nenhum dado encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Ranking Top 10 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-black mb-6 flex items-center gap-2 text-slate-700">
            <FiTrendingUp className="text-amber-500" /> Top 10 Recorrência Baixas
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
            {statsProcessados.top10.length > 0 ? (
              statsProcessados.top10.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{item.nome}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-black">{item.unidade}</span>
                  </div>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg font-black text-xs min-w-[60px] text-center">
                    {item.total} un
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-10 italic font-bold">Sem baixas no período</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponente Card
const MetricCard = ({ label, value, color, icon: Icon }) => {
  const colors = { 
    blue: "bg-blue-600 shadow-blue-100", 
    emerald: "bg-emerald-600 shadow-emerald-100", 
    amber: "bg-amber-500 shadow-amber-100", 
    rose: "bg-rose-500 shadow-rose-100" 
  };
  return (
    <div className={`${colors[color]} p-6 rounded-3xl text-white shadow-xl transition-transform hover:scale-[1.02]`}>
      <div className="flex justify-between items-start mb-2 opacity-80">
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        <Icon size={18} />
      </div>
      <div className="text-3xl font-black">{value || 0}</div>
    </div>
  );
};

export default DashboardOS;