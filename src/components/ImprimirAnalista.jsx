import React from "react";

const ImprimirAnalista = ({ chamado, isRemaneja, formatarDataHora }) => {
  if (!chamado) return null;

  const rem = isRemaneja(chamado);

  return (
    <div
      id="area-impressao"
      className="hidden p-8 text-black bg-white uppercase"
    >
      <div className="border-[4px] border-black p-6">
        {/* CABEÇALHO */}
        <div className="flex justify-between border-b-4 border-black pb-4 mb-4 items-center">
          <h1 className="text-3xl font-black">
            {rem ? "ORDEM DE REMANEJAMENTO" : "ORDEM DE SERVIÇO"}
          </h1>
          <div className="text-right">
            <span className="text-4xl font-black">#{chamado.numeroOs}</span>
            <p className="text-[10px] font-bold">
              Impresso em: {new Date().toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {/* INFORMAÇÕES PRINCIPAIS */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-[12px] font-bold mb-6">
          <p className="border-b border-black/20 pb-1">
            SOLICITANTE: <span className="font-black">{chamado.nome}</span>
          </p>
          <p className="border-b border-black/20 pb-1">
            UNIDADE: <span className="font-black">{chamado.unidade}</span>
          </p>

          <p className="border-b border-black/20 pb-1">
            DATA ABERTURA:{" "}
            <span className="font-black">
              {formatarDataHora(chamado.criadoEm)}
            </span>
          </p>
          <p className="border-b border-black/20 pb-1">
            TÉCNICO:{" "}
            <span className="font-black">
              {chamado.tecnicoResponsavel || "________________"}
            </span>
          </p>

          {/* CAMPOS ESPECÍFICOS DE REMANEJAMENTO */}
          {rem ? (
            <>
              <p className="border-b border-black/20 pb-1">
                ORIGEM:{" "}
                <span className="font-black">
                  {chamado.setorOrigem || chamado.setor}
                </span>
              </p>
              <p className="border-b border-black/20 pb-1 text-red-700">
                DESTINO:{" "}
                <span className="font-black">{chamado.setorDestino}</span>
              </p>
            </>
          ) : (
            <p className="border-b border-black/20 pb-1">
              SETOR: <span className="font-black">{chamado.setor}</span>
            </p>
          )}

          <p className="border-b border-black/20 pb-1">
            PATRIMÔNIO:{" "}
            <span className="font-black">
              {chamado.patrimonio || "________________"}
            </span>
          </p>
        </div>

        {/* DESCRIÇÃO DO PROBLEMA */}
        <div className="border-2 border-black p-4 min-h-[120px] mb-4">
          <p className="text-[10px] font-black border-b border-black mb-2 bg-black text-white px-1 w-fit">
            DESCRIÇÃO / PROBLEMA RELATADO:
          </p>
          <p className="text-[13px] font-medium leading-tight">
            {chamado.problema ||
              chamado.descricao ||
              "Sem descrição registrada."}
          </p>
        </div>

        {/* PARECER TÉCNICO (FECHAMENTO) */}
        <div className="border-2 border-black p-4 min-h-[120px] mb-12">
          <p className="text-[10px] font-black border-b border-black mb-2 bg-black text-white px-1 w-fit">
            PARECER TÉCNICO / SERVIÇO EXECUTADO:
          </p>
          <p className="text-[13px] font-medium leading-tight italic">
            {chamado.feedbackAnalista || (
              <span className="text-slate-300">
                __________________________________________________________________________________________
                <br />
                __________________________________________________________________________________________
                <br />
                __________________________________________________________________________________________
              </span>
            )}
          </p>
        </div>

        {/* ÁREA DE ASSINATURAS */}
        <div className="mt-20 grid grid-cols-2 gap-16">
          <div className="text-center">
            <div className="border-t-2 border-black pt-2">
              <p className="text-[10px] font-black">ASSINATURA DO TÉCNICO</p>
              <p className="text-[9px] mt-1">
                {chamado.tecnicoResponsavel || "NOME LEGÍVEL"}
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="border-t-2 border-black pt-2">
              <p className="text-[10px] font-black">
                ASSINATURA DO SOLICITANTE / CLIENTE
              </p>
              <p className="text-[9px] mt-1">DATA: ____/____/2026</p>
            </div>
          </div>
        </div>

        {/* RODAPÉ DO DOCUMENTO */}
        <div className="mt-12 pt-4 border-t border-dashed border-black/30 flex justify-between text-[8px] font-bold">
          <span>SISTEMA DE CHAMADOS - TI</span>
          <span>DOCUMENTO OBRIGATÓRIO PARA MOVIMENTAÇÃO DE EQUIPAMENTOS</span>
        </div>
      </div>
    </div>
  );
};

export default ImprimirAnalista;
