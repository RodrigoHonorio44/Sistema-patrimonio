import React from "react";
import { FiX, FiInfo, FiMapPin, FiTool, FiAlertCircle } from "react-icons/fi";

const ModalDetalhesAnalista = ({ chamado, isRemaneja, onClose, isOpen }) => {
  if (!isOpen || !chamado) return null;

  const rem = isRemaneja(chamado);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Box do Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-[24px] sm:rounded-[32px] w-full max-w-2xl p-5 sm:p-8 border-t-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] ${
          rem ? "border-orange-500" : "border-blue-600"
        }`}
      >
        {/* Cabeçalho - Fixo no topo */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase italic text-slate-800 flex items-center gap-2 leading-tight">
              <FiInfo className={rem ? "text-orange-500" : "text-blue-600"} />
              Ficha OS #{chamado.numeroOs}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
              Status Atual:{" "}
              <span className="text-slate-600">{chamado.status}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm flex-shrink-0"
          >
            <FiX size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Conteúdo com Scroll Interno */}
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {/* Grid Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Solicitante
              </p>
              <p className="font-bold text-slate-700 uppercase break-words">
                {chamado.nome}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Unidade / Local
              </p>
              <p className="font-bold text-slate-700 uppercase break-words">
                {chamado.unidade}
              </p>
            </div>
          </div>

          {/* Seção de Localização/Patrimônio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <FiMapPin size={10} /> {rem ? "Setor de Origem" : "Setor"}
              </p>
              <p className="font-bold text-slate-700 uppercase break-words">
                {chamado.setor || chamado.setorOrigem || "Não informado"}
              </p>
            </div>

            {rem ? (
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">
                  Setor de Destino
                </p>
                <p className="font-bold text-orange-700 uppercase break-words">
                  {chamado.setorDestino || "Não Informado"}
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Patrimônio
                </p>
                <p className="font-bold text-slate-700 uppercase">
                  {chamado.patrimonio || "N/A"}
                </p>
              </div>
            )}
          </div>

          {/* Descrição do Problema */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-l-4 border-blue-500">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
              Descrição do Problema
            </p>
            <p className="font-bold text-slate-700 text-sm leading-relaxed whitespace-pre-wrap uppercase">
              {chamado.problema ||
                chamado.descricao ||
                "Sem detalhes adicionais."}
            </p>
          </div>

          {/* SLA/Pausa */}
          {chamado.status === "pendente" && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start gap-3">
              <FiAlertCircle
                className="text-amber-600 mt-1 flex-shrink-0"
                size={18}
              />
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase">
                  Motivo da Pausa (SLA)
                </p>
                <p className="text-sm font-bold text-amber-800 uppercase">
                  {chamado.motivoPausa}
                </p>
                {chamado.detalhePausa && (
                  <p className="text-xs text-amber-700 italic mt-1 leading-tight">
                    {chamado.detalhePausa}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Parecer Técnico */}
          {(chamado.feedbackAnalista || (rem && chamado.patrimonio)) && (
            <div className="bg-emerald-50 p-4 sm:p-5 rounded-2xl border-l-4 border-emerald-500">
              <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest flex items-center gap-1">
                <FiTool size={12} /> Parecer Técnico / Finalização
              </p>
              <p className="font-bold text-emerald-800 text-sm leading-relaxed uppercase">
                {chamado.feedbackAnalista || "Atendimento concluído."}
              </p>
              {chamado.patrimonio && (
                <div className="mt-3 pt-2 border-t border-emerald-200">
                  <p className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter text-right">
                    Confirmado Patrimônio: {chamado.patrimonio}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão Inferior */}
        <div className="mt-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg active:scale-[0.98] text-xs sm:text-sm"
          >
            Fechar Visualização
          </button>
        </div>
      </div>

      {/* ESTILO CORRIGIDO - Removido o atributo 'jsx' que causava erro */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `,
        }}
      />
    </div>
  );
};

export default ModalDetalhesAnalista;
