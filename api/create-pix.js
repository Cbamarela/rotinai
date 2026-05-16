const https = require('https');

function mpRequest(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.mercadopago.com',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `rotinai-${Date.now()}`,
      },
    };
    const req = https.request(options, (resp) => {
      let raw = '';
      resp.on('data', chunk => raw += chunk);
      resp.on('end', () => {
        try { resolve({ status: resp.statusCode, body: JSON.parse(raw) }); }
        catch(e) { reject(new Error('Resposta invalida do MP')); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  try {
    const { name, email, cpf } = req.body;
    if (!name || !email || !cpf) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const payload = {
      transaction_amount: 9.90,
      description: 'RotinAI PRO - Assinatura mensal',
      payment_method_id: 'pix',
      payer: {
        email,
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || name,
        identification: { type: 'CPF', number: cpf },
      },
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    const { status, body } = await mpRequest('/v1/payments', payload);
    if (status !== 201) return res.status(400).json({ error: body.message || 'Erro ao gerar Pix' });

    const pixData = body.point_of_interaction?.transaction_data;
    return res.json({
      payment_id: body.id,
      qr_code: pixData?.qr_code,
      qr_code_base64: pixData?.qr_code_base64,
      status: body.status,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
