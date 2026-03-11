
import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Calendar, GraduationCap, LayoutDashboard,
  Settings, ChevronRight, UserPlus, Search, UploadCloud, Trash2, Edit, Cake
} from 'lucide-react';
import { tblTurmas, alunosIniciais, tblStatusMatricula } from './data/db'; // tblTurmas usado como valor inicial do state e na lista de alunos
import { FormularioMatricula } from './components/FormularioMatricula';
import { ImportadorAlunos } from './components/ImportadorAlunos';
import { Dashboard } from './components/Dashboard';
import { Aniversariantes } from './components/Aniversariantes';
import { Configuracoes } from './components/Configuracoes';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [alunoEmEdicao, setAlunoEmEdicao] = useState(null);

  // Turmas (State Global com Persistência)
  const [turmas, setTurmas] = useState(() => {
    const saved = localStorage.getItem('sistema_matriculas_turmas_v2');
    return saved ? JSON.parse(saved) : tblTurmas;
  });

  // Salva turmas sempre que mudar
  useEffect(() => {
    localStorage.setItem('sistema_matriculas_turmas_v2', JSON.stringify(turmas));
  }, [turmas]);

  // Inicialização de Estado com Persistência (Alunos)
  const [alunos, setAlunos] = useState(() => {
    const saved = localStorage.getItem('sistema_matriculas_alunos');
    return saved ? JSON.parse(saved) : alunosIniciais;
  });

  // Salvar automaticamente
  useEffect(() => {
    localStorage.setItem('sistema_matriculas_alunos', JSON.stringify(alunos));
  }, [alunos]);

  // Filtro de Busca (Para a lista de alunos)
  const alunosFiltrados = useMemo(() => {
    if (!searchTerm) return alunos;
    const lower = searchTerm.toLowerCase();
    // Filtra por Nome, RA ou Turma (Nome da turma) - usa state `turmas` para respeitar edições de Configurações
    return alunos.filter(a => {
      const nomeTurma = turmas.find(t => t.id === Number(a.turmaId));
      const turmaStr = nomeTurma ? `${nomeTurma.serie} ${nomeTurma.turma}` : '';

      return a.nome?.toLowerCase().includes(lower) ||
        a.registro?.toString().includes(lower) ||
        turmaStr.toLowerCase().includes(lower);
    });
  }, [alunos, searchTerm, turmas]);

  // Ação de Salvar (Criação ou Edição)
  const handleSaveMatricula = (dadosAluno) => {
    if (alunoEmEdicao) {
      setAlunos(prev => prev.map(a => a.id === alunoEmEdicao.id ? { ...dadosAluno, id: alunoEmEdicao.id } : a));
      alert('Aluno atualizado com sucesso!');
      setAlunoEmEdicao(null);
    } else {
      const novoAluno = { ...dadosAluno, id: Date.now() };
      if (novoAluno.temIrmao && novoAluno.sequenciaFamilia > 1 && novoAluno.bolsa === 0) {
        if (window.confirm('Detectamos que este aluno tem irmão matriculado. Deseja aplicar a bolsa automática de 10%?')) {
          novoAluno.bolsa = 10;
        }
      }
      setAlunos(prev => [...prev, novoAluno]);
      alert('Aluno matriculado com sucesso!');
    }
    setActiveTab('dashboard');
  };

  const handleEditarClick = (aluno) => {
    setAlunoEmEdicao(aluno);
    setActiveTab('matricula_nova');
  };

  const handleImportacao = (novosDados) => {
    const dadosFormatados = novosDados.map((d, i) => ({
      ...d,
      id: Date.now() + i
    }));

    if (alunos.length > 0) {
      if (window.confirm('Deseja substituir a base atual pela nova importação? \n[OK] Substituir Tudo \n[Cancelar] Adicionar aos Existentes')) {
        setAlunos(dadosFormatados);
      } else {
        setAlunos([...alunos, ...dadosFormatados]);
      }
    } else {
      setAlunos(dadosFormatados);
    }
    setActiveTab('dashboard');
  };

  const limparBaseDados = () => {
    if (window.confirm('Tem certeza que deseja apagar TODOS os alunos? Essa ação não pode ser desfeita.')) {
      setAlunos([]);
      localStorage.removeItem('sistema_matriculas_alunos');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col z-10 shadow-xl">
        <div className="flex flex-col items-center gap-4 mb-10 text-center">
          <div className="bg-white p-2 rounded-xl w-full flex justify-center shadow-lg shadow-white/10">
            <img src="/logo.png" alt="Colégio Conquista" className="h-16 object-contain" />
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem
            icon={<UserPlus size={20} />}
            label={alunoEmEdicao ? "Editando Aluno..." : "Nova Matrícula"}
            active={activeTab === 'matricula_nova'}
            onClick={() => { setAlunoEmEdicao(null); setActiveTab('matricula_nova'); }}
          />
          <NavItem
            icon={<Users size={20} />}
            label="Alunos"
            active={activeTab === 'alunos'}
            onClick={() => setActiveTab('alunos')}
          />
          <NavItem
            icon={<Cake size={20} />}
            label="Aniversariantes"
            active={activeTab === 'aniversariantes'}
            onClick={() => setActiveTab('aniversariantes')}
          />
          <NavItem
            icon={<Settings size={20} />}
            label="Configurações"
            active={activeTab === 'configuracoes'}
            onClick={() => setActiveTab('configuracoes')}
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('importacao')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                ${activeTab === 'importacao' ? 'bg-blue-600 text-white' : 'text-emerald-400 hover:bg-slate-800'}
             `}
          >
            <UploadCloud size={20} />
            Importar Planilha
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 bg-slate-50 min-h-screen w-full">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' ? 'Painel de Gestão 2026' : 'Gestão Acadêmica'}
            </h2>
            <p className="text-slate-500">Colégio Conquista • Sistema Integrado</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden">
              <img src="/logo.png" className="h-8 w-8 object-contain" />
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <Dashboard alunos={alunos} turmas={turmas} />
        )}

        {activeTab === 'aniversariantes' && (
          <Aniversariantes alunos={alunos} />
        )}

        {activeTab === 'configuracoes' && (
          <Configuracoes turmas={turmas} onSaveTurmas={setTurmas} />
        )}

        {/* Cadastro / Edição */}
        {activeTab === 'matricula_nova' && (
          <div className="animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <button onClick={() => setActiveTab('alunos')} className="hover:text-blue-600 hover:underline flex items-center gap-1">
                  <Users size={16} /> Alunos
                </button>
                <ChevronRight size={14} />
                <span className="text-slate-800 font-bold bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                  {alunoEmEdicao ? `Editando: ${alunoEmEdicao.nome}` : 'Nova Matrícula'}
                </span>
              </div>
            </div>
            <FormularioMatricula
              listaAlunos={alunos}
              alunoParaEditar={alunoEmEdicao}
              onSave={handleSaveMatricula}
              onCancel={() => setActiveTab('alunos')}
            />
          </div>
        )}

        {/* Importador */}
        {activeTab === 'importacao' && (
          <ImportadorAlunos onImport={handleImportacao} onCancel={() => setActiveTab('dashboard')} />
        )}

        {/* Lista de Alunos */}
        {activeTab === 'alunos' && (
          <div className="glass-panel p-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Corpo Discente <span className="text-slate-400 text-sm font-normal ml-2">({alunosFiltrados.length} encontrados)</span></h3>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative group w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por nome, RA ou Turma..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                      <span className="sr-only">Limpar</span>
                      ✕
                    </button>
                  )}
                </div>
                <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
                <button onClick={limparBaseDados} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors" title="Apagar Tudo">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[500px]">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-800 uppercase text-xs font-bold sticky top-0 z-10 shadow-sm border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg w-[30%]">RA / Nome</th>
                    <th className="px-4 py-3 w-[15%]">Turma</th>
                    <th className="px-4 py-3 w-[25%]">Família / Irmão</th>
                    <th className="px-4 py-3 w-[10%]">Pagante</th>
                    <th className="px-4 py-3 w-[10%]">Bolsa</th>
                    <th className="px-4 py-3 rounded-r-lg text-right w-[10%]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alunosFiltrados.length > 0 ? alunosFiltrados.map(aluno => (
                    <tr key={aluno.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors truncate pr-2" title={aluno.nome}>{aluno.nome}</div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                          <span className="bg-slate-100 px-1 rounded text-slate-500">{aluno.registro || 'S/ RA'}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span>{aluno.genero === 'M' ? 'Masc' : 'Fem'}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          {/* Idade Calculada */}
                          <span className="font-bold text-slate-500" title={aluno.nascimento}>
                            {(() => {
                              if (!aluno.nascimento) return '';
                              const h = new Date(); const n = new Date(aluno.nascimento);
                              let i = h.getFullYear() - n.getFullYear();
                              if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) i--;
                              return isNaN(i) ? '' : `${i}a`;
                            })()}
                          </span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className={`font-bold ${Number(aluno.statusId) === 3 ? 'text-red-400' : 'text-slate-400'}`}>
                            {tblStatusMatricula.find(s => s.id === Number(aluno.statusId))?.status || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isNaN(aluno.turmaId) ? aluno.turmaId : (tblTurmas.find(t => t.id === Number(aluno.turmaId))?.serie || '-')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          {aluno.nomeIrmao ? (
                            <div className="flex items-center gap-1 text-blue-600 font-medium text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100 max-w-full">
                              <Users size={12} className="shrink-0" />
                              <span className="truncate" title={aluno.nomeIrmao}>
                                {aluno.nomeIrmao}
                              </span>
                            </div>
                          ) : <span className="text-slate-300 text-xs">-</span>}
                          {aluno.laudo && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-amber-200 uppercase tracking-wider truncate max-w-full" title={aluno.laudo}>
                              {aluno.laudo.length > 20 ? '⚠️ VER LAUDO' : `⚠️ ${aluno.laudo}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {aluno.pagante === true || aluno.pagante === 'Sim' ? (
                          <span className="text-slate-400">Sim</span>
                        ) : (
                          <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-100">Não</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {Number(aluno.bolsa) > 0 ? (
                          <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded w-fit border border-green-100">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                            <span className="text-green-700 font-bold text-xs">{aluno.bolsa}%</span>
                          </div>
                        ) : <span className="text-slate-300 pl-2">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEditarClick(aluno)}
                          className="group-hover:opacity-100 opacity-60 text-slate-400 hover:text-blue-600 font-medium transition-all px-3 py-1.5 hover:bg-blue-50 rounded-lg text-xs flex items-center gap-1 ml-auto"
                        >
                          <Edit size={14} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                        <Search size={32} className="opacity-20" />
                        <p>Nenhum aluno encontrado para "{searchTerm}".</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto opacity-70" />}
    </button>
  );
}

export default App;
