
// Tabela de Períodos
export const tblPeriodo = [
    { id: 1, periodo: 'Manhã' },
    { id: 2, periodo: 'Tarde' },
    { id: 3, periodo: 'Integral' }
];

// Tabela de Horários
export const tblHorarios = [
    { id: 1, descricao: '07h10 às 12h30' },
    { id: 2, descricao: '07h20 às 12h00' },
    { id: 3, descricao: '08h00 às 12h00' },
    { id: 4, descricao: '13h00 às 18h20' },
    { id: 5, descricao: '13h10 às 17h50' },
    { id: 6, descricao: '13h30 às 17h30' },
    { id: 7, descricao: '07h10 às 11h40' },
    { id: 8, descricao: '13h00 às 17h30' }
];

// Tabela de Itinerários
export const tblItinerario = [
    { id: 1, nome: 'Humanas' },
    { id: 2, nome: 'Exatas' },
    { id: 3, nome: 'Biológicas' },
    { id: 4, nome: 'Normal' } // Fundamental ou sem itinerário
];

// Tabela de Status de Matrícula
export const tblStatusMatricula = [
    { id: 1, status: 'Rematrícula' },
    { id: 2, status: 'Nova' },
    { id: 3, status: 'Desistente' },
    { id: 4, status: 'Em Análise' }
];

// Tabela de Genero
export const tblGenero = [
    { id: 'M', descricao: 'Masculino' },
    { id: 'F', descricao: 'Feminino' }
];

// Tabela de Salas (Infraestrutura)
export const tblSalas = [
    { id: 4, nome: 'Sala 4', local: 'Jardim', cap: 15, obs: 'Fictícia' },
    { id: 5, nome: 'Sala 5', local: 'Jardim', cap: 15, obs: 'Fictícia' },
    { id: 6, nome: 'Sala 6', local: 'Hall Sec.', cap: 28, obs: 'Ideal 24' },
    { id: 7, nome: 'Sala 7', local: 'Corredor', cap: 17, obs: '' },
    { id: 8, nome: 'Sala 8', local: 'Escada Inf.', cap: 19, obs: 'Ideal 18' },
    { id: 9, nome: 'Sala 9', local: 'Inconf.', cap: 25, obs: '' },
    { id: 10, nome: 'Sala 10', local: 'Reunião', cap: 21, obs: 'Ideal 19' },
    { id: 11, nome: 'Sala 11', local: 'Antigo Ref.', cap: 30, obs: '' },
    { id: 12, nome: 'Sala 12', local: 'Universit.', cap: 20, obs: 'Retroprojetor' },
    { id: 13, nome: 'Sala 13', local: 'Universit.', cap: 18, obs: 'Retroprojetor' },
    { id: 14, nome: 'Sala 14', local: 'Universit.', cap: 28, obs: '' },
    { id: 15, nome: 'Sala 15', local: 'Universit.', cap: 21, obs: 'Retroprojetor, Ideal 19' },
    { id: 16, nome: 'Sala 16', local: 'Universit.', cap: 24, obs: 'Retroprojetor' },
    { id: 17, nome: 'Sala 17', local: 'Universit.', cap: 24, obs: 'Retroprojetor' },
    { id: 18, nome: 'Sala 18', local: 'Universit.', cap: 17, obs: 'Retroprojetor, Ideal 16' },
    { id: 20, nome: 'Sala 20', local: 'Envidraçada', cap: 23, obs: 'Ideal 22' },
    { id: 21, nome: 'Sala 21', local: 'A definir', cap: 15, obs: '' },
    { id: 22, nome: 'Sala 22', local: 'Universit.', cap: 30, obs: '' },
    { id: 23, nome: 'Sala 23', local: 'Universit.', cap: 17, obs: '' },
    { id: 24, nome: 'Sala 24', local: 'Cineminha', cap: 16, obs: '' },
];


