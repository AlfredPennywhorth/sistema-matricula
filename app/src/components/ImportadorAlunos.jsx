
import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { tblTurmas, tblPeriodo, tblHorarios } from '../data/db';

export function ImportadorAlunos({ onImport, onCancel }) {
    const [textoCSV, setTextoCSV] = useState('');
    const [erro, setErro] = useState(null);
    const [sucesso, setSucesso] = useState(null);

    // Mapeamento de Colunas (Header da CSV -> Propriedade do Objeto)
    const mapaDeColunas = {
        'nome': 'nome',
        'aluno': 'nome',
        'nome do aluno': 'nome',
        'turma': 'turmaId',
        'período': 'periodoId',
        'periodo': 'periodoId',
        'horário': 'horarioId',
        'horario': 'horarioId',
        'status (matrícula)': 'statusId',
        'status': 'statusId',
        'matrícula': 'statusId',
        'sequência': 'sequenciaFamilia',
        'sequencia': 'sequenciaFamilia',
        'sequencia família': 'sequenciaFamilia',
        'nome do irmão': 'nomeIrmao',
        'nome do irmao': 'nomeIrmao',
        'turma do irmão': 'turmaIrmao',
        'turma do irmao': 'turmaIrmao',
        'pagante': 'pagante',
        'nascimento': 'nascimento',
        'registro': 'registro',
        'ra': 'registro',
        'data matrícula': 'dataMatricula',
        'data matricula': 'dataMatricula',
        'colégio anterior': 'colegioAnterior',
        'colegio anterior': 'colegioAnterior',
        'laudo': 'laudo',
        'reserva de turma': 'reservaTurmaId',
        'itinerário': 'itinerarioId',
        'itinerario': 'itinerarioId',
        'gênero': 'genero',
        'genero': 'genero',
        '% bolsa': 'bolsa',
        'bolsa': 'bolsa'
    };

    // Parser ROBUSTO para CSV/TSV (Detecta separador automaticamente)
    const parseCSVRobust = (text) => {
        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let insideQuotes = false;

        // Normaliza quebras de linha
        const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n') + '\n';

        // Detectar Separador na primeira linha
        const primeiraLinha = cleanText.split('\n')[0];
        const countTabs = (primeiraLinha.match(/\t/g) || []).length;
        const countSemis = (primeiraLinha.match(/;/g) || []).length;
        const separador = countTabs > countSemis ? '\t' : ';';

        console.log(`Separador detectado: '${separador === '\t' ? 'TAB' : 'Ponto e Vírgula'}'`);

        for (let i = 0; i < cleanText.length; i++) {
            const char = cleanText[i];
            const nextChar = cleanText[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    currentCell += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            }
            else if (char === separador && !insideQuotes) {
                currentRow.push(currentCell);
                currentCell = '';
            }
            else if (char === '\n' && !insideQuotes) {
                currentRow.push(currentCell);
                if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentCell = '';
            }
            else {
                currentCell += char;
            }
        }
        return rows;
    };

    // Função para converter data serial do Excel (ex: 41327) com segurança de Fuso Horário
    const excelDateToJSDate = (serial) => {
        if (!serial) return '';
        if (typeof serial === 'string' && (serial.includes('/') || serial.includes('-'))) {
            // Tenta tratar DD/MM/YYYY se vier texto
            if (serial.includes('/')) {
                const part = serial.split('/');
                if (part.length === 3) return `${part[2]}-${part[1]}-${part[0]}`; // YYYY-MM-DD
            }
            return serial;
        }

        const val = Number(serial);
        if (isNaN(val)) return '';

        // Adiciona 12 horas (0.5 dia) para evitar cair no dia anterior por fuso horário
        // Excel serial date bug (1900 was not a leap year logic, but standard fix matches)
        const utc_days = Math.floor(val - 25569);
        const utc_value = utc_days * 86400;
        // Cria data em UTC e adiciona 12h para cair no meio do dia
        const date_info = new Date((utc_value * 1000) + (12 * 60 * 60 * 1000));

        return date_info.toISOString().split('T')[0];
    };

    const processarDados = () => {
        try {
            setErro(null);
            setSucesso(null);

            if (!textoCSV.trim()) throw new Error("A área de texto está vazia.");

            // 1. Parse do CSV
            const linhas = parseCSVRobust(textoCSV);
            if (linhas.length < 2) throw new Error("O arquivo precisa conter Cabeçalho e Dados.");

            // 2. Identificar Colunas (Linha 0)
            const headers = linhas[0].map(h => h.trim().toLowerCase().replace(/^[\uFEFF]/, ''));

            const indices = {};
            Object.keys(mapaDeColunas).forEach(chave => {
                const idx = headers.indexOf(chave);
                if (idx !== -1) {
                    const propriedadeDestino = mapaDeColunas[chave];
                    if (!indices[propriedadeDestino]) {
                        indices[propriedadeDestino] = idx;
                    }
                }
            });

            if (indices['nome'] === undefined) {
                throw new Error("Coluna 'Nome' não encontrada. Verifique o cabeçalho.");
            }

            const novosAlunos = [];
            const hoje = new Date().toISOString().split('T')[0];

            // 3. Processar Linhas de Dados
            for (let i = 1; i < linhas.length; i++) {
                const celulas = linhas[i];
                if (celulas.length < 2 && (!celulas[0] || !celulas[0].trim())) continue;

                const aluno = {
                    id: null,
                    nome: '',
                    genero: 'M',
                    statusId: 1,
                    bolsa: 0,
                    pagante: 'Sim',
                    turmaId: 1,
                    dataMatricula: hoje,
                    sequenciaFamilia: 1,
                    nascimento: '',
                    nomeIrmao: ''
                };

                Object.keys(indices).forEach(prop => {
                    const index = indices[prop];
                    if (celulas[index] !== undefined) {
                        let valorRaw = celulas[index].trim();
                        valorRaw = valorRaw.replace(/^"|"$/g, '');

                        if (prop === 'genero') {
                            if (valorRaw.toLowerCase().startsWith('f')) aluno[prop] = 'F';
                            else aluno[prop] = 'M';
                        }
                        else if (prop === 'nascimento') {
                            aluno[prop] = excelDateToJSDate(valorRaw);
                        }
                        else if (prop === 'dataMatricula') {
                            aluno[prop] = excelDateToJSDate(valorRaw);
                        }
                        else if (prop === 'bolsa') {
                            let num = valorRaw.replace('%', '').replace(',', '.');
                            let val = parseFloat(num);
                            if (!isNaN(val)) {
                                if (val > 0 && val <= 1) val = val * 100;
                                aluno[prop] = Math.round(val);
                            }
                        }
                        else if (prop === 'sequenciaFamilia') {
                            aluno[prop] = parseInt(valorRaw) || 1;
                        }
                        else if (prop === 'statusId') {
                            const v = valorRaw.toLowerCase();
                            if (v.includes('nova')) aluno[prop] = 2;
                            else if (v.includes('desist')) aluno[prop] = 3;
                            else aluno[prop] = 1;
                        }
                        else if (prop === 'pagante') {
                            const v = valorRaw.toLowerCase();
                            aluno[prop] = (v === 'sim' || v === 's' || v === 'true');
                        }
                        else if (prop === 'turmaId') {
                            // 1. Limpeza Inicial
                            let cleanTurma = valorRaw.replace(/^[a-z]\)\s*/i, '').trim();

                            // Detectar Itinerário no Nome da Turma (Ex: "2º Médio A - Exatas")
                            if (!aluno.itinerarioId || aluno.itinerarioId === 4) {
                                const lower = cleanTurma.toLowerCase();
                                if (lower.includes('exata')) aluno.itinerarioId = 2;
                                else if (lower.includes('human')) aluno.itinerarioId = 1;
                                else if (lower.includes('biol')) aluno.itinerarioId = 3;
                            }

                            // 2. Normalização Inteligente
                            // '1º Médio A' -> '1º EM A' -> '1ºEMA'
                            // '1º A' -> '1ºA'
                            let normalizedStr = cleanTurma.toLowerCase();

                            // Substitui termos de Ensino Médio por EM
                            // Trata "2ª Médio", "3ª Médio"
                            normalizedStr = normalizedStr.replace(/ª/g, 'º');

                            if (normalizedStr.includes('médio') || normalizedStr.includes('medio')) {
                                normalizedStr = normalizedStr.replace(/(ensino\s*)?(médio|medio)/g, 'em');
                            }

                            // Remove palavras irrelevantes restantes
                            normalizedStr = normalizedStr
                                .replace(/ª/g, 'º')
                                .replace(/(ano|série|serie|turma|ensino)/g, '')
                                .replace(/[\.\-\s]/g, ''); // Remove pontos, traços e espaços

                            // Busca no DB
                            const turmaEncontrada = tblTurmas.find(t => {
                                // Normaliza o DB também (ex: "1º EM", "A" -> "1ºEMA")
                                const dbName = `${t.serie}${t.turma}`.toLowerCase().replace(/[\.\-\s]/g, '');
                                return dbName === normalizedStr;
                            });

                            if (turmaEncontrada) {
                                aluno[prop] = turmaEncontrada.id;
                                if (!aluno.periodoId) {
                                    const p = tblPeriodo.find(p => p.periodo === turmaEncontrada.periodo);
                                    if (p) aluno.periodoId = p.id;
                                }
                            } else {
                                // Fallback: Tenta match parcial de Série se não achou turma exata
                                // Ex: "Jardim IV" (sem turma) -> Pega qualquer J4
                                const partialMatch = tblTurmas.find(t => {
                                    const dbSerie = t.serie.toLowerCase().replace(/[\.\-\s]/g, '');
                                    return dbSerie === normalizedStr;
                                });

                                if (partialMatch) {
                                    aluno[prop] = partialMatch.id;
                                    if (!aluno.periodoId) {
                                        const p = tblPeriodo.find(p => p.periodo === partialMatch.periodo);
                                        if (p) aluno.periodoId = p.id;
                                    }
                                } else {
                                    aluno[prop] = cleanTurma;
                                }
                            }
                        }
                        else if (prop === 'periodoId') {
                            const v = valorRaw.toLowerCase();
                            if (v.includes('manh')) aluno[prop] = 1;
                            else if (v.includes('tarde')) aluno[prop] = 2;
                            else if (v.includes('integral')) aluno[prop] = 3;
                        }
                        else if (prop === 'horarioId') {
                            const h = tblHorarios.find(h => h.descricao === valorRaw);
                            if (h) aluno[prop] = h.id;
                        }
                        else if (prop === 'laudo') {
                            if (valorRaw && valorRaw.length > 2) aluno[prop] = valorRaw;
                        }
                        else if (prop === 'itinerarioId') {
                            const v = valorRaw.toLowerCase();
                            if (v.includes('human')) aluno[prop] = 1;
                            else if (v.includes('exata')) aluno[prop] = 2;
                            else if (v.includes('biol')) aluno[prop] = 3;
                            else if (v.includes('normal') || v.includes('fund')) aluno[prop] = 4;
                            else aluno[prop] = 4; // Default
                        }
                        else {
                            if (valorRaw) aluno[prop] = valorRaw;
                        }
                    }
                });

                // Aplica Desconto de Irmão (Se Sequencia > 1 e sem bolsa definida)
                if (aluno.sequenciaFamilia > 1 && aluno.bolsa === 0) {
                    aluno.bolsa = 10;
                }

                if (aluno.nome) {
                    novosAlunos.push(aluno);
                }
            }

            onImport(novosAlunos);
            setSucesso(`${novosAlunos.length} alunos importados com sucesso!`);

        } catch (e) {
            console.error(e);
            setErro(e.message);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-5xl mx-auto p-8 animate-fade-in flex flex-col h-[85vh]">
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                    <UploadCloud size={32} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Importação de Dados</h2>
                    <p className="text-slate-500">Cole o conteúdo do seu CSV exportado do Excel abaixo.</p>
                </div>
            </div>

            <div className="mb-4 p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200 shrink-0 flex items-start gap-2">
                <HelpCircle size={18} className="mt-0.5 shrink-0" />
                <p>
                    <strong>Atenção:</strong> Certifique-se de copiar o cabeçalho junto com os dados.
                    O sistema tentará corrigir quebras de linha automáticas dentro das células de horário.
                </p>
            </div>

            <textarea
                className="w-full flex-1 p-4 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none whitespace-pre"
                placeholder="Cole seus dados aqui (Ctrl+V)..."
                value={textoCSV}
                onChange={(e) => setTextoCSV(e.target.value)}
            ></textarea>

            {erro && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 shrink-0 animate-shake">
                    <AlertCircle size={18} />
                    {erro}
                </div>
            )}

            {sucesso && (
                <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 shrink-0 animate-bounce-in">
                    <CheckCircle size={18} />
                    {sucesso}
                </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 shrink-0">
                <button onClick={onCancel} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Voltar</button>
                <button
                    onClick={processarDados}
                    disabled={!textoCSV.trim()}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                    Processar Dados
                </button>
            </div>
        </div>
    );
}
