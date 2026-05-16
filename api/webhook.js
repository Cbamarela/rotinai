module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { type, data } = req.body || {};
  console.log('Webhook recebido:', type, data?.id);
  return res.json({ received: true });
};
