const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

let nativeDb = null;
let databasePath = null;
let transactionDepth = 0;

function persistir() {
  if (!nativeDb || transactionDepth > 0) return;
  const bytes = nativeDb.export();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  fs.writeFileSync(databasePath, Buffer.from(bytes));
}

function adaptarErro(error) {
  const message = String(error && error.message ? error.message : error);
  const wrapped = new Error(message);
  if (/UNIQUE constraint failed/i.test(message)) wrapped.code = "SQLITE_CONSTRAINT_UNIQUE";
  else if (/constraint failed/i.test(message)) wrapped.code = "SQLITE_CONSTRAINT";
  return wrapped;
}

const db = {
  exec(sql) {
    try { nativeDb.exec(sql); persistir(); }
    catch (error) { throw adaptarErro(error); }
  },
  pragma() { return undefined; },
  prepare(sql) {
    return {
      all(...params) {
        let statement;
        try {
          statement = nativeDb.prepare(sql);
          if (params.length) statement.bind(params);
          const rows = [];
          while (statement.step()) rows.push(statement.getAsObject());
          return rows;
        } catch (error) { throw adaptarErro(error); }
        finally { if (statement) statement.free(); }
      },
      get(...params) {
        let statement;
        try {
          statement = nativeDb.prepare(sql);
          if (params.length) statement.bind(params);
          return statement.step() ? statement.getAsObject() : undefined;
        } catch (error) { throw adaptarErro(error); }
        finally { if (statement) statement.free(); }
      },
      run(...params) {
        let statement;
        try {
          statement = nativeDb.prepare(sql);
          if (params.length) statement.bind(params);
          while (statement.step()) { /* consome resultados, se houver */ }
          statement.free();
          statement = null;
          const result = { changes: nativeDb.getRowsModified(), lastInsertRowid: nativeDb.exec("SELECT last_insert_rowid() AS id")[0].values[0][0] };
          persistir();
          return result;
        } catch (error) { throw adaptarErro(error); }
        finally { if (statement) statement.free(); }
      }
    };
  },
  transaction(callback) {
    return (...args) => {
      nativeDb.run("BEGIN TRANSACTION");
      transactionDepth++;
      try {
        const result = callback(...args);
        nativeDb.run("COMMIT");
        transactionDepth--;
        persistir();
        return result;
      } catch (error) {
        nativeDb.run("ROLLBACK");
        transactionDepth--;
        throw adaptarErro(error);
      }
    };
  }
};

async function initDatabase() {
  const SQL = await initSqlJs({});
  databasePath = process.env.DATABASE_PATH || path.join(__dirname, "escola-viva.sqlite");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  if (fs.existsSync(databasePath)) {
    const bytes = fs.readFileSync(databasePath);
    nativeDb = new SQL.Database(new Uint8Array(bytes));
  } else {
    nativeDb = new SQL.Database();
  }
  nativeDb.run("PRAGMA foreign_keys = ON");
  nativeDb.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      senha TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('admin','professor','aluno')),
      turma TEXT,
      aprovado INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS atividades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      disciplinas TEXT NOT NULL DEFAULT '',
      vagas INTEGER NOT NULL DEFAULT 30 CHECK(vagas > 0),
      ativa INTEGER NOT NULL DEFAULT 1,
      criado_por INTEGER,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS inscricoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id INTEGER NOT NULL,
      atividade_id INTEGER NOT NULL,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(aluno_id, atividade_id),
      FOREIGN KEY(aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY(atividade_id) REFERENCES atividades(id) ON DELETE CASCADE
    );
  `);

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@escolaviva.local").trim().toLowerCase();
  const adminName = process.env.ADMIN_NAME || "Administrador Escola Viva";
  const adminPassword = process.env.ADMIN_PASSWORD || "TroqueEstaSenha123!";
  const existe = db.prepare("SELECT id FROM usuarios WHERE email = ? COLLATE NOCASE").get(adminEmail);
  if (!existe) {
    db.prepare("INSERT INTO usuarios (nome,email,senha,tipo) VALUES (?,?,?,'admin')")
      .run(adminName, adminEmail, bcrypt.hashSync(adminPassword, 12));
    console.log(`Administrador inicial criado: ${adminEmail}`);
    if (adminPassword === "TroqueEstaSenha123!") console.warn("ATENÇÃO: configure ADMIN_PASSWORD no ambiente do Render.");
  }

  const total = db.prepare("SELECT COUNT(*) AS total FROM atividades").get().total;
  if (total === 0) {
    const inserir = db.prepare("INSERT INTO atividades (titulo,descricao,disciplinas,vagas) VALUES (?,?,?,?)");
    const iniciais = [
      ["Jardim Inteligente", "Horta vertical com garrafas PET, plantio de temperos e placas educativas.", "Ciências, Matemática e Geografia", 30],
      ["Museu do Futuro", "Exposição de objetos e soluções criados com materiais reutilizáveis.", "Artes, História e Ciências", 30],
      ["Desafio dos Gênios", "Jogos, enigmas, desafios matemáticos e perguntas de conhecimentos gerais.", "Matemática, Português e História", 30],
      ["Vozes da Escola", "Podcast ou jornal escolar com entrevistas da comunidade.", "Português, Tecnologia e Sociologia", 30],
      ["Cidade do Amanhã", "Maquete de uma cidade sustentável com energia limpa e áreas verdes.", "Geografia, Física, Matemática e Artes", 30]
    ];
    iniciais.forEach(item => inserir.run(...item));
  }
  persistir();
}

module.exports = { db, initDatabase };
