import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import React, { createContext, useContext, useState, useEffect } from "react";

const firebaseConfig = {
  apiKey: "AIzaSyBRQCGj_7KHKyW5zjJOgSCAnlNqj93GVw0",
  authDomain: "webchamados-d3d49.firebaseapp.com",
  projectId: "webchamados-d3d49",
  storageBucket: "webchamados-d3d49.firebasestorage.app",
  messagingSenderId: "134652632772",
  appId: "1:134652632772:web:54e21787e49269ec8c7391",
};

// Inicialização
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- LÓGICA DE CONTEXTO (O que resolve o erro de export) ---
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Normaliza o cargo para evitar erros de leitura
            const role = data.role ? String(data.role).toLowerCase().trim() : "user";
            setUserData({ ...data, role });
          }
        } catch (e) {
          console.error("Erro ao buscar dados do usuário:", e);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ESTE É O EXPORT QUE O GUARDIAO ESTÁ PROCURANDO:
export const useAuth = () => useContext(AuthContext);

export default app;