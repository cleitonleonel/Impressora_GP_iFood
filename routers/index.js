const express = require("express");
const router = express.Router();
const Printer = require("../printer");
const {version} = require("../package.json");

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
  try {
    const jobId = await Printer.print([{
      type: "TEXT",
      payload: invoice
    }], printer, printerManufacturer);
    res.send({message: "Successfully printed", jobId, version});
  } catch (error) {
    res.status(500);
    res.send({
      message: "For unknown reason it was not possible to print.",
      version
    });
  }
});

module.exports = router
