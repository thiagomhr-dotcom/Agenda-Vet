# Agenda Vet — publicação no Supabase (plano gratuito)

Pacote pronto: banco (SQL com regras de segurança), app web instalável no celular (PWA) e arquivos de configuração.
**Tempo estimado: 20 a 30 minutos.** Os passos 1 a 6 só você pode fazer (criar conta, senhas e chaves).

## O que tem aqui
- `supabase/migrations/0001_schema.sql` — tabelas, regras de acesso (RLS), bloqueio de dupla reserva, tempo real
- `supabase/migrations/0002_settings_seed.sql` — salas, serviços e profissionais de exemplo
- `index.html`, `app.js`, `styles.css`, `config.js`, `sw.js`, `manifest.webmanifest`, `icons/` — o app

## Passo a passo
1. **Criar o projeto.** Em supabase.com, crie uma conta e um projeto (plano Free). Anote a senha do banco num lugar seguro. Escolha a região São Paulo (sa-east-1).
2. **Criar o banco.** No menu *SQL Editor*, cole e execute o conteúdo de `0001_schema.sql`, depois o de `0002_settings_seed.sql`.
3. **Ligar o login anônimo** (usado pelos tutores): *Authentication → Sign In / Providers* → ative **Allow anonymous sign-ins**. Em *Attack Protection*, ative o captcha se quiser mais proteção contra abuso.
4. **Criar o usuário da recepção.** *Authentication → Users → Add user*: informe e-mail e senha e marque *Auto Confirm User*. Copie o UUID do usuário criado.
5. **Dar acesso de equipe.** No SQL Editor:
   `insert into public.staff(user_id, name) values ('COLE-O-UUID-AQUI', 'Recepção');`
6. **Conectar o app.** Em *Project Settings → API*, copie a **Project URL** e a chave **anon public** e cole em `config.js`. Nunca use a chave `service_role` no app.
7. **Publicar o site.** O Supabase não hospeda páginas estáticas. Use Vercel, Cloudflare Pages ou Netlify (todos têm plano gratuito): crie um projeto novo e envie esta pasta (arrastar e soltar funciona na Netlify e na Cloudflare Pages). Não precisa de build.
8. **Instalar no celular.** Abra o endereço no celular: Android/Chrome → menu → *Instalar app*; iPhone/Safari → Compartilhar → *Adicionar à Tela de Início*.

## Teste rápido
Abra o site, entre como tutor (nome + celular), peça um horário. Em outra aba, entre como equipe, peça a confirmação e gere a cobrança. A tela atualiza sozinha nos dois lados.

## Limites do plano gratuito
- Projetos Free **pausam após 7 dias sem uso**; basta reativar no painel (dados são mantidos). Para uso real, o plano Pro remove a pausa.
- O e-mail padrão do Supabase tem limite baixo; por isso o login do tutor não usa código por e-mail.

## O que ainda é simulado
- **E-mail, Telegram e push**: o app registra a mensagem na tabela `notifications`, mas não envia. Próximo passo: Edge Functions (Resend para e-mail, Bot API do Telegram, Web Push com chaves VAPID) disparadas por *Database Webhooks* ao inserir em `notifications`.
- **Pix/boleto**: a cobrança é gerada com códigos de exemplo. Próximo passo: Edge Function chamando a API do Asaas e outra recebendo o webhook de pagamento para marcar como pago.

## Limitações conhecidas desta fase de teste
- O tutor é identificado por login anônimo do navegador: limpar os dados do navegador perde o histórico, e quem compartilha o aparelho compartilha o histórico. Para produção, troque por telefone/e-mail verificado.
- Agendamentos criados pela recepção não aparecem no app do tutor (não há vínculo de conta).
- Preço, duração e status são definidos pelo banco, mas profissional, sala e horário vêm do app; o banco só impede sobreposição, não valida expediente.
- As mensagens são registradas pelo app; quando houver Edge Functions, mova essa criação para o servidor.
