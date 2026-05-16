const https = require('https');

function stripeRequest(path, body, secretKey) {
  return new Promise((resolve, reject) => {
    const postData = Object.entries(body)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const options = {
      hostname: 'api.stripe.com',
      path,
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(secretKey + ':').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const SECRET = process.env.STRIPE_SECRET_KEY;
  const PRICE  = process.env.STRIPE_PRICE_ID;

  if (!SECRET || !PRICE) {
    return res.status(500).json({ error: 'Chaves não configuradas no Vercel' });
  }

  try {
    const { paymentMethodId, email, name } = req.body;
    if (!paymentMethodId || !email || !name) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // 1. Criar cliente
    const { body: customer } = await stripeRequest('/v1/customers', {
      email, name, payment_method: paymentMethodId,
      'invoice_settings[default_payment_method]': paymentMethodId,
    }, SECRET);

    if (customer.error) throw new Error(customer.error.message);

    // 2. Criar assinatura
    const { body: subscription } = await stripeRequest('/v1/subscriptions', {
      customer: customer.id,
      'items[0][price]': PRICE,
      'payment_settings[payment_method_types][0]': 'card',
      'payment_settings[save_default_payment_method]': 'on_subscription',
      expand: 'latest_invoice.payment_intent',
    }, SECRET);

    if (subscription.error) throw new Error(subscription.error.message);

    return res.json({ success: true, subscriptionId: subscription.id });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
