# Configurando a Meta WhatsApp Cloud API

O Zup envia notificações reais pelo WhatsApp usando a **API oficial da Meta
(WhatsApp Cloud API)** — não usa WhatsApp Web, automação de navegador nem
bibliotecas não oficiais. Enquanto as credenciais abaixo não forem
configuradas, o sistema funciona normalmente em **modo desenvolvimento**: as
mensagens são registradas no banco (tabela `whatsapp_messages`, status
`LOGGED_DEV_MODE`) e impressas no console do servidor, mas nenhuma chamada de
rede é feita e nenhum WhatsApp real é enviado.

## 1. Criar o aplicativo no Meta Developers

1. Acesse https://developers.facebook.com/ e faça login com uma conta Meta.
2. Clique em **Meus Apps → Criar App**.
3. Escolha o tipo de app **"Empresa"** (Business).
4. Preencha o nome do app (ex: "Zup") e conclua a criação.
5. No painel do app, procure o produto **WhatsApp** e clique em **Configurar**.

## 2. Obter o Phone Number ID e o token de acesso temporário

1. Dentro do produto WhatsApp, vá em **Introdução (Getting Started)**.
2. Nesta tela a Meta já disponibiliza:
   - Um **número de teste** gratuito da Meta (para os primeiros testes).
   - O **Phone Number ID** (copie este valor).
   - Um **token de acesso temporário** (válido por 24h — use-o só para testes
     iniciais).
3. Copie o **Phone Number ID** para a variável `META_WHATSAPP_PHONE_NUMBER_ID`
   no seu `.env`.

## 3. Gerar um token de acesso permanente (produção)

O token temporário expira em 24h e não deve ser usado em produção.

1. Vá em **Configurações da Empresa** (Business Settings) →
   **Usuários do sistema** (System Users).
2. Crie um usuário do sistema com papel de **Admin**.
3. Clique em **Gerar novo token**, selecione o seu app e marque as
   permissões: `whatsapp_business_messaging` e `whatsapp_business_management`.
4. Copie o token gerado (ele não será exibido novamente) para
   `META_WHATSAPP_ACCESS_TOKEN` no `.env`.
5. Anote também o **ID da conta do WhatsApp Business** (WABA ID), disponível
   em **Configurações do WhatsApp → Contas**, e coloque em
   `META_WHATSAPP_BUSINESS_ACCOUNT_ID`.

## 4. Configurar o Webhook

O webhook recebe confirmações de entrega/leitura das mensagens enviadas pelo
Zup. A rota já está implementada em `src/app/api/whatsapp/webhook/route.ts`.

1. No painel do produto WhatsApp, vá em **Configuração → Webhooks**.
2. Clique em **Editar** e informe:
   - **URL de callback**: `https://SEU_DOMINIO/api/whatsapp/webhook`
   - **Verify Token**: qualquer string secreta que você escolher — use o
     mesmo valor na variável `META_WHATSAPP_VERIFY_TOKEN` do `.env`.
3. Clique em **Verificar e salvar**. A Meta fará uma requisição `GET` para a
   sua rota; ela responde automaticamente com o `hub.challenge` quando o
   token confere (veja o código da rota).
4. Em **Campos do Webhook**, inscreva-se no campo `messages`.

> Em ambiente de desenvolvimento local, use uma ferramenta de túnel (ex:
> `ngrok http 3000`) para obter uma URL pública temporária e configurá-la como
> callback URL.

## 5. Criar e aprovar templates de mensagem

Mensagens enviadas **fora de uma janela de 24h** de conversa (por exemplo, o
primeiro contato com um participante) precisam usar um **template
pré-aprovado** pela Meta. Mensagens dentro da janela de 24h podem usar texto
livre.

1. Vá em **Gerenciador do WhatsApp → Modelos de mensagem** (Message
   Templates) no Meta Business Manager.
2. Clique em **Criar modelo**.
3. Categoria: **Utilidade (Utility)** — atualização de status/fila se
   enquadra nesta categoria.
