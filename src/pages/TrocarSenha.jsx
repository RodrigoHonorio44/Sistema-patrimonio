import React, { useState, useEffect } from "react";
import { auth, db } from "../api/Firebase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from "firebase/auth";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { toast } from "react-toastify";
import {
  FiLock,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiShield,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const TrocarSenha = () => {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const [verSenhaAtual, setVerSenhaAtual] = useState(false);
  const [verNovaSenha, setVerNovaSenha] = useState(false);
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(false);

  const navigate = useNavigate();

  const [validacoes, setValidacoes] = useState({
    minimo: false,
    maiuscula: false,
    minuscula: false,
    especial: false,
  });

  useEffect(() => {
    setValidacoes({
      minimo: novaSenha.length >= 8,
      maiuscula: /[A-Z]/.test(novaSenha),
      minuscula: /[a-z]/.test(novaSenha),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha),
    });
  }, [novaSenha]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.values(validacoes).includes(false)) {
      return toast.error("A senha não atende aos requisitos mínimos!");
    }
    if (novaSenha !== confirmarSenha) {
      return toast.error("As senhas novas não coincidem!");
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Sessão expirada. Entre novamente.");
        navigate("/login");
        return;
      }

      const userRef = doc(db, "usuarios", user.uid);
      const credential = EmailAuthProvider.credential(user.email, senhaAtual);
      await reauthenticateWithCredential(user, credential);

      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("Usuário não encontrado.");

      const userData = userSnap.data();
      const historico = userData.historicoSenhas || [];
      const novoHash = CryptoJS.SHA256(novaSenha).toString();

      if (historico.includes(novoHash)) {
        setLoading(false);
        return toast.error("Esta senha já foi usada anteriormente!");
      }

      await updatePassword(user, novaSenha);

      const novoHistorico = [...historico, novoHash].slice(-5);
      await updateDoc(userRef, {
        requiresPasswordChange: false,
        ultimaTrocaSenha: serverTimestamp(),
        historicoSenhas: novoHistorico,
      });

      toast.success("Senha pessoal definida com sucesso!");

      setTimeout(async () => {
        try {
          await signOut(auth);
          navigate("/login");
        } catch (err) {
          navigate("/login");
        }
      }, 2000);
    } catch (error) {
      console.error(error);
      if (error.code === "auth/wrong-password") {
        toast.error("Senha atual (provisória) incorreta!");
      } else {
        toast.error("Erro ao processar a troca de senha.");
      }
    } finally {
      setLoading(false);
    }
  };

  const RegraItem = ({ condicao, texto }) => (
    <div
      className={`flex items-center gap-2 text-[10px] sm:text-[11px] font-bold transition-all ${
        condicao ? "text-emerald-500" : "text-slate-400"
      }`}
    >
      {condicao ? (
        <FiCheck className="shrink-0" size={14} />
      ) : (
        <FiX className="shrink-0" size={14} />
      )}
      <span className="truncate">{texto}</span>
    </div>
  );

  return (
    // AJUSTE RESPONSIVO: min-h-screen com py-10 permite scroll em telas pequenas
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans overflow-y-auto py-10">
      {/* CARD: Ajustado max-w e padding para mobile */}
      <div className="w-full max-w-[450px] bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-slate-100 p-6 sm:p-10 relative overflow-hidden flex flex-col">
        {/* Barra de destaque superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>

        {/* HEADER RESPONSIVO */}
        <header className="text-center mb-6 sm:mb-8">
          <div className="inline-flex p-3 sm:p-4 bg-blue-50 rounded-2xl text-blue-600 mb-4 shadow-inner">
            <FiShield size={28} className="sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase italic leading-none">
            Rodhon<span className="text-blue-600">Secure</span>
          </h1>
          <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-2">
            Segurança de Primeiro Acesso
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-6 flex-grow"
        >
          {/* CAMPO SENHA ATUAL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Senha Provisória Atual
            </label>
            <div className="relative">
              <input
                type={verSenhaAtual ? "text" : "password"}
                required
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all pr-12 text-sm font-bold"
                placeholder="Senha atual"
              />
              <button
                type="button"
                onClick={() => setVerSenhaAtual(!verSenhaAtual)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500"
              >
                {verSenhaAtual ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* NOVA SENHA COM REGRAS */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Nova Senha Pessoal
            </label>
            <div className="relative">
              <input
                type={verNovaSenha ? "text" : "password"}
                required
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all pr-12 text-sm font-bold"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setVerNovaSenha(!verNovaSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500"
              >
                {verNovaSenha ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {/* GRID DE REGRAS RESPONSIVO */}
            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-y-2 gap-x-1 sm:gap-2">
              <RegraItem condicao={validacoes.minimo} texto="8+ Letras" />
              <RegraItem condicao={validacoes.maiuscula} texto="Maiúscula" />
              <RegraItem condicao={validacoes.minuscula} texto="Minúscula" />
              <RegraItem condicao={validacoes.especial} texto="Símbolo" />
            </div>
          </div>

          {/* CONFIRMAÇÃO */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={verConfirmarSenha ? "text" : "password"}
                required
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all pr-12 text-sm font-bold"
                placeholder="Repita a senha"
              />
              <button
                type="button"
                onClick={() => setVerConfirmarSenha(!verConfirmarSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500"
              >
                {verConfirmarSenha ? (
                  <FiEyeOff size={18} />
                ) : (
                  <FiEye size={18} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-4 sm:py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer active:scale-95 text-[11px] sm:text-xs tracking-widest uppercase"
          >
            {loading ? <FiRefreshCw className="animate-spin" /> : <FiLock />}
            {loading ? "Processando..." : "Atualizar e Ir para Login"}
          </button>
        </form>

        {/* FOOTER RESPONSIVO */}
        <footer className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
            SISTEMA DE SEGURANÇA RODHON
          </p>
        </footer>
      </div>
    </div>
  );
};

export default TrocarSenha;
