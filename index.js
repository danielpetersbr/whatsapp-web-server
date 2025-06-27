const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let qrCodeData = null;
let isAuthenticated = false;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
});

client.on('qr', (qr) => {
  qrcode.toDataURL(qr, (err, src) => {
    qrCodeData = src;
  });
});

client.on('ready', () => {
  isAuthenticated = true;
  console.log('✅ WhatsApp conectado!');
});

client.on('disconnected', () => {
  isAuthenticated = false;
  console.log('❌ WhatsApp desconectado.');
});

app.get('/qr', (req, res) => {
  if (qrCodeData) {
    res.send(`<img src="${qrCodeData}" />`);
  } else {
    res.send('Aguardando geração do QR...');
  }
});

app.get('/status', (req, res) => {
  res.json({ connected: isAuthenticated });
});

// Rota que inicia o WhatsApp (exigida pelo Lovable)
app.post('/connect', async (req, res) => {
  try {
    if (!isAuthenticated) {
      await client.initialize();
    }
    res.json({ status: 'Inicialização disparada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao conectar' });
  }
});

// Rota para envio de mensagem
app.post('/send', async (req, res) => {
  const { to, message } = req.body;
  try {
    await client.sendMessage(`${to}@c.us`, message);
    res.json({ status: 'Mensagem enviada com sucesso' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Porta + host obrigatórios para funcionar no Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
