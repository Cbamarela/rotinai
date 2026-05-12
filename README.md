# RotinAI

App de organizacao de rotina diaria com IA. R$9,90/mes.

## Arquivos

- landing.html  — Site da empresa (pagina principal)
- index.html    — O app em si
- assinar.html  — Pagina de pagamento (Stripe + Pix)
- manifest.json — PWA config
- sw.js         — Service Worker (funciona offline)
- vercel.json   — Rotas do Vercel
- api/          — Backend dos pagamentos

## URLs apos publicar

- Site:   rotinai-general6.vercel.app
- App:    rotinai-general6.vercel.app/app
- Assinar: rotinai-general6.vercel.app/assinar

## Variaveis de ambiente (Vercel > Settings > Environment Variables)

STRIPE_SECRET_KEY     — dashboard.stripe.com/apikeys
STRIPE_PRICE_ID       — dashboard.stripe.com/prices
STRIPE_WEBHOOK_SECRET — dashboard.stripe.com/webhooks
MP_ACCESS_TOKEN       — mercadopago.com.br/developers/panel/credentials
