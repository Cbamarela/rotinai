const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  const { paymentMethodId, email, name } = req.body || {};
  if (!paymentMethodId || !email || !name) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const customer = await stripe.customers.create({
      email, name,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    const pi = subscription.latest_invoice?.payment_intent;
    if (pi?.status === 'requires_action') {
      return res.json({ clientSecret: pi.client_secret });
    }

    return res.json({ success: true, subscriptionId: subscription.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
