-- AlterTable: adiciona vínculo opcional entre Tarefa e Prazo
ALTER TABLE "tarefas" ADD COLUMN "prazoId" TEXT;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_prazoId_fkey" FOREIGN KEY ("prazoId") REFERENCES "prazos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "tarefas_prazoId_idx" ON "tarefas"("prazoId");
