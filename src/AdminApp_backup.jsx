import { useState, useEffect, useRef } from "react";
import { dbRead, dbWrite, dbClear, dbListen } from "./firebase.js";
import { CSS, mmk, ini, mc, calcRound, BASE_PRICES, TOTAL_SLOTS_CAP, tSlots, uid } from "./shared.js";

// ── Password gate — change this to your own password ──────────────────────────
const ADMIN_PASSWORD = "dai2024";

export default function AdminApp() {
  const [authed,   setAuthed]   = useState(() => sessionStorage.getItem("adm") === "1");
  const [pw,       setPw]       = useState("");
  const [pwErr,    setPwErr]    = useState(false);
  const [db,       setDb]       = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState("main");
  const [activeRn, setActiveRn] = useState(null);
  const [modal,    setModal]    = useState(null);
  const [toast,    setToast]    = useState(null);
  const saveRef = useRef(null);

  useEffect(() => {
    if (!authed) { setLoading(false); return; }
    const unsub = dbListen((data) => { setDb(data); setLoading(false); });
    return () => unsub();
  }, [authed]);

  useEffect(() => {
    if (!db) return;
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => dbWrite(db), 600);
  }, [db]);

  function login() {
    if (pw === ADMIN_PASSWORD) { sessionStorage.setItem("adm","1"); setAuthed(true); setPwErr(false); }
    else { setPwErr(true); setPw(""); }
  }

  function notify(msg, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),2800); }
  function mutate(fn) { setDb(p=>{ const n=JSON.parse(JSON.stringify(p)); fn(n); return n; }); }
  async function resetApp() { await dbClear(); setDb(null); setView("main"); setActiveRn(null); sessionStorage.removeItem("adm"); setAuthed(false); }

  // ── Password screen ──
  if (!authed) return (
    <div style={{minHeight:"100vh",background:"#080810",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Serif',serif"}}>
      <style>{CSS}</style>
      <div style={{background:"#0e0c14",border:"1px solid #2e2050",borderRadius:16,padding:28,width:"90%",maxWidth:340}}>
        <div style={{fontSize:22,fontWeight:700,color:"#c9a0ff",marginBottom:6,fontStyle:"italic"}}>Admin Login</div>
        <div style={{fontSize:11,color:"#555",fontFamily:"'JetBrains Mono',monospace",marginBottom:20}}>ဒိုင်သာ ဝင်ခွင့်ရှိသည်</div>
        <label className="lbl">Password</label>
        <input className="inp" type="password" value={pw}
          onChange={e=>{setPw(e.target.value);setPwErr(false);}}
          onKeyDown={e=>e.key==="Enter"&&login()}
          placeholder="Enter admin password" autoFocus/>
        {pwErr&&<div style={{fontSize:11,color:"#e74c3c",fontFamily:"'JetBrains Mono',monospace",marginTop:6}}>Password မှားသည်</div>}
        <button className="cta-full" style={{marginTop:16}} onClick={login}>ဝင်မည်</button>
      </div>
    </div>
  );

  const members   = db?.members   || [];
  const rounds    = db?.rounds    || [];
  const payments  = db?.payments  || [];
  const cfg       = db?.config    || {};
  const prizePool = cfg.amountPerSlot ? cfg.amountPerSlot * TOTAL_SLOTS_CAP : 0;
  const totalSlots= TOTAL_SLOTS_CAP;

  const memberById   = id  => members.find(m=>m.id===id);
  const roundByNum   = n   => rounds.find(r=>r.number===n);
  const slotsPaid    = (mid,rid) => payments.filter(p=>p.memberId===mid&&p.roundId===rid);
  const collRound    = rid => payments.filter(p=>p.roundId===rid).reduce((s,p)=>s+p.amount,0);
  const totalPaidBy  = mid => payments.filter(p=>p.memberId===mid).reduce((s,p)=>s+p.amount,0);
  const allPaid      = payments.reduce((s,p)=>s+p.amount,0);
  const openRound    = rounds.find(r=>!r.closed);
  const doneRounds   = rounds.filter(r=>r.closed).length;

  function finishSetup(config, mems) {
    const d = { config, members:mems, rounds:[], payments:[] };
    setDb(d); dbWrite(d); setView("main"); notify("ကလပ်ဖွင့်ပြီး 🎉");
  }
  function openNewRound(n) {
    if (openRound) return notify("ဦးစွာ ရှိပြီးသောအဝိုင်းပိတ်ပါ",false);
    mutate(d=>d.rounds.push({id:uid(),number:n,winningBid:null,winnerId:null,closed:false}));
    notify(`Round ${n} ဖွင့်ပြီး!`);
  }
  function setAuction(roundId, bid, winnerId) {
    mutate(d=>{ const r=d.rounds.find(x=>x.id===roundId); if(r){r.winningBid=bid;r.winnerId=winnerId;} });
    notify("Auction သိမ်းပြီး!");
  }
  function closeRoundFn(roundId) {
    mutate(d=>{ const r=d.rounds.find(x=>x.id===roundId); if(r) r.closed=true; });
    notify("အဝိုင်းပိတ်ပြီး ✓");
  }
  function recordPayment(memberId, roundId, slotIndex, amount, note) {
    const val=parseFloat(amount);
    if (!val||val<=0) return notify("ငွေပမာဏမှားသည်",false);
    if (payments.find(p=>p.memberId===memberId&&p.roundId===roundId&&p.slotIndex===slotIndex)) return notify("ဤ slot ငွေပေးပြီး",false);
    mutate(d=>d.payments.push({id:uid(),memberId,roundId,slotIndex,amount:val,note:note||"",paidAt:new Date().toISOString()}));
    notify("မှတ်တမ်းသိမ်းပြီး ✓");
  }
  function deletePayment(id) { mutate(d=>{ d.payments=d.payments.filter(p=>p.id!==id); }); notify("ဖျက်ပြီး"); }

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#080810",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14}}>
      <style>{CSS}</style>
      <div className="spinner"/>
      <div style={{fontSize:12,color:"#444",fontFamily:"'JetBrains Mono',monospace"}}>Firebase ခေါ်နေသည်...</div>
    </div>
  );

  if (!db || view==="setup") return <SetupWizard onFinish={finishSetup}/>;

  // ── ROUND DETAIL ──
  if (view==="round" && activeRn) {
    const r       = roundByNum(activeRn);
    const isDai   = activeRn===1||activeRn===20;
    const base    = BASE_PRICES[activeRn];
    const calc    = r ? calcRound(activeRn,prizePool,totalSlots,r.winningBid) : null;
    const coll    = r ? collRound(r.id) : 0;
    const winner  = r?.winnerId ? memberById(r.winnerId) : null;
    const perSlot = calc ? calc.payPerSlot : null;
    const fullyN  = r ? members.filter(m=>slotsPaid(m.id,r.id).length>=m.slots).length : 0;
    const allFP   = r ? members.every(m=>slotsPaid(m.id,r.id).length>=m.slots) : false;
    const totExp  = calc ? members.reduce((s,m)=>s+calc.payPerSlot*m.slots,0) : 0;

    return (
      <div style={{minHeight:"100vh",background:"#080810",color:"#f0eeff",fontFamily:"'Noto Serif',Georgia,serif"}}>
        <style>{CSS}</style>
        <div className="rnd-bar">
          <button className="back-btn" onClick={()=>{setView("main");setActiveRn(null);}}>← ပြန်</button>
          <div className="rnd-bar-title">Round {activeRn} {isDai&&<span className="dai-badge">ဒိုင်</span>}</div>
          <div style={{width:60}}/>
        </div>
        <div className="page">
          <div className="rsc">
            {isDai ? (
              <>
                <div className="rsc-tag">ဒိုင်အဝိုင်း — {activeRn===1?"ပထမဆုံး":"နောက်ဆုံး"}</div>
                <div className="rsc-big">{mmk(prizePool)}</div>
                <div className="rsc-3">
                  <RSC3 lbl="တစ်ကွက်ပေးရမည်" val={mmk(cfg.amountPerSlot)}/>
                  <RSC3 lbl="ကွက်ရေ" val={totalSlots}/>
                  <RSC3 lbl="ဒိုင်ရမည်" val={mmk(prizePool)}/>
                </div>
              </>
            ) : (
              <>
                <div className="rsc-tag">ကြမ်းခင်းစျေး: {mmk(base)} · တိုး 5,000 ks</div>
                {r?.winningBid && calc ? (
                  <div className="calc-display">
                    <div className="cd-eq">
                      <span className="cd-n">{mmk(prizePool)}</span><span className="cd-op">−</span>
                      <span className="cd-n red">{mmk(r.winningBid)}</span><span className="cd-op">=</span>
                      <span className="cd-n purple">{mmk(calc.winnerGets)}</span>
                    </div>
                    <div className="cd-lbl"><span>Prize Pool</span><span/><span>Winning Bid</span><span/><span>ဆုရသူ ရငွေ</span></div>
                    <div className="cd-div"/>
                    <div className="cd-eq">
                      <span className="cd-n purple">{mmk(calc.winnerGets)}</span><span className="cd-op">÷</span>
                      <span className="cd-n">{totalSlots}</span><span className="cd-op">=</span>
                      <span className="cd-n green">{mmk(calc.payPerSlot)}</span>
                    </div>
                    <div className="cd-lbl"><span>ဆုရသူ ရငွေ</span><span/><span>ကွက်</span><span/><span>တစ်ဦးထည့်ရမည့်ပမာဏ</span></div>
                    {calc.saving>0&&<div className="cd-saving">တစ်ကွက် {mmk(calc.saving)} သက်သာ</div>}
                    {winner&&<div className="cd-winner"><span>🏆</span><strong>{winner.name}</strong><span className="cd-w-amt">{mmk(calc.winnerGets)}</span></div>}
                  </div>
                ) : <div className="rsc-noauction"><div style={{fontSize:24,marginBottom:6}}>🔨</div><div>Auction ထည့်ရန် အောက်ကိုဆင်းပါ</div></div>}
              </>
            )}
            {r&&<div className="rsc-prog">
              <div className="rsc-pr"><span>{fullyN}/{members.length} ဦး ပေးပြီး</span><span>{mmk(coll)} / {mmk(totExp)}</span></div>
              <div className="prog-bar"><div className="prog-fill" style={{width:`${members.length?(fullyN/members.length)*100:0}%`}}/></div>
            </div>}
          </div>

          {r&&!isDai&&!r.winningBid&&!r.closed&&(
            <div className="section"><div className="sec-lbl">Auction ရလဒ်</div>
              <AuctionInput roundId={r.id} basePrice={base} members={members} onSave={setAuction} notify={notify} prizePool={prizePool} totalSlots={totalSlots}/>
            </div>
          )}
          {r&&isDai&&!r.winnerId&&!r.closed&&(
            <div className="section"><div className="sec-lbl">ဒိုင်ရွေးပါ</div>
              <div className="auc-card"><WinnerSelect members={members} value="" onChange={wid=>setAuction(r.id,null,wid)}/></div>
            </div>
          )}
          {r&&!isDai&&r.winningBid&&!r.closed&&(
            <div style={{marginBottom:14}}>
              <button className="sec-btn" onClick={()=>setModal({type:"edit-auction",roundId:r.id,basePrice:base,members,currentBid:r.winningBid,currentWinner:r.winnerId})}>✏ Auction ပြင်မည်</button>
            </div>
          )}

          {r&&(
            <div className="section">
              <div className="sec-lbl">ငွေပေးမှတ်တမ်း — Live</div>
              <div className="lg-summary">
                <LStat lbl="ပေးပြီး" val={`${fullyN}/${members.length}`} cls="green"/>
                <div className="lg-s-div"/>
                <LStat lbl="ကျန်" val={`${members.length-fullyN}`} cls="red"/>
                <div className="lg-s-div"/>
                <LStat lbl="ရငွေ" val={mmk(coll)} cls="purple"/>
                <div className="lg-s-div"/>
                <LStat lbl="ပစ်မှတ်" val={mmk(totExp)} cls=""/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {members.map((m,i)=>{
                  const mPmts=slotsPaid(m.id,r.id);
                  const full=mPmts.length>=m.slots;
                  const isWin=r.winnerId===m.id;
                  const expAmt=perSlot?perSlot*m.slots:null;
                  return (
                    <div key={m.id} className={`lg-card ${full?"lgc-paid":perSlot?"lgc-pend":"lgc-wait"} ${isWin?"lgc-win":""}`}>
                      <div className="lgc-left">
                        <div className="lgc-av" style={{background:mc(i)}}>{ini(m.name)}</div>
                        <div className="lgc-body">
                          <div className="lgc-name">{m.name}{m.slots===2&&<span className="sbdg">×2</span>}{isWin&&<span className="win-tag">🏆ဆုရ</span>}</div>
                          {m.slots===2?(
                            <div className="lgc-slots">
                              {[1,2].map(si=>{
                                const sp=mPmts.find(p=>p.slotIndex===si);
                                return <div key={si} className="lgc-sr">
                                  <span className="lgc-sl">Slot {si}</span>
                                  {sp?<span className="lgc-sp">{mmk(sp.amount)}{!r.closed&&<button className="tiny-del" onClick={()=>deletePayment(sp.id)}>✕</button>}</span>
                                    :<span className="lgc-sw">{expAmt?mmk(perSlot):"—"}</span>}
                                </div>;
                              })}
                            </div>
                          ):(mPmts[0]?
                            <div className="lgc-pr">
                              <span className="lgc-pa">{mmk(mPmts[0].amount)}</span>
                              {mPmts[0].note&&<span className="lgc-pn">{mPmts[0].note}</span>}
                              {!r.closed&&<button className="tiny-del" onClick={()=>deletePayment(mPmts[0].id)}>✕</button>}
                            </div>
                            :<div className="lgc-exp">{expAmt?`ထည့်ရမည်: ${mmk(expAmt)}`:"ဈေးစောင့်"}</div>
                          )}
                        </div>
                      </div>
                      <div className="lgc-right">
                        {full?<div className="lgc-chk">✓</div>:!r.closed&&expAmt?
                          <button className="pay-btn" onClick={()=>setModal({type:"pay",memberId:m.id,memberName:m.name,roundId:r.id,slots:m.slots,paidSlots:mPmts.map(p=>p.slotIndex),defaultAmt:perSlot})}>
                            {mPmts.length>0?"Slot 2":"ငွေထည့်"}
                          </button>:null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {r&&!r.closed&&r.winnerId&&calc&&(
            <div className="section">
              {allFP?
                <button className="cta-full" onClick={()=>setModal({type:"confirm",msg:`Round ${activeRn} ပိတ်မလား?\n\n${winner?.name} သို့ ${mmk(isDai?prizePool:calc.winnerGets)} ပေးမည်`,onOk:()=>closeRoundFn(r.id)})}>
                  ✓ အဝိုင်းပိတ်ပြီး · ဒိုင်မှ ဆုပေးမည်
                </button>
                :<div className="close-hint">⏳ ငွေအားလုံးမရသေး ({members.length-fullyN} ဦး ကျန်)</div>
              }
            </div>
          )}
          {r?.closed&&<div className="closed-banner">✓ Round {activeRn} ပိတ်ပြီး{winner?` — ${winner.name} ${mmk(isDai?prizePool:calc?.winnerGets)} ရပြီး`:""}</div>}
          {!r&&<div className="open-cta">
            <div style={{color:"#444",fontSize:12,marginBottom:10,textAlign:"center",fontFamily:"'JetBrains Mono',monospace"}}>Round {activeRn} မဖွင့်ရသေး</div>
            <button className="cta-full" onClick={()=>openNewRound(activeRn)}>Round {activeRn} ဖွင့်မည်</button>
          </div>}
        </div>

        {modal&&<ModalShell onClose={()=>setModal(null)}>
          {modal.type==="edit-auction"&&<EditAuctionModal {...modal} onSave={setAuction} onClose={()=>setModal(null)} prizePool={prizePool} totalSlots={totalSlots}/>}
          {modal.type==="pay"&&<PayModal {...modal} onSave={recordPayment} onClose={()=>setModal(null)}/>}
          {modal.type==="confirm"&&<ConfirmModal msg={modal.msg} onOk={()=>{modal.onOk();setModal(null);}} onClose={()=>setModal(null)}/>}
        </ModalShell>}
        {toast&&<div className={`toast ${toast.ok?"tok":"terr"}`}>{toast.msg}</div>}
      </div>
    );
  }

  // ── MAIN DASHBOARD ──
  return (
    <div style={{minHeight:"100vh",background:"#080810",color:"#f0eeff",fontFamily:"'Noto Serif',Georgia,serif"}}>
      <style>{CSS}</style>
      <header className="main-top">
        <div>
          <div className="mt-title">ဈေးကြမ်း <span style={{fontSize:11,background:"#2a1a4a",color:"#c9a0ff",border:"1px solid #5a3080",padding:"1px 7px",borderRadius:4,fontFamily:"'JetBrains Mono',monospace",verticalAlign:"middle"}}>ADMIN</span></div>
          <div className="mt-sub">{members.length}ဦး · {TOTAL_SLOTS_CAP}ကွက် · {mmk(cfg.amountPerSlot)}/ကွက်/လ</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div className="mt-pool">{mmk(prizePool)}</div>
          <div className="mt-pool-lbl">PRIZE POOL</div>
        </div>
      </header>

      <div className="page">
        <div className="stat3">
          <SC lbl="ပေးပြီးငွေ" val={mmk(allPaid)} accent="#c9a0ff"/>
          <SC lbl="ပြီးအဝိုင်း" val={`${doneRounds}/20`} accent="#4caf50"/>
          <SC lbl="ကျန်အဝိုင်း" val={`${20-doneRounds}`} accent="#f0c840"/>
        </div>

        <div className="section">
          <div className="sec-lbl">အဝိုင်း ၂၀</div>
          <div className="rounds-grid">
            {Array.from({length:20},(_,i)=>i+1).map(n=>{
              const rr    = roundByNum(n);
              const isDn  = n===1||n===20;
              const cc    = rr ? calcRound(n,prizePool,totalSlots,rr.winningBid) : null;
              const paidN = rr ? members.filter(m=>slotsPaid(m.id,rr.id).length>=m.slots).length : 0;
              const wnr   = rr?.winnerId ? memberById(rr.winnerId) : null;
              const st    = rr?.closed?"done":rr?"open":isDn?"dai":n===rounds.length+1?"next":"future";
              return (
                <div key={n} className={`rg rg-${st}`} onClick={()=>{setActiveRn(n);setView("round");}}>
                  <div className="rg-top">
                    <span className="rg-n">R{n}</span>
                    {st==="done"&&<span className="rg-done-tick">✓</span>}
                    {st==="open"&&<span className="rg-live-dot"/>}
                  </div>
                  {isDn?<div className="rg-dai-txt">ဒိုင်</div>:<div className="rg-base">{mmk(BASE_PRICES[n])}</div>}
                  {rr&&cc&&<div className="rg-per">{mmk(cc.payPerSlot)}</div>}
                  {rr&&<div className="rg-prog-wrap">
                    <div className="rg-prog-bar"><div className="rg-prog-fill" style={{width:`${members.length?(paidN/members.length)*100:0}%`}}/></div>
                    <div className="rg-prog-txt">{paidN}/{members.length}</div>
                  </div>}
                  {wnr&&<div className="rg-wnr">🏆{wnr.name.split(" ")[0]}</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="section">
          <div className="sec-lbl">အဖွဲ့သား — Live</div>
          <div className="mlt">
            <div className="mlt-hdr">
              <div>အမည်</div><div style={{textAlign:"center"}}>ကွက်</div>
              <div style={{textAlign:"center"}}>အဝိုင်း</div><div style={{textAlign:"right"}}>ပေးပြီး</div>
              <div style={{textAlign:"center"}}>ယခု</div>
            </div>
            {members.map((m,i)=>{
              const tp=totalPaidBy(m.id);
              const rc=new Set(payments.filter(p=>p.memberId===m.id).map(p=>p.roundId)).size;
              const won=rounds.filter(r=>r.winnerId===m.id);
              const cp=openRound?slotsPaid(m.id,openRound.id):[];
              const cf=openRound?cp.length>=m.slots:null;
              return (
                <div key={m.id} className={`mlt-row ${cf===true?"mltr-p":cf===false?"mltr-x":""}`}>
                  <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                    <div className="mlt-av" style={{background:mc(i)}}>{ini(m.name)}</div>
                    <div style={{minWidth:0}}>
                      <div className="mlt-nm">{m.name}{m.slots===2&&<span className="sbdg">×2</span>}</div>
                      {won.length>0&&<div className="mlt-won">🏆R{won.map(r=>r.number).join(",")}</div>}
                    </div>
                  </div>
                  <div style={{textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#c9a0ff"}}>{m.slots}</div>
                  <div style={{textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#555"}}>{rc}</div>
                  <div style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#f0eeff"}}>{mmk(tp)}</div>
                  <div style={{textAlign:"center"}}>
                    {cf===true&&<span className="st-paid">✓</span>}
                    {cf===false&&<span className="st-pend">⏳</span>}
                    {cf===null&&<span style={{color:"#333",fontSize:12}}>—</span>}
                  </div>
                </div>
              );
            })}
            <div className="mlt-foot">
              <span style={{color:"#444",fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>🔥 Firebase · {payments.length} records · live sync</span>
              <span style={{color:"#c9a0ff",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700}}>{mmk(allPaid)}</span>
            </div>
          </div>
        </div>

        <div style={{textAlign:"center",marginTop:12}}>
          <button className="reset-btn" onClick={()=>setModal({type:"confirm",msg:"အားလုံးဖျက်ပြီး အသစ်စပြန်မလား?\nFirebase မှ data အားလုံးပျောက်မည်",onOk:resetApp})}>↺ ပြန်စမည်</button>
        </div>
      </div>

      {modal&&<ModalShell onClose={()=>setModal(null)}>
        {modal.type==="confirm"&&<ConfirmModal msg={modal.msg} onOk={()=>{modal.onOk();setModal(null);}} onClose={()=>setModal(null)}/>}
      </ModalShell>}
      {toast&&<div className={`toast ${toast.ok?"tok":"terr"}`}>{toast.msg}</div>}
    </div>
  );
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────
function SetupWizard({onFinish}) {
  const [step,setStep]=useState(1);
  const [n,setN]=useState(20);
  const [members,setMembers]=useState([]);
  const [amt,setAmt]=useState(300000);
  const ts=tSlots(members); const rem=TOTAL_SLOTS_CAP-ts; const pp=TOTAL_SLOTS_CAP*(parseFloat(amt)||0);
  function upd(i,f,v){setMembers(p=>p.map((m,idx)=>idx===i?{...m,[f]:v}:m));}
  function trySet(i,s){const o=ts-members[i].slots;if(o+s>TOTAL_SLOTS_CAP)return;upd(i,"slots",s);}
  function go2(){const c=Math.max(2,Math.min(20,parseInt(n)||20));setMembers(Array.from({length:c},(_,i)=>members[i]||{id:uid(),name:"",slots:1}));setStep(2);}
  function go3(){if(members.some(m=>!m.name.trim())||ts!==TOTAL_SLOTS_CAP)return;setStep(3);}
  function finish(){onFinish({amountPerSlot:parseFloat(amt),totalSlots:TOTAL_SLOTS_CAP,numMembers:members.length},members);}
  const exact=ts===TOTAL_SLOTS_CAP; const full=ts>=TOTAL_SLOTS_CAP;
  return (
    <div style={{minHeight:"100vh",background:"#080810",color:"#f0eeff",fontFamily:"'Noto Serif',Georgia,serif"}}>
      <style>{CSS}</style>
      <div className="wiz-hdr">
        <div className="wiz-title">ဈေးကြမ်း Club</div>
        <div className="wiz-steps">{[1,2,3].map(s=><div key={s} className={`ws ${step===s?"ws-act":step>s?"ws-done":"ws-idle"}`}>{step>s?"✓":s}</div>)}</div>
        <div className="wiz-lbls"><span className={step===1?"wl-act":""}>လူဦးရေ</span><span className={step===2?"wl-act":""}>ကွက်ခွဲ</span><span className={step===3?"wl-act":""}>ပမာဏ</span></div>
      </div>
      <div className="page">
        {step===1&&<div className="wiz-card">
          <div className="wc-ttl">လူဦးရေ ဘယ်နှစ်ဦး?</div>
          <div className="wc-sub">ကွက်စုစုပေါင်း 20 ကွက် ဖြစ်ရမည်</div>
          <div className="slots-cap-banner"><div className="scb-icon">🔒</div><div><div className="scb-title">ကွက် = 20 ကွက် (ပုံသေ)</div><div className="scb-sub">တစ်ဦး 2 ကွက်ယူနိုင်သည်</div></div></div>
          <label className="lbl" style={{marginTop:16}}>လူဦးရေ</label>
          <div className="num-pick"><button className="np-btn" onClick={()=>setN(x=>Math.max(2,x-1))}>−</button><div className="np-val">{n}</div><button className="np-btn" onClick={()=>setN(x=>Math.min(20,x+1))}>+</button></div>
          <input className="inp" type="number" value={n} min={2} max={20} onChange={e=>setN(Math.min(20,Math.max(2,parseInt(e.target.value)||2)))} style={{textAlign:"center",fontSize:18}}/>
          <button className="cta-full" style={{marginTop:20}} onClick={go2}>ဆက်သွားမည် →</button>
        </div>}
        {step===2&&<div>
          <div className="wc-ttl" style={{marginBottom:6}}>ကွက်ခွဲဝေပါ</div>
          <div className="slot-meter">
            <div className="sm-top"><span className="sm-used">{ts}/{TOTAL_SLOTS_CAP} ကွက်</span>{exact?<span className="sm-ok">✓ ပြည့်</span>:rem>0?<span className="sm-rem">{rem} ကျန်</span>:<span className="sm-over">ကျော်</span>}</div>
            <div className="sm-bar"><div className="sm-fill" style={{width:`${(ts/TOTAL_SLOTS_CAP)*100}%`,background:exact?"#4caf50":full?"#e74c3c":"#c9a0ff"}}/></div>
            <div className="sm-cells">{Array.from({length:TOTAL_SLOTS_CAP},(_,i)=><div key={i} className={`sm-cell ${i<ts?"sm-c-used":""}`}/>)}</div>
          </div>
          {!exact&&<div className="slot-warning">{ts<TOTAL_SLOTS_CAP?`⚠ ${rem} ကွက် ကျန်`:`⛔ 20 ကျော်`}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
            {members.map((m,i)=>{const c2=(ts-m.slots+2)<=TOTAL_SLOTS_CAP;return(
              <div key={m.id} className="msr"><div className="msr-num">{i+1}</div>
                <input className="inp" style={{flex:1}} placeholder={`အမည် ${i+1}`} value={m.name} onChange={e=>upd(i,"name",e.target.value)}/>
                <div className="slot-tog">
                  <button className={`st ${m.slots===1?"st-a":""}`} onClick={()=>trySet(i,1)}>×1</button>
                  <button className={`st ${m.slots===2?"st-a":""} ${!c2&&m.slots!==2?"st-dis":""}`} onClick={()=>trySet(i,2)}>×2</button>
                </div>
              </div>);})}
          </div>
          <div className="wiz-nav"><button className="sec-btn" onClick={()=>setStep(1)}>← ပြန်</button><button className="cta-full" style={{flex:1}} onClick={go3} disabled={members.some(m=>!m.name.trim())||!exact}>{exact?"ဆက်သွားမည် →":"ကွက် 20 ပြည့်မှ ဆက်"}</button></div>
        </div>}
        {step===3&&<div className="wiz-card">
          <div className="wc-ttl">ငွေပမာဏ</div>
          <div className="ap-presets" style={{marginBottom:12}}>{[100000,200000,300000,500000].map(v=><button key={v} className={`ap-p ${parseInt(amt)===v?"ap-p-a":""}`} onClick={()=>setAmt(v)}>{mmk(v)}</button>)}</div>
          <input className="inp" type="number" step={10000} value={amt} onChange={e=>setAmt(e.target.value)} style={{fontSize:22,textAlign:"center",fontWeight:700}}/>
          <div className="confirm-box">
            <CBR lbl="လူဦးရေ" val={`${members.length} ဦး`}/><CBR lbl="ကွက်" val={`${TOTAL_SLOTS_CAP}`} accent="#c9a0ff"/>
            <CBR lbl="တစ်ကွက်/လ" val={mmk(amt)}/><div className="cb-div"/>
            <CBR lbl="Prize Pool" val={mmk(pp)} accent="#f0c840" big/><div className="cb-note">{mmk(amt)} × {TOTAL_SLOTS_CAP} = {mmk(pp)}</div>
            <div className="cb-div"/>
            <div style={{maxHeight:150,overflowY:"auto",display:"flex",flexDirection:"column",gap:3}}>
              {members.map((m,i)=><div key={m.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#666",fontFamily:"'JetBrains Mono',monospace",alignItems:"center"}}>
                <span>{m.name}</span><span style={{display:"flex",alignItems:"center",gap:5}}>{m.slots===2&&<span className="sbdg">×2</span>}<span style={{color:"#c9a0ff"}}>{mmk((parseFloat(amt)||0)*m.slots)}/လ</span></span>
              </div>)}
            </div>
          </div>
          <div className="wiz-nav"><button className="sec-btn" onClick={()=>setStep(2)}>← ပြန်</button><button className="cta-full" style={{flex:1}} onClick={finish}>✓ ကလပ်ဖွင့်မည်</button></div>
        </div>}
      </div>
    </div>
  );
}

// ─── Shared UI components ────────────────────────────────────────────────────
function SC({lbl,val,accent}){return <div className="sc-card"><div className="sc-lbl">{lbl}</div><div className="sc-val" style={{color:accent||"#c9a0ff"}}>{val}</div></div>;}
function RSC3({lbl,val}){return <div className="rsc3-i"><div className="rsc3-l">{lbl}</div><div className="rsc3-v">{val}</div></div>;}
function LStat({lbl,val,cls}){return <div className="lg-s-item"><div className="lg-s-lbl">{lbl}</div><div className={`lg-s-val ${cls}`}>{val}</div></div>;}
function CBR({lbl,val,accent,big}){return <div className="cbr"><span>{lbl}</span><span style={{color:accent||"#f0eeff",fontWeight:big?700:500,fontSize:big?15:12,fontFamily:"'JetBrains Mono',monospace"}}>{val}</span></div>;}
function AuctionInput({roundId,basePrice,members,onSave,notify,prizePool,totalSlots}){
  const [bid,setBid]=useState("");const [winner,setWinner]=useState("");
  const bv=parseFloat(bid)||0;const valid=bv>=basePrice&&bv>0;const wg=valid?prizePool-bv:0;const ps=wg?Math.round(wg/totalSlots):0;
  return <div className="auc-card">
    <div className="auc-row2"><div><div className="ac-lbl">ကြမ်းခင်းစျေး</div><div className="ac-val">{mmk(basePrice)}</div></div><div><div className="ac-lbl">အနည်းဆုံးတိုး</div><div className="ac-val">5,000 ks</div></div></div>
    <label className="lbl" style={{marginTop:12}}>အနိုင်ဈေး (ks)</label>
    <input className="inp" type="number" step={5000} min={basePrice} placeholder={String(basePrice)} value={bid} onChange={e=>setBid(e.target.value)}/>
    {!valid&&bv>0&&<div className="err-msg">ကြမ်းခင်းစျေး {mmk(basePrice)} ကျော်ရမည်</div>}
    {valid&&<div className="live-calc">
      <div className="lc-r"><span>Prize Pool</span><span>{mmk(prizePool)}</span></div>
      <div className="lc-r red"><span>− Winning Bid</span><span>− {mmk(bv)}</span></div>
      <div className="lc-div"/>
      <div className="lc-r purple bold"><span>အနိုင်ရသူ ရငွေ</span><span>{mmk(wg)}</span></div>
      <div className="lc-r green bold"><span>တစ်ဦးထည့်ရမည်</span><span>{mmk(ps)}</span></div>
    </div>}
    <label className="lbl" style={{marginTop:12}}>ဆုရသူ</label>
    <WinnerSelect members={members} value={winner} onChange={setWinner}/>
    <button className="cta-full" style={{marginTop:12}} disabled={!valid||!winner} onClick={()=>{if(!winner)return notify("ဆုရသူရွေးပါ",false);onSave(roundId,bv,winner);}}>✓ Auction သိမ်းမည်</button>
  </div>;
}
function WinnerSelect({members,value,onChange}){return <select className="inp" value={value} onChange={e=>onChange(e.target.value)}><option value="">— ဆုရသူရွေးပါ —</option>{members.map(m=><option key={m.id} value={m.id}>{m.name}{m.slots===2?" (×2)":""}</option>)}</select>;}
function ModalShell({children,onClose}){return <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="modal">{children}</div></div>;}
function EditAuctionModal({roundId,basePrice,members,currentBid,currentWinner,onSave,onClose,prizePool,totalSlots}){
  const [bid,setBid]=useState(currentBid||"");const [winner,setWinner]=useState(currentWinner||"");
  const bv=parseFloat(bid)||0;const valid=bv>=basePrice;const wg=valid?prizePool-bv:0;const ps=wg?Math.round(wg/totalSlots):0;
  return <div><div className="mttl">Auction ပြင်မည်</div>
    <label className="lbl">ကြမ်းခင်းစျေး: {mmk(basePrice)}</label>
    <label className="lbl" style={{marginTop:8}}>အနိုင်ဈေး (ks)</label>
    <input className="inp" type="number" step={5000} value={bid} onChange={e=>setBid(e.target.value)} autoFocus/>
    {valid&&bv>0&&<div className="live-calc" style={{margin:"8px 0"}}><div className="lc-r purple bold"><span>ဆုရသူ ရမည်</span><span>{mmk(wg)}</span></div><div className="lc-r green bold"><span>တစ်ကွက်ပေးရမည်</span><span>{mmk(ps)}</span></div></div>}
    <label className="lbl" style={{marginTop:8}}>ဆုရသူ</label><WinnerSelect members={members} value={winner} onChange={setWinner}/>
    <div className="mactions"><button className="sec-btn" onClick={onClose}>မလုပ်တော့</button><button className="cta-full" style={{marginTop:0}} onClick={()=>{onSave(roundId,bv,winner);onClose();}}>သိမ်းမည်</button></div>
  </div>;
}
function PayModal({memberId,memberName,roundId,slots,paidSlots,defaultAmt,onSave,onClose}){
  const unpaid=[1,2].slice(0,slots).filter(s=>!paidSlots.includes(s));
  const [si,setSi]=useState(String(unpaid[0]||1));const [amt,setAmt]=useState(String(defaultAmt||""));const [note,setNote]=useState("");
  return <div><div className="mttl">ငွေပေးချေမှတ်တမ်း</div>
    <div style={{fontSize:13,color:"#888",marginBottom:10,fontFamily:"'JetBrains Mono',monospace"}}>{memberName}</div>
    {slots===2&&unpaid.length>1&&<><label className="lbl">Slot</label><div className="slot-tog" style={{gap:8,marginBottom:10}}>{unpaid.map(s=><button key={s} className={`st ${si===String(s)?"st-a":""}`} style={{flex:1,padding:10}} onClick={()=>setSi(String(s))}>Slot {s}</button>)}</div></>}
    <label className="lbl">ငွေပမာဏ (ks)</label>
    <input className="inp" type="number" value={amt} onChange={e=>setAmt(e.target.value)} autoFocus/>
    <label className="lbl" style={{marginTop:10}}>မှတ်ချက်</label>
    <input className="inp" placeholder="ငွေသား / လွှဲပို့..." value={note} onChange={e=>setNote(e.target.value)}/>
    <div className="mactions"><button className="sec-btn" onClick={onClose}>မလုပ်တော့</button><button className="cta-full" style={{marginTop:0}} onClick={()=>{onSave(memberId,roundId,parseInt(si),amt,note);onClose();}}>သိမ်းမည်</button></div>
  </div>;
}
function ConfirmModal({msg,onOk,onClose}){return <div><div className="mttl">အတည်ပြုမည်</div>
  <div style={{fontSize:12,color:"#aaa",marginBottom:18,lineHeight:1.8,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"pre-line"}}>{msg}</div>
  <div className="mactions"><button className="sec-btn" onClick={onClose}>မလုပ်တော့</button><button className="cta-full" style={{marginTop:0,background:"#5a1010"}} onClick={onOk}>အတည်ပြု</button></div>
</div>;}
