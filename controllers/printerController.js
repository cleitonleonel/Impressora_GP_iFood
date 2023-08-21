const printer_constants = require("./printerConstants");
const node_printer = require("@thiagoelg/node-printer");
const unidecode = require("unidecode");
const PRINTER_STATUS = {
  ERROR_PRINTER_NOT_CONFIGURED: "ERROR_PRINTER_NOT_CONFIGURED",
  ERROR_PRINTER_UNAVAILABLE: "ERROR_PRINTER_UNAVAILABLE",
  PRINTER_OK: "PRINTER_OK"
};
function getPrinterList() {
  return node_printer.getPrinters().map((printerObj) => printerObj.name);
}
function getPrinterStatus(printerName, printerManufacturer) {
  if (!printerName || !printerManufacturer) {
    console.error("Printer not configured");
    return PRINTER_STATUS.ERROR_PRINTER_NOT_CONFIGURED;
  }
  const selectedPrinters = getPrinterList().filter((soPrinter) => soPrinter === printerName);
  if (selectedPrinters.length === 0) {
    console.error("Printer unavailable");
    return PRINTER_STATUS.ERROR_PRINTER_UNAVAILABLE;
  }
  return PRINTER_STATUS.PRINTER_OK;
}
function getPrintableBuffer(printable, commands) {
  return Promise.resolve(printable.payload.split("\n").map((line) => {
    if (line.trim().length) {
      // Precisei alterar essa linha, incluindo um \n para corrigir uma atualização mal
      // feita pelo ifood...
      return Buffer.from(`${line + "\n"}`);
    }
    return Buffer.from(commands.feed);
  }));
}
async function getPrinterBuffer(printables, commands) {
  let bufferData = [];
  bufferData.push(Buffer.from(commands.init));
  return Promise.all(printables.map((printable) => getPrintableBuffer(printable, commands))).then((buffers) => {
    const flatBuffers = buffers.reduce((flat, array) => flat.concat(array), []);
    bufferData = bufferData.concat(flatBuffers);
    bufferData.push(Buffer.from(commands.feed));
    bufferData.push(Buffer.from(commands.feed));
    bufferData.push(Buffer.from(commands.feed));
    bufferData.push(Buffer.from(commands.cut));
    return Buffer.concat(bufferData);
  });
}
function print(printables, printerName, printerManufacturer) {
  const status = getPrinterStatus(printerName, printerManufacturer);
  if (status !== PRINTER_STATUS.PRINTER_OK) {
    return status;
  }
  const decoded = printables.map((printable) => {
    if (printable.type === "TEXT") {
      const escapedText = unidecode(printable.payload);
      return Object.assign({}, printable, { payload: escapedText });
    }
    return printable;
  });
  const commands = printer_constants[printerManufacturer];
  return new Promise((resolve, reject) => {
    getPrinterBuffer(decoded, commands).then((data) => {
      node_printer.printDirect({
        data,
        printer: printerName,
        type: "RAW",
        success: (jobID) => resolve(jobID),
        error: (err) => reject(err)
      });
    }).catch(reject);
  });
}

module.exports = {getPrinterList, print}
