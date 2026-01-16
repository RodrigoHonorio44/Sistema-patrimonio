import React, { useEffect, useState } from "react";
import { db, auth } from "../api/Firebase";
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  ClipboardList, Users, LayoutDashboard, PlusCircle, 
  ArrowRightLeft, Lock, LogOut, UserPlus, Eye 
} from "lucide-react";
import { toast } from "react-toastify";

// IMPORTAÇÃO DOS SEUS COMPONENTES (IGUAIS AOS DA HOME)
import CadastroChamado from "../components/CadastroChamado";
import ModalDetalhes from "../components/ModalDetalhes";

export default function PainelCoordenacao() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("chamados");
  const [userName, setUserName] = useState("Coordenador");
  
  // Estados para Modais
  const [modalChamadoAberto, setModalChamadoAberto] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  
  // Lista de atividades para o Coordenador visualizar
  const [atividades, setAtividades] = useState([]);

  // Estado do Formulário de Remanejo
  const [formDataRemanejo, setFormDataRemanejo] = useState({ tecnicoId: "", deSetor: "", paraSetor: "", motivo: "" });

  useEffect(() => {
    const verificarAcesso = () => {
      const user = auth.currentUser;
      if (!user) { navigate("/login"); return; }

      const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserName(data.nome || "Coordenador");
          const role = data.role?.toLowerCase().trim();
          if (role !== "coordenador" && role !== "admin") { navigate("/home"); return; }
          setAutorizado(data.statusLicenca !== "bloqueada");
        }
        setLoading(false);
      });

      // Busca os últimos chamados/remanejamentos para a lista
      const q = query(collection(db, "chamados"), orderBy("dataCriacao", "desc"), limit(5));
      const unsubAtividades = onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAtividades(lista);
      });

      return () => { unsubUser(); unsubAtividades(); };
    };
    verificarAcesso();
  }, [navigate]);

  // Função necessária para o ModalDetalhes funcionar
  const calcularSLA = (inicio, fim) => {
    if (!inicio) return "---";
    const dataInicio = inicio.toDate();
    const dataFim = fim ? fim.toDate() : new Date();
    const diffMs = dataFim - dataInicio;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  const handleRemanejar = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "chamados"), { // Salvando como tipo remanejamento para aparecer no modal
        ...formDataRemanejo,
        tipo: "REMANEJAMENTO TÉCNICO",
        status: "fechado",
        numeroOs: Math.floor(1000 + Math.random() * 9000),
        criadoEm: serverTimestamp(),
        finalizadoEm: serverTimestamp(),
        autorizadoPor: userName,
      });
      toast.success("Remanejamento efetivado!");
      setFormDataRemanejo({ tecnicoId: "", deSetor: "", paraSetor: "", motivo: "" });
    } catch (error) { toast.error("Erro ao registrar."); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black italic text-slate-400">CARREGANDO...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col h-screen sticky top-0 p-8 shadow-sm">
        <div className="mb-12">
          <div className="text-slate-900 font-black text-2xl italic uppercase tracking-tighter">
            RODHON<span className="text-blue-600">COORD</span>
          </div>
        </div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setAbaAtiva("chamados")} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all uppercase text-xs ${abaAtiva === 'chamados' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <ClipboardList size={20} /> Abertura O.S
          </button>
          <button onClick={() => setAbaAtiva("remanejamento")} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all uppercase text-xs ${abaAtiva === 'remanejamento' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <ArrowRightLeft size={20} /> Remanejamento
          </button>
        </nav>
        <button onClick={() => auth.signOut()} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] mt-auto hover:text-red-600 pt-6 border-t border-slate-100">
          <LogOut size={14} /> Sair
        </button>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 p-8 lg:p-16 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-6xl font-black text-slate-900 italic uppercase leading-none">
            {abaAtiva === "chamados" ? "Gestão de <span class='text-blue-600'>Suporte</span>" : "Gestão de <span class='text-blue-600'>Equipe</span>"}
          </h1>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          
          {/* COLUNA DA ESQUERDA: FORMULÁRIOS */}
          <section>
            {abaAtiva === "chamados" ? (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl text-center">
                <PlusCircle size={48} className="text-blue-600 mx-auto mb-6" />
                <h2 className="text-xl font-black text-slate-800 uppercase italic mb-4">Novo Chamado Técnico</h2>
                <button onClick={() => setModalChamadoAberto(true)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase italic tracking-widest shadow-lg hover:bg-blue-700 transition-all">
                  Abrir Formulário Padrão
                </button>
              </div>
            ) : (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
                <h3 className="text-xl font-black italic uppercase text-slate-800 mb-6 flex items-center gap-3">
                  <UserPlus className="text-orange-500"/> Remanejamento
                </h3>
                <form onSubmit={handleRemanejar} className="space-y-4">
                  <input required value={formDataRemanejo.tecnicoId} onChange={(e) => setFormDataRemanejo({...formDataRemanejo, tecnicoId: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border-none font-bold outline-none" placeholder="Nome do Técnico" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required value={formDataRemanejo.deSetor} onChange={(e) => setFormDataRemanejo({...formDataRemanejo, deSetor: e.target.value})} className="bg-slate-50 p-4 rounded-xl border-none font-bold outline-none" placeholder="Origem" />
                    <input required value={formDataRemanejo.paraSetor} onChange={(e) => setFormDataRemanejo({...formDataRemanejo, paraSetor: e.target.value})} className="bg-slate-50 p-4 rounded-xl border-none font-bold outline-none" placeholder="Destino" />
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white p-5 rounded-xl font-black uppercase italic text-xs tracking-widest hover:bg-orange-600 transition-all">
                    Efetivar Troca
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* COLUNA DA DIREITA: LISTA PARA USAR O MODAL DETALHES */}
          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
              <Eye size={14}/> Atividades Recentes
            </h3>
            <div className="space-y-4">
              {atividades.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase">#{item.numeroOs || "S/N"}</p>
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{item.assunto || item.tipo}</p>
                  </div>
                  <button 
                    onClick={() => setChamadoSelecionado(item)}
                    className="p-3 bg-white text-slate-400 rounded-xl group-hover:text-blue-600 shadow-sm transition-all"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* MODAIS INTEGRADOS */}
        <CadastroChamado 
          isOpen={modalChamadoAberto} 
          onClose={() => setModalChamadoAberto(false)} 
        />

        <ModalDetalhes 
          chamado={chamadoSelecionado} 
          aoFechar={() => setChamadoSelecionado(null)} 
          calcularSLA={calcularSLA}
        />
      </main>
    </div>
  );
}