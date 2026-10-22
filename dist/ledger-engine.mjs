// Executable demonstration rules. One account/entity/currency, not issuer terms.
export const RULE_VERSION = 'demo-usd-1.0';
export const ACCOUNT = Object.freeze({id:'SYNTHETIC-001', entity:'DEMO-ISSUER', currency:'USD', aprBps:2400});
const event = (id,type,cents,effectiveDay,extra={}) => ({id,type,cents,effectiveDay,currency:'USD',account:ACCOUNT.id,entity:ACCOUNT.entity,...extra});
const first = event('purchase-001','purchase',120000,3);
export const SCENARIO = Object.freeze([
  {day:3,label:'Purchase · electronics',event:first},
  {day:7,label:'Purchase · groceries',event:event('purchase-002','purchase',8000,7)},
  {day:12,label:'Customer payment received',event:event('payment-001','payment',30000,12)},
  {day:15,label:'Merchant refund',event:event('refund-001','refund',8000,15)},
  {day:20,label:'Purchase · travel',event:event('purchase-003','purchase',20000,20)},
  {day:21,label:'Reverse travel purchase',event:event('reverse-001','reversal',20000,21,{reverses:'purchase-003'})},
  {day:24,label:'Illustrative service fee',event:event('fee-001','fee',2500,24)},
  {day:28,label:'Replay original purchase',event:{...first}},
  {day:29,label:'Unsupported EUR event',event:event('foreign-001','purchase',5000,29,{currency:'EUR'})},
  {day:30,label:'Conflicting retry',event:{...first,cents:120001}},
]);
const fingerprint = e => JSON.stringify(Object.keys(e).sort().map(k=>[k,e[k]]));
const copy = value => JSON.parse(JSON.stringify(value));
export function createEngine({aprBps=ACCOUNT.aprBps}={}) {
  if(!Number.isSafeInteger(aprBps)||aprBps<0||aprBps>10000)throw Error('Invalid demo APR');
  let day=0, principal=0,fees=0,interest=0,numerator=0n,closed=false;
  const journals=[], attempts=[], days=[], seen=new Map(), reversed=new Set();
  const total=()=>principal+fees+interest;
  function apply(e,label=e.type) {
    const base={day,label,eventId:e.id,type:e.type,cents:e.cents};
    const reject = reason => {const r={...base,status:'rejected',reason};attempts.push(r);return copy(r);};
    if(!e.id||typeof e.id!=='string')return reject('Missing event identity');
    const fp=fingerprint(e);
    if(seen.has(e.id)) {
      if(seen.get(e.id)!==fp)return reject('Idempotency key reused with different content');
      const r={...base,status:'duplicate',reason:'Same event and payload: no second journal'};attempts.push(r);return copy(r);
    }
    if(closed)return reject('Cycle is closed; new postings require a correction workflow');
    if(day<1||day>31)return reject('Advance the simulated calendar first');
    if(e.currency!==ACCOUNT.currency||e.entity!==ACCOUNT.entity||e.account!==ACCOUNT.id)return reject('Account, entity or currency mismatch');
    if(!Number.isSafeInteger(e.cents)||e.cents<=0||e.cents>100000000)return reject('Amount must be positive integer cents within demo bounds');
    if(e.effectiveDay!==day)return reject('New backdated/future events require a correction workflow');
    let debit,credit,bucket,delta;
    if(e.type==='purchase'){debit='AR:principal';credit='Processor clearing';bucket='principal';delta=e.cents;}
    else if(e.type==='payment'||e.type==='refund'){
      if(e.cents>principal)return reject('Demo supports principal reductions only, without credit balances');
      debit=e.type==='payment'?'Payment clearing':'Processor clearing';credit='AR:principal';bucket='principal';delta=-e.cents;
    } else if(e.type==='reversal') {
      const original=journals.find(j=>j.eventId===e.reverses);
      if(!original||original.type!=='purchase'||original.cents!==e.cents||reversed.has(e.reverses))return reject('Reversal requires an unreversed, matching purchase');
      if(e.cents>principal)return reject('Reversal would exceed eligible principal');
      debit='Processor clearing';credit='AR:principal';bucket='principal';delta=-e.cents;
    } else if(e.type==='fee'){debit='AR:fees';credit='Fee income';bucket='fees';delta=e.cents;}
    else if(e.type==='interest'){debit='AR:interest';credit='Interest income';bucket='interest';delta=e.cents;}
    else return reject('Unsupported event type');
    const journal={id:`J${String(journals.length+1).padStart(3,'0')}`,day,effectiveDay:e.effectiveDay,eventId:e.id,type:e.type,label,cents:e.cents,entity:e.entity,currency:e.currency,ruleVersion:RULE_VERSION,reverses:e.reverses||null,lines:[{account:debit,debit:e.cents,credit:0},{account:credit,debit:0,credit:e.cents}]};
    if(journal.lines.reduce((n,l)=>n+l.debit-l.credit,0)!==0)throw Error('Unbalanced journal');
    // In-memory all-or-nothing mutation after validation, not a database transaction.
    if(bucket==='principal')principal+=delta; else if(bucket==='fees')fees+=delta;else interest+=delta;
    journals.push(journal);seen.set(e.id,fp);if(e.reverses)reversed.add(e.reverses);
    const r={...base,status:'posted',journalId:journal.id,reason:'Balanced journal committed in memory'};attempts.push(r);return copy(r);
  }
  function step() {
    if(day===31)return snapshot();
    day++;
    for(const input of SCENARIO.filter(x=>x.day===day))apply(input.event,input.label);
    // End-of-day principal only. No compounding; no fee/interest accrual.
    numerator+=BigInt(principal)*BigInt(aprBps);
    const denominator=3650000n;
    if(day===31){const cents=Number((numerator+denominator/2n)/denominator);if(cents)apply(event('statement-interest','interest',cents,31),'Cycle close · assess accrued interest');closed=true;}
    days.push({day,principal,fees,interest,balance:total(),unbilledInterestCents:day===31?0:Number((numerator+denominator/2n)/denominator)});
    return snapshot();
  }
  function snapshot() {
    const difference=journals.reduce((n,j)=>n+j.lines.reduce((v,l)=>v+l.debit-l.credit,0),0);
    const ledgerReceivable=journals.flatMap(j=>j.lines).filter(l=>l.account.startsWith('AR:')).reduce((n,l)=>n+l.debit-l.credit,0);
    return copy({day,account:{...ACCOUNT,aprBps},ruleVersion:RULE_VERSION,principal,fees,interest,balance:total(),accrualNumerator:numerator.toString(),accrualDenominator:'3650000',unbilledInterestCents:day===31?0:Number((numerator+1825000n)/3650000n),journals,attempts,days,checks:{journalDifference:difference,receivableDifference:ledgerReceivable-total(),uniqueJournalEvents:new Set(journals.map(j=>j.eventId)).size===journals.length},statement:day===31?{closingDay:31,balance:total(),principal,fees,interest,ruleVersion:RULE_VERSION}:null});
  }
  return {step,snapshot,submit:(e)=>apply(e,'Manual validation probe')};
}
export function replay(target=31,options={}) {if(!Number.isInteger(target)||target<0||target>31)throw Error('Invalid day');const engine=createEngine(options);for(let d=0;d<target;d++)engine.step();return engine.snapshot();}
