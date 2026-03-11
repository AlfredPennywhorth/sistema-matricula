
import React, { useState, useMemo } from 'react';
import {
    Users, UserPlus, TrendingUp, Calendar, Filter, Download, User
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { tblTurmas, tblPeriodo, tblStatusMatricula } from '../data/db';

const COLORS_PIE = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981'];

export function Dashboard({ alunos, turmas = tblTurmas }) {
    // Filtros
    const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
    const [filtroNivel, setFiltroNivel] = useState('todos');

    // --- Exportação CSV ---
    const exportarCSV = () => {
        const cabecalho = ['Nome', 'RA', 'Gênero', 'Nascimento', 'Turma', 'Período', 'Status', 'Bolsa (%)', 'Pagante', 'Irmão', 'Colégio Anterior', 'Laudo', 'Data Matrícula'];

        const linhas = dadosFiltrados.map(a => {
            const turma = turmas.find(t => t.id === Number(a.turmaId));
            const periodo = tblPeriodo.find(p => p.id === Number(a.periodoId));
            const status = tblStatusMatricula.find(s => s.id === Number(a.statusId));
            return [
                a.nome || '',
                a.registro || '',
                a.genero === 'M' ? 'Masculino' : 'Feminino',
                a.nascimento || '',
                turma ? `${turma.serie} ${turma.turma}` : (a.turmaId || ''),
                periodo ? periodo.periodo : '',
                status ? status.status : '',
                a.bolsa || 0,
                (a.pagante === true || a.pagante === 'Sim') ? 'Sim' : 'Não',
                a.nomeIrmao || '',
                a.colegioAnterior || '',
                a.laudo || '',
                a.dataMatricula || ''
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
        });

        const csv = [cabecalho.join(','), ...linhas].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `alunos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // --- Processamento de Dados Base ---
    const dadosFiltrados = useMemo(() => {
        return alunos.filter(aluno => {
            let passa = true;
            // 1. Filtro Período
            if (filtroPeriodo !== 'todos') {
                if (Number(aluno.periodoId) !== Number(filtroPeriodo)) passa = false;
            }
            // 2. Filtro Nivel
            if (filtroNivel !== 'todos') {
                const turma = turmas.find(t => t.id === Number(aluno.turmaId));
                if (!turma) passa = false;
                else {
                    const s = turma.serie.toLowerCase();
                    if (filtroNivel === 'infantil' && !s.includes('jardim')) passa = false;
                    if (filtroNivel === 'fundamental' && (s.includes('em') || s.includes('jardim'))) passa = false;
                    if (filtroNivel === 'medio' && !s.includes('em')) passa = false;
                }
            }
            return passa;
        });
    }, [alunos, filtroPeriodo, filtroNivel, turmas]);

    const ativos = useMemo(() => dadosFiltrados.filter(a => Number(a.statusId) !== 3), [dadosFiltrados]);

    // --- KPIs ---
    const kpis = useMemo(() => {
        const total = ativos.length;
        const novos = ativos.filter(a => Number(a.statusId) === 2).length;
        const rematriculas = ativos.filter(a => Number(a.statusId) === 1).length;

        const meninos = ativos.filter(a => a.genero === 'M').length;
        const meninas = total - meninos;
        const pctMeninos = total > 0 ? ((meninos / total) * 100).toFixed(0) : 0;
        const pctMeninas = total > 0 ? ((meninas / total) * 100).toFixed(0) : 0;

        // Capacidade Total (considerando filtros)
        // Agrupar turmas únicas (caso filtro traga alunos de turmas duplicadas por erro, aqui olhamos tabela de turmas)
        const turmasConsideradas = turmas.filter(t => {
            let ok = true;
            if (filtroPeriodo !== 'todos') {
                const p = tblPeriodo.find(ip => ip.id == filtroPeriodo);
                if (p && t.periodo !== p.periodo) ok = false;
            }
            if (filtroNivel !== 'todos') {
                const s = t.serie.toLowerCase();
                if (filtroNivel === 'infantil' && !s.includes('jardim')) ok = false;
                if (filtroNivel === 'fundamental' && (s.includes('em') || s.includes('jardim'))) ok = false;
                if (filtroNivel === 'medio' && !s.includes('em')) ok = false;
            }
            return ok;
        });

        const capacidadeTotal = turmasConsideradas.reduce((a, b) => a + b.capacidade, 0);
        const ocupacao = capacidadeTotal > 0 ? ((total / capacidadeTotal) * 100).toFixed(1) : 0;

        return { total, novos, rematriculas, ocupacao, meninos, meninas, pctMeninos, pctMeninas };
    }, [ativos, filtroPeriodo, filtroNivel, turmas]);

    // --- Gráfico Evolução (Barras Empilhadas) ---
    const dadosEvolucao = useMemo(() => {
        const mapa = {};
        ativos.forEach(aluno => {
            if (!aluno.dataMatricula) return;
            try {
                const date = new Date(aluno.dataMatricula);
                if (isNaN(date.getTime())) return;

                const ano = date.getFullYear();
                const mes = date.getMonth() + 1;
                const chave = `${ano}-${String(mes).padStart(2, '0')}`;
                const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const label = `${meses[mes - 1]}/${ano.toString().substr(2)}`;

                if (!mapa[chave]) mapa[chave] = { chave, name: label, novos: 0, rematricula: 0 };

                if (Number(aluno.statusId) === 2) mapa[chave].novos += 1;
                else mapa[chave].rematricula += 1;

            } catch { /* data inválida, ignora */ }
        });
        return Object.values(mapa).sort((a, b) => a.chave.localeCompare(b.chave));
    }, [ativos]);

    // --- Gráfico Rosca Extra (Alunos por Período ou Irmãos) ---
    const dadosPizzaExtra = useMemo(() => {
        // Vamos mostrar Alunos por Período para complementar a visão
        const data = [
            { name: 'Manhã', value: ativos.filter(a => Number(a.periodoId) === 1).length },
            { name: 'Tarde', value: ativos.filter(a => Number(a.periodoId) === 2).length }
            // Integral não tem na escola segundo usuario
        ];
        return data.filter(d => d.value > 0);
    }, [ativos]);


    // --- Gráfico Ocupação Sombra (Agrupado por Série) ---
    const dadosOcupacaoSombra = useMemo(() => {
        // 1. Agrupar TblTurmas por Série (ex: "1º")
        const mapaSeries = {};

        // Itera sobre as turmas do DB (aplicando filtros de nivel)
        turmas.forEach(t => {
            let visivel = true;
            if (filtroNivel !== 'todos') {
                const s = t.serie.toLowerCase();
                if (filtroNivel === 'infantil' && !s.includes('jardim')) visivel = false;
                if (filtroNivel === 'fundamental' && (s.includes('em') || s.includes('jardim'))) visivel = false;
                if (filtroNivel === 'medio' && !s.includes('em')) visivel = false;
            }
            if (!visivel) return;

            const serieNome = t.serie.trim(); // "1º", "Jardim IV"
            if (!mapaSeries[serieNome]) {
                mapaSeries[serieNome] = {
                    name: serieNome,
                    capacidadeTotal: 0,
                    manha: 0,
                    tarde: 0
                };
            }
            // Soma capacidade total (ignorando turno, é vaga disponível na escola)
            mapaSeries[serieNome].capacidadeTotal += t.capacidade;

            // Conta alunos nessa turma específica
            const alunosNessaTurma = ativos.filter(a => Number(a.turmaId) === t.id);
            if (t.periodo === 'Manhã') mapaSeries[serieNome].manha += alunosNessaTurma.length;
            else mapaSeries[serieNome].tarde += alunosNessaTurma.length;
        });

        return Object.values(mapaSeries);
    }, [ativos, filtroNivel, turmas]); // Ignora filtroPeriodo pois queremos mostrar ambos empilhados

    return (
        <div className="space-y-6 animate-fade-in pb-12">

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <div className="p-2 bg-slate-100 rounded-lg"><Filter size={20} /></div>
                    <span>Filtros de Gestão:</span>
                </div>
                <div className="flex gap-4 flex-wrap">
                    <select className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)}>
                        <option value="todos">Todos os Períodos</option>
                        <option value="1">Manhã</option>
                        <option value="2">Tarde</option>
                    </select>
                    <select className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
                        <option value="todos">Todos os Níveis</option>
                        <option value="infantil">Ed. Infantil</option>
                        <option value="fundamental">Fundamental</option>
                        <option value="medio">Ensino Médio</option>
                    </select>
                    <button onClick={exportarCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 shadow-lg shadow-slate-900/10">
                        <Download size={16} /><span className="hidden sm:inline">Exportar</span>
                    </button>
                </div>
            </div>

            {/* KPIs com Gênero */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel p-6 flex flex-col justify-between h-36 card-hover border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                        <div><p className="text-slate-500 text-sm font-medium">Alunos Ativos</p><h3 className="text-3xl font-bold text-slate-800">{kpis.total}</h3></div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
                    </div>
                    <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> {kpis.meninos} ({kpis.pctMeninos}%)
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-pink-500"></span> {kpis.meninas} ({kpis.pctMeninas}%)
                        </div>
                    </div>
                    <div className="w-full bg-pink-200 h-1.5 rounded-full mt-2 overflow-hidden flex">
                        <div className="bg-blue-500 h-full" style={{ width: `${kpis.pctMeninos}%` }}></div>
                    </div>
                </div>

                <KpiCard title="Novas Matrículas" value={kpis.novos} icon={<UserPlus className="text-green-600" />} sub={`${((kpis.novos / kpis.total) * 100).toFixed(0)}% do total`} color="green" />

                <KpiCard title="Rematrículas" value={kpis.rematriculas} icon={<Calendar className="text-purple-600" />} sub={`${((kpis.rematriculas / kpis.total) * 100).toFixed(0)}% de retenção`} color="purple" />

                <div className="glass-panel p-6 flex flex-col justify-between h-36 card-hover border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start">
                        <div><p className="text-slate-500 text-sm font-medium">Taxa de Ocupação</p><h3 className="text-3xl font-bold text-slate-800">{kpis.ocupacao}%</h3></div>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><TrendingUp size={24} /></div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(kpis.ocupacao, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Baseado na capacidade filtrada.</p>
                </div>
            </div>

            {/* Gráfico Ocupação Sombra (Promovido para o Topo) */}
            <div className="glass-panel p-6 card-hover">
                <h3 className="font-bold text-lg text-slate-800 mb-6">Ocupação das Salas (Manhã + Tarde vs Capacidade Total)</h3>
                <div className="overflow-x-auto pb-4 custom-scrollbar">
                    <div style={{ width: Math.max(800, dadosOcupacaoSombra.length * 60) }} className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dadosOcupacaoSombra} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} interval={0} angle={-45} textAnchor="end" height={60} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />

                                {/* Sombra de Capacidade (Barra Atrás) */}
                                <Bar dataKey="capacidadeTotal" name="Vagas Totais (M+T)" fill="#cbd5e1" barSize={50} radius={[4, 4, 4, 4]} />

                                {/* Barras Empilhadas (Ficam na frente porque vem depois) */}
                                <Bar dataKey="manha" name="Manhã" stackId="ocupacao" fill="#f59e0b" barSize={25} />
                                <Bar dataKey="tarde" name="Tarde" stackId="ocupacao" fill="#3b82f6" barSize={25} radius={[4, 4, 0, 0]} />

                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="mt-4 flex justify-center gap-6 text-sm font-medium">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-100 border border-slate-200"></div> Capacidade da Sala (M+T)</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-500"></div> Ocupação Manhã</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500"></div> Ocupação Tarde</div>
                </div>
            </div>

            {/* Gráficos Linha 2: Evolução + Pizza */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-6 card-hover">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">Linha do Tempo de Matrículas</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="rematricula" name="Rematrículas" stackId="a" fill="#818cf8" radius={[0, 0, 0, 0]} barSize={40} />
                                <Bar dataKey="novos" name="Novos Alunos" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="glass-panel p-6 card-hover">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">Alunos por Período</h3>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dadosPizzaExtra} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                    {dadosPizzaExtra.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Manhã' ? '#f59e0b' : '#3b82f6'} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-xl font-bold text-slate-800">{kpis.total}</p>
                            <p className="text-xs text-slate-400">Total</p>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                        {dadosPizzaExtra.map(d => (
                            <div key={d.name} className="flex items-center gap-1 text-xs font-bold text-slate-600">
                                <span className={`w-2 h-2 rounded-full ${d.name === 'Manhã' ? 'bg-amber-500' : 'bg-blue-500'}`}></span> {d.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}

function KpiCard({ title, value, icon, sub, color = "blue" }) {
    const colorClasses = {
        blue: "border-l-blue-500",
        green: "border-l-emerald-500",
        purple: "border-l-purple-500",
        amber: "border-l-amber-500"
    };
    const bgClasses = {
        blue: "bg-blue-50",
        green: "bg-emerald-50",
        purple: "bg-purple-50",
        amber: "bg-amber-50"
    };

    return (
        <div className={`glass-panel p-6 flex flex-col justify-between h-36 card-hover border-l-4 ${colorClasses[color]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${bgClasses[color]} border border-slate-100`}>
                    {icon}
                </div>
            </div>
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-2">
                {sub}
            </div>
        </div>
    );
}
