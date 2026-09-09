# Configurando o WhatsApp via Twilio

O Zup envia notificações reais pelo WhatsApp usando a **API da Twilio**
(WhatsApp Sandbox / Business API) — não usa WhatsApp Web, automação de
navegador nem bibliotecas não oficiais. Enquanto as credenciais abaixo não
forem configuradas, o sistema funciona normalmente em **modo
desenvolvimento**: as mensagens são registradas no banco (tabela
`whatsapp_messages`, status `LOGGED_DEV_MODE`) e impressas no console do
servidor, mas nenhuma chamada de rede é feita e nenhum WhatsApp real é
enviado.

## 1. Criar conta na Twilio

1. Acesse https://www.twilio.com/try-twilio e crie uma conta gratuita
   (e-mail + verificação por SMS/telefone).
2. No painel (Console), você já verá seu **Account SID** e **Auth Token**
   na página inicial — copie os dois.

## 2. Ativar o WhatsApp Sandbox (grátis, para testes)

1. No menu lateral, vá em **Messaging → Try it out → Send a WhatsApp
   message** (o nome exato pode variar um pouco conforme a Twilio atualiza
   o painel — procure por "WhatsApp Sandbox").
2. A Twilio mostra um número de WhatsApp deles (ex: `+1 415 523 8886`) e um
   código do tipo `join palavra-chave`.
3. Pelo **seu próprio WhatsApp**, mande esse código para o número indicado.
   Você receberá uma confirmação — a partir daí, esse número da Twilio pode
   te enviar mensagens por até 72h (renova toda vez que você manda o código
   de novo).
4. Anote o número do sandbox (ex: `whatsapp:+14155238886`).

## 3. Variáveis de ambiente

No arquivo `.env`, preencha:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## 4. Testando o envio

1. Com as variáveis configuradas, reinicie o servidor (`npm run dev`).
2. Acesse `/dashboard/configuracoes` — o card "Integração com WhatsApp" deve
   mostrar **"Credenciais configuradas"**.
3. Entre na fila pública de um evento (`/fila/[slug]`) usando o **seu
   próprio número de WhatsApp** — o mesmo que você usou para entrar no
   sandbox no passo 2.
4. Você deve receber a mensagem de "Você entrou na fila" no WhatsApp.
5. No painel administrativo, clique em **Chamar próximo** — você deve
   receber a mensagem de chamada.
6. Consulte o histórico completo de mensagens enviadas para um participante
   na tela **Participantes → Visualizar (ícone de olho)**.

> Enquanto estiver no modo sandbox, a Twilio só entrega mensagens para
> números que enviaram o código `join ...` — qualquer outro participante
> real precisaria fazer o mesmo antes de receber notificações. Para
> enviar para qualquer pessoa sem esse passo, é preciso migrar para um
> número de WhatsApp Business aprovado dentro da conta Twilio (isso exige
> verificação da empresa — faça isso quando tiver o número oficial da
> empresa disponível).

## Resolução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| Mensagens ficam com status `LOGGED_DEV_MODE` | Variáveis de ambiente não configuradas | Configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_WHATSAPP_FROM` |
| Erro 401 da API da Twilio | Account SID ou Auth Token errado | Confira os valores copiados do Console da Twilio |
| Mensagem não chega no celular | Número não entrou no sandbox (não mandou o `join ...`) | Mande o código de sandbox pelo WhatsApp para o número da Twilio novamente (expira em 72h) |
| Erro "channel is not enabled" ou parecido | `TWILIO_WHATSAPP_FROM` sem o prefixo `whatsapp:` | Garanta o formato `whatsapp:+14155238886` |
