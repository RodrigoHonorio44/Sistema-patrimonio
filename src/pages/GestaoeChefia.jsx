import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { auth, db } from "../api/Firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { FiUser } from "react-icons/fi";
import { toast } from "react-toastify";

// IMPORTAÇÃO DA NOVA SIDEBAR
import Sidebar from "../components/Sidebar";

const GestaoeChefia = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setUserData(docSnap.data());
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      }
    });
    return () => unsubscribe();
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
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      
      {/* SIDEBAR EXPANSÍVEL IMPORTADA */}
      <Sidebar userData={userData} handleLogout={handleLogout} />

      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                {userData?.role || "COORDENADOR"}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-800 italic">
              Visão Geral{" "}
              <span className="text-slate-400 font-medium not-italic">
                do Sistema
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-black text-slate-800 uppercase">
                {userData?.nome || "Carregando..."}
              </p>
              <div className="bg-[#EBF2FF] px-2 py-0.5 rounded border border-blue-100 mt-1">
                <span className="text-[9px] text-blue-600 font-black uppercase">
                  {userData?.unidade || "HOSPITAL CONDE"}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg border-2 border-white transition-transform hover:scale-105">
              <FiUser size={24} />
            </div>
          </div>
        </header>

        {/* CONTEÚDO DINÂMICO */}
        <section className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
          <div className="max-w-[1600px] mx-auto">
            {/* O Outlet renderiza o conteúdo da rota filha */}
            <Outlet context={[userData]} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default GestaoeChefia;