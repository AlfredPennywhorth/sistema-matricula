
import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, School } from 'lucide-react';

export function Configuracoes({ turmas, onSaveTurmas }) {
    // Estado local para edição antes de salvar
    const [turmasLocais, setTurmasLocais] = useState(turmas);
    const [mensagem, setMensagem] = useState(null);

    // Sincroniza se a prop mudar (embora aqui seja a fonte da verdade para edição)
    useEffect(() => {
        setTurmasLocais(turmas);
    }, [turmas]);

    const handleChange = (id, campo, valor) => {
        setTurmasLocais(prev => prev.map(t => {
            if (t.id === id) {
                return { ...t, [campo]: Number(valor) };
            }
            return t;
        }));
    };

    const handleSalvar = () => {
        onSaveTurmas(turmasLocais);
        setMensagem({ tipo: 'sucesso', texto: 'Configurações de turmas salvas com sucesso!' });
        setTimeout(() => setMensagem(null), 3000);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-full">
                        <School size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Censo e Estrutura</h2>
                        <p className="text-slate-500 text-sm">Defina a capacidade física das salas para cálculo real de ocupação.</p>
                    </div>
                </div>

                <button
                    onClick={handleSalvar}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                    <Save size={18} /> Salvar Alterações
                </button>
            </div>

            {mensagem && (
                <div className={`p-4 rounded-lg flex items-center gap-2 animate-bounce-in
                    ${mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                `}>
                    {mensagem.tipo === 'sucesso' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {mensagem.texto}
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-800 uppercase text-xs font-bold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Série / Turma</th>
                            <th className="px-6 py-4">Período</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 w-40 text-center">Capacidade (Alunos)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {turmasLocais.map(turma => (
                            <tr key={turma.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3 font-medium text-slate-800">
                                    <span className="text-base">{turma.serie}</span>
                                    <span className="ml-2 bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">{turma.turma}</span>
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold
                                        ${turma.periodo === 'Manhã' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}
                                    `}>
                                        {turma.periodo}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    {/* Barra visual de ocupação (baseada nos dados atuais salvos, não em tempo real aqui pra simplificar) */}
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden w-24">
                                        <div
                                            className={`h-full ${turma.qtdeAlunos > turma.capacidade ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min((turma.qtdeAlunos / turma.capacidade) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-slate-400 mt-1 block">
                                        {turma.qtdeAlunos || 0} matriculados
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={turma.capacidade}
                                        onChange={(e) => handleChange(turma.id, 'capacidade', e.target.value)}
                                        className="w-24 p-2 text-center border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
