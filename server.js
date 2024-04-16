const express = require('express');
const app = express();
const cors = require("cors");

const routes = require('./routes/printerRoutes');
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 4013;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/static', express.static('static'));
app.use(
  (cors)({
    origin: [
      "https://gestordepedidos.ifood.com.br",
      "https://gestordepedidos-homologation.ifood.com.br",
      "http://localhost:4200"
    ]
  })
);
app.use(routes);

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${PORT}`)
});
