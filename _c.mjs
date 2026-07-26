import puppeteer from "puppeteer-core";
const CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const S=process.argv[2], pages=JSON.parse(process.argv[3]);
const b=await puppeteer.launch({executablePath:CHROME,headless:"new",args:["--no-sandbox"]});
async function reveal(p){await p.evaluate(async()=>{await new Promise(r=>{let y=0;const t=setInterval(()=>{window.scrollBy(0,150);y+=150;if(y>=document.body.scrollHeight+1000){clearInterval(t);r();}},70);});});await new Promise(r=>setTimeout(r,2500));}
for(const [url,file] of pages){const p=await b.newPage();await p.setViewport({width:1440,height:900});await p.goto(url,{waitUntil:"networkidle0"});await reveal(p);await p.evaluate(()=>window.scrollTo(0,0));await new Promise(r=>setTimeout(r,600));await p.screenshot({path:S+"/"+file,fullPage:true});await p.close();}
await b.close();
