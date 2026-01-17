import React, { useState, useEffect } from "react";
import CadastroChamado from "../components/CadastroChamado";
import MeusChamados from "../components/MeusChamados";
import FormRemanejamento from "../components/FormRemanejamento";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar"; // IMPORTADO
import { LayoutGrid } from "lucide-react";
import { auth, db } from "../api/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [remanejamentoOpen, setRemanejamentoOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const buscarDadosUsuario = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Erro ao buscar dados:", error);
        }
      }
    };
    buscarDadosUsuario();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info("Sessão encerrada");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  return (
    // Mudamos para flex-row para a Sidebar ficar ao lado
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
      
      {/* SIDEBAR EXPANSÍVEL */}
      <Sidebar userData={userData} handleLogout={handleLogout} />

      {/* ÁREA DIREITA (CONTEÚDO) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            
            <div className="mb-10">
              <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
                <LayoutGrid size={14} /> Suporte Técnico
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Olá, {userData?.nome?.split(" ")[0] || "Usuário"}!
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Gerencie seus chamados e acompanhe suas solicitações de TI.
              </p>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden mb-10">
              <div className="p-1">
                <MeusChamados
                  abrirFormulario={() => setModalOpen(true)}
                  abrirRemanejamento={() => setRemanejamentoOpen(true)}
                />
              </div>
            </div>

            <Footer />
          </div>
        </main>
      </div>

      {/* Modais */}
      <CadastroChamado
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {remanejamentoOpen && (
        <FormRemanejamento onClose={() => setRemanejamentoOpen(false)} />
      )}
    </div>
  );
}