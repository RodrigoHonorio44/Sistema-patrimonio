import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { auth, db } from "./api/Firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// COMPONENTES E PAGES
import GuardiaoSessao from "./components/GuardiaoSessao";
import { useLicenseGuard } from "./hooks/useLicenseGuard";
import LicencaExpirada from "./pages/LicencaExpirada";
import MensagemBloqueio from "./pages/MensagemBloqueio";

// Importação das Páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardBI from "./pages/DashboardBI";
import PainelAnalista from "./pages/PainelAnalista";
import Home from "./pages/Home";
import CadastroEquipamento from "./pages/CadastroEquipamento";
import Transferencia from "./pages/Transferencia";
import Inventario from "./pages/Inventario";
import Estoque from "./pages/Estoque";
import Usuarios from "./pages/Usuarios";
import TrocarSenha from "./pages/TrocarSenha";
import AdminLicencas from "./pages/AdminLicencas";
import CadastroChamado from "./components/CadastroChamado";
import GestaoChefia from "./pages/GestaoeChefia";
import PainelGestao from "./pages/PainelGestao";
import FormRemanejamento from "./components/FormRemanejamento";
import SaidaEquipamento from "./pages/SaidaEquipamento"; 

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(
    !!sessionStorage.getItem("app_blocked")
  );

  const { isLicenseValid, loadingLicense } = useLicenseGuard();

  // --- LÓGICA DE PERMISSÕES (NORMALIZADA) ---
  const normalizedRole = useMemo(() => role?.toLowerCase().trim() || "", [role]);

  const isTiOrAdmin = useMemo(() => 
    ["root", "admin", "analista", "ti"].includes(normalizedRole), 
  [normalizedRole]);

  const isGestao = useMemo(() => 
    ["chefia", "coordenador"].includes(normalizedRole), 
  [normalizedRole]);

  const isUsuarioComum = useMemo(() => 
    normalizedRole === "usuario", 
  [normalizedRole]);

  const temAcesso = (moduloId) => {
    if (normalizedRole === "root") return true;
    if (!userData) return false;
    const permissoes = userData.permissoesExtras || {};
    return permissoes[moduloId] === true || permissoes[moduloId.toLowerCase()] === true;
  };

  // --- LÓGICA DE DIRECIONAMENTO (FILTRO ROOT PRIORITÁRIO) ---
  const getHomePath = () => {
    if (!userData) return "/login";
    
    // EXCEÇÃO ROOT: Sempre vai para o Dashboard, independente de troca de senha
    if (normalizedRole === "root") return "/dashboard";

    // OUTROS CARGOS: Se precisar trocar senha, vai para tela de troca
    if (userData.requiresPasswordChange !== false) {
      return "/trocar-senha";
    }

    if (isTiOrAdmin) return "/dashboard";
    if (isGestao) return "/gestao-chefia";
    return "/home";
  };

  // --- COMPONENTE DE ROTA PROTEGIDA ---
  const ProtectedRoute = ({ children, condition }) => {
    if (loading) return null;
    
    // ROOT ignora a trava de senha aqui também
    if (userData?.requiresPasswordChange !== false && normalizedRole !== "root") {
      return <Navigate to="/trocar-senha" replace />;
    }

    return condition ? children : <Navigate to={getHomePath()} replace />;
  };

  // --- OBSERVAÇÃO DE ESTADO DE AUTENTICAÇÃO E BLOQUEIO ---
  useEffect(() => {
    const handleBlockEvent = () => {
      sessionStorage.setItem("app_blocked", "true");
      setIsBlocked(true);
    };
    window.addEventListener("force-block", handleBlockEvent);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const bloqueado = data.status === "Bloqueado" || data.statusLicenca === "bloqueada";

            if (bloqueado) {
              sessionStorage.setItem("app_blocked", "true");
              setIsBlocked(true);
              setUser(null);
              await signOut(auth);
            } else {
              sessionStorage.removeItem("app_blocked");
              setIsBlocked(false);
              setUserData(data);
              setRole(data.role || "usuario");
              setUser(currentUser);
            }
          }
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
        }
      } else {
        setUser(null);
        setUserData(null);
        setRole(null);
        if (!sessionStorage.getItem("app_blocked")) setIsBlocked(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener("force-block", handleBlockEvent);
    };
  }, []);

  // --- DERRUBADA DE CONEXÃO EM TEMPO REAL ---
  useEffect(() => {
    if (!user || !userData) return;

    const userDocRef = doc(db, "usuarios", user.uid);
    const unsubscribeSessao = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const localSessionId = localStorage.getItem("current_session_id");

        if (data.currentSessionId && localSessionId && data.currentSessionId !== localSessionId) {
          toast.warning("Acesso detectado em outro dispositivo. Esta sessão será encerrada.", {
            position: "top-center",
            autoClose: 5000,
            theme: "dark",
          });

          setTimeout(async () => {
            localStorage.removeItem("current_session_id");
            await signOut(auth);
            window.location.href = "/login";
          }, 3000);
        }
      }
    });

    return () => unsubscribeSessao();
  }, [user, userData]);

  if (loading || loadingLicense) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        <p className="mt-4 text-slate-400 font-black text-[10px]">VERIFICANDO SEGURANÇA</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <BrowserRouter>
        <Routes>
          {isBlocked ? (
            <Route path="*" element={<MensagemBloqueio />} />
          ) : !isLicenseValid ? (
            <Route path="*" element={<LicencaExpirada />} />
          ) : (
            <>
              <Route
                path="/login"
                element={!user ? <Login /> : <Navigate to={getHomePath()} replace />}
              />

              {user && userData ? (
                <Route element={<GuardiaoSessao />}>
                  {/* FILTRAGEM ROOT: Se não for root e o campo for diferente de false, trava na senha */}
                  {userData.requiresPasswordChange !== false && normalizedRole !== "root" ? (
                    <>
                      <Route path="/trocar-senha" element={<TrocarSenha />} />
                      <Route path="*" element={<Navigate to="/trocar-senha" replace />} />
                    </>
                  ) : (
                    <>
                      <Route path="/" element={<Navigate to={getHomePath()} replace />} />
                      
                      <Route path="/dashboard" element={<ProtectedRoute condition={isTiOrAdmin}><Dashboard /></ProtectedRoute>} />
                      <Route path="/painel-analista" element={<ProtectedRoute condition={isTiOrAdmin}><PainelAnalista /></ProtectedRoute>} />
                      <Route path="/cadastro-equipamento" element={<ProtectedRoute condition={isTiOrAdmin}><CadastroEquipamento /></ProtectedRoute>} />
                      <Route path="/saida-equipamento" element={<ProtectedRoute condition={isTiOrAdmin}><SaidaEquipamento /></ProtectedRoute>} />
                      <Route path="/estoque" element={<ProtectedRoute condition={isTiOrAdmin}><Estoque /></ProtectedRoute>} />
                      <Route path="/inventario" element={<ProtectedRoute condition={isTiOrAdmin}><Inventario /></ProtectedRoute>} />
                      <Route path="/transferencia" element={<ProtectedRoute condition={isTiOrAdmin}><Transferencia /></ProtectedRoute>} />

                      <Route path="/gestao-chefia" element={<ProtectedRoute condition={isGestao || normalizedRole === "root"}><GestaoChefia /></ProtectedRoute>}>
                        <Route index element={<PainelGestao />} />
                        <Route path="painel-gestao" element={<PainelGestao />} />
                      </Route>

                      <Route path="/home" element={<ProtectedRoute condition={isUsuarioComum}><Home /></ProtectedRoute>} />
                      <Route path="/bi" element={<ProtectedRoute condition={temAcesso("dashboard_bi")}><DashboardBI /></ProtectedRoute>} />
                      <Route path="/remanejamento" element={<ProtectedRoute condition={isTiOrAdmin || temAcesso("remanejamento")}><FormRemanejamento /></ProtectedRoute>} />
                      <Route path="/usuarios" element={<ProtectedRoute condition={normalizedRole === "admin" || normalizedRole === "root"}><Usuarios /></ProtectedRoute>} />
                      <Route path="/admin/licencas" element={<ProtectedRoute condition={normalizedRole === "root"}><AdminLicencas /></ProtectedRoute>} />
                      <Route path="/cadastro-chamado" element={<ProtectedRoute condition={true}><CadastroChamado /></ProtectedRoute>} />
                      <Route path="/trocar-senha" element={<TrocarSenha />} />

                      <Route path="*" element={<Navigate to={getHomePath()} replace />} />
                    </>
                  )}
                </Route>
              ) : (
                <Route path="*" element={<Navigate to="/login" replace />} />
              )}
            </>
          )}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;