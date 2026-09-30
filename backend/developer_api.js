const express=require("express");
const crypto=require("crypto");
const fs=require("fs");
const path=require("path");

const pool=require('./db');
const router=express.Router();
const dir=path.join(__dirname,"data");
const file=path.join(dir,"api-keys.json");

if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
if(!fs.existsSync(file))fs.writeFileSync(file,"[]");

const read=()=>JSON.parse(fs.readFileSync(file,"utf8"));
const write=x=>fs.writeFileSync(file,JSON.stringify(x,null,2));
const makeKey=()=> "aps_"+crypto.randomBytes(32).toString("hex");

router.get("/health",(req,res)=>res.json({
  success:true,
  service:"AP-STREAM Developer API",
  version:"v1"
}));

function requireDeveloperAdmin(req,res,next){
  const supplied=String(req.get("X-Developer-Admin-Secret")||"");
  const expected=String(process.env.APSTREAM_DEVELOPER_ADMIN_SECRET||"");
  if(!expected || supplied!==expected){
    return res.status(403).json({success:false,error:"Developer admin authorization required"});
  }
  next();
}

router.post("/keys",requireDeveloperAdmin,(req,res)=>{
  const keys=read();
  const item={
    id:crypto.randomUUID(),
    name:String(req.body?.name||"AP-STREAM Developer").trim(),
    key:makeKey(),
    active:true,
    requests:0,
    createdAt:new Date().toISOString(),
    lastUsedAt:null
  };
  keys.push(item);
  write(keys);
  res.status(201).json({
    success:true,
    id:item.id,
    name:item.name,
    key:item.key,
    createdAt:item.createdAt
  });
});

router.get("/keys",requireDeveloperAdmin,(req,res)=>{
  res.json({
    success:true,
    keys:read().map(x=>({
      id:x.id,
      name:x.name,
      keyPreview:x.key.slice(0,10)+"••••••••",
      active:x.active,
      requests:x.requests||0,
      createdAt:x.createdAt,
      lastUsedAt:x.lastUsedAt
    }))
  });
});

router.post("/keys/:id/revoke",requireDeveloperAdmin,(req,res)=>{
  const keys=read();
  const item=keys.find(x=>x.id===req.params.id);
  if(!item)return res.status(404).json({
    success:false,
    error:"API key not found"
  });
  item.active=false;
  write(keys);
  res.json({success:true,message:"API key revoked"});
});

function requireApiKey(req,res,next){
  const key=req.get("X-API-Key");
  const item=read().find(x=>x.key===key&&x.active!==false);

  if(!item)return res.status(403).json({
    success:false,
    error:"Invalid API key"
  });

  item.requests=(item.requests||0)+1;
  item.lastUsedAt=new Date().toISOString();
  write(read());
  req.apiKey=item;
  next();
}

router.use(requireApiKey);

const databaseApiRouter = require("./database_api");
router.use("/database", databaseApiRouter);

async function proxy(req,res,target){
  try{
    const qs=new URLSearchParams(req.query).toString();
    const url="http://127.0.0.1:"+String(process.env.PORT||5000)+target+(qs?"?"+qs:"");
    const response=await fetch(url);
    const text=await response.text();

    res.status(response.status);

    try{
      res.json(JSON.parse(text));
    }catch{
      res.type("text").send(text);
    }
  }catch(error){
    res.status(502).json({
      success:false,
      error:"AP-STREAM internal API unavailable",
      message:error.message
    });
  }
}

router.get("/music",(req,res)=>proxy(req,res,"/api/songs"));
router.get("/artists",(req,res)=>proxy(req,res,"/api/artists"));
router.get("/shorts",(req,res)=>proxy(req,res,"/api/shorts"));
router.get("/videos",(req,res)=>proxy(req,res,"/api/videos"));
router.get("/tv",(req,res)=>proxy(req,res,"/api/tv"));
router.get("/radio",(req,res)=>proxy(req,res,"/api/radio"));

router.get("/search",async(req,res)=>{
  const q=String(req.query.q||"").trim();

  if(!q){
    return res.status(400).json({
      success:false,
      error:"Search query required"
    });
  }

  try{
    const result=await pool.query(`
      SELECT
        id,
        url,
        canonical_url,
        title,
        description,
        LEFT(content,500) AS preview,
        language,
        status_code,
        content_type,
        last_crawled_at,
        (
          ts_rank_cd(search_vector, websearch_to_tsquery('simple', $1)) +
          CASE WHEN LOWER(title) = LOWER($1) THEN 10 ELSE 0 END +
          CASE WHEN LOWER(title) LIKE '%' || LOWER($1) || '%' THEN 5 ELSE 0 END +
          CASE WHEN LOWER(description) LIKE '%' || LOWER($1) || '%' THEN 2 ELSE 0 END +
          CASE WHEN LOWER(url) LIKE '%' || LOWER($1) || '%' THEN 1 ELSE 0 END
        ) AS rank
      FROM ap_search_pages
      WHERE search_vector @@ websearch_to_tsquery('simple', $1)
         OR title ILIKE '%' || $1 || '%'
         OR description ILIKE '%' || $1 || '%'
         OR url ILIKE '%' || $1 || '%'
      ORDER BY rank DESC, last_crawled_at DESC NULLS LAST
      LIMIT 100
    `,[q]);

    res.json({
      success:true,
      query:q,
      count:result.rows.length,
      results:result.rows.map(row=>({
        type:"Web",
        id:row.id,
        url:row.url,
        canonical_url:row.canonical_url,
        title:row.title,
        description:row.description,
        preview:row.preview,
        language:row.language,
        status_code:row.status_code,
        content_type:row.content_type,
        last_crawled_at:row.last_crawled_at,
        rank:Number(row.rank||0)
      }))
    });
  }catch(error){
    console.error("Search error:",error.message);
    res.status(500).json({
      success:false,
      error:"Search failed",
      message:error.message
    });
  }
});;

module.exports=router;
