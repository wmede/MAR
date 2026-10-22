import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine,replay,ACCOUNT} from '../dist/ledger-engine.mjs';
test('known cycle outcome and independent balance reconstruction',()=>{
 const s=replay();assert.equal(s.principal,90000);assert.equal(s.fees,2500);assert.equal(s.interest,1949);assert.equal(s.balance,94449);assert.equal(s.journals.length,8);
 // Independent fixture: 29,640 dollar-days at 24% / 365 = $19.49.
 assert.equal(s.accrualNumerator,'7113600000');
 assert.equal(s.attempts.filter(x=>x.status==='duplicate').length,1);assert.equal(s.attempts.filter(x=>x.status==='rejected').length,2);
 for(const j of s.journals)assert.equal(j.lines.reduce((n,l)=>n+l.debit-l.credit,0),0);
 for(const k of ['principal','fees','interest'])assert.equal(s[k],s.journals.flatMap(j=>j.lines).filter(l=>l.account===`AR:${k}`).reduce((n,l)=>n+l.debit-l.credit,0));
 assert.equal(s.statement.balance,s.balance);
});
test('every day reconciles and fresh replay is deterministic',()=>{for(let day=0;day<=31;day++){const s=replay(day);assert.equal(s.checks.journalDifference,0);assert.equal(s.checks.receivableDifference,0);assert.equal(s.checks.uniqueJournalEvents,true);}assert.deepEqual(replay(),replay());});
test('duplicate, conflicting retry and foreign currency have no financial effect',()=>{const a=replay(27),b=replay(30);assert.equal(a.balance,b.balance);assert.deepEqual(a.journals,b.journals);});
test('reversal preserves original and cannot be applied again',()=>{const engine=createEngine();for(let i=0;i<21;i++)engine.step();const before=engine.snapshot();const result=engine.submit({id:'second-reversal',type:'reversal',cents:20000,effectiveDay:21,currency:'USD',account:ACCOUNT.id,entity:ACCOUNT.entity,reverses:'purchase-003'});assert.equal(result.status,'rejected');assert.deepEqual(engine.snapshot().journals,before.journals);assert.ok(before.journals.find(j=>j.eventId==='purchase-003'));assert.equal(before.journals.find(j=>j.eventId==='reverse-001').reverses,'purchase-003');});
test('zero APR and end-of-cycle replay boundaries',()=>{assert.equal(replay(31,{aprBps:0}).interest,0);const e=createEngine();for(let i=0;i<31;i++)e.step();const before=e.snapshot();e.step();assert.deepEqual(e.snapshot(),before);assert.throws(()=>replay(-1));});
test('closed cycle rejects new financial effects and returned snapshots cannot mutate journals',()=>{const e=createEngine();for(let i=0;i<31;i++)e.step();const before=e.snapshot();before.journals[0].lines[0].debit=1;assert.equal(e.snapshot().journals[0].lines[0].debit,120000);const result=e.submit({id:'late',type:'purchase',cents:100,effectiveDay:31,currency:'USD',account:ACCOUNT.id,entity:ACCOUNT.entity});assert.equal(result.status,'rejected');assert.equal(e.snapshot().balance,94449);assert.equal(e.snapshot().journals.length,8);});
test('invalid amounts and overpayments are rejected before mutation',()=>{const e=createEngine();for(let i=0;i<3;i++)e.step();const base={id:'probe',type:'payment',cents:120001,effectiveDay:3,currency:'USD',account:ACCOUNT.id,entity:ACCOUNT.entity};for(const cents of [120001,-100,0,0.1,Number.MAX_SAFE_INTEGER]){assert.equal(e.submit({...base,cents}).status,'rejected');assert.equal(e.snapshot().balance,120000);}assert.equal(e.snapshot().journals.length,1);});
