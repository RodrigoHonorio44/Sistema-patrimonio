import React, { useState, useEffect } from "react";
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
  FiArrowLeft,
  FiTrash2,
  FiArrowUp,
  FiArrowRight,
  FiArrowDown,
  FiChevronLeft,
  FiAlertTriangle,
  FiLock,
  FiMail,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import app from "../api/Firebase";
import FormAnalista from "../components/FormAnalista";
import FormUsuario from "../components/FormUsuario";

export default function Usuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formAberto, setFormAberto] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);

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

  const isOperadorRoot = currentUserData?.role === "root";

  // DISPARO DE E-MAIL DE RECUPERAÇÃO
  const handleResetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`E-mail de redefinição enviado para ${email}`);
    } catch (err) {
      toast.error("Erro ao enviar e-mail de recuperação.");
    }
  };

  const alterarNivel = async (userAlvo, novoRole) => {
    if (userAlvo.role === "root" && !isOperadorRoot) {
      return toast.error(
        "Acesso negado: Apenas um ROOT pode alterar outro ROOT."
      );
    }

    try {
      // Atualizamos apenas a Role. O Cargo administrativo (ex: Gerente) permanece o mesmo.
      await updateDoc(doc(db, "usuarios", userAlvo.id), {
        role: novoRole,
      });

      toast.success(`Nível de acesso alterado para ${novoRole.toUpperCase()}`);
    } catch (err) {
      toast.error("Erro ao atualizar nível.");
    }
  };

  const confirmarRemocao = async () => {
    if (modalExcluir.roleAlvo === "root" && !isOperadorRoot) {
      toast.error("Não é permitido excluir um usuário ROOT.");
      return;
    }

    try {
      await deleteDoc(doc(db, "usuarios", modalExcluir.id));
      toast.success("Registro removido.");
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

      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nome: novoUser.nome,
        email: novoUser.email.toLowerCase().trim(),
        role: roleFinal,
        // Mantemos o cargo administrativo vindo do formulário (cargoH)
        cargo: novoUser.cargoH || roleFinal.toUpperCase(),
        unidade: tipo === "analista" ? "TI" : novoUser.unidade,
        statusLicenca: "ativa",
        validadeLicenca: Timestamp.fromDate(dataVencimento),
        status: "Ativo",
        requiresPasswordChange: true,
        createdAt: Timestamp.now(),
      });

      await signOut(secondaryAuth);
      toast.success(`Usuário criado com sucesso!`);
      setFormAberto(null);
      setNovoUser({
        nome: "",
        email: "",
        senha: "",
        unidade: "",
        cargoH: "",
        matricula: "",
        prazoLicenca: "30",
      });
    } catch (err) {
      toast.error("Erro ao cadastrar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans antialiased text-slate-900 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-4 transition-all font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />{" "}
              Voltar ao Painel
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">
              Gestão de <span className="text-blue-600">Acessos</span>
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                setFormAberto(formAberto === "analista" ? null : "analista")
              }
              className={`px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-xl ${
                formAberto === "analista"
                  ? "bg-red-500 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {formAberto === "analista" ? (
                <FiX size={18} />
              ) : (
                <FiShield size={18} />
              )}{" "}
              Novo Analista
            </button>
            <button
              onClick={() =>
                setFormAberto(formAberto === "usuario" ? null : "usuario")
              }
              className={`px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-xl ${
                formAberto === "usuario"
                  ? "bg-red-50 text-red-500"
                  : "bg-slate-900 text-white"
              }`}
            >
              {formAberto === "usuario" ? (
                <FiX size={18} />
              ) : (
                <FiUserPlus size={18} />
              )}{" "}
              Novo Usuário
            </button>
          </div>
        </div>

        {formAberto && (
          <div className="mb-10 bg-white p-8 rounded-4xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            {formAberto === "analista" ? (
              <FormAnalista
                dados={novoUser}
                setDados={setNovoUser}
                onSubmit={(e) => handleCadastrar(e, "analista")}
                loading={loading}
                requisitos={{ minimo: novoUser.senha.length >= 6 }}
              />
            ) : (
              <FormUsuario
                dados={novoUser}
                setDados={setNovoUser}
                onSubmit={(e) => handleCadastrar(e, "usuario")}
                loading={loading}
                requisitos={{ minimo: novoUser.senha.length >= 6 }}
              />
            )}
          </div>
        )}

        <div className="bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="p-8">Membro / Email</th>
                  <th className="p-8">Cargo / Role</th>
                  <th className="p-8 text-right">Controle de Hierarquia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuarios.map((u) => {
                  const role = (u.role || "usuario").toLowerCase().trim();
                  const isTargetRoot = role === "root";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/30 transition-colors group"
                    >
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                              isTargetRoot
                                ? "bg-purple-600 text-white"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {isTargetRoot ? (
                              <FiShield size={14} />
                            ) : (
                              u.nome?.substring(0, 1).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 uppercase italic text-sm flex items-center gap-2">
                              {u.nome || "Sem Nome"}
                              {isTargetRoot && (
                                <span className="text-[8px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full not-italic">
                                  ROOT
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-tight">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">
                            {u.cargo || "Não definido"}
                          </span>
                          <span
                            className={`w-fit px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                              isTargetRoot
                                ? "bg-purple-100 text-purple-600"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            Permissão: {role}
                          </span>
                        </div>
                      </td>
                      <td className="p-8">
                        {isTargetRoot && !isOperadorRoot ? (
                          <div className="flex justify-end items-center gap-2 text-slate-300">
                            <FiLock size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              Acesso Restrito
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2 items-center">
                            <LevelButton
                              icon={FiArrowUp}
                              color="bg-black"
                              label="ADMIN"
                              onClick={() => alterarNivel(u, "admin")}
                            />
                            <LevelButton
                              icon={FiArrowUp}
                              color="bg-emerald-500"
                              label="ANALISTA"
                              onClick={() => alterarNivel(u, "analista")}
                            />
                            <LevelButton
                              icon={FiArrowRight}
                              color="bg-blue-500"
                              label="CHEFIA"
                              onClick={() => alterarNivel(u, "chefia")}
                            />
                            <LevelButton
                              icon={FiChevronLeft}
                              color="bg-orange-500"
                              label="COORD"
                              onClick={() => alterarNivel(u, "coordenador")}
                            />
                            <LevelButton
                              icon={FiArrowDown}
                              color="bg-red-500"
                              label="USER"
                              onClick={() => alterarNivel(u, "usuario")}
                            />

                            <div className="h-8 w-px bg-slate-100 mx-2"></div>

                            <button
                              onClick={() => handleResetPassword(u.email)}
                              className="p-3 text-slate-300 hover:text-blue-600 transition-all cursor-pointer"
                              title="Resetar Senha (E-mail)"
                            >
                              <FiMail size={18} />
                            </button>

                            <button
                              onClick={() =>
                                setModalExcluir({
                                  aberto: true,
                                  id: u.id,
                                  nome: u.nome || u.email,
                                  roleAlvo: role,
                                })
                              }
                              className="p-3 text-slate-300 hover:text-red-600 transition-all cursor-pointer"
                              title="Excluir Usuário"
                            >
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
        </div>
      </div>

      {/* MODAL DE EXCLUSÃO */}
      {modalExcluir.aberto && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-4xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <FiAlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 mb-2 uppercase italic">
              Excluir Registro?
            </h3>
            <p className="text-slate-500 text-center text-sm mb-8">
              Você está prestes a remover <strong>{modalExcluir.nome}</strong>{" "}
              permanentemente.
              {modalExcluir.roleAlvo === "root" &&
                " Atenção: Este é um usuário ROOT."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setModalExcluir({
                    aberto: false,
                    id: null,
                    nome: "",
                    roleAlvo: "",
                  })
                }
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRemocao}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LevelButton({ icon: Icon, color, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 ${color} text-white rounded-xl hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-sm flex flex-col items-center group relative`}
      title={`Alterar Permissão para ${label}`}
    >
      <Icon size={14} strokeWidth={4} />
    </button>
  );
}
