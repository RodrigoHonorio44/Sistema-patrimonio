import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import {
  FiRefreshCw, FiArrowLeft, FiLayers, FiFilter,
  FiCalendar, FiTrash2, FiTrendingUp, FiPrinter, 
  FiBox, FiAlertCircle, FiChevronLeft, FiChevronRight
} from "react-icons/fi";

const DashboardCenso = () => {
  const navigate = useNavigate();

  // Estados de Dados
  const [stats, setStats] = useState({ total: 0, comPatrimonio: 0, semPatrimonio: 0, baixas: 0 });
  const [dadosSetores, setDadosSetores] = useState([]);
  const [dadosEvolucao, setDadosEvolucao] = useState([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);
  const [dadosBrutos, setDadosBrutos] = useState({ chamados: [], baixas: [] });

  // Estados de Filtro/UI
  const [filtroUnidade, setFiltroUnidade] = useState("TODAS");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [loading, setLoading] = useState(true);
  
  // CONFIGURAÇÃO DE PAGINAÇÃO (12 ITENS)
  const [paginaAtual, setPaginaAtual] = useState(0);
  const itensPorPagina = 12;

  const ID_INVENTARIO = "1VWkt-HDH6x0rXsE78w8ZWrz6QxwIVy-_gkK8-zVFzFo";
  const PROXY = "https://api.allorigins.win/raw?url=";
  const getUrl = (id, gid) => `${PROXY}${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`)}`;

  const LINKS = {
    HOSPITAL_CONDE: getUrl(ID_INVENTARIO, "0"),
    UPA_SANTA_RITA: getUrl(ID_INVENTARIO, "1920265440"),
    UPA_INOA: getUrl(ID_INVENTARIO, "1626713854"),
    SAMU_BARROCO: getUrl(ID_INVENTARIO, "985330834"),
    SAMU_PONTA_NEGRA: getUrl(ID_INVENTARIO, "1841621110"),
    SAMU_CENTRO: getUrl(ID_INVENTARIO, "1453482975"),
    BAIXADOS: getUrl(ID_INVENTARIO, "416525153"),
  };

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
        return new Date(`${a.length === 2 ? '20'+a : a}-${m}-${d}T12:00:00`);
      }
      return new Date(apenasData + "T12:00:00");
    } catch (e) { return null; }
  };

  const censoPatrimonio = useMemo(() => {
    const contagem = dadosBrutos.chamados
      .filter(c => filtroUnidade === "TODAS" || normalizar(c.unidade) === normalizar(filtroUnidade))
      .reduce((acc, curr) => {
        const eq = getVal(curr, "Equipamento") || "OUTROS";
        acc[eq] = (acc[eq] || 0) + 1;
        return acc;
      }, {});
    
    return Object.entries(contagem)
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [dadosBrutos.chamados, filtroUnidade, getVal, normalizar]);

  const totalPaginas = Math.ceil(censoPatrimonio.length / itensPorPagina);
  const equipamentosExibidos = useMemo(() => {
    return censoPatrimonio.slice(paginaAtual * itensPorPagina, (paginaAtual + 1) * itensPorPagina);
  }, [censoPatrimonio, paginaAtual]);

  const processarDados = useCallback((chamados, baixados, unidadeFiltro, inicio, fim) => {
    const dInicio = inicio ? new Date(inicio + "T00:00:00") : null;
    const dFim = fim ? new Date(fim + "T23:59:59") : null;

    const filtrados = chamados.filter((item) => {
      const matchUnidade = unidadeFiltro === "TODAS" || normalizar(item.unidade) === normalizar(unidadeFiltro);
      const dObj = parseDataComp(getVal(item, "Data"));
      let matchData = true;
      if (dInicio && dObj) matchData = matchData && dObj >= dInicio;
      if (dFim && dObj) matchData = matchData && dObj <= dFim;
      return matchUnidade && matchData;
    });

    const baixasFiltradas = baixados.filter((item) => {
      const matchUnidade = unidadeFiltro === "TODAS" || normalizar(item.unidade) === normalizar(unidadeFiltro);
      const dObj = parseDataComp(getVal(item, "Data da Baixa") || getVal(item, "Data"));
      let matchData = true;
      if (dInicio && dObj) matchData = matchData && dObj >= dInicio;
      if (dFim && dObj) matchData = matchData && dObj <= dFim;
      return matchUnidade && matchData;
    });

    let comPat = 0; let semPat = 0;
    filtrados.forEach(item => {
      const p = getVal(item, "Patrimonio").toUpperCase();
      if (p === "" || p.includes("SP") || p.includes("S/P")) semPat++;
      else if (!isNaN(p.replace(/\D/g, "")) && p.length > 0) comPat++;
      else semPat++;
    });

    setStats({ total: filtrados.length, comPatrimonio: comPat, semPatrimonio: semPat, baixas: baixasFiltradas.length });

    const porUnidade = filtrados.reduce((acc, c) => {
      const u = c.unidade || "N/A";
      acc[u] = (acc[u] || 0) + 1;
      return acc;
    }, {});
    setDadosSetores(Object.keys(porUnidade).map(k => ({ name: k, total: porUnidade[k] })).sort((a,b) => b.total - a.total));

    const porDia = filtrados.reduce((acc, c) => {
      const dStr = getVal(c, "Data").split(/[\s,]+/)[0];
      if (dStr && dStr !== "N/A") acc[dStr] = (acc[dStr] || 0) + 1;
      return acc;
    }, {});
    setDadosEvolucao(Object.keys(porDia).map(k => ({ data: k, dataObj: parseDataComp(k), qtd: porDia[k] })).sort((a,b) => a.dataObj - b.dataObj).slice(-15));
    
    setPaginaAtual(0);
  }, [getVal, normalizar]);

  const carregarDadosSheets = async () => {
    setLoading(true);
    try {
      const unidades = [
        { url: LINKS.HOSPITAL_CONDE, nome: "HOSPITAL CONDE" },
        { url: LINKS.UPA_SANTA_RITA, nome: "UPA SANTA RITA" },
        { url: LINKS.UPA_INOA, nome: "UPA INOÃ" },
        { url: LINKS.SAMU_BARROCO, nome: "SAMU BARROCO" },
        { url: LINKS.SAMU_PONTA_NEGRA, nome: "SAMU PONTA NEGRA" },
        { url: LINKS.SAMU_CENTRO, nome: "SAMU CENTRO" },
        { url: LINKS.BAIXADOS, nome: "BAIXADOS" }
      ];
      const respostas = await Promise.all(unidades.map(u => fetch(u.url).then(r => r.text())));
      let todosItens = []; let todasBaixas = [];

      respostas.forEach((csv, idx) => {
        const data = Papa.parse(csv, { header: true, skipEmptyLines: "greedy" }).data;
        const nomeUnidade = unidades[idx].nome;
        if (nomeUnidade === "BAIXADOS") {
          todasBaixas = data.filter(d => getVal(d, "Patrimonio") || getVal(d, "Equipamento"));
        } else {
          const validos = data.filter(d => getVal(d, "Patrimonio") !== "").map(d => ({ ...d, unidade: nomeUnidade }));
          todosItens = [...todosItens, ...validos];
        }
      });

      setDadosBrutos({ chamados: todosItens, baixas: todasBaixas });
      setUnidadesDisponiveis(["TODAS", ...unidades.slice(0, 6).map(u => u.nome)]);
      processarDados(todosItens, todasBaixas, filtroUnidade, dataInicio, dataFim);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDadosSheets(); }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <FiRefreshCw className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-slate-600 font-bold animate-pulse">Sincronizando Censo Patrimonial...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-2 font-medium no-print"><FiArrowLeft /> Voltar</button>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3"><FiBox className="text-blue-600" /> Censo de Patrimônio</h1>
        </div>
        <div className="flex gap-3 no-print">
          <button onClick={() => window.print()} className="bg-slate-800 text-white px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 font-bold hover:bg-black transition-all text-sm"><FiPrinter /> Relatório</button>
          <button onClick={carregarDadosSheets} className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 font-bold text-slate-700 hover:bg-slate-50 transition-all text-sm"><FiRefreshCw /> Atualizar</button>
        </div>
      </header>

      {/* 1. Filtros */}
      <section className="no-print max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2"><FiFilter /> Unidade</label>
          <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold" value={filtroUnidade} onChange={(e) => setFiltroUnidade(e.target.value)}>
            {unidadesDisponiveis.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2"><FiCalendar /> Período</label>
          <div className="flex gap-2">
            <input type="date" className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            <input type="date" className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>
        <div className="flex items-end">
          <button className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-black hover:bg-blue-700 shadow-lg transition-all" onClick={() => processarDados(dadosBrutos.chamados, dadosBrutos.baixas, filtroUnidade, dataInicio, dataFim)}>Aplicar Filtros</button>
        </div>
      </section>

      {/* 2. Métricas */}
      <section className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Geral" value={stats.total} color="blue" icon={FiLayers} />
        <MetricCard label="Patrimoniados" value={stats.comPatrimonio} color="emerald" icon={FiBox} />
        <MetricCard label="Sem Patrimônio" value={stats.semPatrimonio} color="amber" icon={FiAlertCircle} />
        <MetricCard label="Total Baixados" value={stats.baixas} color="rose" icon={FiTrash2} />
      </section>

      {/* 3. Gráficos */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black mb-6 uppercase tracking-widest text-slate-400 flex items-center gap-2"><FiLayers className="text-blue-500" /> Itens por Unidade</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosSetores}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: "16px", border: "none" }} />
                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {dadosSetores.map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? "#1d4ed8" : "#60a5fa"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black mb-6 uppercase tracking-widest text-slate-400 flex items-center gap-2"><FiTrendingUp className="text-amber-500" /> Curva de Crescimento</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosEvolucao}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="data" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "16px", border: "none" }} />
                <Line type="monotone" dataKey="qtd" stroke="#f59e0b" strokeWidth={4} dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO DE CARDS (CORRIGIDA) */}
      <section className="max-w-7xl mx-auto mb-12">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-8">
              <FiBox className="text-emerald-500" /> Detalhamento por Equipamento ({censoPatrimonio.length})
            </h3>

            {/* Grid de Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 min-h-[320px]">
              {equipamentosExibidos.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-100 p-5 rounded-3xl text-center shadow-sm hover:border-blue-400 hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-3 h-10 leading-tight overflow-hidden">
                    {item.nome}
                  </span>
                  <div className="text-3xl font-black text-slate-800 mb-1">{item.qtd}</div>
                  <div className="inline-block text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">UNIDADES</div>
                </div>
              ))}
            </div>
          </div>

          {/* PAGINAÇÃO INTERNA (CORRIGIDA) */}
          <div className="bg-slate-50/50 border-t border-slate-100 p-6 no-print">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Página {paginaAtual + 1} de {totalPaginas}
              </span>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPaginaAtual(p => Math.max(0, p - 1))}
                  disabled={paginaAtual === 0}
                  className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                >
                  <FiChevronLeft size={20}/>
                </button>
                
                {/* Seletor de Página Simplificado para evitar quebra de layout */}
                <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                   {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
                      // Lógica básica para mostrar páginas próximas à atual
                      let pageNum = i;
                      if (totalPaginas > 5) {
                        if (paginaAtual > 2) pageNum = paginaAtual - 2 + i;
                        if (pageNum >= totalPaginas) pageNum = totalPaginas - 5 + i;
                      }
                      
                      if (pageNum < 0 || pageNum >= totalPaginas) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPaginaAtual(pageNum)}
                          className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${paginaAtual === pageNum ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                   })}
                </div>

                <button 
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas - 1, p + 1))}
                  disabled={paginaAtual >= totalPaginas - 1}
                  className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                >
                  <FiChevronRight size={20}/>
                </button>
              </div>

              <div className="hidden md:block w-32"></div> {/* Spacer para centralizar no desktop */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const MetricCard = ({ label, value, color, icon: Icon }) => {
  const variants = {
    blue: "bg-blue-600 shadow-blue-100",
    emerald: "bg-emerald-600 shadow-emerald-100",
    amber: "bg-amber-500 shadow-amber-100",
    rose: "bg-rose-500 shadow-rose-100",
  };
  return (
    <div className={`${variants[color]} p-6 rounded-3xl text-white shadow-xl`}>
      <div className="flex justify-between items-start mb-2 opacity-80">
        <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
        <Icon size={18} />
      </div>
      <div className="text-3xl font-black">{value}</div>
    </div>
  );
};

export default DashboardCenso;