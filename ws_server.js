const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 9090 });

wss.on('connection', (ws) => {
  console.log('Nova conexão WebSocket');

  ws.on('message', (message) => {
    console.log('Mensagem recebida:', message);
    // Lógica para processar a mensagem recebida
  });

  ws.on('close', () => {
    console.log('Conexão WebSocket fechada');
    // Lógica para lidar com o fechamento da conexão
  });
});

