const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept": "application/json",
};

export default async function handler(req, res) {
  const range    = req.query.range    || "10y";
  const interval = req.query.interval || "1wk";

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=${range}&interval=${interval}`;
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
