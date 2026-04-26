// ─── Shared constants & helpers ───────────────────────────────────────────────

export const TOTAL_SLOTS_CAP = 20;

export const BASE_PRICES = {
  1:0, 2:380000, 3:360000, 4:340000, 5:320000, 6:300000,
  7:280000, 8:260000, 9:240000, 10:220000, 11:200000, 12:180000,
  13:160000, 14:140000, 15:120000, 16:100000, 17:80000,
  18:60000, 19:40000, 20:0
};

export function calcRound(rn, prizePool, totalSlots, winningBid) {
  const isDai = rn === 1 || rn === 20;
  if (isDai) return { isDai: true, winnerGets: prizePool, payPerSlot: Math.round(prizePool / totalSlots), saving: 0 };
  if (!winningBid) return null;
  const winnerGets = prizePool - winningBid;
  const payPerSlot = Math.round(winnerGets / totalSlots);
  return { isDai: false, winnerGets, payPerSlot, saving: Math.round(prizePool / totalSlots) - payPerSlot };
}

export const mmk = n =>
  (n == null || isNaN(n)) ? "—" : new Intl.NumberFormat("en-US").format(Math.round(n)) + " ks";

export const ini = n =>
  n.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);

export const PAL = [
  "#e63946","#e76f51","#f4a261","#e9c46a","#2a9d8f","#457b9d","#6a4c93",
  "#c77dff","#f72585","#4cc9f0","#06d6a0","#ffd166","#ef476f","#118ab2",
  "#8338ec","#fb5607","#ff006e","#3a86ff","#52b788","#f9c74f"
];
export const mc = i => PAL[i % PAL.length];
export const tSlots = ms => ms.reduce((s, m) => s + m.slots, 0);

let _uid = Date.now();
export const uid = () => String(++_uid);

