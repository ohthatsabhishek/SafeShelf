require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Product = require('./server/models/Product');
const authRoutes = require('./server/routes/auth');
const productRoutes = require('./server/routes/products');
const uploadRoutes = require('./server/routes/uploads');
const userDataRoutes = require('./server/routes/userData');
const shoppingImportRoutes = require('./server/routes/shoppingImport');
const app = express();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('replace-with')) { console.warn('WARNING: Set a unique JWT_SECRET (32+ characters) in .env before using authentication.'); }
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' }, contentSecurityPolicy: false }));
app.use(express.json({limit:'1mb'}));
app.use('/api/auth', rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:true,legacyHeaders:false}), authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/user-data', userDataRoutes);
app.use('/api/shopping-import', shoppingImportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname,'uploads'), { fallthrough:false, dotfiles:'deny' }));
app.get('/api/health', (req,res)=>res.json({status:'ok',database:app.locals.mongoReady?'connected':'offline',fallback:'local dataset'}));
app.use(express.static(__dirname, { index:'index.html', dotfiles:'ignore' }));
app.use((err,req,res,next)=>{ console.error(err.message); const status=err.name==='MulterError'?400:(err.status||500); res.status(status).json({error: status===500?'Server error. Check server logs.':err.message}); });
const port=Number(process.env.PORT)||3000;
async function start(){
 if(process.env.MONGODB_URI){ try { await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:4000}); app.locals.mongoReady=true; console.log('MongoDB connected'); } catch(e){ app.locals.mongoReady=false; console.warn('MongoDB unavailable; product API will use local dataset:',e.message); } } else { app.locals.mongoReady=false; console.warn('MONGODB_URI not configured; using local dataset fallback.'); }
 app.listen(port,()=>console.log(`SafeShelf running at http://localhost:${port}`));
}
start();
