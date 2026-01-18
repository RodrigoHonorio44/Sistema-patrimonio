import React, { useState } from "react";
import { 
  Stethoscope, 
  Lock, 
  User, 
  Loader2, 
  AlertCircle, 
  LifeBuoy,
  Eye,      
  EyeOff,
  ClipboardCheck,
  Wrench,
  Monitor
} from "lucide-react";
import { auth, db } from "../api/Firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
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
        const agora = new Date();
        const dataValidade = userData.validadeLicenca?.toDate();

        if (userData.status === "Bloqueado" || userData.statusLicenca === "bloqueada") {
          toast.error("Acesso suspenso pelo administrador.");
          await signOut(auth);
          navigate("/bloqueado", { replace: true });
          setLoading(false);
          return;
        }

        if (dataValidade && agora > dataValidade) {
          toast.warning("Sua licença de uso expirou.");
          await signOut(auth);
          navigate("/expirado", { replace: true });
          setLoading(false);
          return;
        }

        const precisaTrocar = 
          userData.requiresPasswordChange === true || 
          userData.permissoesExtras?.requiresPasswordChange === true;

        if (precisaTrocar) {
          toast.info("Primeiro acesso. Redirecionando para alteração de senha...");
          setLoading(false);
          navigate("/trocar-senha"); 
          return; 
        }

        const newSessionId = Date.now().toString();
        localStorage.setItem("current_session_id", newSessionId);
        await updateDoc(userDocRef, { currentSessionId: newSessionId });
        sessionStorage.removeItem("user_blocked");

        const userRole = userData.role?.toLowerCase().trim();
        if (["analista", "admin", "root", "coordenador"].includes(userRole)) {
          navigate("/dashboard");
        } else {
          navigate("/home");
        }
      } else {
        setError("Perfil não encontrado.");
        await signOut(auth);
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans relative">
      {/* LADO ESQUERDO - DECORATIVO (IDENTIDADE HMCML) */}
      <div className="hidden lg:flex w-1/2 bg-blue-700 items-center justify-center p-16 relative overflow-hidden">
        {/* Detalhes de fundo sutis */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-blue-600"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="relative z-10 text-white w-full max-w-lg">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <Stethoscope size={40} className="text-blue-700" />
            </div>
            <div className="h-12 w-[2px] bg-blue-400 opacity-50"></div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">
                Conde Modesto Leal
              </h2>
              <span className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.3em]">
                HMCML • Unidade de TI & Patrimônio
              </span>
            </div>
          </div>

          <h1 className="text-6xl font-black mb-10 leading-[1] uppercase tracking-tighter">
            Controle de <br />
            <span className="text-blue-300">Patrimônio</span> <br />
            & Chamados
          </h1>

          <div className="space-y-6 border-l-4 border-blue-400 pl-8">
            <p className="text-blue-50 text-xl font-medium leading-relaxed">
              Plataforma oficial para gestão técnica, manutenção preventiva e controle de ativos da rede municipal.
            </p>
            
            <div className="grid grid-cols-1 gap-4 pt-6">
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white/90">
                <ClipboardCheck size={20} className="text-blue-300" /> Registro de Ativos
              </div>
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white/90">
                <Wrench size={20} className="text-blue-300" /> Manutenção Corretiva
              </div>
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white/90">
                <Monitor size={20} className="text-blue-300" /> Monitoramento de TI
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO - LOGIN */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              RODHON<span className="text-blue-700">SYSTEM</span>
            </h3>
            <div className="w-12 h-1 bg-blue-700 mt-2 rounded-full"></div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-600 rounded-r-xl flex items-center gap-3 text-xs font-bold">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">
                  E-mail de Acesso
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-slate-300 group-focus-within:text-blue-700 transition-colors">
                    <User size={20} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-700 transition-all font-bold text-slate-700"
                    placeholder="servidor@hmcml.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">
                  Senha
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-slate-300 group-focus-within:text-blue-700 transition-colors">
                    <Lock size={20} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-700 transition-all font-bold text-slate-700"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-blue-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Autenticar no Sistema"}
              </button>
            </form>
          </div>
          <p className="text-center mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
            &copy; 2026 Rodhon System | Unidade Maricá
          </p>
        </div>
      </div>

      {/* BOTÃO SUPORTE */}
      <a 
        href="https://wa.me/SEUNUMERO"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white border border-slate-200 p-3 px-5 rounded-full shadow-lg hover:bg-slate-50 transition-all"
      >
        <LifeBuoy size={18} className="text-blue-700" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Suporte Técnico</span>
      </a>
    </div>
  );
}