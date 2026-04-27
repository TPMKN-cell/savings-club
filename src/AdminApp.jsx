import { useState, useEffect, useRef } from "react";

// ─── Storage ──────────────────────────────────────────────────────────────────
const STORE_KEYS = { club1: "hso_club1_v2", club2: "hso_club2_v2" };
async function dbRead(k) { try { const r=localStorage.getItem(k); if(r) return JSON.parse(r); } catch {} return null; }
async function dbWrite(k,d) { try { localStorage.setItem(k,JSON.stringify(d)); } catch {} }
async function dbClear(k) { try { localStorage.removeItem(k); } catch {} }

let _uid = Date.now();
const uid = () => String(++_uid);

// ─── Club Configs ─────────────────────────────────────────────────────────────
const CLUBS = {
  club1: {
    id:"club1", name:"၃ သိန်း", nameEn:"300K", totalSlots:20, totalRounds:20,
    amountPerSlot:300000, minIncrement:5000, daiRound:1, lastRound:20,
    accent:"#a78bfa", accentDark:"#7c3aed", accentGlow:"rgba(167,139,250,0.15)",
    basePrices:{1:0,2:380000,3:360000,4:340000,5:320000,6:300000,7:280000,8:260000,9:240000,10:220000,11:200000,12:180000,13:160000,14:140000,15:120000,16:100000,17:80000,18:60000,19:40000,20:0}
  },
  club2: {
    id:"club2", name:"၅ သိန်း", nameEn:"500K", totalSlots:25, totalRounds:25,
    amountPerSlot:500000, minIncrement:10000, daiRound:1, lastRound:25,
    accent:"#fbbf24", accentDark:"#d97706", accentGlow:"rgba(251,191,36,0.15)",
    basePrices:{1:0,2:820000,3:785000,4:750000,5:715000,6:680000,7:645000,8:610000,9:575000,10:540000,11:505000,12:470000,13:435000,14:400000,15:365000,16:330000,17:295000,18:260000,19:225000,20:190000,21:155000,22:120000,23:85000,24:50000,25:0}
  }
};

// ─── Math ─────────────────────────────────────────────────────────────────────
function calcRound(rn, cfg, winningBid) {
  const pp = cfg.amountPerSlot * cfg.totalSlots;
  const isDai = rn === cfg.daiRound;
  const isLast = rn === cfg.lastRound;
  if (isDai||isLast) return { isDai, isLast, winnerGets:pp, payPerSlot:cfg.amountPerSlot, saving:0 };
  if (!winningBid) return null;
  const winnerGets = pp - winningBid;
  const payPerSlot = Math.round(winnerGets / cfg.totalSlots);
  return { isDai:false, isLast:false, winnerGets, payPerSlot, saving:cfg.amountPerSlot-payPerSlot };
}

