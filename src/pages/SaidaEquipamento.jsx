import React, { useState } from 'react';
import { db } from '../api/Firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiTruck, FiSearch, FiArrowLeft, FiPackage, FiX, FiMapPin, FiFilter } from 'react-icons/fi';

// IMPORTAÇÃO DOS COMPONENTES
import Header from "../components/Header";
import Footer from "../components/Footer";

const SaidaEquipamento = () => {
    const [unidadeFiltro, setUnidadeFiltro] = useState('TODAS');
    const [patrimonioBusca, setPatrimonioBusca] = useState('');
    const [nomeBusca, setNomeBusca] = useState('');
    const [itensEncontrados, setItensEncontrados] = useState([]);
    const [itemSelecionado, setItemSelecionado] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState('');

    const [dadosSaida, setDadosSaida] = useState({
        novaUnidade: '',
        novoSetor: '',
        motivo: 'Transferência',
        responsavelRecebimento: ''
    });

    const unidades = [
        "HOSPITAL CONDE", 
        "UPA INOÃ", 
        "UPA SANTA RITA", 
        "UPA CENTRO", 
        "SAMU BARROCO", 
        "SAMU PONTA NEGRA"
    ];

    const tratarSP = (t) => t ? t.toUpperCase().replace(/\//g, '').trim() : "";

    const executarBusca = async (tipo) => {
        setLoading(true);
        setItensEncontrados([]);

        try {
            const ativosRef = collection(db, "ativos");
            let lista = [];

            if (tipo === 'patrimonio') {
                const termo = patrimonioBusca.toUpperCase().trim();
                
                if (tratarSP(termo) === 'SP') {
                    toast.info("Para itens 'SP', use a busca por NOME.");
                    setLoading(false);
                    return;
                }

                let q = unidadeFiltro === 'TODAS' 
                    ? query(ativosRef, where("patrimonio", "==", termo), where("status", "==", "Ativo"))
                    : query(ativosRef, where("patrimonio", "==", termo), where("unidade", "==", unidadeFiltro), where("status", "==", "Ativo"));
                
                const snap = await getDocs(q);
                lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            } else {
                const termoOriginal = nomeBusca.toLowerCase().trim();
                if (!termoOriginal) { toast.warn("Digite o nome ou 'SP'"); setLoading(false); return; }
                
                let qGeral = unidadeFiltro === 'TODAS'
                    ? query(ativosRef, where("status", "==", "Ativo"), limit(300))
                    : query(ativosRef, where("unidade", "==", unidadeFiltro), where("status", "==", "Ativo"), limit(300));

                const snapGeral = await getDocs(qGeral);
                const termoBuscaNormalizado = tratarSP(termoOriginal);

                lista = snapGeral.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(item => {
                        const nomeNoBanco = item.nome ? item.nome.toLowerCase() : "";
                        const patNoBanco = item.patrimonio || "";
                        const matchNome = nomeNoBanco.includes(termoOriginal);
                        const matchSP = (termoBuscaNormalizado === 'SP' && tratarSP(patNoBanco) === 'SP');
                        return matchNome || matchSP;
                    });
            }

            if (lista.length > 0) {
                setItensEncontrados(lista);
            } else {
                toast.error("Nenhum item encontrado.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro na consulta.");
        } finally {
            setLoading(false);
        }
    };

    const selecionarItemParaSaida = (item) => {
        setItemSelecionado(item);
        setShowModal(true);
    };

    const fecharModal = () => {
        setShowModal(false);
        setItemSelecionado(null);
        setNovoPatrimonioParaSP('');
    };

    const handleSaida = async (e) => {
        e.preventDefault();
        if(!dadosSaida.novaUnidade || !dadosSaida.novoSetor) {
            toast.warn("Preencha destino e setor.");
            return;
        }
        setLoading(true);
        try {
            const ativoRef = doc(db, "ativos", itemSelecionado.id);
            
            const patrimonioFinal = (tratarSP(itemSelecionado.patrimonio) === 'SP' && novoPatrimonioParaSP)
                ? novoPatrimonioParaSP.toUpperCase()
                : itemSelecionado.patrimonio;

            // 1. ATUALIZA O ATIVO NO FIREBASE (MUDA A LOCALIZAÇÃO ATUAL)
            await updateDoc(ativoRef, {
                unidade: dadosSaida.novaUnidade,
                setor: dadosSaida.novoSetor,
                patrimonio: patrimonioFinal,
                ultimaMovimentacao: serverTimestamp()
            });

            // 2. REGISTRA O LOG DE MOVIMENTAÇÃO NO FIREBASE
            await addDoc(collection(db, "saidaEquipamento"), {
                ativoId: itemSelecionado.id,
                patrimonio: patrimonioFinal,
                nomeEquipamento: itemSelecionado.nome,
                unidadeOrigem: itemSelecionado.unidade,
                setorOrigem: itemSelecionado.setor,
                unidadeDestino: dadosSaida.novaUnidade,
                setorDestino: dadosSaida.novoSetor,
                responsavelRecebimento: dadosSaida.responsavelRecebimento,
                motivo: dadosSaida.motivo,
                dataSaida: serverTimestamp()
            });

            // 3. SINCRONIZAÇÃO COM A PLANILHA GOOGLE (INVENTÁRIO)
            try {
                const payloadPlanilha = {
                    tipoOperacao: "TRANSFERENCIA", // Para o script identificar
                    patrimonio: patrimonioFinal,
                    nome: itemSelecionado.nome,
                    origem: itemSelecionado.unidade,
                    destino: dadosSaida.novaUnidade,
                    setorDestino: dadosSaida.novoSetor,
                    responsavel: dadosSaida.responsavelRecebimento,
                    data: new Date().toLocaleString('pt-BR')
                };

                fetch('https://script.google.com/macros/s/AKfycbxR6EGGtOkeZCUMXA4y2hggPXNPUZL80L4acj9CP9MxVxqSbOrYcsyQ2OY2aFpYabsAEA/exec', {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payloadPlanilha)
                });
            } catch (errPlanilha) {
                console.error("Erro ao enviar para planilha:", errPlanilha);
            }

            toast.success("Transferência concluída e planilha atualizada!");
            fecharModal();
            setItensEncontrados([]);
        } catch (error) {
            toast.error("Erro ao transferir.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
            <Header />

            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                        <FiTruck size={22} />
                    </div>
                    <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase italic">Saída / Transferência</h1>
                </div>
                <Link to="/" className="group flex items-center gap-2 text-xs font-black text-slate-500 hover:text-blue-600 transition-all uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full">
                    <FiArrowLeft /> Voltar
                </Link>
            </header>

            <main className="flex-grow max-w-7xl mx-auto px-6 py-10 w-full">
                {/* FILTRO DE UNIDADE */}
                <div className="mb-8 bg-slate-900 p-2 rounded-3xl shadow-xl flex flex-col md:flex-row items-center gap-2 border border-slate-700">
                    <div className="flex items-center gap-3 px-6 py-3 bg-blue-600 rounded-2xl text-white min-w-max">
                        <FiFilter />
                        <span className="text-[10px] font-black uppercase tracking-widest">Unidade Atual</span>
                    </div>
                    <select 
                        value={unidadeFiltro}
                        onChange={(e) => setUnidadeFiltro(e.target.value)}
                        className="flex-grow bg-transparent border-none py-4 px-6 text-sm font-bold text-white focus:ring-0 cursor-pointer"
                    >
                        <option value="TODAS" className="text-slate-900">🌎 TODAS AS UNIDADES</option>
                        {unidades.map(u => <option key={u} value={u} className="text-slate-900">{u}</option>)}
                    </select>
                </div>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Busca por Patrimônio</label>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-5 pr-14 text-sm font-bold focus:ring-2 focus:ring-blue-500 uppercase"
                                placeholder="HMC-001"
                                value={patrimonioBusca}
                                onChange={(e) => setPatrimonioBusca(e.target.value)}
                            />
                            <button className="absolute right-2 p-3 bg-blue-600 text-white rounded-xl" onClick={() => executarBusca('patrimonio')}>
                                <FiSearch />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-3">Busca por Nome ou 'SP'</label>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-5 pr-14 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                placeholder="Ex: Ar Condicionado ou SP"
                                value={nomeBusca}
                                onChange={(e) => setNomeBusca(e.target.value)}
                            />
                            <button className="absolute right-2 p-3 bg-indigo-600 text-white rounded-xl" onClick={() => executarBusca('nome')}>
                                <FiSearch />
                            </button>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {itensEncontrados.map(item => (
                        <div 
                            key={item.id} 
                            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                            onClick={() => selecionarItemParaSaida(item)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <FiPackage size={22} />
                                </div>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                    {item.patrimonio}
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 leading-tight mb-4 uppercase italic">{item.nome}</h3>
                            <div className="space-y-2 border-t border-slate-50 pt-4">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <FiMapPin size={14} className="text-blue-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{item.unidade}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium ml-6 italic">{item.setor}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={fecharModal}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black italic text-slate-800 uppercase tracking-tight">Confirmar Saída</h3>
                            <button className="p-2 hover:bg-white rounded-full text-slate-400" onClick={fecharModal}><FiX size={24} /></button>
                        </div>
                        <div className="p-8">
                            <div className="bg-blue-50 p-6 rounded-3xl mb-8 border border-blue-100/50">
                                <p className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-widest">Resumo do Ativo</p>
                                <h4 className="text-lg font-black text-slate-900 uppercase italic leading-none">{itemSelecionado.nome}</h4>
                                <p className="text-sm text-slate-600 font-medium mt-2">Origem: {itemSelecionado.unidade} • {itemSelecionado.setor}</p>
                            </div>
                            <form onSubmit={handleSaida} className="space-y-6">
                                {tratarSP(itemSelecionado.patrimonio) === 'SP' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atribuir Nº Patrimônio (Opcional)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 px-5 text-sm font-bold uppercase"
                                            placeholder="Ex: HMC-999"
                                            value={novoPatrimonioParaSP}
                                            onChange={(e) => setNovoPatrimonioParaSP(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidade Destino</label>
                                        <select required className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold"
                                            onChange={(e) => setDadosSaida({ ...dadosSaida, novaUnidade: e.target.value })}>
                                            <option value="">Selecionar...</option>
                                            {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Setor Destino</label>
                                        <input type="text" required className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold"
                                            placeholder="Ex: ALMOXARIFADO" onChange={(e) => setDadosSaida({ ...dadosSaida, novoSetor: e.target.value.toUpperCase() })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responsável Recebimento</label>
                                    <input type="text" required className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold uppercase"
                                        placeholder="Nome de quem recebeu" onChange={(e) => setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })} />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition-all">
                                    {loading ? 'Processando...' : 'Finalizar Transferência'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default SaidaEquipamento;