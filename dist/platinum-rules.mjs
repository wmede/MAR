// Document-derived reference functions, not an approved Amex production ruleset.
export const VERSION='platinum-reference-2026.1';
export const REFERENCE_URL='https://www.americanexpress.com/content/dam/amex/en-us/company/legal/cardmember-agreements/public-site-2026-q1-pdf-cmas/cps-charge/platinum-card-03-31-2026.pdf';
export const SOURCE_STATUS=Object.freeze({routing:'Uploaded terms pp54–57',futureRouting:'Uploaded terms pp55–57; effective 2027-02-01',minimum:'Public March 2026 agreement p3; account applicability unconfirmed',allocation:'Public March 2026 agreement p7; account applicability unconfirmed',interest:'Statement p2 plus public March 2026 agreement p7; grace history and issuer rounding require validation'});
const cents=n=>{if(!Number.isSafeInteger(n)||n<0||n>100000000)throw Error('Expected bounded nonnegative integer cents');return n;};
const half=(n,d)=>{if(n<0n||d<=0n)throw Error('Invalid rounding inputs');return (2n*n+d)/(2n*d);};
const gcd=(a,b)=>{while(b){[a,b]=[b,a%b];}return a;};
const iso=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error('Invalid effective date');return v;};
export function termsVersion(date){return iso(date)>='2027-02-01'?'future-2027-02-01':'current-before-2027-02-01';}
export function routePurchase({date,amount,potBalance,limit,cashBalance=0,planBalance=0,activeAtTransaction,eligible=true,suspended=false,cancelled=false,paymentProgram=false}){
 for(const n of [amount,potBalance,limit,cashBalance,planBalance])cents(n);
 if(paymentProgram)throw Error('Payment-program exceptions require their own effective-date policy');
 const future=termsVersion(date)==='future-2027-02-01';
 const active=future?true:activeAtTransaction===true;
 const available=Math.max(0,limit-potBalance-cashBalance-planBalance);
 // Whole charge at transaction time; partial transfer only at closing.
 const intoPot=eligible&&active&&!cancelled&&(!suspended||future)&&amount<=available;
 return {version:termsVersion(date),pot:intoPot?amount:0,pif:intoPot?0:amount,availableBefore:available,reason:intoPot?'Eligible entire charge fits Pay Over Time capacity':'Entire charge remains Pay In Full',assumption:'Standard account; issuer authorization is external'};
}
export function closingTransfer({date,pifEligible,potBalance,limit,cashBalance=0,planBalance=0,activeAtTransaction,activeAtClose,excluded=false,suspended=false,cancelled=false,paymentProgram=false}){
 for(const n of [pifEligible,potBalance,limit,cashBalance,planBalance])cents(n);
 if(paymentProgram)throw Error('Payment-program exceptions require their own effective-date policy');
 const future=termsVersion(date)==='future-2027-02-01';
 const active=future||(activeAtTransaction===true&&activeAtClose===true);
 const permitted=active&&!excluded&&!cancelled&&(!suspended||future);
 const moved=permitted?Math.min(pifEligible,Math.max(0,limit-potBalance-cashBalance-planBalance)):0;
 return {moved,pifRemaining:pifEligible-moved,potBalance:potBalance+moved,interestStarts:'day_after_transfer',version:termsVersion(date)};
}
export function graceEligibility({previousPotBalance,priorTwoCyclesPaidInFullOnTime=[]}){
 cents(previousPotBalance);
 if(previousPotBalance===0)return {state:'eligible',basis:'Zero previous Pay Over Time balance under reference agreement'};
 if(priorTwoCyclesPaidInFullOnTime.length!==2||priorTwoCyclesPaidInFullOnTime.some(x=>typeof x!=='boolean'))return {state:'unknown',basis:'Two prior-cycle payment outcomes required by the public reference'};
 return {state:priorTwoCyclesPaidInFullOnTime.every(Boolean)?'eligible':'ineligible',basis:'Public reference two-prior-cycle condition; applicability must be confirmed'};
}
export function referenceMinimum({pif,potAndCash,interest=0,planPayment=0,pastDuePot=0}){
 for(const n of [pif,potAndCash,interest,planPayment,pastDuePot])cents(n);
 if(interest>potAndCash)throw Error('Interest exceeds revolving balance');
 const amount=BigInt(potAndCash-interest);
 let remaining=amount,weighted=0n;
 for(const [width,rate] of [[2000000n,1n],[1500000n,2n],[1500000n,5n],[100000000n,10n]]){const n=remaining<width?remaining:width;weighted+=n*rate;remaining-=n;}
 // Ratio is rounded to four decimals, then multiplied by amount, then interest added.
 const ratio=amount===0n?0n:half(weighted*100n,amount);
 const tier=Number(half(amount*ratio,10000n))+interest;
 const twoPercent=Number(half(BigInt(potAndCash)*2n,100n));
 const revolving=Math.min(potAndCash,Math.max(4000,twoPercent,tier)+pastDuePot);
 return {total:pif+revolving+planPayment,revolving,candidates:{floor:4000,twoPercent,tier,roundedRatio:Number(ratio)/10000},sourceStatus:'Public reference formula; not confirmed as the account agreement',version:VERSION};
}
export function allocateReferencePayment({payment,minimumRemaining,pif,pifDue=pif,planBalance=0,planDue=0,pot,cash=0,potAprBps=2400,cashAprBps=2900}){
 for(const n of [payment,minimumRemaining,pif,pifDue,planBalance,planDue,pot,cash,potAprBps,cashAprBps])cents(n);
 if(pifDue>pif)throw Error('Billed PIF due exceeds PIF balance');
 if(planDue>planBalance)throw Error('Plan due exceeds plan balance');
 const balances={pif,plan:planBalance,pot,cash},allocations={pif:0,plan:0,pot:0,cash:0};
 let left=payment,minBudget=Math.min(payment,minimumRemaining);
 const take=(key,budget,max=balances[key])=>{const n=Math.min(balances[key],budget,max);balances[key]-=n;allocations[key]+=n;left-=n;return n;};
 let n=take('pif',minBudget,pifDue);minBudget-=n;
 n=take('plan',minBudget,planDue);minBudget-=n;
 const low=potAprBps<=cashAprBps?['pot','cash']:['cash','pot'];
 for(const k of low){n=take(k,minBudget);minBudget-=n;}
 const minimumApplied=Math.min(payment,minimumRemaining)-minBudget;
 if(minBudget===0){for(const k of [...low].reverse())take(k,left);take('plan',left);}
 // Do not infer how a residual pays unbilled PIF. A true overpayment requires no remaining debt.
 const remainingDebt=Object.values(balances).reduce((a,b)=>a+b,0);
 return {allocations,remaining:balances,unallocatedPayment:left,unallocatedCredit:remainingDebt===0?left:0,needsAllocationPolicy:left>0&&remainingDebt>0,minimumRemaining:minimumRemaining-minimumApplied,sourceStatus:'Public reference allocation; equal-APR order is a deterministic modeling choice'};
}
export function compoundedReference({opening,days,aprBps,changes=[],grace='unknown',kind='pot'}){
 cents(opening);cents(aprBps);if(aprBps>2999)throw Error('APR exceeds reference cap');
 if(!Number.isInteger(days)||days<1||days>366)throw Error('Invalid cycle length');
 if(!['pot','cash'].includes(kind)||!['eligible','ineligible','unknown'].includes(grace))throw Error('Invalid balance/grace state');
 if(kind==='pot'&&grace==='unknown')return {interest:null,days:[],status:'blocked_missing_grace_history',version:VERSION};
 for(const c of changes){if(!Number.isInteger(c.day)||c.day<1||c.day>days||!Number.isSafeInteger(c.delta)||Math.abs(c.delta)>100000000)throw Error('Invalid daily change');}
 const dprUnits=Number(half(BigInt(aprBps)*100n,365n)); // Units of 0.0001 percentage point.
 const rate=kind==='pot'&&grace==='eligible'?0:dprUnits;
 let numerator=BigInt(opening),denominator=1n,principal=opening;
 const rows=[];
 for(let day=1;day<=days;day++){
  const delta=changes.filter(x=>x.day===day).reduce((n,x)=>n+x.delta,0);principal+=delta;
  if(principal<0)throw Error('Overpayment/credit-balance interest treatment outside this reference slice');
  numerator+=BigInt(delta)*denominator;
  const dailyBalance=Number(half(numerator*10000n,denominator))/10000; // display only, cents.
  numerator*=1000000n+BigInt(rate);denominator*=1000000n;
  const g=gcd(numerator,denominator);numerator/=g;denominator/=g;
  rows.push({day,principal,dailyBalanceCents:dailyBalance,unbilledInterest:Number(half(numerator-BigInt(principal)*denominator,denominator))});
 }
 return {interest:Number(half(numerator-BigInt(principal)*denominator,denominator)),days:rows,dprUnits,dprPercent:dprUnits/10000,status:rate?'reference_compounding_calculated':'conditional_grace_suppression',version:VERSION,precision:'Exact rational accumulation after rounded DPR; final half-up cents is a modeling convention requiring issuer validation'};
}
export function reconcileStatement(fixture){
 const {opening,events,observed}=fixture;
 for(const n of [opening,observed.closing,observed.interest,observed.fees])cents(n);
 const totals={purchase:0,payment:0,credit:0};
 for(const e of events){if(!(e.type in totals))throw Error('Unknown fixture event type');cents(e.cents);totals[e.type]+=e.cents;}
 const closing=opening+totals.purchase-totals.payment-totals.credit+observed.fees+observed.interest;
 return {totals,closing,difference:closing-observed.closing,interestStatus:'Observed input, not independently validated by a zero-interest cycle',minimumStatus:'Observed minimum can be compared with reference formula; account terms unconfirmed',postingTimelineVerified:events.every(e=>e.postingDate!==null)};
}
export function syntheticProductRun({active=true,future=false,grace='eligible'}={}){
 // Entirely synthetic amounts, unrelated to the uploaded account.
 const transactionDate=future?'2027-02-05':'2026-09-05',closeDate=future?'2027-02-28':'2026-09-30';
 const routed=routePurchase({date:transactionDate,amount:25000,potBalance:90000,limit:100000,activeAtTransaction:active});
 const paid=allocateReferencePayment({payment:40000,minimumRemaining:19000,pif:15000+routed.pif,pifDue:15000,pot:90000+routed.pot});
 const moved=closingTransfer({date:closeDate,pifEligible:paid.remaining.pif,potBalance:paid.remaining.pot,limit:100000,activeAtTransaction:active,activeAtClose:active});
 const interest=compoundedReference({opening:90000,days:30,aprBps:2400,changes:[{day:5,delta:routed.pot},{day:10,delta:-paid.allocations.pot}],grace});
 const closing=paid.remaining.pif+paid.remaining.pot; // plus interest only when independently determined.
 return {routed,paid,moved,interest,principalClosing:closing,totalClosing:interest.interest===null?null:closing+interest.interest,version:VERSION};
}
