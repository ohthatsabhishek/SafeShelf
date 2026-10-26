const express = require('express');
const Product = require('../models/Product');
const localProducts = require('../../data/products.json');
const router = express.Router();
const norm = s => String(s || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function normalizeApi(p) {
 const name = String(p.title || p.name || '').trim(); if (!name) return null;
 const rawImage = p.thumbnail || (Array.isArray(p.images) && p.images[0]) || p.image || ''; let image=''; try { const u=new URL(rawImage); if(u.protocol==='https:' || u.protocol==='http:') image=u.href; } catch (_) {} return { id: `api_${p.id || norm(name).replace(/ /g,'-')}`, name, brand: p.brand || '', category: typeof p.category === 'string' ? p.category : (p.category && p.category.name) || 'Other', description: p.description || '', price: Number.isFinite(Number(p.price)) ? Number(p.price) : null, currency: 'USD', image, source: 'api', priceIsEstimate: false };
}
async function externalProducts() {
 if (process.env.EXTERNAL_PRODUCTS_ENABLED === 'false') return [];
 const url = process.env.EXTERNAL_PRODUCTS_URL || 'https://dummyjson.com/products?limit=100';
 const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
 if (!response.ok) throw new Error(`External catalog returned ${response.status}`);
 const data = await response.json(); return (data.products || data.items || []).map(normalizeApi).filter(Boolean);
}
router.get('/', async (req, res, next) => {
 try {
  const q = norm(req.query.q), category = String(req.query.category || '').trim();
  let dataset = localProducts;
  try {
   if (req.app.locals.mongoReady) {
    const filter = { source: 'dataset' };
    if (category) filter.category = category;
    if (q) filter.normalizedName = { $regex: q.split(' ').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*'), $options: 'i' };
    const docs = await Product.find(filter).lean(); if (docs.length) dataset = docs.map(p=>({ ...p, id: `dataset_${p.datasetId}`, priceUnit: p.priceUnit, priceIsEstimate: p.priceIsEstimate }));
   }
  } catch (dbErr) { console.warn('Mongo product query unavailable; using local dataset:', dbErr.message); }
  dataset = dataset.map(p=>({ ...p, id: p.id || `dataset_${p.datasetId}`, source: 'dataset', image: p.image || '' }));
  let api = [], apiAvailable = false;
  try { api = await externalProducts(); apiAvailable = true; } catch (e) { console.warn('External product API unavailable; serving dataset only:', e.message); }
  const seen = new Set(dataset.map(p=>norm(p.name)));
  const merged = [...dataset, ...api.filter(p => { const key=norm(p.name); if (!key || seen.has(key)) return false; seen.add(key); return true; })];
  const filtered = merged.filter(p => (!q || norm(`${p.name} ${p.brand} ${p.description}`).includes(q)) && (!category || norm(p.category) === norm(category)));
  res.set('Cache-Control', 'no-store').json({ products: filtered, count: filtered.length, sources: { dataset: dataset.length, api: api.length, apiAvailable } });
 } catch (e) { next(e); }
});
router.get('/categories', async (req, res, next) => {
 try { let items=localProducts; if(req.app.locals.mongoReady){ const docs=await Product.aggregate([{ $match:{source:'dataset'} },{$group:{_id:'$category',count:{$sum:1}}},{$sort:{_id:1}}]); if(docs.length) return res.json(docs.map(d=>({name:d._id,count:d.count}))); }
 const counts={}; items.forEach(p=>counts[p.category]=(counts[p.category]||0)+1); res.json(Object.keys(counts).sort().map(name=>({name,count:counts[name]}))); } catch(e){next(e)}
});
module.exports = router;
