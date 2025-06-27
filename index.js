const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

let client;
let qrCodeData = '';
let isConnected = false;

// Endpoint para iniciar conexão com o WhatsApp
app.post('/connect', async (req, res) => {
  if (client) {
    return res.status(400).json({ error: 'Já conectado ou tentativa em andamento.' });
  }

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', async (qr) => {
    qrCodeData = await qrcode.toDataURL(qr);
    console.log('QR Code atualizado');
  });

  client.on('ready', () => {
    console.log('✅ Cliente pronto');
    isConnected = true;
  });

  client.on('disconnected', (reason) => {
    console.log('❌ Cliente desconectado:', reason);
    client = null;
    isConnected = false;
    qrCodeData = '';
  });

  await client.initialize();

  res.json({ status: 'Inicializado com sucesso' });
});

// QR code como imagem base64
app.get('/qr', (req, res) => {
  if (qrCodeData) {
    const html = `
      <html>
        <body>
          <h1>Escaneie o QR Code:</h1>
          <img src="${qrCodeData}" />
        </body>
      </html>
    `;
    res.send(html);
  } else {
    res.send('Aguardando geração do QR...');
  }
});

// Status de conexão
app.get('/status', (req, res) => {
  res.json({ connected: isConnected });
});

// Rota padrão (opcional)
app.get('/', (req, res) => {
  res.send('Servidor WhatsApp rodando com sucesso!');
});

// Bind para 0.0.0.0 (essencial para Render)
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});
