import React, { useState, useEffect } from "react";
import { db, auth } from "../api/Firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPackage,
  FiArrowLeft,
  FiSave,
  FiHash,
  FiMapPin,
  FiInfo,
  FiActivity,
} from "react-icons/fi";

// Importação dos componentes de Layout
import Header from "../components/Header";
import Footer from "../components/Footer";

const CadastroEquipamento = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");

  const [formData, setFormData] = useState({
    patrimonio: "",
    nome: "",
    tipo: "Mobiliário",
    quantidade: 1,
    setor: "",
    unidade: "",
    estado: "Novo",
    observacoes: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = data.role?.toLowerCase().trim() || "";

            const cargosAutorizados = [
              "root",
              "adm",
              "admin",
              "analista",
              "ti",
            ];

            if (cargosAutorizados.includes(role)) {
              setNomeUsuario(data.nome || "Usuário");
              setVerificandoAcesso(false);
            } else {
              toast.error(
                "Acesso negado: Você não tem permissão de nível técnico."
              );
              navigate("/dashboard");
            }
          } else {
            toast.error("Perfil de usuário não encontrado.");
            navigate("/login");
          }
        } catch (error) {
          console.error("Erro ao validar acesso:", error);
          toast.error("Erro na verificação de segurança.");
          navigate("/dashboard");
        }
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const unidades = [
    "Hospital Conde",
    "Upa de Inoã",
    "Upa de Santa Rita",
    "Samu Barroco",
    "Samu Ponta Negra",
    "Samu Centro",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const idToast = toast.loading("Registrando no sistema...");

    try {
      await addDoc(collection(db, "ativos"), {
        ...formData,
        patrimonio: formData.patrimonio.toUpperCase(),
        quantidade: Number(formData.quantidade),
        status: "Ativo",
        criadoEm: serverTimestamp(),
        cadastradoPor: nomeUsuario,
      });

      toast.update(idToast, {
        render: "Patrimônio registrado com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setFormData({ ...formData, patrimonio: "", nome: "", observacoes: "" });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.update(idToast, {
        render: "Erro ao salvar no banco de dados",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (verificandoAcesso) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-r-4"></div>
        <p className="mt-4 text-blue-600 font-bold uppercase tracking-widest text-xs">
          Validando permissões...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* HEADER ADICIONADO */}
      <Header />

      <main className="flex-1 p-4 md:p-8 font-sans">
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
              <FiPackage size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Novo Patrimônio
              </h1>
              <p className="text-slate-500 text-sm">
                Cadastro de entrada de ativos no sistema
              </p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all font-medium bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm"
          >
            <FiArrowLeft /> Voltar
          </Link>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-10">
          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                  <FiHash className="text-blue-500" /> TAG do Patrimônio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: HMC-1234"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={formData.patrimonio}
                  onChange={(e) =>
                    setFormData({ ...formData, patrimonio: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                  <FiMapPin className="text-blue-500" /> Unidade Destino
                </label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                  value={formData.unidade}
                  onChange={(e) =>
                    setFormData({ ...formData, unidade: e.target.value })
                  }
                >
                  <option value="">Selecione a Unidade...</option>
                  {unidades.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                  <FiInfo className="text-blue-500" /> Tipo de Item
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value })
                  }
                >
                  <option value="Mobiliário">Mobiliário</option>
                  <option value="Refrigeração">Refrigeração</option>
                  <option value="Informática">Informática</option>
                  <option value="Equip. Médico">Equipamento Médico</option>
                  <option value="Ferramenta">Ferramenta</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                  <FiMapPin className="text-blue-500" /> Setor / Sala
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Recepção / Sala 02"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={formData.setor}
                  onChange={(e) =>
                    setFormData({ ...formData, setor: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                <FiPackage className="text-blue-500" /> Descrição do Equipamento
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Cadeira de Rodas Motorizada"
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={formData.quantidade}
                  onChange={(e) =>
                    setFormData({ ...formData, quantidade: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                  <FiActivity className="text-blue-500" /> Estado de Conservação
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value })
                  }
                >
                  <option value="Novo">Novo</option>
                  <option value="Bom">Bom</option>
                  <option value="Regular">Regular</option>
                  <option value="Danificado">Danificado</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Observações Adicionais
              </label>
              <textarea
                rows="3"
                placeholder="Detalhes como marca, cor, número de série..."
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiSave className="text-xl" /> Finalizar Registro de Patrimônio
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* FOOTER ADICIONADO */}
      <Footer />
    </div>
  );
};

export default CadastroEquipamento;