// Tabela de Turmas REAL (Mapeamento Fixo da Escola)
// IDs 1-31 conforme sequencia importada
export const tblTurmas = [
    // Ed. Infantil
    { id: 1, serie: 'Jardim IV', turma: 'A', periodo: 'Manhã', salaId: 4, capacidade: 15, qtdeAlunos: 0 },
    { id: 2, serie: 'Jardim V', turma: 'A', periodo: 'Tarde', salaId: 4, capacidade: 15, qtdeAlunos: 0 },
    { id: 3, serie: 'Jardim IV', turma: 'B', periodo: 'Manhã', salaId: 5, capacidade: 15, qtdeAlunos: 0 },
    { id: 4, serie: 'Jardim V', turma: 'B', periodo: 'Tarde', salaId: 5, capacidade: 15, qtdeAlunos: 0 },

    // Fund I
    { id: 5, serie: '1º', turma: 'A', periodo: 'Manhã', salaId: 10, capacidade: 21, qtdeAlunos: 0 },
    { id: 6, serie: '1º', turma: 'B', periodo: 'Tarde', salaId: 10, capacidade: 21, qtdeAlunos: 0 },

    { id: 7, serie: '2º', turma: 'A', periodo: 'Manhã', salaId: 9, capacidade: 25, qtdeAlunos: 0 },
    { id: 8, serie: '2º', turma: 'B', periodo: 'Tarde', salaId: 6, capacidade: 28, qtdeAlunos: 0 },
    { id: 9, serie: '2º', turma: 'C', periodo: 'Tarde', salaId: 7, capacidade: 17, qtdeAlunos: 0 },

    { id: 10, serie: '3º', turma: 'A', periodo: 'Manhã', salaId: 7, capacidade: 17, qtdeAlunos: 0 },
    { id: 11, serie: '3º', turma: 'B', periodo: 'Tarde', salaId: 9, capacidade: 25, qtdeAlunos: 0 },
    { id: 12, serie: '3º', turma: 'C', periodo: 'Tarde', salaId: 21, capacidade: 15, qtdeAlunos: 0 },

    { id: 13, serie: '4º', turma: 'A', periodo: 'Manhã', salaId: 6, capacidade: 28, qtdeAlunos: 0 },
    { id: 14, serie: '4º', turma: 'B', periodo: 'Tarde', salaId: 20, capacidade: 23, qtdeAlunos: 0 },

    { id: 15, serie: '5º', turma: 'A', periodo: 'Manhã', salaId: 20, capacidade: 23, qtdeAlunos: 0 },
    { id: 16, serie: '5º', turma: 'B', periodo: 'Manhã', salaId: 21, capacidade: 15, qtdeAlunos: 0 },
    { id: 17, serie: '5º', turma: 'C', periodo: 'Tarde', salaId: 8, capacidade: 19, qtdeAlunos: 0 },

    // Fund II
    { id: 18, serie: '6º', turma: 'A', periodo: 'Manhã', salaId: 23, capacidade: 17, qtdeAlunos: 0 },
    { id: 19, serie: '6º', turma: 'B', periodo: 'Manhã', salaId: 12, capacidade: 20, qtdeAlunos: 0 },
    { id: 20, serie: '6º', turma: 'C', periodo: 'Tarde', salaId: 12, capacidade: 20, qtdeAlunos: 0 },

    { id: 21, serie: '7º', turma: 'A', periodo: 'Manhã', salaId: 11, capacidade: 30, qtdeAlunos: 0 },
    { id: 22, serie: '7º', turma: 'B', periodo: 'Tarde', salaId: 17, capacidade: 24, qtdeAlunos: 0 },

    { id: 23, serie: '8º', turma: 'A', periodo: 'Manhã', salaId: 15, capacidade: 21, qtdeAlunos: 0 },
    { id: 24, serie: '8º', turma: 'B', periodo: 'Tarde', salaId: 16, capacidade: 24, qtdeAlunos: 0 },

    { id: 25, serie: '9º', turma: 'A', periodo: 'Manhã', salaId: 14, capacidade: 28, qtdeAlunos: 0 },
    { id: 26, serie: '9º', turma: 'B', periodo: 'Tarde', salaId: 14, capacidade: 28, qtdeAlunos: 0 },

    // Ensino Médio
    { id: 27, serie: '1º EM', turma: 'A', periodo: 'Manhã', salaId: 22, capacidade: 30, qtdeAlunos: 0 },

    // 2º EM tem itinerário fixo
    { id: 28, serie: '2º EM', turma: 'A', periodo: 'Manhã', salaId: 18, capacidade: 17, qtdeAlunos: 0, itinerarioFixo: 2 }, // Exatas
    { id: 29, serie: '2º EM', turma: 'B', periodo: 'Manhã', salaId: 17, capacidade: 24, qtdeAlunos: 0, itinerarioFixo: 1 }, // Humanas

    { id: 30, serie: '3º EM', turma: 'A', periodo: 'Manhã', salaId: 16, capacidade: 24, qtdeAlunos: 0 },
    { id: 31, serie: '3º EM', turma: 'B', periodo: 'Manhã', salaId: 24, capacidade: 16, qtdeAlunos: 0 }
];

export const alunosIniciais = [];
export const tblAlunos = alunosIniciais;
