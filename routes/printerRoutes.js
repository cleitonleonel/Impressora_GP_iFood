const express = require("express");
const router = express.Router();
const Printer = require("../controllers/printerController");
const { version } = require("../package.json");
const { exec } = require('child_process');
const fs = require('fs');

function print_raw(command) {
  return exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar o comando: ${error}`);
      return false;
    }
    return true;
  });
}

router.get("/", (_, res) => {
  res.send({message: "ok", version});
});

router.get("/printers", (_, res) => {
  try {
    let printers = Printer.getPrinterList();
    // Exibe no endpoint a impressora padrão efetiva para facilitar diagnóstico.
    let defaultPrinter = Printer.getDefaultPrinterName(printers);
    if (printers.length < 1) {
      printers = [
        "Printer Test - Server Node",
      ];
      defaultPrinter = null;
    }
    res.json({printers, defaultPrinter, version});
  } catch (error) {
    res.status(500);
    res.json({
      message: "For unknown reason it was not possible to get printers list.",
      version
    });
  }
});

router.post("/print", async (req, res) => {
  const invoice = req.body && req.body.invoice;
  const printerConfig = req.body && req.body.printerConfig ? req.body.printerConfig : {};
  // Se o payload vier sem impressora, resolve automaticamente com base no sistema.
  const printer = Printer.resolvePrinterName(printerConfig.printer);
  // Se a marca não vier (ou vier inválida), tenta inferir pelo nome e usa fallback.
  const printerManufacturer = Printer.resolvePrinterManufacturer(printerConfig.printerManufacturer, printer);
  console.log(printerManufacturer, printer);

  if (!invoice) {
    res.status(400);
    res.send({
      message: "Invalid print payload.",
      version
    });
    return;
  }

  if (!printer) {
    res.status(500);
    res.send({
      message: "No printers available in the operating system.",
      version
    });
    return;
  }

  if (printer === "PDF") {
    let bufferData = Buffer.from(invoice);
    let dataString = bufferData.toString();
    let command = `echo "${dataString}" | lpr -P ${printer}`;
    if (print_raw(command)) {
      console.log("Successfully printed");
      res.send({message: "Successfully printed", version});
    } else {
      console.log("For unknown reason it was not possible to print.");
      res.status(500);
      res.send({
        message: "For unknown reason it was not possible to print.",
        version
      });
    }
  } else {
    try {
      const jobId = await Printer.print([{
        type: "TEXT",
        payload: invoice
      }], printer, printerManufacturer);
      console.log("Successfully printed");
      res.send({message: "Successfully printed", jobId, printer, printerManufacturer, version});
    } catch (error) {
      console.log("For unknown reason it was not possible to print.");
      res.status(500);
      res.send({
        message: "For unknown reason it was not possible to print.",
        version
      });
    }
  }
});

module.exports = router
