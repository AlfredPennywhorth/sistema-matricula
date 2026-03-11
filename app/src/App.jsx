
import React, { useState, useMemo, useEffect } from 'react';
import {
    Users, Calendar, LayoutDashboard,
    UserPlus, Search, UploadCloud, Trash2, Edit, Cake,
    Archive, Stethoscope, LogOut, ChevronUp, ChevronDown, AlertTriangle, Settings
} from 'lucide-react';
import { tblTurmas, alunosIniciais, tblStatusMatricula, tblPeriodo } from './data/db';
import { FormularioMatricula } from './components/FormularioMatricula';
import { ImportadorAlunos } from './components/ImportadorAlunos';
import { Dashboard } from './components/Dashboard';
import { Aniversariantes } from './components/Aniversariantes';
import { Configuracoes } from './components/Configuracoes';
import { Diagnostico } from './components/Diagnostico';

// --- Helpers ---
function calcularIdade(nascimento) {
    if (!nascimento) return '';
    const h = new Date(); const n = new Date(nascimento);
    let i = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) i--;
    return isNaN(i) ? '' : i;
}

function formatarAniversario(nascimento) {
    if (!nascimento) return '';
    const d = new Date(nascimento);
    if (isNaN(d.getTime())) return '';
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
}

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroTurmaAlunos, setFiltroTurmaAlunos] = useState('');
    const [sortField, setSortField] = useState('nome');
    const [sortDir, setSortDir] = useState('asc');
    const [alunoEmEdicao, setAlunoEmEdicao] = useState(null);
    const [alunoDuplicadoAviso, setAlunoDuplicadoAviso] = useState(null);

    // Turmas (State Global com Persistência)
    const [turmas, setTurmas] = useState(() => {
        const saved = localStorage.getItem('sistema_matriculas_turmas_v2');
        return saved ? JSON.parse(saved) : tblTurmas;
    });
    useEffect(() => {
        localStorage.setItem('sistema_matriculas_turmas_v2', JSON.stringify(turmas));
    }, [turmas]);

    // Alunos (State Global com Persistência)
    const [alunos, setAlunos] = useState(() => {
        const saved = localStorage.getItem('sistema_matriculas_alunos');
        return saved ? JSON.parse(saved) : alunosIniciais;
    });
    useEffect(() => {
        localStorage.setItem('sistema_matriculas_alunos', JSON.stringify(alunos));
    }, [alunos]);

    // Alunos ativos (exclui arquivo morto)
    const alunosAtivos = useMemo(() =>
        alunos.filter(a => Number(a.statusId) !== 3 && Number(a.statusId) !== 4),
        [alunos]
    );

    // Alunos inativos (arquivo morto)
    const alunosInativos = useMemo(() =>
        alunos.filter(a => Number(a.statusId) === 3 || Number(a.statusId) === 4),
        [alunos]
    );

    // Filtro + Ordenação para Lista de Alunos
    const alunosFiltrados = useMemo(() => {
        let lista = alunosAtivos;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            lista = lista.filter(a => {
                const nomeTurma = turmas.find(t => t.id === Number(a.turmaId));
                const turmaStr = nomeTurma ? `${nomeTurma.serie} ${nomeTurma.turma}` : '';
                return a.nome?.toLowerCase().includes(lower) ||
                    a.registro?.toString().includes(lower) ||
                    turmaStr.toLowerCase().includes(lower);
            });
        }
        if (filtroTurmaAlunos) {
            lista = lista.filter(a => String(a.turmaId) === String(filtroTurmaAlunos));
        }
        // Ordenação
        lista = [...lista].sort((a, b) => {
            let va = a[sortField] || '';
            let vb = b[sortField] || '';
            if (sortField === 'turmaId') {
                const ta = turmas.find(t => t.id === Number(a.turmaId));
                const tb = turmas.find(t => t.id === Number(b.turmaId));
                va = ta ? `${ta.serie} ${ta.turma}` : '';
                vb = tb ? `${tb.serie} ${tb.turma}` : '';
            }
            if (sortField === 'idade') {
                va = calcularIdade(a.nascimento) || 0;
                vb = calcularIdade(b.nascimento) || 0;
                return sortDir === 'asc' ? va - vb : vb - va;
            }
            return sortDir === 'asc'
                ? String(va).localeCompare(String(vb))
                : String(vb).localeCompare(String(va));
        });
        return lista;
    }, [alunosAtivos, searchTerm, filtroTurmaAlunos, sortField, sortDir, turmas]);

    // Filtro para Arquivo
    const arquivoFiltrado = useMemo(() => {
        let lista = alunosInativos;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            lista = lista.filter(a => {
                const nomeTurma = turmas.find(t => t.id === Number(a.turmaId));
                const turmaStr = nomeTurma ? `${nomeTurma.serie} ${nomeTurma.turma}` : '';
                return a.nome?.toLowerCase().includes(lower) ||
                    a.registro?.toString().includes(lower) ||
                    turmaStr.toLowerCase().includes(lower);
            });
        }
        return lista;
    }, [alunosInativos, searchTerm, turmas]);

    // Ordenação de colunas
    const handleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return null;
        return sortDir === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />;
    };

    // Verificação de duplicatas
    const verificarDuplicata = (dadosAluno) => {
        const nomeNovo = (dadosAluno.nome || '').trim().toLowerCase();
        const raNovo = (dadosAluno.registro || '').trim();
        const idEdicao = alunoEmEdicao?.id;

        // Verificar por nome
        const mesmNome = alunos.find(a =>
            a.id !== idEdicao &&
            (a.nome || '').trim().toLowerCase() === nomeNovo
        );
        // Verificar por RA (somente se RA preenchido)
        const mesmoRA = raNovo ? alunos.find(a =>
            a.id !== idEdicao &&
            (a.registro || '').trim() === raNovo
        ) : null;

        if (mesmoRA) return { tipo: 'ra', msg: `Já existe um aluno com RA "${raNovo}" (${mesmoRA.nome}). RA deve ser único.` };
        if (mesmNome) return { tipo: 'nome', msg: `Já existe um aluno chamado "${mesmNome.nome}" (RA: ${mesmNome.registro || 'S/ RA'}). Confirme se é realmente um homonônimo.` };
        return null;
    };

    // Salvar Matrícula
    const handleSaveMatricula = (dadosAluno) => {
        const duplicata = verificarDuplicata(dadosAluno);

        if (duplicata) {
            const confirmar = window.confirm(
                `⚠️ ATENÇÃO - ${duplicata.tipo === 'ra' ? 'RA Duplicado' : 'Nome Duplicado'}\n\n${duplicata.msg}\n\n${duplicata.tipo === 'ra' ? 'Corrija o RA antes de continuar.' : 'Deseja prosseguir mesmo assim (homonônimo)?'}`
            );
            if (duplicata.tipo === 'ra' || !confirmar) return;
        }

        if (alunoEmEdicao) {
            setAlunos(prev => prev.map(a => a.id === alunoEmEdicao.id ? { ...dadosAluno, id: alunoEmEdicao.id } : a));
            alert('Aluno atualizado com sucesso!');
            setAlunoEmEdicao(null);
        } else {
            const novoAluno = { ...dadosAluno, id: Date.now() };
            if (novoAluno.nomeIrmao && novoAluno.sequenciaFamilia > 1 && !novoAluno.bolsa) {
                if (window.confirm('Detectamos que este aluno tem irmão matriculado. Deseja aplicar a bolsa automática de 10%?')) {
                    novoAluno.bolsa = 10;
                }
            }
            setAlunos(prev => [...prev, novoAluno]);
            alert('Aluno matriculado com sucesso!');
        }
        setActiveTab('alunos');
    };

    const handleEditarClick = (aluno) => {
        setAlunoEmEdicao(aluno);
        setActiveTab('matricula_nova');
    };

    const handleExcluirAluno = (aluno) => {
        if (window.confirm(`Tem certeza que deseja EXCLUIR o aluno "${aluno.nome}" (RA: ${aluno.registro || 'S/ RA'})?\n\nEsta ação não pode ser desfeita.`)) {
            setAlunos(prev => prev.filter(a => a.id !== aluno.id));
        }
    };

    const handleImportacao = (novosDados) => {
        const dadosFormatados = novosDados.map((d, i) => ({ ...d, id: Date.now() + i }));
        if (alunos.length > 0) {
            if (window.confirm('Deseja substituir a base atual pela nova importação?\n[OK] Substituir Tudo\n[Cancelar] Adicionar aos Existentes')) {
                setAlunos(dadosFormatados);
            } else {
                setAlunos([...alunos, ...dadosFormatados]);
            }
        } else {
            setAlunos(dadosFormatados);
        }
        setActiveTab('dashboard');
    };

    const handleNavegacao = (tab) => {
        setSearchTerm('');
        setFiltroTurmaAlunos('');
        if (tab !== 'matricula_nova') setAlunoEmEdicao(null);
        setActiveTab(tab);
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">

            {/* ======== SIDEBAR ======== */}
            <aside className="fixed left-0 top-0 h-full w-52 bg-white border-r border-slate-200 text-slate-700 flex flex-col z-10 shadow-sm">
                {/* Logo */}
                <div className="p-4 border-b border-slate-100">
                    <img src="/logo.png" alt="Colégio Conquista" className="h-14 object-contain mx-auto" />
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                        Sistema de Matrículas
                    </p>
                </div>

                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                    {/* GRUPO DE GESTÃO */}
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-3 pb-1">Grupo de Gestão</p>

                    <NavItem icon={<LayoutDashboard size={16} />} label="Painel Geral" active={activeTab === 'dashboard'} onClick={() => handleNavegacao('dashboard')} />
                    <NavItem icon={<UserPlus size={16} />} label={alunoEmEdicao ? 'Editando...' : 'Nova Matrícula'} active={activeTab === 'matricula_nova'} onClick={() => { setAlunoEmEdicao(null); handleNavegacao('matricula_nova'); }} />
                    <NavItem icon={<Users size={16} />} label="Alunos" active={activeTab === 'alunos'} onClick={() => handleNavegacao('alunos')} />
                    <NavItem icon={<Cake size={16} />} label="Aniversariantes" active={activeTab === 'aniversariantes'} onClick={() => handleNavegacao('aniversariantes')} />
                    <NavItem icon={<Archive size={16} />} label="Arquivo / Inativos" active={activeTab === 'arquivo'} onClick={() => handleNavegacao('arquivo')} />

                    {/* GRUPO DE SISTEMA */}
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-4 pb-1">Grupo de Sistema</p>

                    <NavItem icon={<Settings size={16} />} label="Turmas / Salas" active={activeTab === 'configuracoes'} onClick={() => handleNavegacao('configuracoes')} />
                    <NavItem icon={<UploadCloud size={16} />} label="Importação" active={activeTab === 'importacao'} onClick={() => handleNavegacao('importacao')} />
                    <NavItem icon={<Stethoscope size={16} />} label="Diagnóstico" active={activeTab === 'diagnostico'} onClick={() => handleNavegacao('diagnostico')} />
                </nav>

                {/* Rodapé Sidebar */}
                <div className="p-3 border-t border-slate-100">
                    <button
                        onClick={() => { if (window.confirm('Deseja sair do sistema?')) window.location.reload(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                    >
                        <LogOut size={15} /> Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* ======== CONTEÚDO PRINCIPAL ======== */}
            <main className="flex-1 ml-52 min-h-screen">

                {/* Header */}
                <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex justify-end items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-800 leading-none">André William de Souza</p>
                        <p className="text-xs text-slate-400">Editor (V2.9.1)</p>
                        <p className="text-xs text-green-500 font-medium">✓ Sincronizado</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow">
                        A
                    </div>
                </header>

                <div className="p-6">

                    {/* ===== DASHBOARD ===== */}
                    {activeTab === 'dashboard' && (
                        <Dashboard alunos={alunos} turmas={turmas} />
                    )}

                    {/* ===== ANIVERSARIANTES ===== */}
                    {activeTab === 'aniversariantes' && (
                        <Aniversariantes alunos={alunosAtivos} />
                    )}

                    {/* ===== CONFIGURAÇÕES ===== */}
                    {activeTab === 'configuracoes' && (
                        <Configuracoes turmas={turmas} onSaveTurmas={setTurmas} alunos={alunos} />
                    )}

                    {/* ===== IMPORTAÇÃO ===== */}
                    {activeTab === 'importacao' && (
                        <ImportadorAlunos onImport={handleImportacao} onCancel={() => handleNavegacao('dashboard')} />
                    )}

                    {/* ===== DIAGNÓSTICO ===== */}
                    {activeTab === 'diagnostico' && (
                        <Diagnostico
                            alunos={alunos}
                            turmas={turmas}
                            onEnviarNuvem={() => alert('Função de nuvem não configurada neste ambiente.')}
                            onBaixarNuvem={() => alert('Função de nuvem não configurada neste ambiente.')}
                        />
                    )}

                    {/* ===== NOVA MATRÍCULA / EDIÇÃO ===== */}
                    {activeTab === 'matricula_nova' && (
                        <div className="animate-fade-in">
                            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                                <button onClick={() => handleNavegacao('alunos')} className="hover:text-blue-600 hover:underline flex items-center gap-1">
                                    ← Voltar para Lista
                                </button>
                            </div>
                            <FormularioMatricula
                                listaAlunos={alunos}
                                alunoParaEditar={alunoEmEdicao}
                                onSave={handleSaveMatricula}
                                onCancel={() => handleNavegacao('alunos')}
                            />
                        </div>
                    )}

                    {/* ===== LISTA DE ALUNOS ===== */}
                    {activeTab === 'alunos' && (
                        <TabelaAlunos
                            lista={alunosFiltrados}
                            titulo={`Lista de Alunos (${alunosFiltrados.length})`}
                            totalSemFiltro={alunosAtivos.length}
                            searchTerm={searchTerm}
                            onSearch={setSearchTerm}
                            filtroTurma={filtroTurmaAlunos}
                            onFiltroTurma={setFiltroTurmaAlunos}
                            turmas={turmas}
                            onEditar={handleEditarClick}
                            onExcluir={handleExcluirAluno}
                            onNovaMatricula={() => { setAlunoEmEdicao(null); handleNavegacao('matricula_nova'); }}
                            sortField={sortField}
                            sortDir={sortDir}
                            onSort={handleSort}
                            modoArquivo={false}
                        />
                    )}

                    {/* ===== ARQUIVO / INATIVOS ===== */}
                    {activeTab === 'arquivo' && (
                        <TabelaAlunos
                            lista={arquivoFiltrado}
                            titulo={`Arquivo Morto (${arquivoFiltrado.length})`}
                            totalSemFiltro={alunosInativos.length}
                            searchTerm={searchTerm}
                            onSearch={setSearchTerm}
                            filtroTurma={filtroTurmaAlunos}
                            onFiltroTurma={setFiltroTurmaAlunos}
                            turmas={turmas}
                            onEditar={handleEditarClick}
                            onExcluir={handleExcluirAluno}
                            onNovaMatricula={() => { setAlunoEmEdicao(null); handleNavegacao('matricula_nova'); }}
                            sortField={sortField}
                            sortDir={sortDir}
                            onSort={handleSort}
                            modoArquivo={true}
                        />
                    )}

                </div>
            </main>
        </div>
    );
}

// ======== COMPONENTES AUXILIARES: fora do render ========
function SortIcon({ field, sortField, sortDir }) {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />;
}

function ThSortable({ field, label, sortField, sortDir, onSort }) {
    return (
        <th
            className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none whitespace-nowrap"
            onClick={() => onSort(field)}
        >
            {label}<SortIcon field={field} sortField={sortField} sortDir={sortDir} />
        </th>
    );
}

// ======== COMPONENTE: NavItem ========
function NavItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-sm ${active
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
        >
            <span className="shrink-0">{icon}</span>
            <span className="truncate">{label}</span>
        </button>
    );
}

