# Screenshot Notes - Login

## / (Home)
- Home está mostrando corretamente com user logado (Luiz, ADMIN)
- Botão ADM visível, menu de navegação completo
- Tudo funcionando

## /login
- O screenshot mostra a Home ao invés da página de login! Isso é porque o useEffect no Login redireciona para / quando o user já está logado
- Isso é o comportamento correto - usuário já logado não deve ver a tela de login
- A página de login só aparece para usuários não autenticados
