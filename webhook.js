// api/webhook.js
// Recebe notificações do Stripe e Mercado Pago após pagamento confirmado

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];

  try {
    // Webhook do Stripe
    if (sig) {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        const email = invoice.customer_email;
        console.log(`✅ Pagamento Stripe confirmado: ${email}`);
        // Aqui você pode: salvar no banco, enviar e-mail de boas-vindas, etc.
        // Exemplo com banco (Supabase, Firebase, etc.)
        // await ativarPRO(email);
      }

      if (event.type === 'customer.subscription.deleted') {
        const sub = event.data.object;
        console.log(`❌ Assinatura cancelada: ${sub.customer}`);
        // await desativarPRO(sub.customer);
      }

      return res.json({ received: true });
    }

    // Webhook do Mercado Pago
    const { type, data } = req.body;
    if (type === 'payment') {
      const paymentId = data?.id;
      console.log(`💰 Pix recebido: pagamento ${paymentId}`);
      // Verificar status do pagamento e ativar PRO
      // await verificarEAtivarPRO(paymentId);
    }

    return res.json({ received: true });

  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).json({ error: err.message });
  }
};
