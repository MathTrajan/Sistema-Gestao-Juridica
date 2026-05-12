-- AlterTable
ALTER TABLE "movimentacoes" ADD COLUMN     "codigoExterno" TEXT;

-- AlterTable
ALTER TABLE "processos" ADD COLUMN     "lastSyncAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "movimentacoes_processoId_codigoExterno_idx" ON "movimentacoes"("processoId", "codigoExterno");
