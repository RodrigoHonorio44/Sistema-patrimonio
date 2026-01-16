import { useEffect, useRef, useCallback } from "react";
import { auth } from "../api/Firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";

export const useInactivityLogout = (timeoutMinutes = 40) => {
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const ms = timeoutMinutes * 60 * 1000;

  // Função de Logout
  const handleLogout = useCallback(async () => {
    if (auth.currentUser) {
      try {
        await signOut(auth);
        toast.warning("Sessão encerrada por inatividade.", {
          toastId: "logout-toast",
          autoClose: 5000,
        });
      } catch (err) {
        console.error("Erro ao deslogar:", err);
      }
    }
  }, []);

  // Função para resetar o timer
  const resetTimer = useCallback(() => {
    // Limpeza rigorosa do timer anterior
    if (timerRef.current) clearTimeout(timerRef.current);

    // Agenda o próximo logout
    timerRef.current = setTimeout(() => {
      handleLogout();
    }, ms);
  }, [handleLogout, ms]);

  useEffect(() => {
    // Escutamos a mudança de estado do Firebase
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const events = [
          "mousedown",
          "mousemove",
          "keypress",
          "scroll",
          "touchstart",
          "click",
        ];

        // Handler com verificação de tempo para não sobrecarregar o processador
        const handleUserActivity = () => {
          const now = Date.now();
          // Só reseta se houver passado pelo menos 1 segundo desde a última atividade (throttle)
          if (now - lastActivityRef.current > 1000) {
            lastActivityRef.current = now;
            resetTimer();
          }
        };

        // Adiciona ouvintes
        events.forEach((e) => window.addEventListener(e, handleUserActivity));

        // Inicia o contador inicial
        resetTimer();

        // Cleanup dos eventos quando o usuário deslogar ou o componente desmontar
        return () => {
          events.forEach((e) =>
            window.removeEventListener(e, handleUserActivity)
          );
          if (timerRef.current) clearTimeout(timerRef.current);
        };
      } else {
        // Se não há usuário, garante que nenhum timer está rodando
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    });

    return () => {
      unsubscribeAuth();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
};
