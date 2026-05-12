-- AlterTable: campos oficiais vindos do DataJud / CNJ
ALTER TABLE "processos"
  ADD COLUMN "grau" TEXT,
  ADD COLUMN "sistema" TEXT,
  ADD COLUMN "formato" TEXT,
  ADD COLUMN "nivelSigilo" INTEGER,
  ADD COLUMN "classeCodigo" INTEGER,
  ADD COLUMN "classeNome" TEXT,
  ADD COLUMN "assuntos" JSONB,
  ADD COLUMN "orgaoJulgador" TEXT,
  ADD COLUMN "orgaoJulgadorCodigo" TEXT,
  ADD COLUMN "municipioIbge" INTEGER,
  ADD COLUMN "dataAjuizamentoDataJud" TIMESTAMP(3),
  ADD COLUMN "dataUltimaAtualizacaoDataJud" TIMESTAMP(3);
