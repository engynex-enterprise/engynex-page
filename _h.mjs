import puppeteer from "puppeteer-core";
const CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const S=process.argv[2];
const b=await puppeteer.launch({executablePath:CHROME,headless:"new",args:["--no-sandbox"]});
async function slow(p){await p.evaluate(async()=>{await new Promise(r=>{let y=0;const h=document.body.scrollHeight;const t=setInterval(()=>{window.scrollBy(0,170);y+=170;if(y>=h){clearInterval(t);r();}},55);});});await new Promise(r=>setTimeout(r,1500));await p.evaluate(()=>window.scrollTo(0,0));await new Promise(r=>setTimeout(r,400));}
async function cap(url,theme,file){const p=await b.newPage();await p.setViewport({width:1440,height:900});await p.emulateMediaFeatures([{name:"prefers-color-scheme",value:theme}]);await p.goto(url,{waitUntil:"networkidle0"});await slow(p);await p.screenshot({path:file,fullPage:true});await p.close();}
await cap("http://localhost:3210/es/servicios/desarrollo-web","light",S+"/h-service-light.png");
await cap("http://localhost:3210/es/contacto","light",S+"/h-contact-light.png");
// widget open (viewport)
const p=await b.newPage();await p.setViewport({width:1440,height:900});
await p.goto("http://localhost:3210/es",{waitUntil:"networkidle0"});await new Promise(r=>setTimeout(r,300));
await p.click('button[aria-label="Abrir chat"]');await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:S+"/h-widget.png"});
await p.close();
// service dark top
await cap("http://localhost:3210/es/servicios/apps-moviles","dark",S+"/h-service-dark.png");
await b.close();
