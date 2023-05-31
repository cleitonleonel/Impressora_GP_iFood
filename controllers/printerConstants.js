const PRINTERS = {
  Bematech: {
    cut: [27, 109],
    feed: [10],
    init: [27, "@"]
  },
  Brother: {
    cut: [27, 105, 77],
    feed: [12],
    init: [27, "@"]
  },
  Daruma: {
    cut: [27, 109],
    feed: [10],
    init: [27, "@"]
  },
  Diebold: {
    cut: [27, 109],
    feed: [10],
    init: [27, "@"]
  },
  Elgin: {
    cut: [29, 86, 65, 0],
    feed: [10],
    init: [27, "@"]
  },
  Epson: {
    cut: [29, 86, 65, 0],
    feed: [10],
    init: [27, "@"]
  },
  Gainscha: {
    cut: [29, 86, 65, 0],
    feed: [10],
    init: [27, "@"]
  },
  Sweda: {
    cut: [29, 86, 1],
    feed: [10],
    init: [27, "m"]
  },
  Tanca: {
    cut: [27, 109],
    feed: [10],
    init: [27, "m"]
  }
};

module.exports = PRINTERS;
