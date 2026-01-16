import React, { useState } from 'react';
import { db } from '../api/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiTruck, FiSearch, FiArrowLeft, FiPackage, FiEdit3, FiX, FiMapPin, FiUser } from 'react-icons/fi';

const SaidaEquipamento = () => {
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

    const unidades = ["Hospital Conde", "Upa de Inoã", "Upa de Santa Rita", "Samu Barroco", "Samu Ponta Negra"];

    const executarBusca = async (tipo) => {
        setLoading(true);
        setItensEncontrados([]);

        try {
            const ativosRef = collection(db, "ativos");
            let lista = [];

            if (tipo === 'patrimonio') {
                const termo = patrimonioBusca.toUpperCase().trim();
                if (termo === 'S/P' || termo === 'SP') {
                    toast.info("Para itens S/P, use a busca por NOME.");
                    setLoading(false);
                    return;
                }
                const q = query(ativosRef, where("patrimonio", "==", termo), where("status", "==", "Ativo"));
                const snap = await getDocs(q);
                lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } else {
                const termoOriginal = nomeBusca.toLowerCase().trim();
                if (!termoOriginal) { toast.warn("Digite o nome."); setLoading(false); return; }
                const qGeral = query(ativosRef, where("status", "==", "Ativo"), limit(100));
                const snapGeral = await getDocs(qGeral);
                lista = snapGeral.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(item =>
                        item.nome.toLowerCase().includes(termoOriginal) ||
                        item.patrimonio.toLowerCase() === termoOriginal
                    );
            }

            if (lista.length > 0) {
                setItensEncontrados(lista);
            } else {
                toast.error("Nenhum item ativo encontrado.");
            }
        } catch (error) {
            toast.error("Erro ao buscar.");
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
        setLoading(true);
        try {
            const ativoRef = doc(db, "ativos", itemSelecionado.id);
            const patrimonioFinal = (itemSelecionado.patrimonio === 'S/P' && novoPatrimonioParaSP)
                ? novoPatrimonioParaSP.toUpperCase()
                : itemSelecionado.patrimonio;

            await updateDoc(ativoRef, {
                unidade: dadosSaida.novaUnidade,
                setor: dadosSaida.novoSetor,
                patrimonio: patrimonioFinal,
                ultimaMovimentacao: serverTimestamp()
            });

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

            toast.success("Transferência realizada com sucesso!");
            fecharModal();
            setItensEncontrados([]);
            setPatrimonioBusca('');
            setNomeBusca('');
        } catch (error) {
            toast.error("Erro ao processar transferência.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
            {/* HEADER */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                            <FiTruck size={24} />
                        </div>
                        <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase italic">
                            Saída / Transferência
                        </h1>
                    </div>
                    <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
                        <FiArrowLeft /> Voltar
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* BUSCA */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Nº Patrimônio</label>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-5 pr-14 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                                placeholder="Ex: HMC-001"
                                value={patrimonioBusca}
                                onChange={(e) => setPatrimonioBusca(e.target.value)}
                            />
                            <button 
                                className="absolute right-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100" 
                                onClick={() => executarBusca('patrimonio')}
                            >
                                <FiSearch />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-3">Busca por Nome ou S/P</label>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-5 pr-14 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                placeholder="Ex: Monitor, Maca, SP..."
                                value={nomeBusca}
                                onChange={(e) => setNomeBusca(e.target.value)}
                            />
                            <button 
                                className="absolute right-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100" 
                                onClick={() => executarBusca('nome')}
                            >
                                <FiSearch />
                            </button>
                        </div>
                    </div>
                </section>

                {/* RESULTADOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {itensEncontrados.map(item => (
                        <div 
                            key={item.id} 
                            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
                            onClick={() => selecionarItemParaSaida(item)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                                    <FiPackage size={22} />
                                </div>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                    {item.patrimonio}
                                </span>
                            </div>
                            
                            <h3 className="text-lg font-black text-slate-800 leading-tight mb-4 uppercase italic">{item.nome}</h3>
                            
                            <div className="space-y-2 border-t border-slate-50 pt-4">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <FiMapPin size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{item.unidade}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium ml-6">{item.setor}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {itensEncontrados.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                             <FiSearch size={32} />
                        </div>
                        <p className="text-sm font-black uppercase tracking-[0.3em]">Aguardando Busca...</p>
                    </div>
                )}
            </main>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={fecharModal}></div>
                    
                    {/* Modal Content */}
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black italic text-slate-800 uppercase tracking-tight">Confirmar Saída</h3>
                            <button className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-all" onClick={fecharModal}>
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="bg-blue-50 p-6 rounded-3xl mb-8 border border-blue-100/50">
                                <p className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-widest">Resumo do Ativo</p>
                                <h4 className="text-lg font-black text-slate-900 uppercase italic leading-none">{itemSelecionado.nome}</h4>
                                <p className="text-sm text-slate-600 font-medium mt-2">Origem: {itemSelecionado.unidade} • {itemSelecionado.setor}</p>
                            </div>

                            <form onSubmit={handleSaida} className="space-y-6">
                                {itemSelecionado.patrimonio === 'S/P' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <FiEdit3 className="text-blue-600" /> Novo Nº Patrimônio (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 px-5 text-sm font-bold transition-all uppercase"
                                            placeholder="Digite o número"
                                            value={novoPatrimonioParaSP}
                                            onChange={(e) => setNovoPatrimonioParaSP(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidade de Destino</label>
                                        <select 
                                            required 
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-blue-500 appearance-none"
                                            onChange={(e) => setDadosSaida({ ...dadosSaida, novaUnidade: e.target.value })}
                                        >
                                            <option value="">Selecionar...</option>
                                            {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Novo Setor</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Ex: UTI"
                                            onChange={(e) => setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <FiUser className="text-blue-600" /> Responsável Recebimento
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Quem recebeu o equipamento?"
                                        onChange={(e) => setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98] disabled:bg-slate-300"
                                >
                                    {loading ? 'Processando...' : 'Finalizar Transferência'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <footer className="mt-auto py-10 text-center border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                    Rodhon System • Gestão de Ativos v2.0
                </p>
            </footer>
        </div>
    );
};

export default SaidaEquipamento;