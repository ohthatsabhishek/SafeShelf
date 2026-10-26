require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../server/models/Product');
const products = require('../data/products.json');
const normalize = s => String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
(async()=>{
 if(!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in .env before importing.');
 await mongoose.connect(process.env.MONGODB_URI);
 const ops=products.map(p=>({ updateOne:{ filter:{datasetId:Number(p.id)}, update:{$set:{datasetId:Number(p.id),name:p.name,normalizedName:normalize(p.name),brand:'',category:p.category||'Other',description:p.description||'',price:Number(p.price)||null,currency:p.currency||'INR',priceUnit:p.price_unit||'',priceIsEstimate:Boolean(p.price_is_estimate),image:p.image||'',source:'dataset',updatedAt:new Date()}},upsert:true }}));
 const result=await Product.bulkWrite(ops,{ordered:false});
 console.log(`Dataset import complete: ${products.length} records. Inserted ${result.upsertedCount||0}, updated ${result.modifiedCount||0}. Re-running is safe.`);
 await mongoose.disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