4. Nome do template: use o mesmo valor configurado em
   `META_WHATSAPP_TEMPLATE_NAME` (padrão sugerido: `fila_atualizacao`).
5. Idioma: `Portuguese (BR)` — deve corresponder a
   `META_WHATSAPP_TEMPLATE_LANGUAGE` (padrão: `pt_BR`).
6. Corpo sugerido (4 variáveis, compatível com o serviço implementado em
   `src/lib/whatsapp.ts`):

   ```
   Olá, {{1}}! Uma atualização do evento {{2}}: sua senha é {{3}} e sua
   posição atual na fila é {{4}}.
   ```

7. Envie para aprovação. A aprovação costuma levar de minutos a algumas
   horas.
8. Após aprovado, o sistema já está pronto para usá-lo — nenhuma alteração de
   código é necessária, apenas garanta que `META_WHATSAPP_TEMPLATE_NAME` e
   `META_WHATSAPP_TEMPLATE_LANGUAGE` no `.env` correspondem exatamente ao
   template aprovado.

> Enquanto o template não estiver aprovado, o envio via template falhará e o
> erro ficará registrado em `whatsapp_messages.error` — a experiência do
> participante na fila não é afetada, apenas a notificação não é entregue.

## 6. Variáveis de ambiente

```env
META_WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
META_WHATSAPP_PHONE_NUMBER_ID=123456789012345
META_WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
META_WHATSAPP_VERIFY_TOKEN=um-segredo-que-voce-escolhe
META_WHATSAPP_API_VERSION=v21.0
META_WHATSAPP_TEMPLATE_NAME=fila_atualizacao
META_WHATSAPP_TEMPLATE_LANGUAGE=pt_BR
```

## 7. Testando o envio

1. Com as variáveis configuradas, reinicie o servidor (`npm run dev`).
2. Acesse `/dashboard/configuracoes` — o card "Integração com WhatsApp" deve
   mostrar **"Credenciais configuradas"**.
3. Entre na fila pública de um evento (`/fila/[slug]`) usando um número de
   WhatsApp que você controla e que esteja cadastrado como **destinatário de
   teste** no painel da Meta (obrigatório enquanto o app estiver em modo de
   desenvolvimento/não revisado pela Meta).
4. Você deve receber a mensagem de "Você entrou na fila" no WhatsApp.
5. No painel administrativo, clique em **Chamar próximo** — você deve
   receber a mensagem de chamada.
6. Consulte o histórico completo de mensagens enviadas para um participante
   na tela **Participantes → Visualizar (ícone de olho)**.

## 8. Publicando o app (opcional, para uso com contatos externos)

Enquanto o app estiver em **modo de desenvolvimento** no Meta, mensagens só
podem ser enviadas para números cadastrados como destinatários de teste. Para
enviar para qualquer participante:

1. Complete a **verificação da empresa** (Business Verification) no Meta
   Business Manager.
2. Solicite a **revisão do app** (App Review) para o produto WhatsApp.
3. Após aprovado, publique o app.

## Resolução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| Mensagens ficam com status `LOGGED_DEV_MODE` | Variáveis de ambiente não configuradas | Configure `META_WHATSAPP_ACCESS_TOKEN` e `META_WHATSAPP_PHONE_NUMBER_ID` |
| Erro "Template name does not exist" | Template não criado/aprovado ainda, ou nome/idioma divergente | Confira `META_WHATSAPP_TEMPLATE_NAME`/`META_WHATSAPP_TEMPLATE_LANGUAGE` no Business Manager |
| Erro 401/403 da Graph API | Token expirado ou sem permissão | Gere um token permanente via usuário do sistema (passo 3) |
| Webhook não verifica | Verify token não confere | Garanta que `META_WHATSAPP_VERIFY_TOKEN` no `.env` é idêntico ao configurado no painel da Meta |
| Mensagem não chega no celular | Número não cadastrado como destinatário de teste | Cadastre o número em "Números de telefone de teste" no painel do produto WhatsApp |
