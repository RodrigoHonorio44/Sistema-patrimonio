import React, { useState, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { auth, db } from "../api/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    nome: "Usuário",
    cargo: "Carregando...",
    unidade: "Carregando...",
  });

  useEffect(() => {
    const buscarDados = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              nome: data.nome || "Usuário do Sistema",
              // Prioridade: cargoHospitalar -> cargo -> role
              cargo:
                data.cargoHospitalar || data.cargo || data.role || "Usuário",
              unidade: data.unidade || "Unidade Central",
            });
          }
        } catch (error) {
          console.error("Erro ao buscar dados:", error);
        }
      }
    };
    buscarDados();
  }, []);

  const formatarNome = (nomeCompleto) => {
    if (!nomeCompleto) return "Usuário";
    const nomes = nomeCompleto.split(" ");
    return nomes.length > 1 ? `${nomes[0]} ${nomes[1]}` : nomes[0];
  };

  return (
    <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-50">
      <div
        className="flex flex-col cursor-pointer group"
        onClick={() => navigate("/dashboard")}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
            Rodhon System
          </h2>
        </div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight italic">
          Centro de{" "}
          <span className="text-slate-400 font-medium">Operações</span>
        </h1>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 group">
          <div className="text-right hidden md:block">
            <div className="flex items-center justify-end gap-2 mb-1">
              <div className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                <p className="text-[9px] text-blue-600 font-black uppercase">
                  {userData.unidade}
                </p>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {userData.cargo}
              </p>
            </div>
            <p className="text-sm font-black text-slate-800 uppercase italic">
              {formatarNome(userData.nome)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-blue-700 to-blue-400 flex items-center justify-center text-white border-2 border-white shadow-lg shadow-blue-100 transition-all group-hover:scale-105">
            <User size={22} />
          </div>
        </div>
        <div className="h-10 w-px bg-slate-100"></div>
        <button
          onClick={() => auth.signOut()}
          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
