const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept": "application/json",
};

async function yahooFetch(symbol, range, interval) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${symbol}`);
  return res.json();
}

export default async function handler(req, res) {
  const range    = req.query.range    || "10y";
  const interval = req.query.interval || "1wk";

  try {
    const [bistJson, fxJson] = await Promise.all([
      yahooFetch("XU100.IS", range, interval),
      yahooFetch("USDTRY%3DX", range, interval),
    ]);

    const bistResult = bistJson.chart?.result?.[0];
    const fxResult   = fxJson.chart?.result?.[0];
    if (!bistResult || !fxResult) throw new Error("Veri bulunamadı");

    const bistTs    = bistResult.timestamp;
    const bistClose = bistResult.indicators.quote[0].close;
    const fxTs      = fxResult.timestamp;
    const fxClose   = fxResult.indicators.quote[0].close;

    const fxMap = new Map();
    fxTs.forEach((ts, i) => { if (fxClose[i] != null) fxMap.set(ts, fxClose[i]); });

    function nearestFx(ts) {
      if (fxMap.has(ts)) return fxMap.get(ts);
      let best = fxTs[0], bestDiff = Math.abs(ts - best);
      for (const t of fxTs) {
        const d = Math.abs(ts - t);
        if (d < bestDiff) { bestDiff = d; best = t; }
      }
      return fxMap.get(best) || 1;
    }

    const timestamps = [], closes = [];
    for (let i = 0; i < bistTs.length; i++) {
      if (bistClose[i] == null) continue;
      const fx = nearestFx(bistTs[i]);
      timestamps.push(bistTs[i]);
      closes.push(Math.round((bistClose[i] / fx) * 100) / 100);
    }

    res.json({ timestamps, closes });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
