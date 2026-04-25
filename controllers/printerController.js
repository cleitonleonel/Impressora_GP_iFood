const printer_constants = require("./printerConstants");
const node_printer = require("@thiagoelg/node-printer");
const unidecode = require("unidecode");
const { execSync } = require("child_process");
const PRINTER_STATUS = {
  ERROR_PRINTER_NOT_CONFIGURED: "ERROR_PRINTER_NOT_CONFIGURED",
  ERROR_PRINTER_UNAVAILABLE: "ERROR_PRINTER_UNAVAILABLE",
  PRINTER_OK: "PRINTER_OK"
};
// Fabricante padrão para manter compatibilidade quando o payload não informa marca.
const DEFAULT_MANUFACTURER = "Epson";

function getPrinterList() {
  try {
    return node_printer.getPrinters().map((printerObj) => printerObj.name);
  } catch (error) {
    return [];
  }
}

function getDefaultPrinterByNodePrinter() {
  // Usa API nativa da lib, quando disponível.
  if (typeof node_printer.getDefaultPrinterName === "function") {
    try {
      return node_printer.getDefaultPrinterName();
    } catch (error) {
      return null;
    }
  }
  return null;
}

function getDefaultPrinterByCups() {
  // Fallback Linux/CUPS: tenta descobrir a impressora padrão via lpstat.
  try {
    const output = execSync("lpstat -d", { encoding: "utf8" }).trim();
    const match = output.match(/system default destination:\s*(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (error) {
  }

  // Segundo fallback CUPS: lê o destino padrão salvo em lpoptions.
  try {
    const output = execSync("lpoptions -d", { encoding: "utf8" }).trim();
    const match = output.match(/dest\s+(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (error) {
  }

  return null;
}

function getDefaultPrinterName(availablePrinters) {
  const printers = availablePrinters || getPrinterList();
  // Permite override opcional por variável de ambiente sem mexer no código.
  const envPrinter = process.env.PRINTER_NAME;
  if (envPrinter && printers.includes(envPrinter)) {
    return envPrinter;
  }

  // Ordem de resolução automática: env -> node-printer -> CUPS -> primeira disponível.
  const nodeDefaultPrinter = getDefaultPrinterByNodePrinter();
  if (nodeDefaultPrinter && printers.includes(nodeDefaultPrinter)) {
    return nodeDefaultPrinter;
  }

  const cupsDefaultPrinter = getDefaultPrinterByCups();
  if (cupsDefaultPrinter && printers.includes(cupsDefaultPrinter)) {
    return cupsDefaultPrinter;
  }

  return printers.length ? printers[0] : null;
}

function resolvePrinterName(requestedPrinterName) {
  const printers = getPrinterList();
  // Respeita o nome enviado pelo cliente apenas se existir no sistema.
  if (requestedPrinterName && printers.includes(requestedPrinterName)) {
    return requestedPrinterName;
  }

  return getDefaultPrinterName(printers);
}

function inferManufacturerByName(printerName) {
  if (!printerName) {
    return DEFAULT_MANUFACTURER;
  }

  const normalizedName = printerName.toLowerCase();
  const knownManufacturers = Object.keys(printer_constants);
  const matchedManufacturer = knownManufacturers.find((manufacturer) => normalizedName.includes(manufacturer.toLowerCase()));

  return matchedManufacturer || DEFAULT_MANUFACTURER;
}

function resolvePrinterManufacturer(requestedManufacturer, printerName) {
  // Mantém fabricante enviado quando é suportado pelo mapa de comandos ESC/POS.
  if (requestedManufacturer && printer_constants[requestedManufacturer]) {
    return requestedManufacturer;
  }

  return inferManufacturerByName(printerName);
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

module.exports = {
  getPrinterList,
  getDefaultPrinterName,
  resolvePrinterName,
  resolvePrinterManufacturer,
  print
}
