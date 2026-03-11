
import React, { useState, useEffect, useMemo } from 'react';
import { Save, Plus, Trash2, Edit, X, CheckCircle, AlertCircle, School, Check } from 'lucide-react';
import { tblSalas } from '../data/db';
import { salvarTurmas, excluirTurma as excluirTurmaFirestore } from '../services/firestoreService';

const SERIES_SUGERIDAS = [
    'Jardim IV', 'Jardim V',
    '1º', '2º', '3º', '4º', '5º',
    '6º', '7º', '8º', '9º',
    '1º EM', '2º EM', '3º EM'
];

const TURMAS_LETRAS = ['A', 'B', 'C', 'D', 'E'];

const turmaVazia = () => ({
    serie: '',
    turma: 'A',
    periodo: 'Manhã',
    salaId: '',
    capacidade: 25,
});

export function Configuracoes({ turmas, onSaveTurmas, alunos = [] }) {
    const [turmasLocais, setTurmasLocais] = useState(turmas);
    const [mensagem, setMensagem] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [turmaEditando, setTurmaEditando] = useState(null); // null = nova turma
    const [form, setForm] = useState(turmaVazia());

    useEffect(() => {
        setTurmasLocais(turmas);
    }, [turmas]);

    // Calcula quantidade de alunos ativos por turma
    const qtdeAlunosPorTurma = useMemo(() => {
        const mapa = {};
        alunos
            .filter(a => Number(a.statusId) !== 3 && Number(a.statusId) !== 4)
            .forEach(a => {
                const id = Number(a.turmaId);
                mapa[id] = (mapa[id] || 0) + 1;
            });
        return mapa;
    }, [alunos]);

    const exibirMensagem = (tipo, texto) => {
        setMensagem({ tipo, texto });
        setTimeout(() => setMensagem(null), 3000);
    };

    // Salvar todas as turmas no Firestore
    const handleSalvarTudo = async () => {
        try {
            await salvarTurmas(turmasLocais);
            exibirMensagem('sucesso', 'Configurações salvas no Firestore!');
        } catch (e) {
            exibirMensagem('erro', 'Erro ao salvar: ' + e.message);
        }
    };

    // Abrir modal para nova turma
    const handleNovaTurma = () => {
        setTurmaEditando(null);
        setForm(turmaVazia());
        setModalAberto(true);
    };

    // Abrir modal para editar turma existente
    const handleEditarTurma = (turma) => {
        setTurmaEditando(turma);
        setForm({ ...turma });
        setModalAberto(true);
    };

    // Excluir turma do Firestore
    const handleExcluirTurma = async (turma) => {
        const qtde = qtdeAlunosPorTurma[turma.id] || 0;
        const msg = qtde > 0
            ? `A turma "${turma.serie} ${turma.turma}" tem ${qtde} aluno(s) matriculado(s). Excluir mesmo assim?`
            : `Excluir a turma "${turma.serie} ${turma.turma}"?`;
        if (window.confirm(msg)) {
            try {
                await excluirTurmaFirestore(turma.id);
                exibirMensagem('sucesso', 'Turma excluída.');
            } catch (e) {
                exibirMensagem('erro', 'Erro ao excluir: ' + e.message);
            }
        }
    };

    // Salvar formulário do modal
    const handleSalvarModal = () => {
        if (!form.serie.trim()) return exibirMensagem('erro', 'Preencha a série.');
        if (!form.capacidade || Number(form.capacidade) < 1) return exibirMensagem('erro', 'Capacidade inválida.');

        let novaLista;
        if (turmaEditando) {
            // Edição
            novaLista = turmasLocais.map(t =>
                t.id === turmaEditando.id ? { ...turmaEditando, ...form, capacidade: Number(form.capacidade) } : t
            );
        } else {
            // Nova turma — verificar duplicata
            const existe = turmasLocais.find(t =>
                t.serie.trim().toLowerCase() === form.serie.trim().toLowerCase() &&
                t.turma === form.turma &&
                t.periodo === form.periodo
            );
            if (existe) return exibirMensagem('erro', `Já existe a turma "${form.serie} ${form.turma}" no período ${form.periodo}.`);

            const novoId = Math.max(0, ...turmasLocais.map(t => t.id)) + 1;
            const novaTurma = { ...form, id: novoId, capacidade: Number(form.capacidade), qtdeAlunos: 0 };
            novaLista = [...turmasLocais, novaTurma];
        }

        setTurmasLocais(novaLista);
        onSaveTurmas(novaLista);
        setModalAberto(false);
        exibirMensagem('sucesso', turmaEditando ? 'Turma atualizada!' : 'Turma adicionada!');
    };

    // Editar capacidade inline na tabela
    const handleCapacidadeInline = (id, valor) => {
        setTurmasLocais(prev => prev.map(t =>
            t.id === id ? { ...t, capacidade: Number(valor) } : t
        ));
    };

    // Agrupar turmas por série para exibição
    const turmasPorSerie = useMemo(() => {
        const mapa = {};
        turmasLocais.forEach(t => {
            const s = t.serie.trim();
            if (!mapa[s]) mapa[s] = [];
            mapa[s].push(t);
        });
        return mapa;
    }, [turmasLocais]);

    return (
        <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">

            {/* Header */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <School size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Estrutura de Turmas e Salas</h2>
                        <p className="text-slate-500 text-sm">Gerencie as turmas, períodos e capacidades — alimenta o Mapa de Salas.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleNovaTurma}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                    >
                        <Plus size={16} /> Nova Turma
                    </button>
                    <button
                        onClick={handleSalvarTudo}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-700 shadow-md transition-all"
                    >
                        <Save size={16} /> Salvar Tudo
                    </button>
                </div>
            </div>

            {/* Mensagem de feedback */}
            {mensagem && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium
                    ${mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}
                `}>
                    {mensagem.tipo === 'sucesso' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {mensagem.texto}
                </div>
            )}

            {/* Tabela agrupada por série */}
            {Object.entries(turmasPorSerie).map(([serie, turmasDaSerie]) => (
                <div key={serie} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-bold text-slate-700">{serie}</h3>
                        <span className="text-xs text-slate-400">{turmasDaSerie.length} turma(s)</span>
                    </div>
                    <table className="w-full text-sm text-slate-700">
                        <thead className="border-b border-slate-100">
                            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <th className="px-5 py-2.5 text-left">Turma</th>
                                <th className="px-5 py-2.5 text-left">Período</th>
                                <th className="px-5 py-2.5 text-left">Sala</th>
                                <th className="px-5 py-2.5 text-center">Matriculados / Capacidade</th>
                                <th className="px-5 py-2.5 text-center">Ocupação</th>
                                <th className="px-5 py-2.5 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {turmasDaSerie.map(turma => {
                                const matriculados = qtdeAlunosPorTurma[turma.id] || 0;
                                const pct = turma.capacidade > 0 ? (matriculados / turma.capacidade) * 100 : 0;
                                const corBarra = pct >= 100 ? '#ef4444' : pct >= 85 ? '#f59e0b' : '#22c55e';
                                const sala = tblSalas.find(s => s.id === turma.salaId);
                                return (
                                    <tr key={turma.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3">
                                            <span className="font-bold text-slate-800 text-base mr-2">{turma.turma}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded
                                                ${turma.periodo === 'Manhã' ? 'bg-amber-100 text-amber-700' : turma.periodo === 'Tarde' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                                            `}>
                                                {turma.periodo}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500 text-xs">
                                            {sala ? `${sala.nome} (${sala.local})` : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="font-bold text-slate-700">{matriculados}</span>
                                                <span className="text-slate-400">/</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="60"
                                                    value={turma.capacidade}
                                                    onChange={(e) => handleCapacidadeInline(turma.id, e.target.value)}
                                                    className="w-14 p-1 text-center border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: corBarra }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">{pct.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleEditarTurma(turma)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleExcluirTurma(turma)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ))}

            {turmasLocais.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                    <School size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Nenhuma turma cadastrada.</p>
                    <p className="text-sm mt-1">Clique em "Nova Turma" para começar.</p>
                </div>
            )}

            {/* ===== MODAL: Adicionar / Editar Turma ===== */}
            {modalAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md mx-4 p-6 animate-fade-in">

                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">
                                    {turmaEditando ? 'Editar Turma' : 'Nova Turma'}
                                </h3>
                                <p className="text-sm text-slate-400">Preencha os dados da turma</p>
                            </div>
                            <button onClick={() => setModalAberto(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Série */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Série / Nível</label>
                                <input
                                    list="series-list"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Ex: Jardim IV, 1º, 2º EM..."
                                    value={form.serie}
                                    onChange={e => setForm(f => ({ ...f, serie: e.target.value }))}
                                />
                                <datalist id="series-list">
                                    {SERIES_SUGERIDAS.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>

                            {/* Turma + Período */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Turma (Letra)</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        value={form.turma}
                                        onChange={e => setForm(f => ({ ...f, turma: e.target.value }))}
                                    >
                                        {TURMAS_LETRAS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        value={form.periodo}
                                        onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}
                                    >
                                        <option value="Manhã">Manhã</option>
                                        <option value="Tarde">Tarde</option>
                                        <option value="Integral">Integral</option>
                                    </select>
                                </div>
                            </div>

                            {/* Capacidade + Sala */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Capacidade (alunos)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                        value={form.capacidade}
                                        onChange={e => setForm(f => ({ ...f, capacidade: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Sala Física</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        value={form.salaId}
                                        onChange={e => setForm(f => ({ ...f, salaId: Number(e.target.value) }))}
                                    >
                                        <option value="">— Sem sala —</option>
                                        {tblSalas.map(s => (
                                            <option key={s.id} value={s.id}>{s.nome} ({s.local}, cap. {s.cap})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
                            <button onClick={() => setModalAberto(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSalvarModal} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all">
                                <Check size={16} />
                                {turmaEditando ? 'Salvar Alterações' : 'Adicionar Turma'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
