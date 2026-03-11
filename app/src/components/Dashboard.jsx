
import React, { useState, useMemo } from 'react';
import {
    Users, BarChart2, Map, Download
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { tblTurmas, tblPeriodo, tblStatusMatricula } from '../data/db';

const COLORS_GENERO = ['#ec4899', '#3b82f6'];
const COLORS_PERIODO = ['#10b981', '#f59e0b'];
const COLORS_PAGANTE = ['#3b82f6', '#10b981'];
const COLORS_TIPO = ['#10b981', '#3b82f6'];

// Labels customizados para gráficos de pizza
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function Dashboard({ alunos, turmas = tblTurmas }) {
    const [abaAtiva, setAbaAtiva] = useState('visao');
    const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
    const [filtroTurma, setFiltroTurma] = useState('todas');

    // --- Exportação CSV ---
    const exportarCSV = () => {
        const cabecalho = ['Nome', 'RA', 'Gênero', 'Nascimento', 'Turma', 'Período', 'Status', 'Bolsa (%)', 'Pagante', 'Irmão', 'Colégio Anterior', 'Laudo', 'Data Matrícula'];
        const linhas = dadosFiltrados.map(a => {
            const turma = turmas.find(t => t.id === Number(a.turmaId));
            const periodo = tblPeriodo.find(p => p.id === Number(a.periodoId));
            const status = tblStatusMatricula.find(s => s.id === Number(a.statusId));
            return [
                a.nome || '', a.registro || '',
                a.genero === 'M' ? 'Masculino' : 'Feminino',
                a.nascimento || '',
                turma ? `${turma.serie} ${turma.turma}` : (a.turmaId || ''),
                periodo ? periodo.periodo : '',
                status ? status.status : '',
                a.bolsa || 0,
                (a.pagante === true || a.pagante === 'Sim') ? 'Sim' : 'Não',
                a.nomeIrmao || '', a.colegioAnterior || '', a.laudo || '', a.dataMatricula || ''
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
        });
        const csv = [cabecalho.join(','), ...linhas].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `alunos_${new Date().toISOString().split('T')[0]}.csv`; link.click();
        URL.revokeObjectURL(url);
    };

    // --- Dados base (exclui desistentes/transferidos) ---
    const dadosFiltrados = useMemo(() => {
        return alunos.filter(aluno => {
            if (Number(aluno.statusId) === 3 || Number(aluno.statusId) === 4) return false;
            if (filtroPeriodo !== 'todos' && Number(aluno.periodoId) !== Number(filtroPeriodo)) return false;
            if (filtroTurma !== 'todas' && String(aluno.turmaId) !== String(filtroTurma)) return false;
            return true;
        });
    }, [alunos, filtroPeriodo, filtroTurma]);

    // --- KPIs Visão Geral ---
    const kpis = useMemo(() => {
        const total = dadosFiltrados.length;
        const bilingues = dadosFiltrados.filter(a => a.bilingue === true || a.bilingue === 'Sim' || a.bilingue === 'SIM').length;
        const comIrmao = dadosFiltrados.filter(a => a.nomeIrmao && a.nomeIrmao.trim() !== '').length;
        const novos = dadosFiltrados.filter(a => Number(a.statusId) === 2).length;
        const rematriculas = dadosFiltrados.filter(a => Number(a.statusId) === 1).length;
        const masculino = dadosFiltrados.filter(a => a.genero === 'M').length;
        const feminino = total - masculino;
        const manha = dadosFiltrados.filter(a => Number(a.periodoId) === 1).length;
        const tarde = dadosFiltrados.filter(a => Number(a.periodoId) === 2).length;
        const pagantes = dadosFiltrados.filter(a => a.pagante === true || a.pagante === 'Sim').length;
        const naoPagantes = total - pagantes;
        return { total, bilingues, comIrmao, novos, rematriculas, masculino, feminino, manha, tarde, pagantes, naoPagantes };
    }, [dadosFiltrados]);

    // --- Dados Estatísticas: Top 10 Origem ---
    const dadosOrigem = useMemo(() => {
        const mapa = {};
        dadosFiltrados.forEach(a => {
            const col = (a.colegioAnterior || '').trim().toUpperCase() || 'PÚBLICO';
            if (col) mapa[col] = (mapa[col] || 0) + 1;
        });
        return Object.entries(mapa)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [dadosFiltrados]);

    // --- Dados Estatísticas: Gênero por Turma (ordenado pelo id da turma) ---
    const dadosGeneroPorTurma = useMemo(() => {
        const mapa = {};
        dadosFiltrados.forEach(a => {
            const t = turmas.find(t => t.id === Number(a.turmaId));
            if (!t) return;
            const nome = `${t.serie} ${t.turma}`;
            if (!mapa[nome]) mapa[nome] = { name: nome, turmaId: t.id, Feminino: 0, Masculino: 0 };
            if (a.genero === 'F') mapa[nome].Feminino++;
            else mapa[nome].Masculino++;
        });
        // Ordena pelo id da turma (ordem pedagógica: Jardim → EM)
        return Object.values(mapa).sort((a, b) => a.turmaId - b.turmaId);
    }, [dadosFiltrados, turmas]);

    // --- Dados Estatísticas: Matrículas por Mês ---
    const dadosEvolucao = useMemo(() => {
        const mapa = {};
        dadosFiltrados.forEach(aluno => {
            if (!aluno.dataMatricula) return;
            try {
                const date = new Date(aluno.dataMatricula);
                if (isNaN(date.getTime())) return;
                const ano = date.getFullYear();
                const mes = date.getMonth() + 1;
                const chave = `${ano}-${String(mes).padStart(2, '0')}`;
                const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const label = `${meses[mes - 1]}/${ano.toString().substr(2)}`;
                if (!mapa[chave]) mapa[chave] = { chave, name: label, 'Feminino (Novos)': 0, 'Masculino (Novos)': 0 };
                if (Number(aluno.statusId) === 2) {
                    if (aluno.genero === 'F') mapa[chave]['Feminino (Novos)']++;
                    else mapa[chave]['Masculino (Novos)']++;
                }
            } catch { }
        });
        return Object.values(mapa).sort((a, b) => a.chave.localeCompare(b.chave));
    }, [dadosFiltrados]);

    // --- Mapa de Salas: Agrupar por Série ---
    const mapaDeSlads = useMemo(() => {
        // Contar alunos ativos por turma
        const alunosPorTurma = {};
        alunos.filter(a => Number(a.statusId) !== 3 && Number(a.statusId) !== 4).forEach(a => {
            const id = Number(a.turmaId);
            alunosPorTurma[id] = (alunosPorTurma[id] || 0) + 1;
        });

        // Agrupar turmas por série
        const porSerie = {};
        turmas.forEach(t => {
            const serie = t.serie.trim();
            if (!porSerie[serie]) porSerie[serie] = [];
            porSerie[serie].push({
                ...t,
                matriculados: alunosPorTurma[t.id] || 0
            });
        });
        return porSerie;
    }, [alunos, turmas]);

    const abas = [
        { id: 'visao', label: 'Visão Geral', icon: <BarChart2 size={16} /> },
        { id: 'mapa', label: 'Mapa de Salas', icon: <Map size={16} /> },
        { id: 'estatisticas', label: 'Estatísticas', icon: <BarChart2 size={16} /> },
    ];

    return (
        <div className="space-y-0 animate-fade-in pb-12">

            {/* Abas + Filtros */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                {/* Abas */}
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm gap-1">
                    {abas.map(aba => (
                        <button
                            key={aba.id}
                            onClick={() => setAbaAtiva(aba.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${abaAtiva === aba.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            {aba.icon}
                            {aba.label}
                        </button>
                    ))}
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-3">
                    <select
                        className="p-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm"
                        value={filtroPeriodo}
                        onChange={(e) => setFiltroPeriodo(e.target.value)}
                    >
                        <option value="todos">Todos os Períodos</option>
                        <option value="1">Manhã</option>
                        <option value="2">Tarde</option>
                    </select>
                    <select
                        className="p-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm"
                        value={filtroTurma}
                        onChange={(e) => setFiltroTurma(e.target.value)}
                    >
                        <option value="todas">Todas as Turmas</option>
                        {turmas.map(t => (
                            <option key={t.id} value={t.id}>{t.serie} {t.turma}</option>
                        ))}
                    </select>
                    <button
                        onClick={exportarCSV}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 shadow"
                        title="Exportar CSV"
                    >
                        <Download size={15} />
                    </button>
                </div>
            </div>

            {/* ===== ABA: VISÃO GERAL ===== */}
            {abaAtiva === 'visao' && (
                <div className="space-y-6">
                    {/* Cards KPI */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KpiCard
                            title="TOTAL DE ALUNOS"
                            value={kpis.total}
                            sub="Matriculados"
                            icon="👥"
                       />
                        <KpiCard
                            title="ALUNOS BILÍNGUES"
                            value={kpis.bilingues}
                            sub={`${kpis.total > 0 ? ((kpis.bilingues / kpis.total) * 100).toFixed(0) : 0}% do total`}
                            icon="🌐"
                            color="blue"
                        />
                        <KpiCard
                            title="ALUNOS COM IRMÃOS"
                            value={kpis.comIrmao}
                            sub="Contagem por família"
                            icon="🏠"
                            color="green"
                        />
                    </div>

                    {/* Gráficos de Pizza - Linha 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PizzaCard
                            titulo="Gênero dos Alunos"
                            icone="👥"
                            dados={[
                                { name: 'Feminino', value: kpis.feminino },
                                { name: 'Masculino', value: kpis.masculino }
                            ]}
                            cores={COLORS_GENERO}
                        />
                        <PizzaCard
                            titulo="Distribuição por Período"
                            icone="🕐"
                            dados={[
                                { name: 'Manhã', value: kpis.manha },
                                { name: 'Tarde', value: kpis.tarde }
                            ]}
                            cores={COLORS_PERIODO}
                        />
                    </div>

                    {/* Gráficos de Pizza - Linha 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PizzaCard
                            titulo="Pagantes"
                            icone="💳"
                            dados={[
                                { name: 'Não', value: kpis.naoPagantes },
                                { name: 'Sim', value: kpis.pagantes }
                            ]}
                            cores={COLORS_PAGANTE}
                        />
                        <PizzaCard
                            titulo="Novos vs Rematrícula"
                            icone="📊"
                            dados={[
                                { name: 'Novos', value: kpis.novos },
                                { name: 'Rematrícula', value: kpis.rematriculas }
                            ]}
                            cores={COLORS_TIPO}
                        />
                    </div>
                </div>
            )}

            {/* ===== ABA: MAPA DE SALAS ===== */}
            {abaAtiva === 'mapa' && (
                <div className="space-y-6">
                    {Object.entries(mapaDeSlads).map(([serie, turmasDaSerie]) => (
                        <div key={serie} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 text-base">{serie}</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 divide-x divide-y divide-slate-100">
                                {turmasDaSerie.map(t => {
                                    const pct = t.capacidade > 0 ? (t.matriculados / t.capacidade) * 100 : 0;
                                    const corBarra = pct >= 100 ? '#ef4444' : pct >= 85 ? '#f59e0b' : '#22c55e';
                                    const corFundo = pct >= 100 ? 'bg-red-50' : pct >= 85 ? 'bg-amber-50' : 'bg-green-50';
                                    const corTexto = pct >= 100 ? 'text-red-700' : pct >= 85 ? 'text-amber-700' : 'text-green-700';
                                    return (
                                        <div key={t.id} className={`p-4 ${corFundo}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-slate-800 text-lg">{t.turma}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.periodo === 'Manhã' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {t.periodo.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className={`text-2xl font-bold ${corTexto} mb-1`}>{t.matriculados}</p>
                                            <p className="text-xs text-slate-500">/ {t.capacidade} vagas</p>
                                            <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                                                <div
                                                    className="h-1.5 rounded-full transition-all"
                                                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: corBarra }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ===== ABA: ESTATÍSTICAS ===== */}
            {abaAtiva === 'estatisticas' && (
                <div className="space-y-6">

                    {/* Top 10 Origem dos Alunos */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Users size={16} className="text-slate-500" /> Top 10 Origem dos Alunos
                        </h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dadosOrigem} layout="vertical" margin={{ left: 100, right: 30, top: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
                                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                                    <Bar dataKey="value" name="Alunos" fill="#64748b" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Distribuição de Gênero por Turma */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BarChart2 size={16} className="text-slate-500" /> Distribuição de Gênero por Turma
                        </h3>
                        <div className="flex justify-center gap-6 mb-4 text-xs font-medium">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-pink-500" /> Feminino</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-blue-500" /> Masculino</span>
                        </div>
                        <div className="overflow-x-auto pb-2">
                            <div style={{ minWidth: Math.max(800, dadosGeneroPorTurma.length * 50) }} className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dadosGeneroPorTurma} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                                        <Bar dataKey="Feminino" stackId="g" fill="#ec4899" />
                                        <Bar dataKey="Masculino" stackId="g" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Matrículas por Mês */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            📅 Matrículas por Mês (Evolução)
                        </h3>
                        <div className="flex justify-center gap-6 mb-4 text-xs font-medium">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-pink-500" /> Feminino (Novos)</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-blue-500" /> Masculino (Novos)</span>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                                    <Bar dataKey="Feminino (Novos)" stackId="m" fill="#ec4899" />
                                    <Bar dataKey="Masculino (Novos)" stackId="m" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

function KpiCard({ title, value, sub, icon, color = 'default' }) {
    const bg = { default: 'bg-white', blue: 'bg-white', green: 'bg-white' }[color] || 'bg-white';
    return (
        <div className={`${bg} rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between`}>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
                <p className="text-4xl font-bold text-blue-600">{value}</p>
                <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
            <div className="text-5xl opacity-10">{icon}</div>
        </div>
    );
}

function PizzaCard({ titulo, icone, dados, cores }) {
    const total = dados.reduce((s, d) => s + d.value, 0);
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm">
                <span className="text-base">{icone}</span> {titulo}
            </h3>
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={dados}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            labelLine={false}
                            label={renderCustomLabel}
                        >
                            {dados.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                            ))}
                        </Pie>
                        <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span style={{ fontSize: 12, color: '#64748b' }}>{value}</span>}
                        />
                        <RechartsTooltip formatter={(value) => [`${value} (${total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)`, '']} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
