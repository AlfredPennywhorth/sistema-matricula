/**
 * firestoreService.js
 * Camada de serviço para todas as operações no Cloud Firestore.
 * Coleções: alunos | turmas | salas | users | debug
 */
import {
    collection, doc,
    onSnapshot,
    addDoc, setDoc, updateDoc, deleteDoc,
    query, orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── ALUNOS ───────────────────────────────────────────────────────────────────

/**
 * Assina em tempo real a coleção "alunos".
 * @param {Function} callback - recebe array de alunos
 * @returns {Function} unsubscribe
 */
export function subscribeAlunos(callback) {
    const q = query(collection(db, 'alunos'), orderBy('nome'));
    return onSnapshot(q, (snapshot) => {
        const alunos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(alunos);
    }, (error) => {
        console.error('[Firestore] Erro ao ler alunos:', error);
    });
}

/**
 * Adiciona um novo aluno.
 * @param {Object} dados - campos do aluno (sem id, sem dataMatricula)
 */
export async function adicionarAluno(dados) {
    const payload = {
        ...dados,
        dataMatricula: dados.dataMatricula || new Date().toISOString().split('T')[0],
        _criadoEm: serverTimestamp(),
        _atualizadoEm: serverTimestamp()
    };
    const ref = await addDoc(collection(db, 'alunos'), payload);
    return ref.id;
}

/**
 * Atualiza um aluno existente (merge parcial).
 * @param {string} id - ID do documento no Firestore
 * @param {Object} dados - campos a atualizar
 */
export async function atualizarAluno(id, dados) {
    const ref = doc(db, 'alunos', id);
    await updateDoc(ref, { ...dados, _atualizadoEm: serverTimestamp() });
}

/**
 * Exclui um aluno.
 * @param {string} id - ID do documento no Firestore
 */
export async function excluirAluno(id) {
    await deleteDoc(doc(db, 'alunos', id));
}

// ─── TURMAS ───────────────────────────────────────────────────────────────────

/**
 * Assina em tempo real a coleção "turmas".
 * @param {Function} callback - recebe array de turmas
 * @returns {Function} unsubscribe
 */
export function subscribeTurmas(callback) {
    const q = query(collection(db, 'turmas'));
    return onSnapshot(q, (snapshot) => {
        const turmas = snapshot.docs.map(doc => ({
            id: doc.id,
            // Compatibilidade: o campo "id" numérico pode estar armazenado como "turmaId"
            ...doc.data()
        }));
        callback(turmas);
    }, (error) => {
        console.error('[Firestore] Erro ao ler turmas:', error);
    });
}

/**
 * Salva (substitui) todas as turmas — útil quando o gestor edita a grade.
 * Faz upsert usando o ID numérico como chave do documento.
 * @param {Array} turmas
 */
export async function salvarTurmas(turmas) {
    const promises = turmas.map(t => {
        const docId = String(t.id);
        const ref = doc(db, 'turmas', docId);
        return setDoc(ref, { ...t, _atualizadoEm: serverTimestamp() }, { merge: true });
    });
    await Promise.all(promises);
}

/**
 * Exclui uma turma pelo ID.
 * @param {string|number} id
 */
export async function excluirTurma(id) {
    await deleteDoc(doc(db, 'turmas', String(id)));
}

// ─── DEBUG (log de eventos) ───────────────────────────────────────────────────

export async function registrarDebug(evento, detalhes = {}) {
    try {
        await addDoc(collection(db, 'debug'), {
            evento,
            detalhes,
            _ts: serverTimestamp()
        });
    } catch { /* silencioso */ }
}
