
import React, { useState, useEffect } from 'react';
import { Save, X, Search, Clock, Calendar as CalendarIcon, User } from 'lucide-react';
import { tblPeriodo, tblHorarios, tblStatusMatricula, tblTurmas } from '../data/db';

export function FormularioMatricula({ onSave, onCancel, alunoParaEditar = null, listaAlunos = [] }) {
    // Se houver alunoParaEditar, usa os valores dele. Se não, usa defaults.
    const [formData, setFormData] = useState(alunoParaEditar || {
        nome: '',
        turmaId: '',
        periodoId: '',
        horarioId: '',
        statusId: 2, // Nova por padrão
        sequenciaFamilia: 1,
        nomeIrmao: '',
        turmaIrmao: '',
        pagante: true,
        nascimento: '',
        genero: 'M',
        bolsa: 0,
        registro: '', // RA
        dataMatricula: new Date().toISOString().split('T')[0],
        colegioAnterior: '',
        laudo: '',
        reservaTurmaId: '',
        itinerarioId: 3
    });

    const [turmasFiltradas, setTurmasFiltradas] = useState([]);
    // Estado para controle da busca de irmão
    const [buscaIrmao, setBuscaIrmao] = useState('');
    const [sugestoesIrmaos, setSugestoesIrmaos] = useState([]);

    // Atualiza o formulário se o alunoParaEditar mudar
    useEffect(() => {
        if (alunoParaEditar) {
            setFormData(alunoParaEditar);
            // Se já tem irmão, tentar popular o campo de busca
            if (alunoParaEditar.nomeIrmao) {
                setBuscaIrmao(alunoParaEditar.nomeIrmao);
            }
        }
    }, [alunoParaEditar]);

    // Filtra Turmas quando o Período muda
    useEffect(() => {
        if (formData.periodoId) {
            const periodoObj = tblPeriodo.find(p => p.id == formData.periodoId);
            if (periodoObj) {
                const turmasDoPeriodo = tblTurmas.filter(t => t.periodo.toLowerCase() === periodoObj.periodo.toLowerCase());
                setTurmasFiltradas(turmasDoPeriodo);
            } else {
                setTurmasFiltradas([]);
            }
        } else {
            setTurmasFiltradas([]);
        }
    }, [formData.periodoId]);

    // Auto-preenche Horário quando a Turma é selecionada
    useEffect(() => {
        if (formData.turmaId) {
            const turmaSelecionada = tblTurmas.find(t => t.id == formData.turmaId);
            if (turmaSelecionada) {
                let novoHorario = '';
                if (turmaSelecionada.periodo === 'Manhã') novoHorario = '1';
                else if (turmaSelecionada.periodo === 'Tarde') novoHorario = '4';
                else novoHorario = '1';
                setFormData(prev => ({ ...prev, horarioId: novoHorario }));
            }
        }
    }, [formData.turmaId]);

    // Busca de Irmãos (Live Search)
    useEffect(() => {
        if (buscaIrmao.length > 2) {
            const termo = buscaIrmao.toLowerCase();
            const filtrados = listaAlunos.filter(a =>
                a.nome.toLowerCase().includes(termo) &&
                a.id !== formData.id // Não mostrar a si mesmo
            );
            setSugestoesIrmaos(filtrados.slice(0, 5)); // Top 5
        } else {
            setSugestoesIrmaos([]);
        }
    }, [buscaIrmao, listaAlunos, formData.id]);

    const selecionarIrmao = (irmao) => {
        setBuscaIrmao(irmao.nome);
        setSugestoesIrmaos([]);

        // Lógica Inteligente de Vínculo
        const novaSequencia = (irmao.sequenciaFamilia || 1) + 1;

        setFormData(prev => ({
            ...prev,
            nomeIrmao: irmao.nome,
            turmaIrmao: irmao.turmaId, // Poderia buscar o nome da turma
            sequenciaFamilia: novaSequencia,
            bolsa: novaSequencia > 1 ? 10 : 0 // Aplica desconto automático se for o 2º+
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const getHorarioDescricao = () => {
        if (!formData.horarioId) return '--';
        return tblHorarios.find(h => h.id == formData.horarioId)?.descricao || '--';
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-4xl mx-auto h-[85vh] overflow-y-auto custom-scrollbar">

            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10 pt-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {alunoParaEditar ? 'Editar Matrícula' : 'Nova Matrícula'}
                    </h2>
                    <p className="text-slate-500 text-sm">Preencha os dados do aluno para cadastro</p>
                </div>
                <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>

            <div className="space-y-8">
                {/* Dados do Aluno */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Dados do Aluno</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                            <input
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Ex: Maria Pereira da Silva"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
                            <div className="relative">
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        name="nascimento"
                                        value={formData.nascimento}
                                        onChange={handleChange}
                                        className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-600"
                                    />
                                    {formData.nascimento && (
                                        <div className="flex items-center justify-center px-3 bg-slate-100 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm min-w-[3rem]" title="Idade Atual">
                                            {(() => {
                                                const hoje = new Date();
                                                const nasc = new Date(formData.nascimento);
                                                let idade = hoje.getFullYear() - nasc.getFullYear();
                                                const m = hoje.getMonth() - nasc.getMonth();
                                                if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
                                                return isNaN(idade) ? '' : idade + 'a';
                                            })()}
                                        </div>
                                    )}
                                </div>
                                <CalendarIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Matrícula</label>
                            <input
                                type="date"
                                name="dataMatricula"
                                value={formData.dataMatricula}
                                onChange={handleChange}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gênero</label>
                            <select
                                name="genero"
                                value={formData.genero}
                                onChange={handleChange}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            >
                                <option value="M">Masculino</option>
                                <option value="F">Feminino</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">RA / Registro</label>
                            <input
                                type="text"
                                name="registro"
                                value={formData.registro}
                                onChange={handleChange}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Gerado autom. se vazio"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Colégio Anterior</label>
                            <input
                                type="text"
                                name="colegioAnterior"
                                value={formData.colegioAnterior}
                                onChange={handleChange}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* Dados Acadêmicos */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Dados Acadêmicos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Matrícula</label>
                            <select
                                name="statusId"
                                value={formData.statusId}
                                onChange={handleChange}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            >
                                {tblStatusMatricula.map(s => (
                                    <option key={s.id} value={s.id}>{s.status}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Período Desejado</label>
                            <select
                                name="periodoId"
                                value={formData.periodoId}
                                onChange={handleChange}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                required
                            >
                                <option value="">Selecione...</option>
                                {tblPeriodo.map(p => (
                                    <option key={p.id} value={p.id}>{p.periodo}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Turma (Série)</label>
                            <select
                                name="turmaId"
                                value={formData.turmaId}
                                onChange={handleChange}
                                disabled={!formData.periodoId}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100"
                            >
                                <option value="">{formData.periodoId ? 'Selecione a Turma...' : 'Selecione o Período primeiro'}</option>
                                {turmasFiltradas.map(t => (
                                    <option key={t.id} value={t.id}>{t.serie} {t.turma} ({t.qtdeAlunos}/{t.capacidade})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Horário (Automático)</label>
                            <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" />
                                <span className="text-sm font-medium">{getHorarioDescricao()}</span>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Laudo / Observações</label>
                            <textarea
                                name="laudo"
                                value={formData.laudo}
                                onChange={handleChange}
                                rows="2"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                placeholder="Preencha se houver laudo médico ou observação pedagógica importante."
                            ></textarea>
                        </div>
                    </div>
                </section>

                {/* Financeiro e Família (UX Inteligente) */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Detalhes e Financeiro</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Vínculo Familiar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar irmão já matriculado..."
                                    className="w-full pl-9 p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={buscaIrmao}
                                    onChange={(e) => {
                                        setBuscaIrmao(e.target.value);
                                        if (e.target.value === '') {
                                            setFormData(prev => ({ ...prev, nomeIrmao: '', sequenciaFamilia: 1, bolsa: 0 }));
                                        }
                                    }}
                                />
                                {/* Lista de Sugestões de Vínculo */}
                                {sugestoesIrmaos.length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-lg shadow-xl mt-1 z-20 overflow-hidden">
                                        {sugestoesIrmaos.map(irmao => (
                                            <div
                                                key={irmao.id}
                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between"
                                                onClick={() => selecionarIrmao(irmao)}
                                            >
                                                <div>
                                                    <p className="font-medium text-slate-800 text-sm">{irmao.nome}</p>
                                                    <p className="text-xs text-slate-500">RA: {irmao.registro}</p>
                                                </div>
                                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                    Seq: {irmao.sequenciaFamilia || 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {formData.nomeIrmao && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in">
                                    <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-1">
                                        <User size={14} />
                                        <span>Vínculo Detectado</span>
                                    </div>
                                    <p className="text-xs text-blue-600 mb-2">
                                        Irmão: <strong>{formData.nomeIrmao}</strong> (Seq {formData.sequenciaFamilia - 1})
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 uppercase font-bold">Nova Sequência:</span>
                                        <span className="text-sm font-bold bg-white px-2 py-0.5 rounded border border-blue-200 text-slate-700">
                                            {formData.sequenciaFamilia}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">% de Bolsa</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    name="bolsa"
                                    value={formData.bolsa}
                                    onChange={handleChange}
                                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-bold text-slate-800
                                        ${formData.sequenciaFamilia > 1 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200'}
                                    `}
                                />
                                <span className="text-slate-400 font-bold">%</span>
                            </div>
                            <p className="text-xs mt-2 min-h-[20px]">
                                {formData.sequenciaFamilia > 1 ? (
                                    <span className="text-green-600 flex items-center gap-1 font-medium">
                                        <CheckCircleIconMini /> Desconto de irmão aplicado (10%).
                                    </span>
                                ) : (
                                    <span className="text-slate-400">Sem desconto automático.</span>
                                )}
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-slate-100 sticky bottom-0 bg-white pb-2 z-10">
                <button type="button" onClick={onCancel} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                    {alunoParaEditar ? 'Salvar Alterações' : 'Confirmar Matrícula'}
                </button>
            </div>
        </form>
    );
}

// Pequeno helper de ícone para não importar mais coisas
const CheckCircleIconMini = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
