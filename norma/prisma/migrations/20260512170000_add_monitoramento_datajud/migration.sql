-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM (
  'DATAJUD_MOVIMENTACAO',
  'DATAJUD_PROCESSO_DESCOBERTO',
  'PRAZO_PROXIMO',
  'TAREFA_ATRASADA'
);

-- CreateTable: advogados_monitorados
CREATE TABLE "advogados_monitorados" (
  "id"                   TEXT NOT NULL,
  "oab"                  TEXT NOT NULL,
  "nome"                 TEXT,
  "tribunais"            TEXT[],
  "ativo"                BOOLEAN NOT NULL DEFAULT true,
  "ultimaVerificacaoAt"  TIMESTAMP(3),
  "ultimoResultadoCount" INTEGER,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  "escritorioId"         TEXT NOT NULL,
  "usuarioId"            TEXT,
  CONSTRAINT "advogados_monitorados_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "advogados_monitorados_escritorioId_oab_key"
  ON "advogados_monitorados"("escritorioId", "oab");

CREATE INDEX "advogados_monitorados_escritorioId_ativo_idx"
  ON "advogados_monitorados"("escritorioId", "ativo");

ALTER TABLE "advogados_monitorados"
  ADD CONSTRAINT "advogados_monitorados_escritorioId_fkey"
  FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "advogados_monitorados"
  ADD CONSTRAINT "advogados_monitorados_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: notificacoes
CREATE TABLE "notificacoes" (
  "id"           TEXT NOT NULL,
  "tipo"         "TipoNotificacao" NOT NULL,
  "titulo"       TEXT NOT NULL,
  "descricao"    TEXT,
  "link"         TEXT,
  "metadata"     JSONB,
  "lida"         BOOLEAN NOT NULL DEFAULT false,
  "urgente"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lidaAt"       TIMESTAMP(3),
  "escritorioId" TEXT NOT NULL,
  "usuarioId"    TEXT,
  CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notificacoes_escritorioId_lida_createdAt_idx"
  ON "notificacoes"("escritorioId", "lida", "createdAt");

CREATE INDEX "notificacoes_escritorioId_usuarioId_idx"
  ON "notificacoes"("escritorioId", "usuarioId");

ALTER TABLE "notificacoes"
  ADD CONSTRAINT "notificacoes_escritorioId_fkey"
  FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notificacoes"
  ADD CONSTRAINT "notificacoes_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
