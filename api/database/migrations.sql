-- Adicionar número da edição
ALTER TABLE comics ADD COLUMN issue_number INTEGER;

-- Tabela de histórias por edição
CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comic_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);
