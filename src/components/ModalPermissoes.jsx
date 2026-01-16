import React, { useState } from "react";
import { db } from "../api/Firebase";
import { doc, updateDoc } from "firebase/firestore";
import { X, ShieldCheck, ShieldAlert, Save } from "lucide-react";
import { toast } from "react-toastify";

export default function ModalPermissoes({ usuario, aoFechar }) {
  // FUNÇÃO DE NORMALIZAÇÃO
  const inicializarPermissoes = () => {
    const extras = usuario.permissoesExtras || {};
    const estadoLimpo = {};

    Object.keys(extras).forEach((key) => {
      if (typeof extras[key] === "boolean") {
        estadoLimpo[key] = extras[key];
      }
    });

    Object.values(extras).forEach((val) => {
      if (typeof val === "string") {
        estadoLimpo[val] = true;
      }
    });

    return estadoLimpo;
  };

  const [permissoes, setPermissoes] = useState(inicializarPermissoes);
  const [salvando, setSalvando] = useState(false);

  // LISTA DE MÓDULOS ATUALIZADA
  const modulosDisponiveis = [
    {
      id: "dashboard_bi",
      nome: "Dashboard Power BI",
      desc: "Análise de indicadores",
    },
    {
      id: "chamados",
      nome: "Gestão de Chamados",
      desc: "Acesso à fila e suporte",
    },
    {
      id: "remanejamento", // NOVO MÓDULO ADICIONADO
      nome: "Remanejamento",
      desc: "Operação de troca de ativos/setores",
    },
    {
      id: "inventario",
      nome: "Inventário / Patrimônio",
      desc: "Controle de ativos",
    },
    {
      id: "financeiro",
      nome: "Financeiro / Faturamento",
      desc: "Relatórios e notas",
    },
    { id: "kb", nome: "Base de Conhecimento", desc: "Wiki e tutoriais" },
    {
      id: "monitoramento",
      nome: "Monitoramento Server",
      desc: "Status de servidores",
    },
  ];

  const toggleModulo = (id) => {
    setPermissoes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const salvarPermissoes = async () => {
    setSalvando(true);
    try {
      const userRef = doc(db, "usuarios", usuario.id);

      await updateDoc(userRef, {
        permissoesExtras: permissoes,
      });

      toast.success(`Módulos de ${usuario.nome} atualizados!`);
      aoFechar();
    } catch (error) {
      toast.error("Erro ao salvar permissões.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-4xl shadow-2xl overflow-hidden">
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase italic">
              Privilégios SaaS
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Cliente: {usuario.nome}
            </p>
          </div>
          <button
            onClick={aoFechar}
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {modulosDisponiveis.map((modulo) => (
            <div
              key={modulo.id}
              onClick={() => toggleModulo(modulo.id)}
              className={`group flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                permissoes[modulo.id]
                  ? "border-emerald-100 bg-emerald-50/30"
                  : "border-slate-100 bg-white opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${
                    permissoes[modulo.id]
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {permissoes[modulo.id] ? (
                    <ShieldCheck size={18} />
                  ) : (
                    <ShieldAlert size={18} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase">
                    {modulo.nome}
                  </p>
                  <p className="text-[9px] text-slate-500">{modulo.desc}</p>
                </div>
              </div>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  permissoes[modulo.id] ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                    permissoes[modulo.id] ? "left-6" : "left-1"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={aoFechar}
            className="flex-1 py-3 text-[10px] font-black uppercase text-slate-500"
          >
            Cancelar
          </button>
          <button
            onClick={salvarPermissoes}
            disabled={salvando}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all"
          >
            {salvando ? (
              "Sincronizando..."
            ) : (
              <>
                <Save size={14} /> Aplicar Travas
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
