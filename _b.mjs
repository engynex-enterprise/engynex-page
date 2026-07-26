import puppeteer from "puppeteer-core";
const CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const S=process.argv[2], pages=JSON.parse(process.argv[3]);
const b=await puppeteer.launch({executablePath:CHROME,headless:"new",args:["--no-sandbox"]});
async function slow(p){await p.evaluate(async()=>{await new Promise(r=>{let y=0;const h=document.body.scrollHeight;const t=setInterval(()=>{window.scrollBy(0,320);y+=320;if(y>=h){clearInterval(t);r();}},35);});});await new Promise(r=>setTimeout(r,900));await p.evaluate(()=>window.scrollTo(0,0));await new Promise(r=>setTimeout(r,250));}
for(const [url,file] of pages){const p=await b.newPage();await p.setViewport({width:1440,height:900});await p.goto(url,{waitUntil:"networkidle0"});await slow(p);await p.screenshot({path:S+"/"+file,fullPage:true});await p.close();}
await b.close();
