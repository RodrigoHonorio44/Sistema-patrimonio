import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../api/Firebase";
import { signOut } from "firebase/auth"; // Importe o signOut
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FiUser, FiLayers, FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";

const GestaoeChefia = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // FUNÇÃO PARA LOGOUT
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
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#F1F5F9] border-r border-slate-200 flex flex-col">
        {/* LOGO */}
        <div className="h-24 flex items-center px-8 border-b border-slate-200 bg-white">
          <span className="text-xl font-black italic">
            RODHON<span className="text-blue-600">SYSTEM</span>
          </span>
        </div>

        {/* LINKS DE NAVEGAÇÃO */}
        <nav className="p-4 flex-1 space-y-2">
          <Link
            to="/gestao-chefia"
            className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
              location.pathname === "/gestao-chefia"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            <FiLayers size={22} />
            <span className="text-[11px] font-black uppercase tracking-widest">
              Início
            </span>
          </Link>
        </nav>

        {/* BOTÃO DE SAIR NO RODAPÉ DA SIDEBAR */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors font-black uppercase text-[11px] tracking-widest"
          >
            <FiLogOut size={22} />
            Sair do Sistema
          </button>
        </div>
      </aside>

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
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg border-2 border-white">
              <FiUser size={24} />
            </div>
          </div>
        </header>

        {/* CONTEÚDO DINÂMICO */}
        <section className="flex-1 overflow-y-auto p-10">
          <div className="max-w-[1600px] mx-auto">
            <Outlet context={[userData]} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default GestaoeChefia;
