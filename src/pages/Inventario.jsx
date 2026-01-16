import React, { useState } from "react";
import { db } from "../api/Firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  Search,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  AlertCircle,
  FilterX,
  ArrowLeft,
} from "lucide-react";

// Importação dos componentes solicitados
import Header from "../components/Header";
import Footer from "../components/Footer";

const Inventario = () => {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Estados dos Filtros
  const [unidadeFiltro, setUnidadeFiltro] = useState("Todas");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [buscaPatrimonio, setBuscaPatrimonio] = useState("");

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [modalBaixa, setModalBaixa] = useState({
    aberto: false,
    id: null,
    nome: "",
  });

  const navigate = useNavigate();
  const itensPorPagina = 15;
  const WEBAPP_URL_SHEETS =
    "https://script.google.com/macros/s/AKfycbwHsFnuMc_onDTG9vloDYNW6o_eIrTTfXt6O4WuhGxEP86rl1ZH4WY6o_JsSSljZqck3g/exec";

  // Função de normalização para busca e filtros
  const normalizarParaComparacao = (texto) => {
    if (!texto) return "";
    return texto
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[/\s._-]/g, "")
      .trim();
  };

  const carregarDados = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    setPaginaAtual(1);

    try {
      const querySnapshot = await getDocs(collection(db, "ativos"));
      const todosOsDados = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setItens(todosOsDados);

      if (todosOsDados.length > 0) {
        toast.success(`${todosOsDados.length} itens encontrados.`);
      } else {
        toast.info("Nenhum item encontrado no banco.");
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
      toast.error("Erro ao consultar dados.");
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setBuscaPatrimonio("");
    setUnidadeFiltro("Todas");
    setStatusFiltro("Todos");
    setItens([]);
    setHasSearched(false);
  };

  // Lógica de Filtragem
  const itensFiltrados = itens.filter((item) => {
    const unidadeItemNorm = normalizarParaComparacao(item.unidade || "");
    const unidadeSelecionadaNorm = normalizarParaComparacao(unidadeFiltro);
    const matchUnidade =
      unidadeFiltro === "Todas" ||
      unidadeItemNorm.includes(unidadeSelecionadaNorm);

    const statusItem = item.status || "Ativo";
    const matchStatus = statusFiltro === "Todos" || statusItem === statusFiltro;

    let matchBusca = true;
    if (buscaPatrimonio.trim() !== "") {
      const termoNorm = normalizarParaComparacao(buscaPatrimonio);
      const patItemNorm = normalizarParaComparacao(item.patrimonio || "");
      const nomeItemNorm = normalizarParaComparacao(item.nome || "");
      matchBusca =
        patItemNorm.includes(termoNorm) || nomeItemNorm.includes(termoNorm);
    }

    return matchUnidade && matchStatus && matchBusca;
  });

  // Paginação
  const totalPaginas = Math.ceil(itensFiltrados.length / itensPorPagina);
  const itensExibidos = itensFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const formatarDataBR = (timestamp) => {
    if (!timestamp) return "---";
    try {
      const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Data inválida";
    }
  };

  const exportarExcelCompleto = async () => {
    if (itensFiltrados.length === 0)
      return toast.error("Não há dados para exportar.");
    toast.info("Sincronizando...");
    try {
      const dadosParaEnviar = itensFiltrados.map((i) => ({
        patrimonio: i.patrimonio?.toString() || "S/P",
        nome: i.nome,
        unidade: i.unidade || "",
        setor: i.setor || "",
        estado: i.estado || "Bom",
        status: i.status,
        dataBaixa: i.dataBaixa ? formatarDataBR(i.dataBaixa) : "",
      }));

      const ws = XLSX.utils.json_to_sheet(dadosParaEnviar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario");
      XLSX.writeFile(wb, `Inventario_${unidadeFiltro}.xlsx`);
      toast.success("Exportação concluída!");
    } catch (error) {
      toast.error("Erro na exportação.");
    }
  };

  const confirmarBaixa = async () => {
    try {
      await updateDoc(doc(db, "ativos", modalBaixa.id), {
        status: "Baixado",
        dataBaixa: serverTimestamp(),
      });
      toast.warning("Item baixado.");
      setModalBaixa({ aberto: false, id: null, nome: "" });
      carregarDados();
    } catch (error) {
      toast.error("Erro ao baixar.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* HEADER ADICIONADO */}
      <Header />

      <main className="flex-grow p-4 md:p-8">
        <header className="max-w-7xl mx-auto mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors mb-4 group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Voltar ao Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                <Shield className="text-blue-600" size={28} /> Painel
                Administrativo
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                Gestão centralizada de ativos.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={limparFiltros}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
              >
                <FilterX size={18} /> Limpar
              </button>
              <button
                onClick={exportarExcelCompleto}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-lg shadow-emerald-100 cursor-pointer"
              >
                <Database size={18} /> Exportar Excel
              </button>
            </div>
          </div>
        </header>

        {/* FILTROS */}
        <div className="max-w-7xl mx-auto bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Unidade
            </label>
            <select
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              value={unidadeFiltro}
              onChange={(e) => setUnidadeFiltro(e.target.value)}
            >
              <option value="Todas">🌍 Todas as Unidades</option>
              <option value="Hospital Conde">Hospital Conde</option>
              <option value="Santa Rita">UPA Santa Rita</option>
              <option value="Inoã">UPA Inoã</option>
              <option value="Barroco">SAMU Barroco</option>
              <option value="Ponta Negra">SAMU Ponta Negra</option>
              <option value="Centro">SAMU Centro</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Status
            </label>
            <select
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Ativo">Ativos</option>
              <option value="Baixado">Inutilizados</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Patrimônio / Nome
            </label>
            <input
              type="text"
              placeholder="Ex: 105 ou Monitor"
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              value={buscaPatrimonio}
              onChange={(e) => setBuscaPatrimonio(e.target.value)}
            />
          </div>
          <button
            onClick={carregarDados}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <>
                <Search size={20} /> Consultar
              </>
            )}
          </button>
        </div>

        {/* TABELA / RESULTADOS */}
        <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] mb-8">
          {!hasSearched ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-300">
              <Search size={64} className="mb-4 opacity-10" />
              <p className="font-bold text-lg text-slate-400">
                Pronto para buscar
              </p>
              <p className="text-sm">
                Clique em Consultar para carregar os dados.
              </p>
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 text-center p-4">
              <FilterX size={48} className="mb-2 opacity-20" />
              <p className="font-bold">
                Nenhum item corresponde aos filtros selecionados.
              </p>
              <p className="text-xs italic">
                Verifique se o Status ou a Unidade estão corretos.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-4">Patrimônio</th>
                      <th className="p-4">Equipamento</th>
                      <th className="p-4">Unidade / Setor</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {itensExibidos.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/50 transition-colors group"
                      >
                        <td className="p-4 font-black text-blue-600 italic">
                          #{item.patrimonio || "S/P"}
                        </td>
                        <td className="p-4 font-bold text-slate-700 uppercase text-sm">
                          {item.nome}
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-500">
                          {item.unidade} <br />
                          <span className="font-normal opacity-60 uppercase">
                            {item.setor}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                              item.status === "Ativo"
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {item.status === "Baixado"
                              ? "Inutilizado"
                              : item.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {item.status === "Ativo" ? (
                            <button
                              onClick={() =>
                                setModalBaixa({
                                  aberto: true,
                                  id: item.id,
                                  nome: item.nome,
                                })
                              }
                              className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm border border-red-100"
                            >
                              Baixar
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">
                              Baixado em {formatarDataBR(item.dataBaixa)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINAÇÃO */}
              <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-slate-100 font-bold text-slate-400 text-xs uppercase">
                <span>
                  Página {paginaAtual} de {totalPaginas || 1}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={paginaAtual === 1}
                    onClick={() => setPaginaAtual((p) => p - 1)}
                    className="p-2 bg-white rounded-lg border border-slate-200 disabled:opacity-30 cursor-pointer transition-colors hover:text-blue-600"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    disabled={paginaAtual === totalPaginas}
                    onClick={() => setPaginaAtual((p) => p + 1)}
                    className="p-2 bg-white rounded-lg border border-slate-200 disabled:opacity-30 cursor-pointer transition-colors hover:text-blue-600"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* FOOTER ADICIONADO */}
      <Footer />

      {/* MODAL DE CONFIRMAÇÃO */}
      {modalBaixa.aberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-black text-center mb-2 italic tracking-tighter uppercase">
              Confirmar Baixa?
            </h3>
            <p className="text-slate-500 text-center mb-8 text-sm italic font-medium">
              Item:{" "}
              <span className="text-slate-900 font-bold">
                {modalBaixa.nome}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalBaixa({ aberto: false })}
                className="flex-1 bg-slate-100 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Sair
              </button>
              <button
                onClick={confirmarBaixa}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 cursor-pointer transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
