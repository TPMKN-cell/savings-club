import { useState, useEffect } from "react";
import { dbListen } from "./firebase.js";
import { CSS, mmk, ini, mc, calcRound, BASE_PRICES, TOTAL_SLOTS_CAP } from "./shared.js";

export default function MemberApp() {
  const [db,       setDb]       = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [activeRn, setActiveRn] = useState(null);

  // Live listener — updates automatically when admin makes changes
  useEffect(() => {
    const unsub = dbListen((data) => {
      setDb(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const members   = db?.members   || [];
  const rounds    = db?.rounds    || [];
  const payments  = db?.payments  || [];
  const cfg       = db?.config    || {};
  const prizePool = cfg.amountPerSlot ? cfg.amountPerSlot * TOTAL_SLOTS_CAP : 0;
  const totalSlots= TOTAL_SLOTS_CAP;

  const memberById  = id  => members.find(m=>m.id===id);
  const roundByNum  = n   => rounds.find(r=>r.number===n);
  const slotsPaid   = (mid,rid) => payments.filter(p=>p.memberId===mid&&p.roundId===rid);
  const collRound   = rid => payments.filter(p=>p.roundId===rid).reduce((s,p)=>s+p.amount,0);
  const totalPaidBy = mid => payments.filter(p=>p.memberId===mid).reduce((s,p)=>s+p.amount,0);
  const allPaid     = payments.reduce((s,p)=>s+p.amount,0);
  const openRound   = rounds.find(r=>!r.closed);
  const doneRounds  = rounds.filter(r=>r.closed).length;

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#08070e",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14}}>
      <style>{CSS}</style>
      <div className="spinner" style={{borderTopColor:"#a0c4ff",borderColor:"#1a1a3a"}}/>
      <div style={{fontSize:12,color:"#3a3a5a",fontFamily:"'JetBrains Mono',monospace"}}>ခေါ်နေသည်...</div>
    </div>
  );

  if (!db) return (
    <div style={{minHeight:"100vh",background:"#08070e",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,fontFamily:"'Noto Serif',serif"}}>
      <style>{CSS}</style>
      <div style={{fontSize:32}}>📋</div>
      <div style={{color:"#a0c4ff",fontSize:16,fontWeight:700}}>ဈေးကြမ်း Savings Club</div>
      <div style={{color:"#3a3a5a",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>ဒိုင်မှ ကလပ်ဖွင့်ရန် စောင့်ဆိုင်းပါ</div>
    </div>
  );

  const activeR  = activeRn ? roundByNum(activeRn) : null;
  const isDaiRn  = activeRn===1||activeRn===20;
  const calcA    = activeR ? calcRound(activeRn, prizePool, totalSlots, activeR.winningBid) : null;

  return (
    <div style={{minHeight:"100vh",background:"#06060e",color:"#e8e4f8",fontFamily:"'Noto Serif',Georgia,serif"}}>
      <style>{CSS}</style>

      {/* Member topbar — NO admin button */}
      <header className="mem-topbar">
        <div>
          <div className="mem-title">ဈေးကြမ်း Club</div>
          <div className="mem-sub">{members.length}ဦး · {TOTAL_SLOTS_CAP}ကွက် · Prize Pool {mmk(prizePool)}</div>
        </div>
        <div className="live-badge">
          <div className="live-dot"/>
          LIVE
        </div>
      </header>

      {/* View only banner */}
      <div className="view-only-banner">👁 View Only — ကြည့်ရုံသာ</div>

      <div className="page">
        {/* Stats */}
        <div className="stat3">
          <SC label="Prize Pool"  val={mmk(prizePool)} color="#a0c4ff"/>
          <SC label="ပြီးအဝိုင်း" val={`${doneRounds}/20`} color="#4caf50"/>
          <SC label="ဖွင့်ဆဲ"    val={openRound?`R${openRound.number}`:"—"} color="#f0c840"/>
        </div>

        {/* Round grid */}
        <div className="section">
          <div className="sec-lbl" style={{color:"#2a2a5a"}}>အဝိုင်းရွေးပါ — tap to view</div>
          <div className="rounds-grid">
            {Array.from({length:20},(_,i)=>i+1).map(n=>{
              const r     = roundByNum(n);
              const isDai = n===1||n===20;
              const calc  = r ? calcRound(n,prizePool,totalSlots,r.winningBid) : null;
              const paidN = r ? members.filter(m=>slotsPaid(m.id,r.id).length>=m.slots).length : 0;
              const wnr   = r?.winnerId ? memberById(r.winnerId) : null;
              const st    = r?.closed?"done":r?"open":isDai?"dai":"future";
              const isAct = activeRn===n;
              return (
                <div key={n} className={`rg rg-${st}`}
                  style={isAct?{outline:"2px solid #a0c4ff",outlineOffset:1}:{}}
                  onClick={()=>setActiveRn(activeRn===n?null:n)}>
                  <div className="rg-top">
                    <span className="rg-n">R{n}</span>
                    {st==="done"&&<span className="rg-done-tick">✓</span>}
                    {st==="open"&&<span className="rg-live-dot"/>}
                  </div>
                  {isDai?<div className="rg-dai-txt">ဒိုင်</div>:<div className="rg-base">{mmk(BASE_PRICES[n])}</div>}
                  {r&&calc&&<div className="rg-per">{mmk(calc.payPerSlot)}</div>}
                  {r&&<div className="rg-prog-wrap">
                    <div className="rg-prog-bar"><div className="rg-prog-fill" style={{width:`${members.length?(paidN/members.length)*100:0}%`}}/></div>
                    <div className="rg-prog-txt">{paidN}/{members.length}</div>
                  </div>}
                  {wnr&&<div className="rg-wnr">🏆{wnr.name.split(" ")[0]}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected round detail */}
        {activeRn && (
          <div className="section">
            <div className="sec-lbl" style={{color:"#2a2a5a"}}>Round {activeRn} — အသေးစိတ်</div>

            <div style={{background:"#0c0c1e",border:"1px solid #1a1a3a",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{fontSize:17,fontWeight:700,color:"#e8e4f8",display:"flex",alignItems:"center",gap:8}}>
                    Round {activeRn} {isDaiRn&&<span className="dai-badge">ဒိုင်</span>}
                  </div>
                  {!isDaiRn&&<div style={{fontSize:10,color:"#3a3a5a",fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>ကြမ်းခင်းစျေး: {mmk(BASE_PRICES[activeRn])}</div>}
                </div>
                {activeR?.closed&&<div style={{fontSize:9,padding:"2px 9px",borderRadius:100,background:"#0a150a",color:"#4caf50",border:"1px solid #1a4a1a",fontFamily:"'JetBrains Mono',monospace"}}>✓ ပိတ်ပြီ</div>}
                {activeR&&!activeR.closed&&<div style={{fontSize:9,padding:"2px 9px",borderRadius:100,background:"#0a0a1a",color:"#a0c4ff",border:"1px solid #2a2060",fontFamily:"'JetBrains Mono',monospace"}}>▶ ဖွင့်ဆဲ</div>}
              </div>

              {activeR && calcA ? (
                isDaiRn ? (
                  <div style={{background:"#080814",border:"1px solid #14142a",borderRadius:10,padding:12,display:"flex",flexDirection:"column",gap:7}}>
                    <CRow lbl="Prize Pool" val={mmk(prizePool)} vc="#a0c4ff"/>
                    <CRow lbl="တစ်ကွက်ပေးရမည်" val={mmk(calcA.payPerSlot)} vc="#f0c840"/>
                    <CRow lbl="ဒိုင် ရမည်" val={mmk(prizePool)} vc="#a0c4ff"/>
                  </div>
                ) : activeR.winningBid ? (
                  <div className="calc-display">
                    <div className="cd-eq">
                      <span className="cd-n">{mmk(prizePool)}</span>
                      <span className="cd-op">−</span>
                      <span className="cd-n red">{mmk(activeR.winningBid)}</span>
                      <span className="cd-op">=</span>
                      <span className="cd-n purple">{mmk(calcA.winnerGets)}</span>
                    </div>
                    <div className="cd-lbl"><span>Prize Pool</span><span/><span>Winning Bid</span><span/><span>ဆုရသူ ရငွေ</span></div>
                    <div className="cd-div"/>
                    <div className="cd-eq">
                      <span className="cd-n purple">{mmk(calcA.winnerGets)}</span>
                      <span className="cd-op">÷</span>
                      <span className="cd-n">{totalSlots}</span>
                      <span className="cd-op">=</span>
                      <span className="cd-n green">{mmk(calcA.payPerSlot)}</span>
                    </div>
                    <div className="cd-lbl"><span>ဆုရသူ ရငွေ</span><span/><span>ကွက်</span><span/><span>တစ်ဦးထည့်ရမည့်ပမာဏ</span></div>
                    {calcA.saving>0&&<div className="cd-saving">တစ်ကွက် {mmk(calcA.saving)} သက်သာ</div>}
                    {activeR.winnerId&&<div className="cd-winner">
                      <span>🏆 ဆုရသူ:</span>
                      <strong>{memberById(activeR.winnerId)?.name}</strong>
                      <span className="cd-w-amt">{mmk(calcA.winnerGets)}</span>
                    </div>}
                  </div>
                ) : (
                  <div style={{textAlign:"center",padding:14,color:"#3a3a6a",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>
                    🔨 Auction ရလဒ်မရသေး
                  </div>
                )
              ) : !activeR ? (
                <div style={{textAlign:"center",padding:14,color:"#2a2a5a",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>ဒိုင်မှ ဤအဝိုင်းမဖွင့်ရသေး</div>
              ) : null}
            </div>

            {/* Payment status table — read only */}
            {activeR && (
              <div style={{background:"#0c0c1a",border:"1px solid #1a1a3a",borderRadius:12,overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"28px 1fr 90px 80px",gap:4,padding:"8px 12px",background:"#08081a",borderBottom:"1px solid #1a1a3a",fontSize:9,color:"#3a3a5a",fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>
                  <div>#</div><div>အမည်</div><div style={{textAlign:"right"}}>ထည့်ရမည်</div><div style={{textAlign:"center"}}>အခြေနေ</div>
                </div>
                {members.map((m,i)=>{
                  const mPmts  = slotsPaid(m.id,activeR.id);
                  const full   = mPmts.length>=m.slots;
                  const isWin  = activeR.winnerId===m.id;
                  const expAmt = calcA ? calcA.payPerSlot*m.slots : null;
                  const paidAmt= mPmts.reduce((s,p)=>s+p.amount,0);
                  return (
                    <div key={m.id} style={{display:"grid",gridTemplateColumns:"28px 1fr 90px 80px",gap:4,padding:"9px 12px",borderBottom:"1px solid #0c0c1a",alignItems:"center",background:full?"#080f08":undefined}}>
                      <div style={{fontSize:10,color:"#3a3a5a",fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}>{i+1}</div>
                      <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                        <div style={{width:24,height:24,borderRadius:"50%",background:mc(i),display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#06060e",flexShrink:0,fontFamily:"'JetBrains Mono',monospace"}}>{ini(m.name)}</div>
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:"#e8e4f8",display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                            {m.name}
                            {m.slots===2&&<span className="sbdg">×2</span>}
                            {isWin&&<span className="win-tag">🏆</span>}
                          </div>
                          {m.slots===2&&<div style={{display:"flex",gap:4,marginTop:2}}>
                            {[1,2].map(si=>{
                              const sp=mPmts.find(p=>p.slotIndex===si);
                              return <span key={si} style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",padding:"1px 4px",borderRadius:3,background:sp?"#0a200a":"#1a0a0a",color:sp?"#4caf50":"#555",border:`1px solid ${sp?"#1a4a1a":"#2a1a1a"}`}}>S{si}</span>;
                            })}
                          </div>}
                        </div>
                      </div>
                      <div style={{textAlign:"right",fontSize:10,color:"#5a5a8a",fontFamily:"'JetBrains Mono',monospace"}}>{expAmt?mmk(expAmt):"—"}</div>
                      <div style={{textAlign:"center"}}>
                        {full ? (
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                            <span style={{fontSize:13,color:"#4caf50",fontWeight:700}}>✓</span>
                            <span style={{fontSize:9,color:"#4caf50",fontFamily:"'JetBrains Mono',monospace"}}>{mmk(paidAmt)}</span>
                          </div>
                        ) : <span style={{fontSize:11}}>⏳</span>}
                      </div>
                    </div>
                  );
                })}
                {calcA&&<div style={{display:"flex",justifyContent:"space-between",padding:"9px 13px",background:"#08081a",borderTop:"1px solid #1a1a3a"}}>
                  <span style={{fontSize:10,color:"#4caf50",fontFamily:"'JetBrains Mono',monospace"}}>
                    ပေးပြီး {members.filter(m=>slotsPaid(m.id,activeR.id).length>=m.slots).length}/{members.length} ဦး
                  </span>
                  <span style={{fontSize:13,color:"#a0c4ff",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>
                    {mmk(collRound(activeR.id))} / {mmk(members.reduce((s,m)=>s+calcA.payPerSlot*m.slots,0))}
                  </span>
                </div>}
              </div>
            )}
          </div>
        )}

        {/* All members overview when no round selected */}
        {!activeRn && (
          <div className="section">
            <div className="sec-lbl" style={{color:"#2a2a5a"}}>အဖွဲ့သား ၂၀ — အခြေနေ</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:7}}>
              {members.map((m,i)=>{
                const tp   = totalPaidBy(m.id);
                const rc   = new Set(payments.filter(p=>p.memberId===m.id).map(p=>p.roundId)).size;
                const won  = rounds.filter(r=>r.winnerId===m.id);
                const cp   = openRound ? slotsPaid(m.id,openRound.id) : [];
                const full = openRound ? cp.length>=m.slots : null;
                return (
                  <div key={m.id} style={{background:"#0c0c1a",border:`1px solid ${full===true?"#1a3a1a":full===false?"#3a1a1a":"#1a1a3a"}`,borderRadius:10,padding:12,display:"flex",flexDirection:"column",alignItems:"center",gap:4,textAlign:"center",position:"relative"}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:mc(i),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#06060e",fontFamily:"'JetBrains Mono',monospace"}}>{ini(m.name)}</div>
                    <div style={{fontSize:13,fontWeight:600,color:"#e8e4f8"}}>{m.name}</div>
                    {m.slots===2&&<div style={{fontSize:9,color:"#a0c4ff",fontFamily:"'JetBrains Mono',monospace"}}>×2 ကွက်</div>}
                    <div style={{fontSize:9,color:"#3a3a5a",fontFamily:"'JetBrains Mono',monospace"}}>{rc} အဝိုင်း</div>
                    <div style={{fontSize:11,color:"#a0c4ff",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{mmk(tp)}</div>
                    {won.length>0&&<div style={{fontSize:9,color:"#a0c4ff",fontFamily:"'JetBrains Mono',monospace"}}>🏆 R{won.map(r=>r.number).join(",")}</div>}
                    {full===true&&<div style={{position:"absolute",top:6,right:8,fontSize:13,color:"#4caf50",fontWeight:700}}>✓</div>}
                    {full===false&&<div style={{position:"absolute",top:6,right:8,fontSize:11}}>⏳</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SC({label, val, color}) {
  return (
    <div style={{background:"#0c0c1a",border:"1px solid #1a1a3a",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
      <div style={{fontSize:9,color:"#3a3a5a",fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{label}</div>
      <div style={{fontSize:15,fontWeight:700,fontStyle:"italic",color}}>{val}</div>
    </div>
  );
}

function CRow({lbl, val, vc}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#6a6a9a",alignItems:"center"}}>
      <span>{lbl}</span>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:vc||"#e8e4f8"}}>{val}</span>
    </div>
  );
}
