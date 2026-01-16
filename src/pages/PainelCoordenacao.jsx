import React, { useState } from "react";
import { Stethoscope, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { auth, db } from "../api/Firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      const userDocRef = doc(db, "usuarios", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // 1. Verificação de troca de senha obrigatória
        if (userData.requiresPasswordChange === true) {
          toast.info("Primeiro acesso. Por favor, altere sua senha.");
          navigate("/trocar-senha");
          return;
        }

        // 2. Normalização do Role (Garante que espaços ou maiúsculas não quebrem a lógica)
        const userRole = userData.role ? String(userData.role).toLowerCase().trim() : "user";

        // 3. LÓGICA DE REDIRECIONAMENTO POR NÍVEL (HIERARQUIA)
        if (userRole === "coordenador") {
          // Prioridade para o Coordenador
          navigate("/coordenacao");
        } 
        else if (userRole === "analista" || userRole === "admin") {
          // Analistas e Admins para o Dashboard principal
          navigate("/dashboard");
        } 
        else {
          // Usuários comuns ou sem role definido vão para Home
          navigate("/home");
        }

      } else {
        // Se o usuário não tiver documento no Firestore
        navigate("/home");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("E-mail ou senha incorretos.");
      } else {
        setError("Erro ao acessar o sistema.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans">
      {/* LADO ESQUERDO: Visual Hospitalar */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500 rounded-full opacity-50 blur-3xl"></div>

        <div className="relative z-10 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
              <Stethoscope size={42} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none">
                Conde Modesto Leal
              </h2>
              <span className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em]">
                HMCML Unidade de TI
              </span>
            </div>
          </div>

          <h1 className="text-6xl font-black mb-6 leading-tight uppercase tracking-tighter">
            Patrimônio <br />
            <span className="text-blue-300">& Chamados</span>
          </h1>

          <p className="text-blue-100 text-xl leading-relaxed font-medium opacity-90">
            Plataforma inteligente para gestão de ativos e suporte técnico
            hospitalar.
          </p>
        </div>
      </div>

      {/* LADO DIREITO: Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              RODHON<span className="text-blue-600">SYSTEM</span>
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3">
              Technology Solutions
            </p>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
            <div className="mb-8 text-center">
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                Identificação de Usuário
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-600 rounded-r-xl flex items-center gap-3 text-sm font-bold">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 ml-1 tracking-widest">
                  E-mail Corporativo
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <User size={20} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all font-semibold text-slate-700"
                    placeholder="nome@hospital.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 ml-1 tracking-widest">
                  Senha
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={20} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all font-semibold text-slate-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm mt-4"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  "Acessar Sistema"
                )}
              </button>
            </form>
          </div>

          <p className="text-center mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            &copy; 2026 Rodhon System | Unidade Hospitalar
          </p>
        </div>
      </div>
    </div>
  );
}