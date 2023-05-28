const express = require('express');
const app = express();
const cors = require("cors");
const path = require('path');

const routes = require('./routers');
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 4013;

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use('/static', express.static('static'))
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
