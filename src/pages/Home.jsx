import React, { useState, useEffect } from "react";
import CadastroChamado from "../components/CadastroChamado";
import MeusChamados from "../components/MeusChamados";
import FormRemanejamento from "../components/FormRemanejamento";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { LayoutGrid } from "lucide-react";
import { auth, db } from "../api/Firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [remanejamentoOpen, setRemanejamentoOpen] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");

  useEffect(() => {
    const buscarNomeUsuario = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setNomeUsuario(
              data.nome || data.name || user.displayName || "Usuário"
            );
          } else if (user.displayName) {
            setNomeUsuario(user.displayName);
          }
        } catch (error) {
          console.error("Erro ao buscar nome:", error);
        }
      }
    };

    buscarNomeUsuario();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <LayoutGrid size={14} /> Suporte Técnico
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Olá, {nomeUsuario.split(" ")[0]}!
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Gerencie seus chamados e acompanhe suas solicitações de TI.
          </p>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
          <div className="p-1">
            <MeusChamados
              abrirFormulario={() => setModalOpen(true)}
              abrirRemanejamento={() => setRemanejamentoOpen(true)}
            />
          </div>
        </div>

        <Footer />

        {/* Modal de Manutenção */}
        <CadastroChamado
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />

        {/* Modal de Remanejamento - CORRIGIDO PARA onClose */}
        {remanejamentoOpen && (
          <FormRemanejamento onClose={() => setRemanejamentoOpen(false)} />
        )}
      </main>
    </div>
  );
}
