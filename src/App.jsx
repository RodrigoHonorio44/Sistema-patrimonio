import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
// Corrigido para minúsculo para evitar erro de case-sensitivity
import { auth, db } from "./api/firebase"; 
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

// NOVO IMPORT: Saída de Equipamento
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

  // --- DERRUBADA DE CONEXÃO EM TEMPO REAL ---
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, "usuarios", user.uid);
    const unsubscribeSessao = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const localSessionId = localStorage.getItem("current_session_id");
        if (data.currentSessionId && data.currentSessionId !== localSessionId) {
          toast.error(
            "Acesso detectado em outro dispositivo. Encerrando sessão...",
            {
              autoClose: 5000,
              theme: "dark",
            }
          );
          setTimeout(() => {
            signOut(auth);
            localStorage.removeItem("current_session_id");
            window.location.href = "/login";
          }, 4000);
        }
      }
    });
    return () => unsubscribeSessao();
  }, [user]);

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
            const bloqueado =
              data.status === "Bloqueado" || data.statusLicenca === "bloqueada";

            if (bloqueado) {
              sessionStorage.setItem("app_blocked", "true");
              setIsBlocked(true);
              setUser(null);
              await signOut(auth);
            } else {
              sessionStorage.removeItem("app_blocked");
              setIsBlocked(false);
              setUserData(data);
              setRole(data.role?.toLowerCase().trim() || "usuario");
              setUser(currentUser);
            }
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        setUser(null);
        if (!sessionStorage.getItem("app_blocked")) setIsBlocked(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener("force-block", handleBlockEvent);
    };
  }, []);

  // --- LÓGICA DE PERMISSÕES ---
  const temAcesso = (moduloId) => {
    if (role === "root") return true;
    if (!userData) return false;
    const permissoes = userData.permissoesExtras || {};
    return (
      permissoes[moduloId] === true ||
      permissoes[moduloId.toLowerCase()] === true
    );
  };

  const isTiOrAdmin = useMemo(
    () => ["root", "admin", "analista", "ti"].includes(role),
    [role]
  );
  const isGestao = useMemo(
    () => ["chefia", "coordenador"].includes(role),
    [role]
  );
  const isUsuarioComum = useMemo(() => role === "usuario", [role]);

  const getHomePath = () => {
    if (isTiOrAdmin) return "/dashboard";
    if (isGestao) return "/gestao-chefia";
    return "/home";
  };

  const ProtectedRoute = ({ children, condition }) => {
    if (loading) return null;
    return condition ? children : <Navigate to={getHomePath()} replace />;
  };

  if (loading || loadingLicense) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        <p className="mt-4 text-slate-400 font-black text-[10px]">
          VALIDANDO SEGURANÇA
        </p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <BrowserRouter>
        <Routes>
          {isBlocked ? (
            <>
              <Route path="/bloqueado" element={<MensagemBloqueio />} />
              <Route path="*" element={<Navigate to="/bloqueado" replace />} />
            </>
          ) : !isLicenseValid ? (
            <>
              <Route path="/expirado" element={<LicencaExpirada />} />
              <Route path="*" element={<Navigate to="/expirado" replace />} />
            </>
          ) : (
            <>
              <Route
                path="/login"
                element={
                  !user ? <Login /> : <Navigate to={getHomePath()} replace />
                }
              />

              {user ? (
                <Route element={<GuardiaoSessao />}>
                  <Route
                    path="/"
                    element={<Navigate to={getHomePath()} replace />}
                  />

                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/painel-analista"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <PainelAnalista />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cadastro-equipamento"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <CadastroEquipamento />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/saida-equipamento"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <SaidaEquipamento />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/estoque"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <Estoque />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventario"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <Inventario />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transferencia"
                    element={
                      <ProtectedRoute condition={isTiOrAdmin}>
                        <Transferencia />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/gestao-chefia"
                    element={
                      <ProtectedRoute condition={isGestao || role === "root"}>
                        <GestaoChefia />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<PainelGestao />} />
                    <Route path="painel-gestao" element={<PainelGestao />} />
                  </Route>

                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute condition={isUsuarioComum}>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/bi"
                    element={
                      <ProtectedRoute condition={temAcesso("dashboard_bi")}>
                        <DashboardBI />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/remanejamento"
                    element={
                      <ProtectedRoute
                        condition={isTiOrAdmin || temAcesso("remanejamento")}
                      >
                        <FormRemanejamento />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/usuarios"
                    element={
                      <ProtectedRoute
                        condition={role === "admin" || role === "root"}
                      >
                        <Usuarios />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/licencas"
                    element={
                      <ProtectedRoute condition={role === "root"}>
                        <AdminLicencas />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/trocar-senha" element={<TrocarSenha />} />
                  <Route
                    path="/cadastro-chamado"
                    element={<CadastroChamado />}
                  />

                  <Route
                    path="*"
                    element={<Navigate to={getHomePath()} replace />}
                  />
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