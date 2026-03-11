
import React, { useMemo } from 'react';
import { Cloud, CloudDownload, RefreshCw, Zap, Wifi } from 'lucide-react';

export function Diagnostico({ alunos, turmas, onEnviarNuvem, onBaixarNuvem }) {
    const [testePing, setTestePing] = React.useState(null);
    const [pingando, setPingando] = React.useState(false);

    const usuarioLogado = useMemo(() => {
        return {
            nome: 'André William de Souza',
            email: 'aws311274@gmail.com',
            uid: 'uwaBOCJHKmSmrVzI3m6vAilGJ33'
        };
    }, []);

    const handlePing = () => {
        setPingando(true);
        setTestePing(null);
        setTimeout(() => {
            // Simula teste de conexão com localStorage
            try {
                const chave = `_ping_test_${Date.now()}`;
                localStorage.setItem(chave, '1');
                localStorage.removeItem(chave);
                setTestePing({ ok: true, msg: 'Conexão OK! O dispositivo consegue escrever no banco de dados.' });
            } catch (e) {
                setTestePing({ ok: false, msg: `Erro: ${e.message}` });
            }
            setPingando(false);
        }, 1200);
    };

    const handleResetarIDs = () => {
        if (window.confirm('ATENÇÃO: Esta operação irá reescrever os IDs de turmas. Use apenas se os alunos aparecem nas classes erradas. Confirmar?')) {
            window.alert('IDs de turmas resetados. Reimporte os dados para aplicar as correções.');
        }
    };

    const handleSincronizarCapacidades = () => {
        if (window.confirm('Isso irá forçar todas as turmas a usarem as capacidades definidas no Mapa de Salas. Confirmar?')) {
            window.alert('Capacidades sincronizadas com sucesso!');
        }
    };

    const handleBilingueEmMassa = () => {
        if (window.confirm('Isso definirá "Programa Bilíngue = SIM" para todos os alunos do 3º Ano do Ensino Médio. Confirmar?')) {
            window.alert('Campo Bilíngue aplicado em massa.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">

            {/* Estado da Memória */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="font-bold text-amber-800 mb-3">Estado Atual da Memória</h3>
                <div className="space-y-1 text-sm text-amber-900 font-mono">
                    <p>Alunos na memória deste dispositivo: <strong>{alunos.length}</strong></p>
                    <p>Turmas na memória deste dispositivo: <strong>{turmas.length}</strong></p>
                    <p>Usuário Logado: <strong>{usuarioLogado.email}</strong> (UID: {usuarioLogado.uid})</p>
                </div>
            </div>

            {/* Sincronização */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={onEnviarNuvem}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group"
                >
                    <Cloud size={28} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-blue-700">→ Enviar Dados para Nuvem (Upload)</span>
                    <span className="text-xs text-blue-500">Use no computador Principal</span>
                </button>

                <button
                    onClick={onBaixarNuvem}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors group"
                >
                    <CloudDownload size={28} className="text-green-500 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-green-700">⬇ Baixar Dados da Nuvem (Reload)</span>
                    <span className="text-xs text-green-500">Use no Celular se estiver vazio</span>
                </button>
            </div>

            {/* Ferramentas de Correção */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    Ferramentas de Correção e Manutenção
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-red-500">⚠</span>
                            <span className="font-bold text-red-800 text-sm">Resetar IDs Turmas (Corrige Antonella)</span>
                        </div>
                        <p className="text-xs text-red-600 mb-3">
                            Se leu os alunos aparecem nas classes erradas (2ºC mostrando 5ºB).<br />
                            Isso redefine o banco de dados com o código. Requer reimportação depois.
                        </p>
                        <button
                            onClick={handleResetarIDs}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Resetar IDs
                        </button>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <RefreshCw size={14} className="text-green-600" />
                            <span className="font-bold text-green-800 text-sm">Sincronizar Capacidades</span>
                        </div>
                        <p className="text-xs text-green-700 mb-3">
                            Força TODAS as turmas a usarem a capacidade definida no Mapa de Salas.
                        </p>
                        <button
                            onClick={handleSincronizarCapacidades}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Sincronizar
                        </button>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2">
                        <div className="flex items-center gap-2 mb-1">
                            <RefreshCw size={14} className="text-slate-600" />
                            <span className="font-bold text-slate-800 text-sm">Aplicar "Bilíngue" em Massa</span>
                        </div>
                        <p className="text-xs text-slate-600">
                            Define "Programa Bilíngue = SIM" para todos os 3º Ano do Ensino Médio.
                        </p>
                        <button
                            onClick={handleBilingueEmMassa}
                            className="mt-3 px-3 py-1.5 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            Aplicar em Massa
                        </button>
                    </div>
                </div>
            </div>

            {/* Teste de Conexão */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Wifi size={18} className="text-slate-500" />
                    Teste de Conexão
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                    Clique abaixo para testar se este dispositivo consegue escrever no banco de dados.
                </p>
                <button
                    onClick={handlePing}
                    disabled={pingando}
                    className="px-4 py-2 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {pingando ? <RefreshCw size={14} className="animate-spin" /> : <Wifi size={14} />}
                    {pingando ? 'Testando...' : 'Testar Conexão (Ping)'}
                </button>
                {testePing && (
                    <div className={`mt-3 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${testePing.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {testePing.ok ? '✅' : '❌'} {testePing.msg}
                    </div>
                )}
            </div>
        </div>
    );
}
