import React, { useState, useEffect } from "react";
import { db } from "../api/Firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  serverTimestamp,
  increment,
  runTransaction,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Box,
  ArrowLeft,
  RefreshCw,
  Truck,
  Tag,
  User,
  MapPin,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

// IMPORTAÇÃO DOS COMPONENTES
import Header from "../components/Header";
import Footer from "../components/Footer";

const Estoque = () => {
  const [itensAtivos, setItensAtivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);

  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState("");
  const [quantidadeParaRetirar, setQuantidadeParaRetirar] = useState(1);

  const navigate = useNavigate();

  const [dadosSaida, setDadosSaida] = useState({
    novaUnidade: "",
    novoSetor: "",
    responsavelRecebimento: "",
    motivo: "Transferência",
  });

  const unidades = [
    "Hospital Conde",
    "UPA de Inoã",
    "UPA de Santa Rita",
    "SAMU Barroco",
    "SAMU Ponta Negra",
    "SAMU Centro",
  ];

  const carregarEstoquePatrimonio = async () => {
    setLoading(true);
    try {
      const ativosRef = collection(db, "ativos");
      const q = query(
        ativosRef,
        where("setor", "in", ["patrimonio", "Patrimonio", "PATRIMONIO"]),
        where("status", "==", "Ativo")
      );

      const querySnapshot = await getDocs(q);
      const lista = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItensAtivos(lista);
    } catch (error) {
      toast.error("Erro ao carregar itens do estoque.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEstoquePatrimonio();
  }, []);

  const handleSaida = async (e) => {
    e.preventDefault();
    setProcessando(true);

    const ativoRef = doc(db, "ativos", itemSelecionado.id);
    const qtdSolicitada = Number(quantidadeParaRetirar);

    try {
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(ativoRef);
        if (!sfDoc.exists()) throw new Error("O item não existe no banco.");

        const dadosOriginais = sfDoc.data();
        const qtdAtual = Number(dadosOriginais.quantidade || 1);

        if (qtdSolicitada > qtdAtual)
          throw new Error(`Estoque insuficiente! Disponível: ${qtdAtual}`);

        const isSP = dadosOriginais.patrimonio?.toUpperCase() === "S/P";
        const patrimonioFinal =
          isSP && novoPatrimonioParaSP
            ? novoPatrimonioParaSP.toUpperCase().trim()
            : dadosOriginais.patrimonio;

        if (isSP && qtdSolicitada < qtdAtual) {
          transaction.update(ativoRef, {
            quantidade: increment(-qtdSolicitada),
            ultimaMovimentacao: serverTimestamp(),
          });

          const novoAtivoRef = doc(collection(db, "ativos"));
          transaction.set(novoAtivoRef, {
            ...dadosOriginais,
            id: novoAtivoRef.id,
            quantidade: qtdSolicitada,
            patrimonio: patrimonioFinal,
            unidade: dadosSaida.novaUnidade,
            setor: dadosSaida.novoSetor.toLowerCase().trim(),
            ultimaMovimentacao: serverTimestamp(),
            dataCadastro: serverTimestamp(),
          });
        } else {
          transaction.update(ativoRef, {
            unidade: dadosSaida.novaUnidade,
            setor: dadosSaida.novoSetor.toLowerCase().trim(),
            patrimonio: patrimonioFinal,
            quantidade: isSP ? qtdSolicitada : qtdAtual,
            ultimaMovimentacao: serverTimestamp(),
          });
        }

        const logsRef = collection(db, "saidaEquipamento");
        transaction.set(doc(logsRef), {
          ativoId: itemSelecionado.id,
          patrimonio: patrimonioFinal,
          nomeEquipamento: itemSelecionado.nome,
          unidadeOrigem: itemSelecionado.unidade,
          setorOrigem: itemSelecionado.setor,
          unidadeDestino: dadosSaida.novaUnidade,
          setorDestino: dadosSaida.novoSetor,
          quantidadeRetirada: qtdSolicitada,
          responsavelRecebimento: dadosSaida.responsavelRecebimento,
          motivo: dadosSaida.motivo,
          dataSaida: serverTimestamp(),
        });
      });

      toast.success("Movimentação concluída com sucesso!");
      fecharModal();
      carregarEstoquePatrimonio();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessando(false);
    }
  };

  const fecharModal = () => {
    setItemSelecionado(null);
    setNovoPatrimonioParaSP("");
    setQuantidadeParaRetirar(1);
    setDadosSaida({
      novaUnidade: "",
      novoSetor: "",
      responsavelRecebimento: "",
      motivo: "Transferência",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* HEADER COMPONENTE */}
      <Header />

      <main className="flex-grow p-4 md:p-8">
        {/* Header Interno / Navegação */}
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
                <Box className="text-blue-600" size={28} /> Sala do Patrimônio
              </h1>
              <p className="text-slate-500 text-sm font-medium italic">
                Gerencie o estoque central e realize distribuições para as unidades.
              </p>
            </div>
            <button
              onClick={carregarEstoquePatrimonio}
              className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Atualizar Estoque
            </button>
          </div>
        </header>

        {/* Tabela de Itens no Patrimônio */}
        <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4">Equipamento</th>
                  <th className="p-4">Patrimônio</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Quantidade</th>
                  <th className="p-4">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400 font-bold">
                      Carregando estoque...
                    </td>
                  </tr>
                ) : itensAtivos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400 font-bold">
                      Nenhum item disponível no Patrimônio.
                    </td>
                  </tr>
                ) : (
                  itensAtivos.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4 font-bold text-slate-700">{item.nome}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono text-xs font-bold uppercase">
                          {item.patrimonio || "S/P"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                            item.estado === "Novo"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {item.estado}
                        </span>
                      </td>
                      <td className="p-4 text-center font-black text-slate-600">
                        {item.quantidade || 1}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setItemSelecionado(item)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
                        >
                          Dar Saída <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* FOOTER COMPONENTE */}
      <Footer />

      {/* Modal de Movimentação */}
      {itemSelecionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Truck size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  Movimentar Ativo
                </h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {itemSelecionado.nome}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaida} className="space-y-5">
              {itemSelecionado.patrimonio?.toUpperCase() === "S/P" && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase">
                    <AlertTriangle size={16} /> Identificação Necessária
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                        Novo Patrimônio
                      </label>
                      <input
                        type="text"
                        className="w-full bg-white border-none rounded-xl p-2 text-sm font-bold focus:ring-2 focus:ring-amber-500"
                        value={novoPatrimonioParaSP}
                        onChange={(e) => setNovoPatrimonioParaSP(e.target.value)}
                        required
                      />
                    </div>
                    {Number(itemSelecionado.quantidade) > 1 && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                          Quantidade
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={itemSelecionado.quantidade}
                          className="w-full bg-white border-none rounded-xl p-2 text-sm font-bold focus:ring-2 focus:ring-amber-500"
                          value={quantidadeParaRetirar}
                          onChange={(e) => setQuantidadeParaRetirar(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                    <MapPin size={12} /> Unidade Destino
                  </label>
                  <select
                    required
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                    value={dadosSaida.novaUnidade}
                    onChange={(e) =>
                      setDadosSaida({ ...dadosSaida, novaUnidade: e.target.value })
                    }
                  >
                    <option value="">Selecione...</option>
                    {unidades.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                    <Tag size={12} /> Setor Destino
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sala 01"
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                    value={dadosSaida.novoSetor}
                    onChange={(e) =>
                      setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                  <User size={12} /> Responsável pelo Recebimento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo"
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                  value={dadosSaida.responsavelRecebimento}
                  onChange={(e) =>
                    setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Sair
                </button>
                <button
                  type="submit"
                  disabled={processando}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  {processando ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    "Confirmar Saída"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estoque;