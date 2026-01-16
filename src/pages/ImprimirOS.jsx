import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../api/Firebase"; // Verifique se o caminho está correto
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Printer, ArrowLeft } from "lucide-react";

export default function ImprimirOS() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const docSnap = await getDoc(doc(db, "chamados", id));
        if (docSnap.exists()) {
          setDados(docSnap.data());
        } else {
          toast.error("OS não encontrada!");
          navigate("/operacional");
        }
      } catch (error) {
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
  }, [id, navigate]);

  if (loading)
    return (
      <div className="p-10 text-center font-bold">Carregando formulário...</div>
    );

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 print:p-0">
      {/* Botões de Ação - Somente Tela */}
      <div className="flex gap-4 mb-8 print:hidden justify-center">
        <button
          onClick={() => window.print()}
          className="bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-emerald-700"
        >
          <Printer size={20} /> Imprimir Agora
        </button>
        <button
          onClick={() => navigate(-1)}
          className="bg-slate-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
      </div>

      {/* Documento OS */}
      <div className="max-w-[800px] mx-auto border-2 border-slate-800 p-8 shadow-sm">
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              ORDEM DE SERVIÇO
            </h1>
            <p className="text-lg">
              Protocolo:{" "}
              <strong className="text-blue-600">#{dados?.numeroOs}</strong>
            </p>
          </div>
          <div className="text-right text-sm">
            <p>
              <strong>Data de Abertura:</strong>{" "}
              {dados?.criadoEm?.toDate().toLocaleString()}
            </p>
            <p>
              <strong>Status:</strong> {dados?.status?.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="space-y-1">
            <h3 className="font-black border-b border-slate-200 uppercase text-xs text-slate-500 mb-2">
              Solicitante
            </h3>
            <p>
              <strong>Nome:</strong> {dados?.nome}
            </p>
            <p>
              <strong>Unidade:</strong> {dados?.unidade}
            </p>
            <p>
              <strong>Setor:</strong> {dados?.setor || "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-black border-b border-slate-200 uppercase text-xs text-slate-500 mb-2">
              Equipamento
            </h3>
            <p>
              <strong>Patrimônio:</strong> {dados?.patrimonio || "---"}
            </p>
            <p>
              <strong>Técnico:</strong> {dados?.tecnicoResponsavel || "---"}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-black border-b border-slate-200 uppercase text-xs text-slate-500 mb-2">
            Descrição do Problema
          </h3>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded min-h-[100px]">
            {dados?.descricao}
          </div>
        </div>

        <div className="mb-12">
          <h3 className="font-black border-b border-slate-200 uppercase text-xs text-slate-500 mb-2">
            Parecer Técnico / Solução
          </h3>
          <div className="p-4 border-2 border-dashed border-slate-300 rounded min-h-[150px]">
            {dados?.feedbackAnalista ||
              "Espaço reservado para laudo técnico manual se necessário."}
          </div>
        </div>

        {/* Área de Assinaturas */}
        <div className="grid grid-cols-2 gap-20 pt-10">
          <div className="text-center">
            <div className="border-t border-slate-800 pt-2">
              <p className="font-bold text-sm">Assinatura do Técnico</p>
              <p className="text-xs text-slate-500">
                {dados?.tecnicoResponsavel || "Nome Legível"}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-800 pt-2">
              <p className="font-bold text-sm">Assinatura do Solicitante</p>
              <p className="text-xs text-slate-500">{dados?.nome}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
