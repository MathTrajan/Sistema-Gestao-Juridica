-- AddColumn: permissoes de telas por usuario
ALTER TABLE "usuarios" ADD COLUMN "permissoes" TEXT[] NOT NULL DEFAULT '{}';

-- Migrar permissoes existentes baseadas em area para colaboradores
UPDATE "usuarios"
SET "permissoes" = CASE "area"
  WHEN 'JURIDICO'      THEN ARRAY['/dashboard', '/clientes', '/processos', '/tarefas', '/prazos']
  WHEN 'COMERCIAL'     THEN ARRAY['/dashboard', '/clientes', '/comercial']
  WHEN 'FINANCEIRO'    THEN ARRAY['/dashboard', '/financeiro']
  WHEN 'CONTROLADORIA' THEN ARRAY['/dashboard', '/controladoria']
  WHEN 'MARKETING'     THEN ARRAY['/dashboard', '/marketing']
  ELSE ARRAY['/dashboard']::TEXT[]
END
WHERE "perfil" = 'COLABORADOR';
