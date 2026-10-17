import { calendarDays, paperSize, WEEKDAYS, makePdf } from './calendar.js';

const $=id=>document.getElementById(id);
const fonts={
  canela:{label:'Canela Text · original',family:'OriginalCanela, Cormorant, Georgia, serif'},
  noteworthy:{label:'Noteworthy · original',family:'OriginalNoteworthy, Handlee, cursive'},
  cormorant:{label:'Cormorant Garamond',family:'Cormorant, Georgia, serif'},
  handlee:{label:'Handlee',family:'Handlee, cursive'},
  georgia:{label:'Georgia',family:'Georgia, serif'},
  baskerville:{label:'Baskerville',family:'Baskerville, "Times New Roman", serif'},
  times:{label:'Times New Roman',family:'"Times New Roman", Times, serif'},
  helvetica:{label:'Helvetica Neue',family:'"Helvetica Neue", Helvetica, Arial, sans-serif'},
  arial:{label:'Arial',family:'Arial, sans-serif'}
};
const defaults={title:'HOLIDAYS 2026',start:'2026-10-18',end:'2027-01-02','title-font':'canela','year-font':'noteworthy','grid-font':'canela',size:'18x24',width:'18',height:'24',orientation:'portrait','week-start':'0',shading:true};
for (const id of ['title-font','year-font','grid-font']) {
  for(const [value,font] of Object.entries(fonts)) $(id).add(new Option(font.label,value));
}
function restore(values){for(const [id,value] of Object.entries(defaults)) {const input=$(id),saved=values[id]??value;if(input.type==='checkbox')input.checked=!!saved;else input.value=saved;}}
try {restore({...defaults,...JSON.parse(localStorage.getItem('calmaker-settings')||'{}')});} catch {restore(defaults);}
let current=null, exporting=false;
const measure=document.createElement('canvas').getContext('2d');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function font(key){return fonts[key]?.family||fonts.canela.family;}
function textWidth(text,size,family,weight=400){measure.font=`${weight} ${size}px ${family}`;return measure.measureText(text).width;}
function createScene(model) {
  const w=1080,h=w*model.size.height/model.size.width,margin=w*.051;
  const titleFont=font($('title-font').value),yearFont=font($('year-font').value),gridFont=font($('grid-font').value);
  const title=$('title').value.trim(),match=title.match(/^(.*?)\s+(\d{4})$/),main=match?match[1]:title,year=match?match[2]:'';
  const scene=[];
  const rect=(x,y,width,height,fill)=>scene.push({kind:'rect',x,y,width,height,fill});
  const line=(x1,y1,x2,y2,width=.9)=>scene.push({kind:'line',x1,y1,x2,y2,width});
  const text=(value,x,y,size,family,weight=400,anchor='start')=>scene.push({kind:'text',value,x,y,size,family,weight,anchor});
  rect(0,0,w,h,'#ffffff');
  let titleSize=Math.min(85,h*.074),gap=10;
  const titleWidth=s=>textWidth(main,s,titleFont,600)+(year?gap+textWidth(year,s,yearFont):0);
  if(titleWidth(titleSize)>w-2*margin) titleSize*= (w-2*margin)/titleWidth(titleSize);
  const titleY=margin+Math.min(65,h*.055);
  const fullWidth=titleWidth(titleSize),titleX=(w-fullWidth)/2;
  text(main,titleX,titleY,titleSize,titleFont,600);
  if(year)text(year,titleX+textWidth(main,titleSize,titleFont,600)+gap,titleY,titleSize,yearFont);
  const gridTop=title?titleY+Math.min(35,h*.028):margin,gridBottom=h-margin;
  const headerHeight=Math.min(37,h*.036),gridWidth=w-2*margin,cellWidth=gridWidth/7;
  const rowHeight=(gridBottom-gridTop-headerHeight)/model.calendar.weeks;
  const numberSize=Math.min(14.2,rowHeight*.39),weekdaySize=Math.min(22,headerHeight*.58);
  const rowsTop=gridTop+headerHeight;
  for(let r=0;r<model.calendar.weeks;r++)if($('shading').checked&&r%2===0)rect(margin,rowsTop+r*rowHeight,gridWidth,rowHeight,'#f3f3f3');
  for(let i=0;i<7;i++)text(WEEKDAYS[(i+model.weekStart)%7],margin+(i+.5)*cellWidth,gridTop+headerHeight*.69,weekdaySize,gridFont,600,'middle');
  for(let i=0;i<8;i++)line(margin+i*cellWidth,gridTop,margin+i*cellWidth,gridBottom);
  line(margin,gridTop,w-margin,gridTop);
  for(let r=0;r<=model.calendar.weeks;r++)line(margin,rowsTop+r*rowHeight,w-margin,rowsTop+r*rowHeight);
  model.calendar.cells.forEach((cell,i)=>{
    if(!cell.active)return;
    const x=margin+(i%7+1)*cellWidth-4,y=rowsTop+Math.floor(i/7)*rowHeight+numberSize+4;
    const value=cell.monthStart?`${cell.month} ${cell.day}`:String(cell.day);
    text(value,x,y,numberSize,gridFont,cell.monthStart?600:400,'end');
  });
  return {w,h,scene};
}
function sceneSvg({w,h,scene}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="calendar-title calendar-description"><title id="calendar-title">${escape($('title').value||'Calendar')}</title><desc id="calendar-description">${escape($('start').value)} to ${escape($('end').value)}. ${current.calendar.weeks} weeks, ${current.size.width} by ${current.size.height} inches.</desc>${scene.map(o=>{
    if(o.kind==='rect')return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="${o.fill}"/>`;
    if(o.kind==='line')return `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="#111" stroke-width="${o.width}"/>`;
    return `<text x="${o.x}" y="${o.y}" font-size="${o.size}" font-family="${escape(o.family)}" font-weight="${o.weight}" text-anchor="${o.anchor}" fill="#080808">${escape(o.value)}</text>`;
  }).join('')}</svg>`;
}
function settingsValues(){return Object.fromEntries(Object.keys(defaults).map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value]));}
function update() {
  $('custom-size').hidden=$('size').value!=='custom';
  try {
    const weekStart=Number($('week-start').value),calendar=calendarDays($('start').value,$('end').value,weekStart);
    const size=paperSize($('size').value,$('width').value,$('height').value,$('orientation').value);
    current={calendar,size,weekStart};current.artwork=createScene(current);
    $('paper').style.aspectRatio=`${size.width} / ${size.height}`;
    $('paper').innerHTML=sceneSvg(current.artwork);
    $('dimensions').textContent=`${size.width} × ${size.height} IN`;
    const fmt=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
    $('range-summary').textContent=`${fmt.format(calendar.start)} — ${fmt.format(calendar.end)}`;
    $('week-summary').textContent=`${calendar.weeks} ${calendar.weeks===1?'week':'weeks'} · ${calendar.dayCount} ${calendar.dayCount===1?'day':'days'}`;
    $('error').hidden=true;document.body.classList.remove('invalid');
    $('download').disabled=exporting;$('print').disabled=exporting;
    let style=$('print-size');if(!style){style=document.createElement('style');style.id='print-size';document.head.append(style);}
    style.textContent=`@page { size: ${size.width}in ${size.height}in; margin: 0; } @media print { .paper { width:${size.width}in!important; height:${size.height}in!important; } }`;
    try{localStorage.setItem('calmaker-settings',JSON.stringify(settingsValues()));}catch{}
  } catch(error) {
    current=null;$('error').textContent=error.message;$('error').hidden=false;
    $('download').disabled=true;$('print').disabled=true;document.body.classList.add('invalid');
  }
}
$('settings').addEventListener('input',update);
$('settings').addEventListener('change',update);
$('settings').addEventListener('submit',event=>event.preventDefault());
$('reset').addEventListener('click',()=>{restore(defaults);$('export-status').textContent='';update();});
$('print').addEventListener('click',async()=>{await document.fonts.ready;if(current)window.print();});

async function exportPdf() {
  if(!current||exporting)return;
  exporting=true;$('download').disabled=true;$('print').disabled=true;$('export-status').textContent='Preparing your print-ready PDF…';
  // Snapshot all artwork before yielding so edits cannot change an in-flight PDF.
  const {size,artwork}=current,title=$('title').value;
  const dpi=Math.min(300,Math.sqrt(40000000/(size.width*size.height)));
  const pixelWidth=Math.round(size.width*dpi),pixelHeight=Math.round(size.height*dpi);
  const canvas=document.createElement('canvas');
  let url;
  try {
    await document.fonts.ready;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    canvas.width=pixelWidth;canvas.height=pixelHeight;
    const context=canvas.getContext('2d',{alpha:false});
    if(!context)throw new Error('This browser could not create the PDF image. Try Print calendar instead.');
    context.scale(pixelWidth/artwork.w,pixelHeight/artwork.h);
    for(const o of artwork.scene) {
      if(o.kind==='rect'){context.fillStyle=o.fill;context.fillRect(o.x,o.y,o.width,o.height);}
      else if(o.kind==='line'){context.strokeStyle='#111';context.lineWidth=o.width;context.beginPath();context.moveTo(o.x1,o.y1);context.lineTo(o.x2,o.y2);context.stroke();}
      else {context.fillStyle='#080808';context.font=`${o.weight} ${o.size}px ${o.family}`;context.textAlign=o.anchor==='middle'?'center':o.anchor==='end'?'right':'left';context.fillText(o.value,o.x,o.y);}
    }
    const jpeg=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PDF export is too large for this browser. Try Print calendar instead.')),'image/jpeg',.99));
    const pdf=makePdf(new Uint8Array(await jpeg.arrayBuffer()),pixelWidth,pixelHeight,size.width,size.height);
    url=URL.createObjectURL(pdf);const anchor=document.createElement('a');anchor.href=url;
    const name=title.replace(/[^\p{L}\p{N}\s_-]/gu,'').trim().replace(/\s+/g,'-').slice(0,70)||'calendar';
    anchor.download=`${name}-${size.width}x${size.height}.pdf`;document.body.append(anchor);anchor.click();anchor.remove();
    $('export-status').textContent=`PDF downloaded · ${Math.round(dpi)} dpi. Print at actual size (100%).`;
  } catch(error) {$('export-status').textContent=error.message||'Could not export. Please try Print calendar.';}
  finally {canvas.width=canvas.height=0;if(url)setTimeout(()=>URL.revokeObjectURL(url),60000);exporting=false;update();}
}
$('download').addEventListener('click',exportPdf);
update();
// Explicitly load each family used by the scene before measuring the title.
await Promise.allSettled([document.fonts.load('600 40px Cormorant'),document.fonts.load('400 40px Handlee'),document.fonts.load('400 40px OriginalCanela'),document.fonts.load('600 40px OriginalCanela'),document.fonts.load('400 40px OriginalNoteworthy')]);
const originalCanela=document.fonts.check('400 40px OriginalCanela'),originalNoteworthy=document.fonts.check('400 40px OriginalNoteworthy');
$('font-note').textContent=originalCanela&&originalNoteworthy?'Original fonts available: Canela Text & Noteworthy.':'Original: Canela Text & Noteworthy. Where unavailable, Cormorant Garamond & Handlee are used.';
update();
