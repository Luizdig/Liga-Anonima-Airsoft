# Notas do Projeto

## Estado Atual
- GameDetail.tsx reescrito com: imagem do jogo, botão inscrição, times BDU/PMC, chave PIX, upload comprovante
- Erro restante: AdminPanel.tsx linha 832 - imageUrl não existe no tipo de honored_members (não crítico)
- Upload de comprovante usa: media.uploadFile -> storagePut -> submitPaymentProof (salva URL no gamePaymentProofs)
- teamsEnabled adicionado à tabela games

## Próximos Passos
1. Adicionar teamsEnabled no formulário de criação de jogo (Games.tsx)
2. Corrigir Games.tsx para exibir imagem no card e tornar card clicável
3. Reiniciar servidor para limpar cache de erros antigos
4. Salvar checkpoint

## Arquitetura de Upload
- storagePut(key, buffer, contentType) -> retorna { key, url: "/manus-storage/{key}" }
- media.uploadFile: recebe base64, faz storagePut, salva em memberMediaUploads (com aprovação)
- Para comprovante PIX: usa media.uploadFile para upload, depois games.submitPaymentProof para registrar
- Para imagem do jogo: salva imageUrl diretamente na tabela games (sem aprovação)

## Tabelas Relevantes
- games: id, title, description, location, gameDate, value, imageUrl, maxPlayers, currentPlayers, status, teamsEnabled, createdBy
- gameParticipations: id, userId, gameId
- gamePaymentProofs: id, gameId, userId, proofUrl, status (pending/approved/rejected)
- gameTeamAssignments: id, gameId, userId, team (BDU/PMC)
- gamePixKeys: id, gameId, pixKey