const mmk  = n => (n==null||isNaN(n))?"—":new Intl.NumberFormat("en-US").format(Math.round(n))+" ks";
const ini  = n => n.trim().split(/\s+/).map(w=>w[0]).join("").toUpperCase().slice(0,2);
const PAL  = ["#f43f5e","#f97316","#eab308","#22c55e","#06b6d4","#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#84cc16","#0ea5e9","#a855f7","#ef4444","#10b981","#3b82f6","#d946ef","#64748b","#be185d","#065f46","#1d4ed8","#7c3aed","#b45309","#047857","#dc2626"];
const mc   = i => PAL[i%PAL.length];
const tSlots = ms => ms.reduce((s,m)=>s+m.slots,0);

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase,      setPhase]      = useState("splash");   // splash | select | main | round
  const [activeClub, setActiveClub] = useState(null);
  const [dbs,        setDbs]        = useState({club1:null,club2:null});
  const [loading,    setLoading]    = useState(true);
  const [activeRn,   setActiveRn]   = useState(null);
  const [modal,      setModal]      = useState(null);
  const [toast,      setToast]      = useState(null);
  const saveRef = useRef({});

  useEffect(() => {
    setTimeout(() => setPhase("select"), 2200);
    (async () => {
      const c1 = await dbRead(STORE_KEYS.club1);
      const c2 = await dbRead(STORE_KEYS.club2);
      setDbs({club1:c1,club2:c2});
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    Object.keys(dbs).forEach(k=>{
      if (!dbs[k]) return;
      clearTimeout(saveRef.current[k]);
      saveRef.current[k]=setTimeout(()=>dbWrite(STORE_KEYS[k],dbs[k]),400);
    });
  },[dbs]);

  function notify(msg,ok=true){setToast({msg,ok});setTimeout(()=>setToast(null),2600);}
  function mutate(cid,fn){setDbs(p=>{const n=JSON.parse(JSON.stringify(p));fn(n[cid]);return n;});}

  async function resetClub(cid){
    await dbClear(STORE_KEYS[cid]);
    setDbs(p=>({...p,[cid]:null}));
    setPhase("select"); setActiveRn(null); notify("ပြန်စပြီ");
  }

  function finishSetup(cid,mems){
    const d={members:mems,rounds:[],payments:[]};
    setDbs(p=>({...p,[cid]:d}));
    dbWrite(STORE_KEYS[cid],d);
    setPhase("main"); notify("ကလပ်ဖွင့်ပြီး 🎉");
  }

  function selectClub(cid){
    setActiveClub(cid);
    if (dbs[cid]) setPhase("main");
    else setPhase("setup");
  }

  const cfg = activeClub ? CLUBS[activeClub] : CLUBS.club1;
  const db  = activeClub ? dbs[activeClub] : null;
  const pp  = cfg.amountPerSlot * cfg.totalSlots;

  const members    = db?.members   || [];
  const rounds     = db?.rounds    || [];
  const payments   = db?.payments  || [];

  const memberById   = id  => members.find(m=>m.id===id);
  const roundByNum   = n   => rounds.find(r=>r.number===n);
  const slotsPaid    = (mid,rid) => payments.filter(p=>p.memberId===mid&&p.roundId===rid);
  const collRound    = rid => payments.filter(p=>p.roundId===rid).reduce((s,p)=>s+p.amount,0);
  const totalPaidBy  = mid => payments.filter(p=>p.memberId===mid).reduce((s,p)=>s+p.amount,0);
  const allPaid      = payments.reduce((s,p)=>s+p.amount,0);
  const openRound    = rounds.find(r=>!r.closed);
  const doneRounds   = rounds.filter(r=>r.closed).length;

  function openNewRound(n){
    if(openRound)return notify("ဦးစွာ ရှိပြီးသောအဝိုင်းပိတ်ပါ",false);
    mutate(activeClub,d=>d.rounds.push({id:uid(),number:n,winningBid:null,winnerId:null,closed:false}));
    notify(`Round ${n} ဖွင့်ပြီး!`);
  }
  function setAuction(roundId,bid,winnerId){
    mutate(activeClub,d=>{const r=d.rounds.find(x=>x.id===roundId);if(r){r.winningBid=bid;r.winnerId=winnerId;}});
    notify("Auction သိမ်းပြီး!");
  }
  function closeRoundFn(roundId){
    mutate(activeClub,d=>{const r=d.rounds.find(x=>x.id===roundId);if(r)r.closed=true;});
    notify("အဝိုင်းပိတ်ပြီး ✓");
  }
  function recordPayment(memberId,roundId,slotIndex,amount,note){
    const val=parseFloat(amount);
    if(!val||val<=0)return notify("ငွေပမာဏမှားသည်",false);
    if(payments.find(p=>p.memberId===memberId&&p.roundId===roundId&&p.slotIndex===slotIndex))return notify("ဤ slot ငွေပေးပြီး",false);
    mutate(activeClub,d=>d.payments.push({id:uid(),memberId,roundId,slotIndex,amount:val,note:note||"",paidAt:new Date().toISOString()}));
    notify("မှတ်တမ်းသိမ်းပြီး ✓");
  }
  function deletePayment(id){mutate(activeClub,d=>{d.payments=d.payments.filter(p=>p.id!==id);});notify("ဖျက်ပြီး");}

  // PAID ALL — mark every unpaid slot in current round
  function paidAll(roundId, calc) {
    const unpaidMembers = members.filter(m => {
      const paid = slotsPaid(m.id, roundId);
      return paid.length < m.slots;
    });
    if (unpaidMembers.length === 0) return notify("အားလုံး ပေးပြီးပြီ",false);
    mutate(activeClub, d => {
      unpaidMembers.forEach(m => {
        const paidSlots = d.payments.filter(p=>p.memberId===m.id&&p.roundId===roundId).map(p=>p.slotIn