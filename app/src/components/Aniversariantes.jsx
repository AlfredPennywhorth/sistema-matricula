
import React, { useState, useMemo } from 'react';
import { Cake, Calendar as CalendarIcon, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { tblTurmas } from '../data/db';

export function Aniversariantes({ alunos }) {
    const hoje = new Date();
    const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth()); // 0-11
    const [diaSelecionado, setDiaSelecionado] = useState(null); // null = todos do mês
    const [incluirFimDeSemana, setIncluirFimDeSemana] = useState(true); // Auto-check fim de semana na segunda

    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Helpers de Data
    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay(); // 0 = Domingo

    // Processa lista de alunos do Mês
    const mapAniversariantes = useMemo(() => {
        const mapa = {}; // dia -> [alunos]
        alunos.forEach(aluno => {
            if (!aluno.nascimento) return;
            const partes = aluno.nascimento.split('-'); // YYYY-MM-DD
            if (partes.length !== 3) return;

            const mesNasc = parseInt(partes[1]) - 1;
            const diaNasc = parseInt(partes[2]);

            if (mesNasc === mesSelecionado) {
                if (!mapa[diaNasc]) mapa[diaNasc] = [];
                mapa[diaNasc].push(aluno);
            }
        });
        return mapa; // { 1: [alunoA], 5: [alunoB, alunoC] }
    }, [alunos, mesSelecionado]);

    // Lista Final Filtrada
    const listaExibida = useMemo(() => {
        let lista = [];
        const anoAtual = new Date().getFullYear();

        if (diaSelecionado === null) {
            // Mostrar todos do mês ordenados por dia
            Object.keys(mapAniversariantes).sort((a, b) => Number(a) - Number(b)).forEach(dia => {
                lista = [...lista, ...mapAniversariantes[dia]];
            });
        } else {
            // Lógica Inteligente "Fim de Semana na Segunda"
            // Se for segunda (1) e a flag estiver ativa, pega sabado e domingo anteriores
            let diasParaMostrar = [diaSelecionado];

            if (incluirFimDeSemana) {
                const dataSelecionada = new Date(anoAtual, mesSelecionado, diaSelecionado);
                if (dataSelecionada.getDay() === 1) { // Segunda-feira
                    // Verifica se Sábado e Domingo anteriores são do mesmo mês
                    if (diaSelecionado > 2) {
                        diasParaMostrar.push(diaSelecionado - 1); // Domingo
                        diasParaMostrar.push(diaSelecionado - 2); // Sábado
                    }
                }
            }

            diasParaMostrar.sort((a, b) => a - b).forEach(d => {
                if (mapAniversariantes[d]) {
                    lista = [...lista, ...mapAniversariantes[d]];
                }
            });
        }
        return lista;
    }, [mapAniversariantes, diaSelecionado, incluirFimDeSemana, mesSelecionado]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in pb-12 h-[calc(100vh-140px)]">

            {/* --- Painel Esquerdo: Calendário e Filtros --- */}
            <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 overflow-y-auto pr-2 custom-scrollbar">

                {/* Seletor de Mês */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <CalendarIcon size={18} className="text-pink-500" /> Mês de Referência
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {meses.map((mes, index) => (
                            <button
                                key={mes}
                                onClick={() => { setMesSelecionado(index); setDiaSelecionado(null); }}
                                className={`px-2 py-2 rounded-lg text-xs font-bold transition-all border
                                    ${mesSelecionado === index
                                        ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-sm'
                                        : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}
                                `}
                            >
                                {mes.substr(0, 3)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Minicalendário */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-slate-800 text-lg">{meses[mesSelecionado]}</span>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">2026</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                            <span key={i} className={`text-[10px] font-bold ${i === 0 || i === 6 ? 'text-slate-300' : 'text-slate-400'}`}>{d}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {/* Padding Days */}
                        {Array.from({ length: getFirstDayOfMonth(mesSelecionado, 2026) }).map((_, i) => (
                            <div key={`pad-${i}`} className="h-8"></div>
                        ))}

                        {/* Days */}
                        {Array.from({ length: getDaysInMonth(mesSelecionado, 2026) }).map((_, i) => {
                            const dia = i + 1;
                            const temAniversario = !!mapAniversariantes[dia];
                            const count = mapAniversariantes[dia]?.length || 0;
                            const isSelected = diaSelecionado === dia;
                            const isHoje = (new Date().getDate() === dia) && (new Date().getMonth() === mesSelecionado);
                            const dataObj = new Date(2026, mesSelecionado, dia);
                            const isSegunda = dataObj.getDay() === 1;

                            return (
                                <button
                                    key={dia}
                                    onClick={() => setDiaSelecionado(isSelected ? null : dia)}
                                    className={`
                                        h-9 w-9 rounded-full flex flex-col items-center justify-center relative transition-all border
                                        ${isSelected
                                            ? 'bg-pink-500 text-white border-pink-600 shadow-md scale-110 z-10'
                                            : temAniversario
                                                ? 'bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100' // Tem festa
                                                : 'bg-white text-slate-500 border-transparent hover:bg-slate-50' // Dia comum
                                        }
                                        ${isHoje && !isSelected ? 'ring-2 ring-pink-400 ring-offset-1' : ''}
                                     `}
                                >
                                    <span className="text-xs font-bold leading-none">{dia}</span>
                                    {/* Dot indicators */}
                                    {temAniversario && !isSelected && (
                                        <span className="flex gap-0.5 mt-0.5">
                                            {Array.from({ length: Math.min(count, 3) }).map((_, ii) => (
                                                <span key={ii} className="w-1 h-1 rounded-full bg-pink-400"></span>
                                            ))}
                                        </span>
                                    )}
                                    {/* Tooltip de quantidade (se selecionado, esconde) */}
                                    {isSelected && isSegunda && incluirFimDeSemana && dia > 2 && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white" title="Incluindo Fim de Semana"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {diaSelecionado && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-2">
                                {new Date(2026, mesSelecionado, diaSelecionado).getDay() === 1 ? (
                                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={incluirFimDeSemana}
                                            onChange={(e) => setIncluirFimDeSemana(e.target.checked)}
                                            className="accent-pink-500 rounded"
                                        />
                                        Incluir Sáb/Dom
                                    </label>
                                ) : (
                                    <span className="text-xs text-slate-400">Filtro Ativo</span>
                                )}
                            </div>
                            <button onClick={() => setDiaSelecionado(null)} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                <X size={12} /> Limpar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Painel Direito: Lista (Scrollável) --- */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 p-4">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        {diaSelecionado ? (
                            <>
                                Aniversariantes do Dia <span className="text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">{diaSelecionado}</span>
                                {incluirFimDeSemana && diaSelecionado && new Date(2026, mesSelecionado, diaSelecionado).getDay() === 1 && (
                                    <span className="text-slate-400 text-sm font-normal">(+ Fim de Semana)</span>
                                )}
                            </>
                        ) : (
                            `Todos em ${meses[mesSelecionado]} (${listaExibida.length})`
                        )}
                    </h2>
                </div>

                <div className="overflow-y-auto custom-scrollbar pr-2 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {listaExibida.length > 0 ? (
                            listaExibida.map(aluno => {
                                const [, mes, dia] = aluno.nascimento.split('-');
                                const isHoje = (new Date().getDate() === parseInt(dia)) && (new Date().getMonth() === parseInt(mesSelecionado));
                                const turma = tblTurmas.find(t => t.id === Number(aluno.turmaId));

                                // Idade que vai fazer (ou fez)
                                const anoNasc = parseInt(aluno.nascimento.split('-')[0]);
                                const idade = new Date().getFullYear() - anoNasc;

                                // Verifica se é do fim de semana (pra destacar na lista de segunda)
                                const diaNum = parseInt(dia);
                                const isFimDeSemana = diaSelecionado && diaNum < diaSelecionado;

                                return (
                                    <div key={aluno.id} className={`group relative p-4 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between
                                        ${isHoje ? 'bg-gradient-to-br from-pink-50 to-orange-50 border-pink-200 shadow-pink-100' : 'bg-white border-slate-100 shadow-sm hover:border-blue-200'}
                                    `}>
                                        {isHoje && (
                                            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-pink-500 text-white text-[10px] uppercase font-bold rounded-full animate-bounce shadow-sm z-10">
                                                É Hoje!
                                            </span>
                                        )}
                                        {isFimDeSemana && (
                                            <span className="absolute top-2 right-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold rounded border border-slate-200">
                                                Fim de Semana
                                            </span>
                                        )}

                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 border-2
                                                ${aluno.genero === 'F' ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-blue-50 text-blue-500 border-blue-100'}
                                            `}>
                                                {aluno.nome.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2" title={aluno.nome}>{aluno.nome}</h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                        <CalendarIcon size={10} /> {dia}/{mes}
                                                    </span>
                                                    <span className="font-bold text-pink-600">
                                                        {idade} anos
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-xs">
                                            <span className="px-2 py-1 bg-slate-50 rounded text-slate-600 font-medium border border-slate-100 truncate max-w-[120px]" title={turma ? `${turma.serie} ${turma.turma}` : 'Sem Turma'}>
                                                {turma ? `${turma.serie} ${turma.turma}` : 'Sem Turma'}
                                            </span>
                                            {turma?.periodo === 'Manhã' ? (
                                                <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold">Manhã</span>
                                            ) : (
                                                <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">Tarde</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                                <Cake size={64} className="opacity-10 mb-4" />
                                <p className="text-center font-medium">Nenhum aniversariante encontrado <br /> para este filtro.</p>
                                {diaSelecionado && (
                                    <button onClick={() => setDiaSelecionado(null)} className="mt-4 text-sm text-blue-500 hover:underline">
                                        Ver todos do mês
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