// Shared CSS string
export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,300&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.page{padding:14px 14px 90px;max-width:520px;margin:0 auto;}
.section{margin-bottom:20px;}
.sec-lbl{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#3a3060;font-family:'JetBrains Mono',monospace;margin-bottom:10px;}
.spinner{width:34px;height:34px;border:3px solid #1e1a2e;border-top-color:#c9a0ff;border-radius:50%;animation:spin 0.8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}

/* Topbars */
.main-top{background:#0c0a18;border-bottom:1px solid #1e1a2e;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
.mt-title{font-size:19px;font-weight:700;color:#c9a0ff;}
.mt-sub{font-size:10px;color:#444;font-family:'JetBrains Mono',monospace;margin-top:2px;}
.mt-pool{font-size:16px;font-weight:700;color:#c9a0ff;text-align:right;font-family:'JetBrains Mono',monospace;}
.mt-pool-lbl{font-size:8px;color:#333;text-align:right;text-transform:uppercase;letter-spacing:2px;font-family:'JetBrains Mono',monospace;}
.rnd-bar{background:#0c0a18;border-bottom:1px solid #1e1a2e;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
.back-btn{background:none;border:1px solid #1e1a2e;color:#888;font-family:'JetBrains Mono',monospace;font-size:11px;padding:6px 12px;border-radius:8px;cursor:pointer;transition:all 0.2s;}
.back-btn:hover{border-color:#c9a0ff;color:#c9a0ff;}
.rnd-bar-title{font-size:15px;font-weight:700;color:#f0eeff;display:flex;align-items:center;gap:7px;}

/* Stat cards */
.stat3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;}
.sc-card{background:#0e0c18;border:1px solid #1e1a2e;border-radius:10px;padding:11px;text-align:center;}
.sc-lbl{font-size:9px;color:#444;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;}
.sc-val{font-size:17px;font-weight:700;font-style:italic;}

/* Rounds grid */
.rounds-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;}
.rg{border-radius:10px;padding:9px 6px;cursor:pointer;transition:all 0.15s;border:1px solid #1e1a2e;min-height:78px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:2px;text-align:center;position:relative;}
.rg:hover{transform:scale(1.05);}
.rg-done{background:#0a120a;border-color:#1a3a1a;}
.rg-open{background:#100c1e;border-color:#3a2060;box-shadow:0 0 8px rgba(201,160,255,0.12);}
.rg-dai{background:#140a1e;border-color:#4a2080;}
.rg-next{background:#0c0a14;border-color:#2a2040;border-style:dashed;}
.rg-future{background:#080810;border-color:#111018;opacity:0.4;}
.rg-top{display:flex;align-items:center;justify-content:center;gap:4px;width:100%;}
.rg-n{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#444;}
.rg-done .rg-n,.rg-open .rg-n,.rg-dai .rg-n{color:#c9a0ff;}
.rg-done-tick{font-size:10px;color:#4caf50;}
.rg-live-dot{width:6px;height:6px;border-radius:50%;background:#c9a0ff;flex-shrink:0;animation:pulse 1.5s infinite;}
.rg-base{font-size:8px;color:#444;font-family:'JetBrains Mono',monospace;}
.rg-dai-txt{font-size:10px;color:#c9a0ff;font-weight:700;}
.rg-per{font-size:9px;color:#4caf50;font-family:'JetBrains Mono',monospace;}
.rg-prog-wrap{width:100%;margin-top:2px;}
.rg-prog-bar{height:2px;background:#1e1a2e;border-radius:1px;}
.rg-prog-fill{height:100%;background:#c9a0ff;border-radius:1px;transition:width 0.4s;}
.rg-prog-txt{font-size:8px;color:#444;font-family:'JetBrains Mono',monospace;margin-top:1px;}
.rg-wnr{font-size:8px;color:#c9a0ff;font-family:'JetBrains Mono',monospace;}

/* Member live table */
.mlt{background:#0e0c14;border:1px solid #1e1a2e;border-radius:12px;overflow:hidden;}
.mlt-hdr{display:grid;grid-template-columns:1fr 40px 50px 90px 44px;gap:4px;padding:8px 12px;background:#0a0818;border-bottom:1px solid #1e1a2e;font-size:9px;color:#3a3060;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:1px;}
.mlt-row{display:grid;grid-template-columns:1fr 40px 50px 90px 44px;gap:4px;padding:8px 12px;border-bottom:1px solid #0e0c14;align-items:center;transition:background 0.2s;}
.mltr-p{background:#0a120a;}
.mltr-x{background:#0f0808;}
.mlt-av{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#080810;flex-shrink:0;font-family:'JetBrains Mono',monospace;}
.mlt-nm{font-size:12px;font-weight:600;color:#f0eeff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mlt-won{font-size:8px;color:#c9a0ff;font-family:'JetBrains Mono',monospace;}
.mlt-foot{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:#0a0818;border-top:1px solid #1e1a2e;}
.st-paid{font-size:10px;color:#4caf50;font-weight:700;}
.st-pend{font-size:10px;color:#e74c3c;}

/* Round summary */
.rsc{background:linear-gradient(135deg,#110d22,#08080e);border:1px solid #2a1e50;border-radius:16px;padding:18px;margin-bottom:18px;}
.rsc-tag{font-size:9px;color:#5a3a80;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:2px;margin-bottom:7px;}
.rsc-big{font-size:36px;font-weight:300;color:#c9a0ff;font-style:italic;margin:4px 0;}
.rsc-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:10px;}
.rsc3-i{background:#0e0a1a;border:1px solid #1e1a2e;border-radius:8px;padding:8px;text-align:center;}
.rsc3-l{font-size:8px;color:#444;font-family:'JetBrains Mono',monospace;margin-bottom:2px;text-transform:uppercase;letter-spacing:1px;}
.rsc3-v{font-size:12px;font-weight:700;color:#c9a0ff;font-style:italic;}
.rsc-prog{margin-top:12px;border-top:1px solid #1e1a2e;padding-top:11px;}
.rsc-pr{display:flex;justify-content:space-between;font-size:10px;color:#555;font-family:'JetBrains Mono',monospace;margin-bottom:5px;}
.prog-bar{height:4px;background:#1e1a2e;border-radius:2px;}
.prog-fill{height:100%;background:#c9a0ff;border-radius:2px;transition:width 0.5s;}
.rsc-noauction{text-align:center;padding:16px;color:#3a3060;font-family:'JetBrains Mono',monospace;font-size:12px;}

/* Calc display */
.calc-display{background:#0a0814;border:1px solid #1e1a2e;border-radius:12px;padding:14px;margin:8px 0;}
.cd-eq{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;}
.cd-n{font-size:15px;font-weight:700;color:#f0eeff;font-family:'JetBrains Mono',monospace;}
.cd-n.red{color:#e74c3c;}.cd-n.purple{color:#c9a0ff;}.cd-n.green{color:#4caf50;}
.cd-op{font-size:16px;color:#333;}
.cd-lbl{display:flex;align-items:center;justify-content:center;gap:10px;font-size:8px;color:#3a3060;font-family:'JetBrains Mono',monospace;margin-top:2px;flex-wrap:wrap;text-align:center;}
.cd-div{height:1px;background:#1e1a2e;margin:10px 0;}
.cd-saving{font-size:10px;color:#4caf50;font-family:'JetBrains Mono',monospace;margin-top:6px;text-align:right;}
.cd-winner{display:flex;align-items:center;gap:8px;background:#160e28;border:1px solid #3a2060;border-radius:8px;padding:9px 12px;margin-top:8px;font-size:12px;flex-wrap:wrap;}
.cd-w-amt{font-family:'JetBrains Mono',monospace;font-weight:700;color:#c9a0ff;margin-left:auto;}

/* Live payment cards */
.lg-summary{display:flex;align-items:center;background:#0e0c14;border:1px solid #1e1a2e;border-radius:10px;padding:11px 12px;margin-bottom:7px;}
.lg-s-item{flex:1;text-align:center;}
.lg-s-lbl{font-size:8px;color:#444;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;}
.lg-s-val{font-size:14px;font-weight:700;font-style:italic;}
.lg-s-val.green{color:#4caf50;}.lg-s-val.red{color:#e74c3c;}.lg-s-val.purple{color:#c9a0ff;}
.lg-s-div{width:1px;background:#1e1a2e;align-self:stretch;flex-shrink:0;}
.lg-card{display:flex;align-items:flex-start;justify-content:space-between;background:#0e0c14;border:1px solid #1e1a2e;border-radius:10px;padding:10px 12px;gap:8px;transition:all 0.2s;}
.lgc-paid{border-left:3px solid #4caf50;background:#0a120a;}
.lgc-pend{border-left:3px solid #e74c3c;}
.lgc-wait{border-left:3px solid #1e1a2e;}
.lgc-win{border-color:#3a2060;}
.lgc-left{display:flex;align-items:flex-start;gap:8px;flex:1;min-width:0;}
.lgc-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#080810;flex-shrink:0;font-family:'JetBrains Mono',monospace;}
.lgc-body{flex:1;min-width:0;}
.lgc-name{font-size:13px;font-weight:600;color:#f0eeff;display:flex;align-items:center;gap:4px;flex-wrap:wrap;}
.lgc-slots{margin-top:4px;display:flex;flex-direction:column;gap:2px;}
.lgc-sr{display:flex;align-items:center;gap:5px;font-size:10px;}
.lgc-sl{color:#333;font-family:'JetBrains Mono',monospace;min-width:34px;}
.lgc-sp{color:#c9a0ff;font-family:'JetBrains Mono',monospace;display:flex;align-items:center;gap:4px;}
.lgc-sw{color:#2a2838;font-family:'JetBrains Mono',monospace;font-style:italic;}
.lgc-pr{display:flex;align-items:center;gap:7px;margin-top:2px;flex-wrap:wrap;}
.lgc-pa{font-size:12px;color:#c9a0ff;font-family:'JetBrains Mono',monospace;font-weight:600;}
.lgc-pn{font-size:10px;color:#444;font-family:'JetBrains Mono',monospace;}
.lgc-exp{font-size:10px;color:#2a2838;font-family:'JetBrains Mono',monospace;margin-top:2px;}
.lgc-right{flex-shrink:0;}
.lgc-chk{font-size:17px;color:#4caf50;}

/* Auction */
.auc-card{background:#0e0c14;border:1px solid #1e1a2e;border-radius:12px;padding:13px;}
.auc-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px;}
.ac-lbl{font-size:9px;color:#444;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;}
.ac-val{font-size:14px;font-weight:700;color:#c9a0ff;font-style:italic;}
.live-calc{background:#06050c;border:1px solid #1e1a2e;border-radius:9px;padding:10px;margin-top:8px;}
.lc-r{display:flex;justify-content:space-between;font-size:11px;color:#555;padding:3px 0;font-family:'JetBrains Mono',monospace;}
.lc-r.red{color:#e74c3c;}.lc-r.purple{color:#c9a0ff;}.lc-r.green{color:#4caf50;}.lc-r.bold{font-size:13px;font-weight:700;}
.lc-div{height:1px;background:#1e1a2e;margin:5px 0;}
.err-msg{font-size:10px;color:#e74c3c;font-family:'JetBrains Mono',monospace;margin-top:4px;}

/* Buttons */
.pay-btn{background:#c9a0ff;border:none;color:#08070a;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:5px 10px;border-radius:7px;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
.pay-btn:hover{background:#e0c0ff;}
.tiny-del{background:none;border:none;color:#252030;cursor:pointer;font-size:9px;padding:0 2px;transition:color 0.2s;}
.tiny-del:hover{color:#e74c3c;}
.cta-full{width:100%;background:#c9a0ff;border:none;color:#080810;font-family:'Noto Serif',Georgia,serif;font-size:14px;font-weight:700;padding:13px;border-radius:10px;cursor:pointer;transition:all 0.2s;text-align:center;display:block;}
.cta-full:hover{background:#e0c0ff;}
.cta-full:disabled{opacity:0.35;cursor:not-allowed;}
.close-hint{background:#0a0810;border:1px dashed #1e1a2e;border-radius:10px;padding:12px;text-align:center;color:#3a3060;font-family:'JetBrains Mono',monospace;font-size:11px;}
.closed-banner{background:#0a120a;border:1px solid #1a3a1a;border-radius:10px;padding:12px;text-align:center;color:#4caf50;font-size:13px;}
.open-cta{text-align:center;padding:16px 0;}
.sec-btn{background:#120e20;border:1px solid #2e2050;color:#8060b0;font-family:'Noto Serif',Georgia,serif;font-size:12px;padding:7px 14px;border-radius:8px;cursor:pointer;transition:all 0.2s;}
.sec-btn:hover{border-color:#c9a0ff;color:#c9a0ff;}
.reset-btn{background:none;border:1px solid #1e1a2e;color:#2a2838;font-family:'JetBrains Mono',monospace;font-size:10px;padding:7px 18px;border-radius:8px;cursor:pointer;transition:all 0.2s;}
.reset-btn:hover{border-color:#5a1010;color:#e74c3c;}

/* Inputs */
.inp{width:100%;background:#06050a;border:1px solid #1e1a2e;border-radius:8px;font-family:'Noto Serif',Georgia,serif;font-size:14px;color:#f0eeff;padding:10px 12px;outline:none;transition:border-color 0.2s;display:block;}
.inp:focus{border-color:#c9a0ff;}
select.inp{cursor:pointer;}
.lbl{font-size:10px;color:#444;font-family:'JetBrains Mono',monospace;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;}

/* Badges */
.dai-badge{background:#2a1a4a;color:#c9a0ff;border:1px solid #5a3080;font-size:9px;font-family:'JetBrains Mono',monospace;padding:1px 7px;border-radius:4px;vertical-align:middle;}
.sbdg{background:#2a1a3a;color:#c9a0ff;border:1px solid #4a2060;font-size:9px;font-family:'JetBrains Mono',monospace;padding:1px 5px;border-radius:4px;vertical-align:middle;}
.win-tag{background:#2a3a1a;color:#4caf50;border:1px solid #3a5a2a;font-size:9px;font-family:'JetBrains Mono',monospace;padding:1px 5px;border-radius:4px;}

/* Wizard */
.wiz-hdr{background:#0c0a18;border-bottom:1px solid #1e1a2e;padding:15px 16px 11px;text-align:center;}
.wiz-title{font-size:20px;font-weight:700;color:#c9a0ff;margin-bottom:12px;}
.wiz-steps{display:flex;justify-content:center;gap:8px;margin-bottom:7px;}
.ws{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;border:2px solid #1e1a2e;color:#333;}
.ws-act{border-color:#c9a0ff;color:#c9a0ff;background:#160e28;}
.ws-done{border-color:#4caf50;color:#4caf50;background:#0a120a;}
.ws-idle{border-color:#1e1a2e;color:#333;}
.wiz-lbls{display:flex;justify-content:center;gap:26px;font-size:9px;color:#333;font-family:'JetBrains Mono',monospace;}
.wl-act{color:#c9a0ff;}
.wiz-card{background:#0e0c14;border:1px solid #1e1a2e;border-radius:14px;padding:20px;}
.wc-ttl{font-size:20px;font-weight:700;color:#f0eeff;font-style:italic;margin-bottom:4px;}
.wc-sub{font-size:11px;color:#555;font-family:'JetBrains Mono',monospace;margin-bottom:16px;}
.wiz-nav{display:flex;gap:10px;margin-top:16px;align-items:center;}
.num-pick{display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0;}
.np-btn{width:40px;height:40px;border-radius:50%;background:#160e28;border:1px solid #3a2060;color:#c9a0ff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
.np-val{font-size:44px;font-weight:700;color:#c9a0ff;font-style:italic;min-width:72px;text-align:center;}
.slots-cap-banner{display:flex;align-items:flex-start;gap:10px;background:#0e0a1a;border:1px solid #3a2060;border-radius:10px;padding:12px 14px;margin:14px 0 4px;}
.scb-icon{font-size:18px;flex-shrink:0;margin-top:1px;}
.scb-title{font-size:12px;font-weight:700;color:#c9a0ff;font-family:'JetBrains Mono',monospace;}
.scb-sub{font-size:10px;color:#5a3a80;font-family:'JetBrains Mono',monospace;margin-top:2px;}
.slot-meter{background:#0e0c14;border:1px solid #1e1a2e;border-radius:12px;padding:14px;margin-bottom:10px;}
.sm-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.sm-used{font-size:14px;font-weight:700;color:#f0eeff;font-family:'JetBrains Mono',monospace;}
.sm-ok{font-size:11px;color:#4caf50;font-family:'JetBrains Mono',monospace;font-weight:700;}
.sm-rem{font-size:11px;color:#f0c840;font-family:'JetBrains Mono',monospace;}
.sm-over{font-size:11px;color:#e74c3c;font-family:'JetBrains Mono',monospace;font-weight:700;}
.sm-bar{height:6px;background:#1e1a2e;border-radius:3px;margin-bottom:8px;overflow:hidden;}
.sm-fill{height:100%;border-radius:3px;transition:width 0.3s,background 0.3s;}
.sm-cells{display:flex;gap:2px;flex-wrap:wrap;}
.sm-cell{width:16px;height:10px;border-radius:2px;background:#1a1a2e;transition:background 0.2s;}
.sm-c-used{background:#c9a0ff;}
.slot-warning{background:#150e08;border:1px solid #3a2000;border-radius:8px;padding:9px 12px;font-size:11px;color:#c07030;font-family:'JetBrains Mono',monospace;margin-bottom:10px;}
.msr{display:flex;align-items:center;gap:7px;}
.msr-num{width:20px;font-size:10px;color:#444;font-family:'JetBrains Mono',monospace;text-align:right;flex-shrink:0;}
.slot-tog{display:flex;gap:4px;flex-shrink:0;}
.st{background:#0e0c14;border:1px solid #1e1a2e;color:#555;font-family:'JetBrains Mono',monospace;font-size:11px;padding:5px 9px;border-radius:6px;cursor:pointer;transition:all 0.2s;}
.st.st-a{background:#160e28;border-color:#c9a0ff;color:#c9a0ff;}
.st.st-dis{opacity:0.25;cursor:not-allowed;}
.ap-presets{display:flex;gap:6px;flex-wrap:wrap;}
.ap-p{background:#0e0c14;border:1px solid #1e1a2e;color:#555;font-family:'JetBrains Mono',monospace;font-size:10px;padding:5px 10px;border-radius:20px;cursor:pointer;transition:all 0.2s;}
.ap-p.ap-p-a{background:#160e28;border-color:#c9a0ff;color:#c9a0ff;}
.confirm-box{background:#06050a;border:1px solid #1e1a2e;border-radius:12px;padding:13px;margin:12px 0 4px;}
.cbr{display:flex;justify-content:space-between;font-size:12px;color:#888;padding:3px 0;}
.cb-div{height:1px;background:#1e1a2e;margin:7px 0;}
.cb-note{font-size:9px;color:#333;font-family:'JetBrains Mono',monospace;margin-top:3px;}

/* Modal */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:flex-end;justify-content:center;z-index:200;animation:fadeIn 0.15s ease;}
.modal{background:#0e0c14;border-radius:20px 20px 0 0;border:1px solid #1e1a2e;border-bottom:none;padding:22px 18px 44px;width:100%;max-width:500px;animation:slideUp 0.2s ease;}
.mttl{font-size:17px;font-weight:700;font-style:italic;color:#c9a0ff;margin-bottom:14px;}
.mactions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px;}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);padding:9px 20px;border-radius:100px;font-size:11px;font-family:'JetBrains Mono',monospace;z-index:999;white-space:nowrap;animation:slideUp 0.25s ease;}
.tok{background:#c9a0ff;color:#08070a;}
.terr{background:#5a1010;color:#f5e8e8;}

/* Member view extras */
.mem-topbar{background:#08070e;border-bottom:2px solid #1a1a3a;padding:13px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
.mem-title{font-size:18px;font-weight:700;color:#a0c4ff;}
.mem-sub{font-size:10px;color:#3a3a5a;font-family:'JetBrains Mono',monospace;margin-top:2px;}
.view-only-banner{background:#0d0d20;border-bottom:1px solid #1a1a3a;padding:7px 16px;text-align:center;font-size:11px;color:#3a3a6a;font-family:'JetBrains Mono',monospace;letter-spacing:1px;}
.live-badge{display:inline-flex;align-items:center;gap:5px;background:#0a120a;border:1px solid #1a3a1a;color:#4caf50;font-size:9px;font-family:'JetBrains Mono',monospace;padding:3px 10px;border-radius:100px;}
.live-dot{width:5px;height:5px;border-radius:50%;background:#4caf50;animation:pulse 1.5s infinite;}

@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(26px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
`;
