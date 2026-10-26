// Barra de meta del hub: total donado (Mercado Pago + Ko-fi) en pesos.
import { goal } from './_stats.js';

export default async function handler(req, res) {
  try {
    const g = await goal();
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    res.status(200).json(g);
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=30');
    res.status(200).json(null);
  }
}
