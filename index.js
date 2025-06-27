const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode  = require('qrcode');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- variáveis de estado ---
let qrCodeData     = null;
let isAuthenticated = false;

// --- instancia o cliente ---
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// dispara sempre que há novo QR
client.on('qr', qr => {
  qrcode.toDataURL(qr, (_, src) => qrCodeData = src);
});

client.on('ready',        () => { isAuthenticated = true;  console.log('✅ WhatsApp conectado!'); });
client.on('disconnected', () => { isAuthenticated = false; console.log('❌ WhatsApp desconectado.'); });

client.initialize();

/* ------------ ROTAS ------------ */

// inicia (ou reinicia) a sessão e faz o QR voltar a ser gerado
app.post('/connect', async (_, res) => {
  try {
    if (client.info && client.info.wid) await client.destroy(); // se já havia sessão, derruba
    qrCodeData = null;
    isAuthenticated = false;
    await client.initialize();
    res.json({ status: 'Inicializando, abra /qr para escanear' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falha ao iniciar conexão' });
  }
});

// devolve o QR (se já tiver sido disparado pelo evento acima)
app.get('/qr', (_, res) => {
  qrCodeData
    ? res.send(`<img src="${qrCodeData}" />`)
    : res.send('Aguardando geração do QR…');
});

app.get('/status', (_, res) => res.json({ connected: isAuthenticated }));

app.post('/send', async (req, res) => {
  const { to, message } = req.body;
  try {
    await client.sendMessage(`${to}@c.us`, message);
    res.json({ status: 'Mensagem enviada com sucesso' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

/* ----------- start ----------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
