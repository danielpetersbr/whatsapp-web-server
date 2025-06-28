const express = require('express');
const { create, Client } = require('@open-wa/wa-automate');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;
let client;

app.use(cors());
app.use(express.json());

// Rota base para teste
app.get('/', (req, res) => {
  res.send('Servidor WhatsApp rodando com sucesso!');
});

// Rota para iniciar a conexão com o WhatsApp
app.post('/connect', async (req, res) => {
  if (client) {
    return res.send({ status: 'already_connected' });
  }

  try {
    console.log('Iniciando conexão com o WhatsApp...');
    client = await create({
      sessionId: 'session',
      multiDevice: true,
      qrTimeout: 0,
      headless: true,
      useChrome: true,
      authTimeout: 60,
      killProcessOnBrowserClose: true,
      popup: true,
    });

    console.log('Conectado com sucesso.');
    res.send({ status: 'connected' });
  } catch (error) {
    console.error('Erro ao conectar:', error);
    res.status(500).send({ status: 'error', error });
  }
});

// Rota para exibir o QR code
app.get('/qr', async (req, res) => {
  if (!client) {
    return res.send('Aguardando geração do QR...');
  }
  const qr = await client.getQrCode();
  res.send(`<img src="${qr}" />`);
});

// Rota para listar etiquetas
app.get('/etiquetas', async (req, res) => {
  if (!client) {
    return res.status(400).send({ error: 'Cliente não conectado' });
  }

  try {
    const labels = await client.getLabels(); // Retorna etiquetas do WhatsApp
    res.send({ etiquetas: labels });
  } catch (error) {
    res.status(500).send({ error: 'Erro ao buscar etiquetas', details: error });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
