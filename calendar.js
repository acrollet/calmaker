// Defaults follow the visitor's local date; grid calculations use UTC so
// daylight saving never changes a day or week.
export const DAY = 86400000;
export const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
export const WEEKDAYS = ['SUN','MON','TUES','WED','THURS','FRI','SAT'];
export function defaultDateRange(now = new Date()) {
  const format = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return {start:format(now),end:format(new Date(now.getFullYear(),now.getMonth()+2,0))};
}
export function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Choose both a start and an end date.');
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(+date) || date.toISOString().slice(0,10) !== value || date.getUTCFullYear()<1900 || date.getUTCFullYear()>2199) throw new Error('Choose dates between 1900 and 2199.');
  return date;
}
export function calendarDays(startValue, endValue, weekStart=0) {
  const start = parseDate(startValue), end = parseDate(endValue);
  if (end < start) throw new Error('The end date needs to be on or after the start date.');
  const dayCount = Math.round((end-start)/DAY)+1;
  if (dayCount>732) throw new Error('Choose a range of up to two years (732 days) for one page.');
  const offset = (start.getUTCDay()-weekStart+7)%7;
  const weeks = Math.ceil((dayCount+offset)/7);
  const first = +start-offset*DAY;
  const cells = Array.from({length:weeks*7},(_,i)=>{
    const date = new Date(first+i*DAY), active=date>=start && date<=end;
    return {date,active,day:date.getUTCDate(),month:MONTHS[date.getUTCMonth()],monthStart:date.getUTCDate()===1 || +date===+start};
  });
  return {start,end,weeks,dayCount,cells};
}
export function paperSize(size, width, height, orientation) {
  let [w,h] = size==='custom' ? [Number(width),Number(height)] : size.split('x').map(Number);
  if (![w,h].every(n=>Number.isFinite(n)&&n>=4&&n<=48)) throw new Error('Paper dimensions must be between 4 and 48 inches.');
  [w,h]=orientation==='landscape' ? [Math.max(w,h),Math.min(w,h)] : [Math.min(w,h),Math.max(w,h)];
  return {width:w,height:h};
}

// A tiny, dependency-free PDF container. The page size is in physical points;
// the high-resolution artwork is embedded unchanged, without printer scaling.
export function makePdf(jpeg, pixelWidth, pixelHeight, widthInches, heightInches) {
  const encode = s=>new TextEncoder().encode(s), parts=[], offsets=[0]; let length=0;
  function add(data){ const bytes=typeof data==='string'?encode(data):data;parts.push(bytes);length+=bytes.length; }
  function object(id,body){offsets[id]=length;add(`${id} 0 obj\n${body}\nendobj\n`);}
  const w=widthInches*72,h=heightInches*72;
  add('%PDF-1.4\n% Calmaker\n');
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Calendar 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4]=length;
  add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  add(jpeg);add('\nendstream\nendobj\n');
  const drawing=`q\n${w} 0 0 ${h} 0 0 cm\n/Calendar Do\nQ\n`;
  object(5,`<< /Length ${encode(drawing).length} >>\nstream\n${drawing}endstream`);
  const xref=length;
  add('xref\n0 6\n0000000000 65535 f \n');
  for(let i=1;i<=5;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts,{type:'application/pdf'});
}
