import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../api/Firebase";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  doc,
  query,
  orderBy,
  setDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import {
  FiShield,
  FiUserPlus,
  FiX,
  FiTrash2,
  FiArrowUp,
  FiArrowRight,
  FiArrowDown,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
  FiLock,
  FiMail,
  FiCheckSquare,
  FiArrowLeft,
  FiRefreshCw
} from "react-icons/fi";
import { toast } from "react-toastify";

import app from "../api/Firebase";
import FormAnalista from "../components/FormAnalista";
import FormUsuario from "../components/FormUsuario";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Usuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formAberto, setFormAberto] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const [modalExcluir, setModalExcluir] = useState({
    aberto: false,
    id: null,
    nome: "",
    roleAlvo: "",
  });

  const [novoUser, setNovoUser] = useState({
    nome: "",
    email: "",
    senha: "",
    unidade: "",
    cargoH: "",
    matricula: "",
    prazoLicenca: "30",
  });

  const tradutorPermissoes = {
    chamados: "Chamados",
    dashboard_bi: "Painel BI",
    financeiro: "Financeiro",
    inventario: "Inventário",
    kb: "Base de Conhecimento",
    monitoramento: "Monitoramento",
  };

  useEffect(() => {
    const loadLoggedUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (snap.exists()) setCurrentUserData(snap.data());
      }
    };
    loadLoggedUser();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "usuarios"), orderBy("email", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsuarios(lista);
    });
    return () => unsubscribe();
  }, []);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = usuarios.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(usuarios.length / usersPerPage);

  const isOperadorRoot = currentUserData?.role === "root" || currentUserData?.role === "admin";

  const handleResetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`E-mail enviado para ${email}`);
    } catch (err) {
      toast.error("Erro ao enviar e-mail.");
    }
  };

  const alterarNivel = async (userAlvo, novoRole) => {
    if (userAlvo.role === "root" && currentUserData?.role !== "root") {
      return toast.error("Apenas um ROOT pode alterar outro ROOT.");
    }
    try {
      const cargoLabel = 
        novoRole === "admin" ? "ADMINISTRADOR" :
        novoRole === "coordenador" ? "COORDENADOR" :
        novoRole === "analista" ? "ANALISTA" : "USUÁRIO";

      await updateDoc(doc(db, "usuarios", userAlvo.id), { 
        role: novoRole,
        cargo: cargoLabel 
      });
      toast.success(`Nível alterado para ${novoRole.toUpperCase()}`);
    } catch (err) {
      toast.error("Erro ao atualizar nível.");
    }
  };

  const confirmarRemocao = async () => {
    try {
      await deleteDoc(doc(db, "usuarios", modalExcluir.id));
      toast.success("Usuário removido.");
      setModalExcluir({ aberto: false, id: null, nome: "", roleAlvo: "" });
    } catch (err) {
      toast.error("Erro ao remover.");
    }
  };

  const handleCadastrar = async (e, tipo) => {
    e.preventDefault();
    setLoading(true);
    const secondaryAppName = `SecondaryAuth_${Date.now()}`;
    const secondaryApp = initializeApp(app.options, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const diasParaAdicionar = parseInt(novoUser.prazoLicenca || "30");
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + diasParaAdicionar);

      const { user } = await createUserWithEmailAndPassword(
        secondaryAuth,
        novoUser.email.trim(),
        novoUser.senha
      );

      const roleFinal = tipo === "analista" ? "analista" : "usuario";
      const cargoHospitalarFinal = tipo === "analista" ? "ANALISTA TI" : novoUser.cargoH || "USUÁRIO";

      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nome: novoUser.nome,
        email: novoUser.email.toLowerCase().trim(),
        role: roleFinal,
        cargoHospitalar: cargoHospitalarFinal.toUpperCase(),
        unidade: tipo === "analista" ? "TI" : novoUser.unidade,
        statusLicenca: "ativa",
        validadeLicenca: Timestamp.fromDate(dataVencimento),
        status: "Ativo",
        requiresPasswordChange: true,
        createdAt: Timestamp.now(),
      });

      await signOut(secondaryAuth);
      toast.success(`Usuário cadastrado!`);
      setFormAberto(null);
      setNovoUser({
        nome: "", email: "", senha: "", unidade: "", cargoH: "", matricula: "", prazoLicenca: "30",
      });
    } catch (err) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900">
      <Header cargo={currentUserData?.cargoHospitalar || "CARREGANDO..."} />

      <main className="grow max-w-7xl mx-auto p-4 md:p-10 w-full">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-4 transition-all font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
              Voltar ao Painel
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">
              Gestão de <span className="text-blue-600">Acessos</span>
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setFormAberto(formAberto === "analista" ? null : "analista")}
              className={`px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl ${
                formAberto === "analista" ? "bg-red-500 text-white" : "bg-blue-600 text-white"
              }`}
            >
              {formAberto === "analista" ? <FiX size={18} /> : <FiShield size={18} />} Novo Analista
            </button>
            <button
              onClick={() => setFormAberto(formAberto === "usuario" ? null : "usuario")}
              className={`px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl ${
                formAberto === "usuario" ? "bg-red-50 text-red-500" : "bg-slate-900 text-white"
              }`}
            >
              {formAberto === "usuario" ? <FiX size={18} /> : <FiUserPlus size={18} />} Novo Usuário
            </button>
          </div>
        </div>

        {formAberto && (
          <div className="mb-10 bg-white p-8 rounded-4xl border border-slate-100 shadow-sm animate-in slide-in-from-top-4">
            {formAberto === "analista" ? (
              <FormAnalista dados={novoUser} setDados={setNovoUser} onSubmit={(e) => handleCadastrar(e, "analista")} loading={loading} requisitos={{ minimo: novoUser.senha.length >= 6 }} />
            ) : (
              <FormUsuario dados={novoUser} setDados={setNovoUser} onSubmit={(e) => handleCadastrar(e, "usuario")} loading={loading} requisitos={{ minimo: novoUser.senha.length >= 6 }} />
            )}
          </div>
        )}

        <div className="bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="p-8">Colaborador</th>
                  <th className="p-8">Cargo Hospitalar</th>
                  <th className="p-8">Nível Sistema</th>
                  <th className="p-8 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentUsers.map((u) => {
                  const r = (u.role || "usuario").toLowerCase().trim();
                  const isTargetRoot = r === "root";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isTargetRoot ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                            {isTargetRoot ? <FiShield size={14} /> : u.nome?.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 uppercase italic text-sm">{u.nome || "Sem Nome"}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        {u.cargoHospitalar || "NÃO INFORMADO"}
                      </td>
                      <td className="p-8">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          r === "root" || r === "admin" ? "bg-purple-600 text-white" : 
                          r === "coordenador" ? "bg-orange-500 text-white" :
                          r === "analista" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                        }`}>
                          {u.role?.toUpperCase() || "USUÁRIO"}
                        </span>
                      </td>
                      <td className="p-8 text-right">
                        {isTargetRoot && !isOperadorRoot ? (
                          <div className="flex justify-end items-center gap-2 text-slate-300">
                            <FiLock size={14} /> <span className="text-[9px] font-black uppercase">Protegido</span>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5 items-center">
                            <LevelButton icon={FiArrowUp} color="bg-purple-600" label="ADMIN" onClick={() => alterarNivel(u, "admin")} />
                            <LevelButton icon={FiArrowUp} color="bg-orange-500" label="COORD" onClick={() => alterarNivel(u, "coordenador")} />
                            <LevelButton icon={FiArrowUp} color="bg-emerald-500" label="ANALISTA" onClick={() => alterarNivel(u, "analista")} />
                            <LevelButton icon={FiArrowDown} color="bg-slate-400" label="USER" onClick={() => alterarNivel(u, "usuario")} />
                            
                            <button onClick={() => handleResetPassword(u.email)} className="p-3 text-slate-300 hover:text-blue-600 cursor-pointer" title="Resetar Senha">
                              <FiMail size={18} />
                            </button>
                            <button onClick={() => setModalExcluir({ aberto: true, id: u.id, nome: u.nome || u.email, roleAlvo: r })} className="p-3 text-slate-300 hover:text-red-600 cursor-pointer" title="Excluir">
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="bg-slate-50/50 p-6 flex justify-center items-center border-t border-slate-100">
            <div className="flex gap-4">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 font-black text-[10px] uppercase cursor-pointer">
                <FiChevronLeft size={16} /> Anterior
              </button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 font-black text-[10px] uppercase cursor-pointer">
                Próximo <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modal Excluir */}
      {modalExcluir.aberto && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-4xl p-8 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <FiAlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 mb-2 uppercase italic">Remover?</h3>
            <p className="text-slate-500 text-center text-sm mb-8">Excluir permanentemente <strong>{modalExcluir.nome}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setModalExcluir({ aberto: false, id: null, nome: "", roleAlvo: "" })} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
              <button onClick={confirmarRemocao} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente de Botão de Nível
function LevelButton({ icon: Icon, color, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 ${color} text-white rounded-xl hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-sm flex items-center justify-center`}
      title={`Tornar ${label}`}
    >
      <Icon size={14} strokeWidth={4} />
    </button>
  );
}