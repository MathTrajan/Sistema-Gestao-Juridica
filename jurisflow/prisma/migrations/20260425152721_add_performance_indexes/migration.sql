-- CreateIndex
CREATE INDEX "clientes_escritorioId_idx" ON "clientes"("escritorioId");

-- CreateIndex
CREATE INDEX "clientes_escritorioId_status_idx" ON "clientes"("escritorioId", "status");

-- CreateIndex
CREATE INDEX "lancamentos_escritorioId_idx" ON "lancamentos"("escritorioId");

-- CreateIndex
CREATE INDEX "lancamentos_escritorioId_status_idx" ON "lancamentos"("escritorioId", "status");

-- CreateIndex
CREATE INDEX "lancamentos_dataVencimento_idx" ON "lancamentos"("dataVencimento");

-- CreateIndex
CREATE INDEX "leads_escritorioId_idx" ON "leads"("escritorioId");

-- CreateIndex
CREATE INDEX "leads_escritorioId_etapa_idx" ON "leads"("escritorioId", "etapa");

-- CreateIndex
CREATE INDEX "prazos_processoId_idx" ON "prazos"("processoId");

-- CreateIndex
CREATE INDEX "prazos_dataFinal_status_idx" ON "prazos"("dataFinal", "status");

-- CreateIndex
CREATE INDEX "processos_escritorioId_idx" ON "processos"("escritorioId");

-- CreateIndex
CREATE INDEX "processos_escritorioId_status_idx" ON "processos"("escritorioId", "status");

-- CreateIndex
CREATE INDEX "processos_clienteId_idx" ON "processos"("clienteId");

-- CreateIndex
CREATE INDEX "tarefas_escritorioId_idx" ON "tarefas"("escritorioId");

-- CreateIndex
CREATE INDEX "tarefas_escritorioId_status_idx" ON "tarefas"("escritorioId", "status");

-- CreateIndex
CREATE INDEX "tarefas_dataVencimento_idx" ON "tarefas"("dataVencimento");

-- CreateIndex
CREATE INDEX "usuarios_escritorioId_idx" ON "usuarios"("escritorioId");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");
