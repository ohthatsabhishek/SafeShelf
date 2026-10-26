const express = require('express');
const UserData = require('../models/UserData');
const auth = require('../middleware/auth');
const router = express.Router();
router.use(auth);
router.use((req,res,next)=>req.app.locals.mongoReady ? next() : res.status(503).json({error:'Your saved data is temporarily unavailable because MongoDB is disconnected. Local cached data remains on this device.'}));
router.get('/', async (req,res,next)=>{ try { const doc=await UserData.findOne({userId:req.user.sub}).lean(); res.json({inventory:doc?.inventory||[],shoppingList:doc?.shoppingList||[]}); } catch(e){next(e)} });
router.put('/', async (req,res,next)=>{ try { const inventory=Array.isArray(req.body.inventory)?req.body.inventory:null; const shoppingList=Array.isArray(req.body.shoppingList)?req.body.shoppingList:null; if(!inventory||!shoppingList) return res.status(400).json({error:'inventory and shoppingList must be arrays.'}); if(inventory.length>5000||shoppingList.length>2000) return res.status(413).json({error:'Too many records.'}); const doc=await UserData.findOneAndUpdate({userId:req.user.sub},{$set:{inventory,shoppingList}},{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true}); res.json({ok:true,updatedAt:doc.updatedAt}); } catch(e){next(e)} });
module.exports=router;
