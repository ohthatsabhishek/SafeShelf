const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024, files: 1 }, fileFilter: (req, file, cb) => {
  const ext = String(file.originalname || '').toLowerCase().split('.').pop();
  if (ext !== 'csv' || (file.mimetype && !['text/csv','application/vnd.ms-excel','application/csv','text/plain','application/octet-stream'].includes(file.mimetype))) return cb(new Error('Upload a .csv file only.'));
  cb(null, true);
}});
function parseCsv(text) {
  const rows=[]; let row=[], field='', quoted=false;
  for(let i=0;i<text.length;i++) { const ch=text[i];
    if(quoted) { if(ch==='"' && text[i+1]==='"'){field+='"';i++;} else if(ch==='"') quoted=false; else field+=ch; }
    else if(ch==='"' && field==='') quoted=true;
    else if(ch===','){row.push(field.trim());field='';}
    else if(ch==='\n'){row.push(field.trim()); if(row.some(v=>v!=='')) rows.push(row); row=[];field='';}
    else if(ch!=='\r') field+=ch;
  }
  if(quoted) throw new Error('CSV contains an unclosed quoted field.');
  if(field!=='' || row.length){row.push(field.trim());if(row.some(v=>v!==''))rows.push(row);}
  return rows;
}
router.post('/preview', auth, upload.single('file'), (req,res)=>{
  if(!req.file) return res.status(400).json({error:'Choose a CSV file first.'});
  try {
    const text=req.file.buffer.toString('utf8').replace(/^\uFEFF/,'');
    const rows=parseCsv(text); if(rows.length<2) return res.status(400).json({error:'CSV must contain a header and at least one item.'});
    const headers=rows.shift().map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,''));
    const nameIndex=headers.findIndex(h=>['itemname','item','name','product','productname'].includes(h));
    const qtyIndex=headers.findIndex(h=>['quantity','qty','amount'].includes(h));
    const categoryIndex=headers.findIndex(h=>['category','department'].includes(h));
    if(nameIndex<0) return res.status(400).json({error:'CSV needs an itemName column. Optional columns: quantity, category.'});
    const valid=[], invalid=[];
    rows.forEach((r,i)=>{const name=String(r[nameIndex]||'').trim(); const quantity=qtyIndex<0?'1':String(r[qtyIndex]||'1').trim(); const category=categoryIndex<0?'Other':String(r[categoryIndex]||'Other').trim();
      if(!name || name.length>160 || quantity.length>60 || category.length>80) invalid.push({row:i+2,reason:'Missing or overly long item name, quantity or category.'});
      else valid.push({name,quantity,category,source:'import'});
    });
    if(valid.length>500) return res.status(413).json({error:'Import is limited to 500 rows per file.'});
    res.json({items:valid,invalid,total:rows.length});
  } catch(e){res.status(400).json({error:e.message||'Could not parse CSV.'});}
});
module.exports=router;
