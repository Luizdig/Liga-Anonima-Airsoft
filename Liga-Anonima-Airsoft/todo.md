# Liga Airsoft - TODO

## Fase 1: Banco de Dados e Backend
- [x] Criar tabelas de PIX, comprovantes e status de pagamento
- [x] Adicionar helpers de banco de dados para PIX/pagamento
- [x] Criar procedures tRPC para PIX e pagamento

## Fase 2: Correção de Bugs
- [x] Corrigir bug de edição de jogos (duplicação)
- [x] Adicionar procedure `games.update`
- [x] Reutilizar imagem na edição de jogos
- [x] Corrigir erro de runtime `gameImages` (re-export do db.ts)
- [x] Corrigir bug de upload de imagem do jogo (setUploadingGameImg fora do callback)
- [x] Bloquear botão CRIAR enquanto upload está em andamento

## Fase 3: Inscrição em Jogos
- [x] Adicionar procedure `games.joinGame`
- [x] Adicionar procedure `games.leaveGame`
- [x] Adicionar procedure `games.isUserJoined`
- [x] Adicionar UI de botão de inscrição
- [x] Adicionar imagem do jogo na listagem

## Fase 4: Sistema de Pagamento PIX
- [x] Criar seção no painel ADM para cadastrar chave PIX
- [x] Criar UI para usuário enviar comprovante de pagamento
- [x] Criar central de mensagens no painel ADM
- [x] Implementar checkbox para marcar pagamento confirmado
- [x] Adicionar validação de comprovante

## Fase 5: Upload Direto de Mídia
- [x] Substituir links por upload nos jogos
- [x] Criar página de detalhe do jogo com envio de comprovante PIX
- [x] Implementar upload de comprovante com validação
- [x] Substituir links por upload no feed (upload direto de imagens)
- [x] Substituir links por upload no perfil (avatar via uploadDirect)
- [x] Substituir links por upload na loja
- [x] Substituir links por upload em membros honrados

## Fase 6: Sistema de Times BDU/PMC
- [x] Campo `teamsEnabled` no schema da tabela games
- [x] Procedure `joinWithTeam` com validação de limite 50%
- [x] Procedure `getTeamAssignments` para listar times
- [x] Checkbox "Habilitar Times" no formulário de criação/edição (Games.tsx)
- [x] Passar `teamsEnabled` para procedures create/update
- [x] UI de seleção de time no GameDetail.tsx
- [x] Exibição de contagem de jogadores por time

## Fase 7: Testes e Refinamento
- [x] Testar inscrição em jogos
- [x] Testar sistema de PIX
- [x] Testar uploads de mídia
- [x] Verificar responsividade
- [x] Criar checkpoint final

## Fase 8: Correções Urgentes
- [x] Card do jogo na home com link direto para página de inscrição (/jogos/:id)
- [x] Upload da loja separado da galeria (não enviar para aprovação na galeria)
- [x] Adicionar seção de anúncios recentes da loja na home
- [x] Adicionar seção de galeria recente na home
- [x] Adicionar seção de feed recente na home
- [x] Galeria: lightbox para fotos (abrir em tamanho maior)
- [x] Galeria: player de vídeo funcional (reproduzir vídeos)

## Fase 9: Sistema de Gestão de Pagamentos
- [x] Adicionar campo paymentDeadlineDays na tabela games (prazo em dias para pagamento)
- [x] Adicionar campo paymentStatus na tabela game_participations (none/pending/approved/rejected)
- [x] Adicionar campo proofUrl na tabela game_participations (URL do comprovante)
- [x] Adicionar campo failCount na tabela game_participations (contagem de falhas)
- [x] Adicionar tabela game_bans (userId, gameId) para banimentos por jogo
- [x] Procedure: ADM aprovar comprovante (status -> approved, check verde)
- [x] Procedure: ADM rejeitar comprovante (status -> rejected, banir do jogo)
- [x] Procedure: Verificar prazo expirado e remover automaticamente
- [x] Procedure: Verificar se usuário está banido antes de inscrever
- [x] UI: Lista de inscritos na tela do jogo com ícones de status (vermelho/amarelo/verde/X)
- [x] UI: Campo prazo de pagamento no formulário de criação de jogo
- [x] UI: Notificação de status no perfil do usuário (histórico)
- [x] Heartbeat: Job periódico para remover inscrições com prazo expirado
