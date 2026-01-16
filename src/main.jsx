import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; 
// Importamos o AuthProvider que você configurou no arquivo Firebase
import { AuthProvider } from "./api/Firebase"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* O AuthProvider fornece os dados do usuário para o Guardião e para o App */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);