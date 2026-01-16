import React, { useState, useEffect } from "react";
import { auth, db } from "../api/Firebase";
import { doc, getDoc } from "firebase/firestore";
import ListaChamadosGestao from "../components/ListaChamadosGestao";
import CadastroChamado from "../components/CadastroChamado";
import FormRemanejamento from "../components/FormRemanejamento";
import { FiPlus, FiRefreshCw } from "react-icons/fi";

const PainelGestao = () => {
  const [userData, setUserData] = useState(null);
  const [modalSuporteAberto, setModalSuporteAberto] = useState(false);
  const [modalRemanejamentoAberto, setModalRemanejamentoAberto] =
    useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const docSnap = await getDoc(doc(db, "usuarios", auth.currentUser.uid));
        if (docSnap.exists()) setUserData(docSnap.data());
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      {/* 1. BOTÕES DE AÇÃO RÁPIDA (Agora no topo) */}
      <div className="flex gap-4">
        <button
          onClick={() => setModalSuporteAberto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-wider shadow-xl shadow-blue-200 flex items-center gap-3 transition-all active:scale-95"
        >
          <FiPlus size={18} /> Abrir Novo Chamado
        </button>

        <button
          onClick={() => setModalRemanejamentoAberto(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-wider shadow-xl shadow-orange-200 flex items-center gap-3 transition-all active:scale-95"
        >
          <FiRefreshCw size={18} /> Solicitar Remanejamento
        </button>
      </div>

      {/* 2. LISTAGEM EXCLUSIVA */}
      <div className="pt-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-6 pl-2">
          Monitoramento de Solicitações do Setor
        </h3>
        <ListaChamadosGestao />
      </div>

      {/* MODAL DE SUPORTE/MANUTENÇÃO */}
      {modalSuporteAberto && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <CadastroChamado
            isOpen={modalSuporteAberto}
            onClose={() => setModalSuporteAberto(false)}
          />
        </div>
      )}

      {/* MODAL DE REMANEJAMENTO */}
      {modalRemanejamentoAberto && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <FormRemanejamento
            onClose={() => setModalRemanejamentoAberto(false)}
          />
        </div>
      )}
    </div>
  );
};

export default PainelGestao;
