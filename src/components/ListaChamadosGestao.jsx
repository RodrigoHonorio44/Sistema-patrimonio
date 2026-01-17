import React, { useState, useEffect } from "react";
import { db, auth } from "../api/Firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import {
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiX,
  FiArrowRight,
  FiUser,
  FiAlertCircle,
} from "react-icons/fi";

const ListaChamadosGestao = () => {
  const [chamados, setChamados] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const itensPorPagina = 15;

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const q = query(
        collection(db, "chamados"),
        where("userId", "==", user.uid),
        orderBy("criadoEm", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const dados = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChamados(dados);
      });
      return () => unsubscribe();
    }
  }, []);

  const totalPaginas = Math.ceil(chamados.length / itensPorPagina);
  const chamadosPaginados = chamados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-[10px] uppercase tracking-widest text-slate-400 font-black">
              <th className="px-6 py-6">Nº OS / Analista</th>
              <th className="px-6 py-6">Unidade / Local</th>
              <th className="px-6 py-6">Problema / Solicitação</th>
              <th className="px-6 py-6 text-center">Status</th>
              <th className="px-6 py-6">Abertura</th>
              <th className="px-6 py-6 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {chamadosPaginados.map((item) => {
              const isRem = item.numeroOs?.includes("REM");
              const data = item.criadoEm?.toDate();
              const statusLower = item.status?.toLowerCase();

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => setChamadoSelecionado(item)}
                >
                  <td className="px-6 py-4">
                    <div className={`text-sm font-black italic tracking-tight ${isRem ? "text-orange-500" : "text-blue-600"}`}>
                      {isRem ? `##${item.numeroOs}` : `#${item.numeroOs}`}
                    </div>
                    <div className="text-[10px] uppercase text-slate-400 font-black mt-0.5">
                      {item.analistaResponsavel || "Aguardando Analista"}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-slate-800">{item.unidade}</div>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-black">
                      {isRem ? (
                        <>
                          <span className="text-red-400">{item.setorOrigem}</span>
                          <FiArrowRight className="text-slate-300" />
                          <span className="text-emerald-500">{item.setorDestino}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">{item.setor}</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-500 font-bold italic truncate max-w-[200px]">
                      {item.descricao}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border tracking-widest ${
                        statusLower === "pendente"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : statusLower === "aberto"
                          ? "bg-emerald-50/50 text-emerald-600 border-emerald-100"
                          : "bg-red-50 text-red-600 border-red-100"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="text-xs font-black text-slate-700">{data?.toLocaleDateString("pt-BR")}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-1 justify-center">
                      <FiClock size={12} />
                      {data?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button className={`p-2 rounded-xl transition-all ${isRem ? "text-orange-500 hover:bg-orange-50" : "text-blue-600 hover:bg-blue-50"}`}>
                      <FiEye size={20} className="mx-auto" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINAÇÃO */}
      <div className="p-6 flex justify-between items-center bg-slate-50/30 border-t border-slate-50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Página {paginaAtual} de {totalPaginas}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
            className="p-2 border rounded-xl bg-white disabled:opacity-30"
            disabled={paginaAtual === 1}
          ><FiChevronLeft /></button>
          <button
            onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
            className="p-2 border rounded-xl bg-white disabled:opacity-30"
            disabled={paginaAtual === totalPaginas}
          ><FiChevronRight /></button>
        </div>
      </div>

      {/* MODAL DE DETALHES */}
      {chamadoSelecionado && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 text-left">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${chamadoSelecionado.numeroOs?.includes("REM") ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}>
                    {chamadoSelecionado.numeroOs?.includes("REM") ? "Remanejamento" : "Manutenção"}
                  </span>
                  <h2 className="text-2xl font-black text-slate-800 mt-2 italic">#{chamadoSelecionado.numeroOs}</h2>
                </div>
                <button onClick={() => setChamadoSelecionado(null)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                  <FiX size={20} />
                </button>
              </div>

              {/* BLOCO DE PAUSA/PENDÊNCIA */}
              {chamadoSelecionado.status?.toLowerCase() === "pendente" && (
                <div className="mb-6 bg-amber-50 border border-amber-100 rounded-[2rem] p-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="bg-white p-2 rounded-full shadow-sm text-amber-600">
                      <FiAlertCircle size={24} />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Aguardando Resolução</span>
                      <h4 className="text-lg font-black text-amber-900 uppercase italic leading-tight mt-1">
                        {chamadoSelecionado.motivoPausa || "Pendente"}
                      </h4>
                    </div>
                  </div>
                  
                  {/* PUXANDO detalhePausa DO FIREBASE */}
                  {chamadoSelecionado.detalhePausa && (
                    <div className="bg-white/60 rounded-2xl p-4 border border-amber-200/50">
                      <p className="text-[9px] font-black text-amber-800 uppercase mb-1 tracking-tighter">Detalhes da Pausa:</p>
                      <p className="text-amber-900 text-sm font-medium italic leading-relaxed">
                        {chamadoSelecionado.detalhePausa}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-1 flex items-center gap-1"><FiClock /> Abertura</p>
                  <p className="text-sm font-bold text-slate-700">{chamadoSelecionado.criadoEm?.toDate().toLocaleString("pt-BR")}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-1 flex items-center gap-1"><FiUser /> Analista</p>
                  <p className="text-sm font-bold text-slate-700">{chamadoSelecionado.analistaResponsavel || "Não atribuído"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase font-black text-slate-400">Descrição do Chamado</label>
                <div className="bg-slate-50 p-5 rounded-2xl text-sm text-slate-600 font-medium min-h-[100px] whitespace-pre-wrap border border-slate-100">
                  {chamadoSelecionado.descricao}
                </div>
              </div>

              <button 
                onClick={() => setChamadoSelecionado(null)} 
                className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaChamadosGestao;