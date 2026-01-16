import React, { useState } from "react";
import { auth, db } from "../api/Firebase";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function DefinirSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTrocarSenha = async (e) => {
    e.preventDefault();

    if (novaSenha.length < 6) {
      return toast.warning("A senha deve ter no mínimo 6 caracteres.");
    }
    if (novaSenha !== confirmarSenha) {
      return toast.error("As senhas não coincidem.");
    }

    setLoading(true);
    try {
      const user = auth.currentUser;

      if (user) {
        // 1. Atualiza a senha no Auth
        await updatePassword(user, novaSenha);

        // 2. Remove a trava no Firestore
        await updateDoc(doc(db, "usuarios", user.uid), {
          requiresPasswordChange: false,
          updatedAt: new Date(),
        });

        toast.success("Senha atualizada com sucesso!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Erro ao atualizar senha. Tente fazer login novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-6">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md">
        <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">
          Defina sua nova senha
        </h2>
        <p className="text-slate-500 text-sm mb-6 font-medium">
          Por segurança, você precisa criar uma senha pessoal no primeiro
          acesso.
        </p>

        <form onSubmit={handleTrocarSenha} className="space-y-4">
          <input
            type="password"
            placeholder="Nova Senha"
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirme a Nova Senha"
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
          />
          <button
            disabled={loading}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-black transition-all"
          >
            {loading ? "Salvando..." : "Atualizar e Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
