import React from "react";
import { Outlet } from "react-router-dom";
import { useInactivityLogout } from "../hooks/useInactivityLogout";

const GuardiaoSessao = () => {
  // Monitora inatividade (40 minutos)
  useInactivityLogout(40);

  // O Outlet é essencial para renderizar as rotas filhas
  // definidas dentro do Route que envolve o Guardião no App.js
  return <Outlet />;
};

export default GuardiaoSessao;
