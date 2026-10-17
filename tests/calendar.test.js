import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarDays,defaultDateRange,parseDate,paperSize,makePdf} from '../calendar.js';

test('defaults start today and end on the last day of next month',()=>{
  assert.deepEqual(defaultDateRange(new Date(2026,9,17,23,59)),{start:'2026-10-17',end:'2026-11-30'});
  assert.deepEqual(defaultDateRange(new Date(2026,0,31)),{start:'2026-01-31',end:'2026-02-28'});
  assert.deepEqual(defaultDateRange(new Date(2024,0,31)),{start:'2024-01-31',end:'2024-02-29'});
  assert.deepEqual(defaultDateRange(new Date(2026,11,31)),{start:'2026-12-31',end:'2027-01-31'});
});

test('reference spans 11 Sunday-first weeks across a year boundary',()=>{
  const c=calendarDays('2026-10-18','2027-01-02');
  assert.equal(c.weeks,11);assert.equal(c.dayCount,77);
  assert.equal(c.cells[0].date.toISOString().slice(0,10),'2026-10-18');
  assert.equal(c.cells.at(-1).date.toISOString().slice(0,10),'2027-01-02');
});
test('partial weeks keep out-of-range dates blank',()=>{
  const c=calendarDays('2026-10-21','2026-10-22');
  assert.equal(c.weeks,1);assert.deepEqual(c.cells.map(x=>x.active),[false,false,false,true,true,false,false]);
});
test('Monday first, leap days and daylight-saving boundaries',()=>{
  assert.equal(calendarDays('2024-02-28','2024-03-01',1).dayCount,3);
  assert.equal(calendarDays('2026-03-07','2026-03-10').dayCount,4);
  assert.equal(calendarDays('2026-10-18','2026-10-18',1).cells[6].active,true);
});
test('invalid dates and oversized ranges are rejected',()=>{
  for(const value of ['','2026-02-30','2026-13-01','1899-01-01','2200-01-01'])assert.throws(()=>parseDate(value));
  assert.throws(()=>calendarDays('2026-10-22','2026-10-21'));
  assert.throws(()=>calendarDays('2026-01-01','2029-01-01'));
});
test('paper sizes respect orientation and dimension bounds',()=>{
  assert.deepEqual(paperSize('18x24',0,0,'portrait'),{width:18,height:24});
  assert.deepEqual(paperSize('18x24',0,0,'landscape'),{width:24,height:18});
  assert.deepEqual(paperSize('custom','20','30','portrait'),{width:20,height:30});
  assert.throws(()=>paperSize('custom',0,30,'portrait'));
});
test('PDF declares one exact-size 18 by 24 inch page and valid cross references',async()=>{
  const blob=makePdf(new Uint8Array([255,216,255,217]),5400,7200,18,24),bytes=new Uint8Array(await blob.arrayBuffer());
  const text=new TextDecoder().decode(bytes);
  assert.match(text,/\/MediaBox \[0 0 1296 1728\]/);assert.match(text,/\/Count 1/);
  const offset=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(new TextDecoder().decode(bytes.slice(offset,offset+4)),'xref');
  const entries=text.match(/xref\n0 6\n([\s\S]*?)trailer/)[1].trimEnd().split('\n').slice(1);
  entries.forEach((entry,i)=>{const pos=Number(entry.slice(0,10));assert.equal(new TextDecoder().decode(bytes.slice(pos,pos+7)),`${i+1} 0 obj`);});
});
