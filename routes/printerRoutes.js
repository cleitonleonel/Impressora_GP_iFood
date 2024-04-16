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
    if (printers.length < 1) {
      printers = [
        "Printer Test - Server Node",
      ];
    }
    res.json({printers, version});
  } catch (error) {
    res.status(500);
    res.json({
      message: "For unknown reason it was not possible to get printers list.",
      version
    });
  }
});

router.post("/print", async (req, res) => {
  const {invoice, printerConfig: {printerManufacturer, printer}} = req.body;
  console.log(printerManufacturer, printer);
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
      res.send({message: "Successfully printed", jobId, version});
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
