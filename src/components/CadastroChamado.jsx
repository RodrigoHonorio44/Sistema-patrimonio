import React, { useState } from "react";
import {
  X,
  Send,
  Loader2,
  Building2,
  Monitor,
  Hash,
  MapPin,
  FileText,
  BarChart,
  CheckCircle2,
} from "lucide-react";
import { auth, db } from "../api/Firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function CadastroChamado({ isOpen = true, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState("");

  const [unidade, setUnidade] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [setor, setSetor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("média");
  const [naoSeiPatrimonio, setNaoSeiPatrimonio] = useState(false);

  // Se for modal e estiver explicitamente fechado, não renderiza
  if (onClose && !isOpen) return null;

  const handleFechar = () => {
    setSucesso(false);
    if (onClose) {
      onClose(); // Fecha o modal (Home/Gestão)
    } else {
      navigate(-1); // Volta a rota (Dashboard)
    }
  };

  const toggleNaoSei = () => {
    const novoEstado = !naoSeiPatrimonio;
    setNaoSeiPatrimonio(novoEstado);
    setPatrimonio(novoEstado ? "S/P" : "");
  };

  const handleNovoChamado = async (e) => {
    e.preventDefault();
    if (!unidade) return;
    setLoading(true);

    const novaOs = `${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    try {
      await addDoc(collection(db, "chamados"), {
        equipamento,
        patrimonio,
        setor,
        descricao,
        unidade,
        prioridade,
        criadoEm: serverTimestamp(),
        emailSolicitante: auth.currentUser.email,
        nome:
          auth.currentUser.displayName || auth.currentUser.email.split("@")[0],
        numeroOs: novaOs,
        status: "aberto",
        userId: auth.currentUser.uid,
        feedbackAnalista: "",
        tecnicoResponsavel: "",
      });
      setProtocoloGerado(novaOs);
      setSucesso(true);
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar chamado técnico.");
    } finally {
      setLoading(false);
    }
  };

  // Mantém o fundo escuro e centralização independente de ser rota ou modal
  const containerStyle =
    "fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md transition-all";

  return (
    <div className={containerStyle}>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
        {sucesso ? (
          <div className="p-10 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">
              Protocolo Gerado!
            </h2>
            <p className="text-slate-500 mb-8 italic text-xl font-bold">
              #{protocoloGerado}
            </p>
            <button
              onClick={handleFechar}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all uppercase text-xs"
            >
              Concluir e Voltar
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
                Novo Chamado
              </h2>
              <button
                onClick={handleFechar}
                className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleNovoChamado} className="space-y-4">
              {/* UNIDADE */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                  Unidade
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <select
                    required
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 appearance-none text-sm font-bold text-slate-700 transition-all"
                  >
                    <option value="">Onde você está?</option>
                    <option value="Hospital Conde">Hospital Conde</option>
                    <option value="UPA INOÃ">UPA INOÃ</option>
                    <option value="UPA SANTA RITA">UPA SANTA RITA</option>
                    <option value="SAMU BARROCO">SAMU BARROCO</option>
                    <option value="SAMU CENTRO">SAMU CENTRO</option>
                  </select>
                </div>
              </div>

              {/* GRID: EQUIPAMENTO E PATRIMÔNIO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Monitor
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    required
                    value={equipamento}
                    onChange={(e) => setEquipamento(e.target.value)}
                    placeholder="Equipamento"
                    className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 text-sm font-bold"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <button
                      type="button"
                      onClick={toggleNaoSei}
                      className={`text-[9px] font-black px-2 py-1 rounded-lg transition-all ${
                        naoSeiPatrimonio
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {naoSeiPatrimonio ? "DIGITAR" : "NÃO SEI TAG"}
                    </button>
                  </div>
                  <div className="relative">
                    <Hash
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      required
                      readOnly={naoSeiPatrimonio}
                      value={patrimonio}
                      onChange={(e) => setPatrimonio(e.target.value)}
                      placeholder="Patrimônio/Tag"
                      className={`w-full p-4 pl-11 border-2 rounded-2xl outline-none text-sm font-bold ${
                        naoSeiPatrimonio
                          ? "bg-amber-50 border-amber-200"
                          : "bg-slate-50 border-slate-50 focus:border-blue-600"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* GRID: SETOR E PRIORIDADE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <MapPin
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    required
                    value={setor}
                    onChange={(e) => setSetor(e.target.value)}
                    placeholder="Setor"
                    className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-blue-600 text-sm font-bold"
                  />
                </div>
                <div className="relative">
                  <BarChart
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value)}
                    className="w-full p-4 pl-11 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 appearance-none text-sm font-bold"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="média">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <FileText
                  className="absolute left-4 top-4 text-slate-400"
                  size={18}
                />
                <textarea
                  required
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o problema detalhadamente..."
                  rows="3"
                  className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:bg-white focus:border-blue-600 text-sm font-medium resize-none"
                />
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase text-xs active:scale-95 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send size={16} /> Enviar Chamado
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
