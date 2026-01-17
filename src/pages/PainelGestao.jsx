import React, { useState, useEffect } from "react";
import { auth, db } from "../api/Firebase";
import { doc, getDoc } from "firebase/firestore";
import ListaChamadosGestao from "../components/ListaChamadosGestao";
import CadastroChamado from "../components/CadastroChamado";
import FormRemanejamento from "../components/FormRemanejamento";
import { FiPlus, FiRefreshCw } from "react-icons/fi";

const PainelGestao = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalSuporteAberto, setModalSuporteAberto] = useState(false);
  const [modalRemanejamentoAberto, setModalRemanejamentoAberto] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (auth.currentUser) {
          const docSnap = await getDoc(doc(db, "usuarios", auth.currentUser.uid));
          if (docSnap.exists()) setUserData(docSnap.data());
        }
      } catch (error) {
        console.error("Erro ao carregar dados do gestor:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return <div className="p-10 text-slate-400 font-bold animate-pulse">Carregando painel de gestão...</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* 1. BOTÕES DE AÇÃO RÁPIDA */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setModalSuporteAberto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-wider shadow-xl shadow-blue-100 flex items-center gap-3 transition-all active:scale-95 cursor-pointer"
        >
          <FiPlus size={18} /> Abrir Novo Chamado
        </button>

        <button
          onClick={() => setModalRemanejamentoAberto(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-wider shadow-xl shadow-orange-100 flex items-center gap-3 transition-all active:scale-95 cursor-pointer"
        >
          <FiRefreshCw size={18} /> Solicitar Remanejamento
        </button>
      </div>

      {/* 2. LISTAGEM EXCLUSIVA DO SETOR */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] pl-2">
            Monitoramento de Solicitações: {userData?.setor || "Geral"}
          </h3>
        </div>
        
        {/* Este componente deve conter a lógica de onSnapshot para os chamados do setor */}
        <ListaChamadosGestao gestorSetor={userData?.setor} />
      </div>

      {/* MODAL DE SUPORTE/MANUTENÇÃO */}
      {modalSuporteAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <CadastroChamado
              isOpen={modalSuporteAberto}
              onClose={() => setModalSuporteAberto(false)}
              userContext={userData} // Passando dados do gestor para o formulário
            />
          </div>
        </div>
      )}

      {/* MODAL DE REMANEJAMENTO */}
      {modalRemanejamentoAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <FormRemanejamento
              onClose={() => setModalRemanejamentoAberto(false)}
              userContext={userData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelGestao;