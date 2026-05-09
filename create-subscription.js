// api/create-subscription.js
// Vercel Serverless Function — Stripe

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { paymentMethodId, email, name } = req.body;
    if (!paymentMethodId || !email || !name) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // 1. Criar ou buscar cliente no Stripe
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
      // Atualizar método de pagamento
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
    } else {
      customer = await stripe.customers.create({
        email,
        name,
        payment_method: paymentMethodId,
      });
    }

    // Definir método padrão
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // 2. Criar assinatura
    // IMPORTANTE: Substitua 'price_SEU_PRICE_ID' pelo Price ID criado no Stripe Dashboard
    // Crie em: https://dashboard.stripe.com/prices (R$9,90 recorrente mensal)
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    const invoice = subscription.latest_invoice;
    const paymentIntent = invoice.payment_intent;

    // 3. Retornar clientSecret se precisar de 3D Secure
    if (paymentIntent && paymentIntent.status === 'requires_action') {
      return res.json({ clientSecret: paymentIntent.client_secret });
    }

    return res.json({ success: true, subscriptionId: subscription.id });

  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
};