// ======== COMPONENTE: TabelaAlunos ========
function TabelaAlunos({ lista, titulo, searchTerm, onSearch, filtroTurma, onFiltroTurma, turmas, onEditar, onExcluir, onNovaMatricula, sortField, sortDir, onSort, modoArquivo }) {

    const getStatusBadge = (statusId) => {
        const id = Number(statusId);
        if (id === 1) return <span className="px-2 py-0.5 text-xs font-bold rounded bg-green-100 text-green-700 border border-green-200">Rematrícula</span>;
        if (id === 2) return <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-700 border border-blue-200">Nova</span>;
        if (id === 3) return <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-700 border border-red-200">Desistente</span>;
        if (id === 4) return <span className="px-2 py-0.5 text-xs font-bold rounded bg-orange-100 text-orange-700 border border-orange-200">Transferido</span>;
        return <span className="text-slate-400 text-xs">-</span>;
    };

    return (
        <div className="animate-fade-in">
            {/* Header da Lista */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-5">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Users size={20} className="text-slate-500" />
                    {titulo}
                </h2>
                {!modoArquivo && (
                    <button
                        onClick={onNovaMatricula}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                    >
                        <UserPlus size={16} /> Nova Matrícula
                    </button>
                )}
            </div>

            {/* Barra de Busca + Filtro */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, RA ou turma..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none shadow-sm"
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm"
                    value={filtroTurma}
                    onChange={(e) => onFiltroTurma(e.target.value)}
                >
                    <option value="">Todas as Turmas</option>
                    {turmas.map(t => (
                        <option key={t.id} value={t.id}>{t.serie} {t.turma}</option>
                    ))}
                </select>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-700">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <ThSortable field="registro" label="RA" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                                <ThSortable field="nome" label="Nome ↑" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Gênero</th>
                                <ThSortable field="turmaId" label="Turma" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                                <ThSortable field="idade" label="Idade" sortField={sortField} sortDir={sortDir} onSort={onSort} />
                                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Aniversário</th>
                                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Bilíngue</th>
                                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Irmão(ã)</th>
                                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {lista.length > 0 ? lista.map(aluno => {
                                const turmaObj = turmas.find(t => t.id === Number(aluno.turmaId));
                                const turmaStr = turmaObj ? `${turmaObj.serie} ${turmaObj.turma}` : (aluno.turmaId || '-');
                                const idade = calcularIdade(aluno.nascimento);
                                const aniversario = formatarAniversario(aluno.nascimento);
                                const bilingue = aluno.bilingue === true || aluno.bilingue === 'Sim' || aluno.bilingue === 'SIM';
                                const primeiroNomeIrmao = aluno.nomeIrmao ? aluno.nomeIrmao.split(' ')[0] : '';

                                return (
                                    <tr key={aluno.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-3 py-2.5 text-xs text-slate-500 font-mono whitespace-nowrap">{aluno.registro || '-'}</td>
                                        <td className="px-3 py-2.5 font-medium text-slate-900 max-w-[200px] truncate" title={aluno.nome}>{aluno.nome}</td>
                                        <td className="px-3 py-2.5">
                                            {aluno.genero === 'F'
                                                ? <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 font-bold text-xs flex items-center justify-center border border-pink-200">F</span>
                                                : <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200">M</span>
                                            }
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{turmaStr}</td>
                                        <td className="px-3 py-2.5 text-slate-600">{idade || '-'}</td>
                                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{aniversario || '-'}</td>
                                        <td className="px-3 py-2.5">
                                            {bilingue
                                                ? <span className="px-2 py-0.5 text-xs font-bold rounded bg-teal-100 text-teal-700 border border-teal-200">SIM</span>
                                                : <span className="text-slate-300">-</span>
                                            }
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {primeiroNomeIrmao
                                                ? <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                                                    <Users size={10} /> {primeiroNomeIrmao}
                                                  </span>
                                                : <span className="text-slate-300">-</span>
                                            }
                                        </td>
                                        <td className="px-3 py-2.5">{getStatusBadge(aluno.statusId)}</td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => onEditar(aluno)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={15} />
                                                </button>
                                                <button
                                                    onClick={() => onExcluir(aluno)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="10" className="px-4 py-12 text-center text-slate-400">
                                        <Search size={32} className="mx-auto mb-2 opacity-20" />
                                        <p>{searchTerm ? `Nenhum aluno encontrado para "${searchTerm}".` : 'Nenhum aluno cadastrado.'}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default App;
