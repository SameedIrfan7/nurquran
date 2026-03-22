import React, { useState, useEffect, useRef } from 'react';
import { upsertUser, getLeaderboard, getEpisodes, subscribeToPresence, unsubscribePresence } from './supabase';
import { AdminRecorder } from './AdminRecorder';
import { CommentsSection } from './Comments';

/* ── FONTS ── */
const fl = document.createElement('link');
fl.rel = 'stylesheet';
fl.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Amiri:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap';
document.head.appendChild(fl);

/* ── SEO META ── */
document.title = 'NurQuran — Read the Complete Quran Online | نور القرآن';
const setMeta = (name, content, prop) => {
  let el = document.querySelector(prop ? `meta[property="${name}"]` : `meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); prop ? el.setAttribute('property', name) : el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
};
setMeta('description', 'Read the complete Quran online with Arabic text, English & Urdu translations, multiple qaris, progress tracking and daily recitations. Free for every human on earth.');
setMeta('keywords', 'Quran online, read Quran, Quran translation, Quran English, Quran Urdu, Islamic app, daily recitation, NurQuran');
setMeta('og:title', 'NurQuran — The Complete Quran Online', true);
setMeta('og:description', 'Read all 114 Surahs with translations in multiple languages. Track your progress. Listen to daily recitations until Ramadan 2027.', true);
setMeta('og:type', 'website', true);
setMeta('twitter:card', 'summary_large_image');
setMeta('robots', 'index, follow');

/* ── GLOBAL CSS ── */
const gs = document.createElement('style');
gs.textContent = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{
  --bg:#08100A;--bg2:#0E1812;--bg3:#152018;--bg4:#1E2E24;
  --gold:#C8A45A;--gold2:#9A7A35;--gold3:rgba(200,164,90,0.12);
  --cream:#F2EAD8;--cream2:rgba(242,234,216,0.72);--cream3:rgba(242,234,216,0.38);
  --border:rgba(200,164,90,0.16);--border2:rgba(200,164,90,0.3);
  --red:#E05252;--green:#3DB87B;--sidebar:250px;
}
body{background:var(--bg);color:var(--cream);font-family:'DM Sans',sans-serif;min-height:100vh;overflow-x:hidden}
body.light{
  --bg:#FAF6EE;--bg2:#F0E8D4;--bg3:#E4D9C0;--bg4:#C8BA9A;
  --gold:#8A6010;--gold2:#6A4808;--gold3:rgba(138,96,16,0.12);
  --cream:#0A0804;--cream2:rgba(10,8,4,0.85);--cream3:rgba(10,8,4,0.6);
  --border:rgba(138,96,16,0.3);--border2:rgba(138,96,16,0.5);
  --red:#C0392B;--green:#1A7A3A;
}
body.midnight{
  --bg:#070B18;--bg2:#0C1228;--bg3:#111A38;--bg4:#1A2550;
  --gold:#7EB8F7;--gold2:#5A96D8;--gold3:rgba(126,184,247,0.1);
  --cream:#E8F0FF;--cream2:rgba(232,240,255,0.72);--cream3:rgba(232,240,255,0.38);
  --border:rgba(126,184,247,0.16);--border2:rgba(126,184,247,0.3);
  --red:#E05252;--green:#3DB87B;
}
body.parchment{
  --bg:#2C1810;--bg2:#3A2218;--bg3:#4A2E20;--bg4:#5C3C28;
  --gold:#E8C070;--gold2:#C09040;--gold3:rgba(232,192,112,0.12);
  --cream:#FFF5E0;--cream2:rgba(255,245,224,0.78);--cream3:rgba(255,245,224,0.45);
  --border:rgba(232,192,112,0.18);--border2:rgba(232,192,112,0.35);
  --red:#E07050;--green:#70A860;
}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:2px}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
@keyframes wave1{0%,100%{height:5px}50%{height:20px}}
@keyframes wave2{0%,100%{height:12px}50%{height:4px}}
@keyframes wave3{0%,100%{height:8px}50%{height:24px}}
@keyframes wave4{0%,100%{height:16px}50%{height:5px}}
@keyframes wave5{0%,100%{height:7px}50%{height:18px}}
@keyframes flipRight{0%{transform:perspective(1200px) rotateY(0deg);z-index:10}100%{transform:perspective(1200px) rotateY(-100deg);z-index:10}}
@keyframes flipIn{0%{transform:perspective(1200px) rotateY(100deg)}100%{transform:perspective(1200px) rotateY(0deg)}}
.wv1{animation:wave1 1.1s ease-in-out infinite}
.wv2{animation:wave2 0.9s ease-in-out infinite}
.wv3{animation:wave3 1.3s ease-in-out infinite}
.wv4{animation:wave4 0.8s ease-in-out infinite}
.wv5{animation:wave5 1.0s ease-in-out infinite}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--red);animation:pulse 1.4s infinite}
.row-hover:hover{background:var(--bg3)!important;transition:background 0.15s}
.app-shell{display:flex;min-height:100vh}
.sidebar{width:var(--sidebar);flex-shrink:0;position:fixed;top:0;left:0;height:100vh;border-right:0.5px solid var(--border);background:var(--bg2);display:flex;flex-direction:column;z-index:100}
.main-area{margin-left:var(--sidebar);flex:1;display:flex;flex-direction:column}
.content-wrap{flex:1;max-width:860px;width:100%;margin:0 auto;padding:0 0 80px}
.mobile-header{display:none}
.mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(8,16,10,0.97);backdrop-filter:blur(20px);border-top:0.5px solid var(--border);z-index:100;padding:8px 0 max(8px,env(safe-area-inset-bottom))}
body.light .mobile-nav{background:rgba(247,242,232,0.97)}
body.light .mobile-header-bg{background:rgba(247,242,232,0.96)!important}
.surah-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;padding:16px}
.quran-text{font-family:'Amiri',serif;font-size:27px;line-height:2.7;text-align:right;direction:rtl;word-spacing:6px}
.ayah-num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;border:0.5px solid var(--border2);background:var(--gold3);color:var(--gold);font-size:11px;font-family:'Cormorant Garamond',serif;margin:0 3px;vertical-align:middle;cursor:pointer;transition:all 0.2s;flex-shrink:0}
.ayah-num:hover,.ayah-num.done{background:var(--gold);color:#08100A;border-color:var(--gold)}
.page-flip-enter{animation:flipIn 0.4s cubic-bezier(0.4,0,0.2,1) both}
.desktop-footer{display:block!important}
@media(max-width:900px){.desktop-footer{display:none!important}}
.ayah-word{cursor:pointer;transition:all 0.15s;border-radius:4px;padding:0 2px;display:inline}
.ayah-word:hover{background:rgba(200,164,90,0.15)}
:root{--quran-size:26px}
body{--quran-font:'Amiri',serif}
audio::-webkit-media-controls-panel{background:var(--bg3)!important}
audio{filter:invert(0);border-radius:10px}
.qari-pill{padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--cream3);cursor:pointer;font-size:12px;transition:all 0.15s;white-space:nowrap;font-family:'DM Sans',sans-serif}
.qari-pill.active{border-color:var(--gold);background:var(--gold3);color:var(--gold)}
.trans-pill{padding:4px 12px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--cream3);cursor:pointer;font-size:11px;transition:all 0.15s;font-family:'DM Sans',sans-serif}
.trans-pill.active{border-color:var(--gold);background:var(--gold3);color:var(--gold)}
@media(max-width:900px){
  .sidebar{display:none!important}
  .main-area{margin-left:0!important}
  .mobile-header{display:flex!important}
  .mobile-nav{display:flex!important}
  .surah-grid{grid-template-columns:1fr!important;gap:0!important;padding:0!important}
  .content-wrap{padding:0 0 80px!important;max-width:100%!important}
}
@media(max-width:600px){
  .quran-text{font-size:22px!important;line-height:2.6!important}
  .ayah-num{width:24px!important;height:24px!important;font-size:10px!important}
}
`;
document.head.appendChild(gs);

/* ── CONSTANTS ── */
const QARIS = [
  { id: 'ar.alafasy', name: 'Mishary Alafasy', style: 'Mujawwad' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdurrahman As-Sudais', style: 'Murattal' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', style: 'Murattal' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq Al-Minshawi', style: 'Mujawwad' },
  { id: 'ar.abdullahbasfar', name: 'Abdullah Basfar', style: 'Murattal' },
];

const TRANSLATIONS = [
  { id: 'en.sahih', name: 'English — Sahih International', lang: 'en' },
  { id: 'en.asad', name: 'English — Muhammad Asad', lang: 'en' },
  { id: 'ur.maududi', name: 'اردو — مودودی', lang: 'ur' },
  { id: 'ur.ahmedali', name: 'اردو — احمد علی', lang: 'ur' },
  { id: 'fr.hamidullah', name: 'Français — Hamidullah', lang: 'fr' },
  { id: 'de.aburida', name: 'Deutsch — Abu Rida', lang: 'de' },
  { id: 'tr.ates', name: 'Türkçe — Ateş', lang: 'tr' },
  { id: 'id.indonesian', name: 'Indonesia — Bahasa', lang: 'id' },
];

const FEATURED_SURAHS = [
  {n:1,name:"Al-Fatiha",ar:"الفاتحة",meaning:"The Opening",ayahs:7,type:"Meccan"},
  {n:2,name:"Al-Baqara",ar:"البقرة",meaning:"The Cow",ayahs:286,type:"Medinan"},
  {n:18,name:"Al-Kahf",ar:"الكهف",meaning:"The Cave",ayahs:110,type:"Meccan"},
  {n:36,name:"Ya-Sin",ar:"يس",meaning:"Ya Sin",ayahs:83,type:"Meccan"},
  {n:55,name:"Ar-Rahman",ar:"الرحمان",meaning:"The Beneficent",ayahs:78,type:"Medinan"},
  {n:67,name:"Al-Mulk",ar:"الملك",meaning:"The Sovereignty",ayahs:30,type:"Meccan"},
  {n:112,name:"Al-Ikhlas",ar:"الإخلاص",meaning:"The Sincerity",ayahs:4,type:"Meccan"},
  {n:114,name:"An-Nas",ar:"الناس",meaning:"The Mankind",ayahs:6,type:"Meccan"},
];

const ACTIVITY = ['Someone completed Al-Fatiha','A reader from Malaysia joined','New listener from Pakistan','Someone marked 10 ayahs in Ya-Sin','A reader finished Al-Ikhlas','Someone from Indonesia just joined','A reader completed their daily recitation','New reader from Bangladesh joined'];


const SCHOLARS = [
  {
    name: "Dr. Israr Ahmed",
    ar: "ڈاکٹر اسرار احمد",
    desc: "Profound Quranic tafseer and Islamic revival movement",
    tag: "Tafseer · Urdu",
    channel: "UCgRJCEWnPHYfioSlGnAE9_w",
    videos: [
      {title:"Bayan ul Quran — Al-Fatiha",id:"pgZuWBOBdFI"},
      {title:"Quran ki Zaroorat",id:"wMIQ8v6MNZU"},
      {title:"Maqsad e Hayat",id:"lyRhPPJsOlw"},
    ]
  },
  {
    name: "Mufti Menk",
    ar: "مفتي منك",
    desc: "Practical Islamic guidance for modern life",
    tag: "Motivation · English",
    channel: "UCBVMhSuBkBGnzLKSAbzQHpA",
    videos: [
      {title:"Episode 1 — Motivation",id:"WdKFpMRmBqs"},
      {title:"Getting Closer to Allah",id:"VXqMiJXXGVY"},
      {title:"Power of Dua",id:"n5KXMsU4BEI"},
    ]
  },
  {
    name: "Nouman Ali Khan",
    ar: "نعمان علي خان",
    desc: "Deep linguistic analysis of Quranic Arabic",
    tag: "Tafseer · English",
    channel: "UCITtPY3T-DM6T_M_YzCwQDQ",
    videos: [
      {title:"Why Study the Quran",id:"T3bEFRNUmaA"},
      {title:"Quran Weekly — Fatiha",id:"sEdkMxOlMhE"},
      {title:"Stories of the Prophets",id:"4UtbJNAYDjQ"},
    ]
  },
  {
    name: "Sheikh Omar Suleiman",
    ar: "الشيخ عمر سليمان",
    desc: "Spiritual depth and contemporary relevance",
    tag: "Spirituality · English",
    channel: "UCxd8RRgQ6jYMkTZn3XDqBNg",
    videos: [
      {title:"Quran 30 for 30",id:"IyJBKBRNI4k"},
      {title:"Angels in Your Presence",id:"zvRdTm8lUjg"},
      {title:"The Day of Judgement",id:"xXDsmh3Vq-E"},
    ]
  },
  {
    name: "Zakir Naik",
    ar: "ذاكر نايك",
    desc: "Comparative religion and Quran and modern science",
    tag: "Dawah · English/Urdu",
    channel: "UCQLmS_lHMaQeM4Bz-YWBEOQ",
    videos: [
      {title:"Quran and Modern Science",id:"PkuLcpS1q0o"},
      {title:"Is Quran Word of God",id:"eqHMSZHlHko"},
      {title:"Purpose of Life",id:"3BYJK4tqtMA"},
    ]
  },
  {
    name: "Yasir Qadhi",
    ar: "ياسر قاضي",
    desc: "Scholarly Seerah, Aqeedah and Islamic history",
    tag: "Seerah · English",
    channel: "UCeJFTtdEUuMKPDNKGVGdcNw",
    videos: [
      {title:"Seerah of Prophet Muhammad",id:"mBYDVJYPVoM"},
      {title:"Understanding the Quran",id:"j9fGFsv-qXQ"},
      {title:"Miracles of the Quran",id:"fGn_oQMEZsA"},
    ]
  },
];

// Global ayah number offsets per surah (for audio URLs)
const SURAH_OFFSETS=[1,8,294,494,670,790,955,1121,1196,1325,1434,1557,1668,1711,1763,1862,1990,2101,2211,2309,2444,2522,2600,2718,2782,2859,3086,3179,3267,3336,3396,3430,3460,3533,3587,3632,3715,3897,3985,4060,4145,4199,4252,4341,4400,4437,4472,4510,4539,4557,4602,4662,4711,4773,4828,4906,5002,5031,5053,5077,5090,5104,5115,5126,5144,5156,5168,5198,5250,5302,5346,5374,5402,5422,5478,5518,5549,5580,5630,5672,5701,5720,5756,5781,5803,5825,5847,5869,5888,5914,5944,5964,5979,6000,6011,6019,6027,6046,6051,6059,6067,6078,6089,6097,6100,6109,6114,6118,6125,6128,6134,6137,6142,6146,6151,6157];
const SURAHS=[{n:1,name:"Al-Fatiha",ar:"الفاتحة",meaning:"The Opening",ayahs:7,type:"Meccan"},{n:2,name:"Al-Baqara",ar:"البقرة",meaning:"The Cow",ayahs:286,type:"Medinan"},{n:3,name:"Ali 'Imran",ar:"آل عمران",meaning:"Family of Imran",ayahs:200,type:"Medinan"},{n:4,name:"An-Nisa",ar:"النساء",meaning:"The Women",ayahs:176,type:"Medinan"},{n:5,name:"Al-Ma'ida",ar:"المائدة",meaning:"The Table Spread",ayahs:120,type:"Medinan"},{n:6,name:"Al-An'am",ar:"الأنعام",meaning:"The Cattle",ayahs:165,type:"Meccan"},{n:7,name:"Al-A'raf",ar:"الأعراف",meaning:"The Heights",ayahs:206,type:"Meccan"},{n:8,name:"Al-Anfal",ar:"الأنفال",meaning:"Spoils of War",ayahs:75,type:"Medinan"},{n:9,name:"At-Tawba",ar:"التوبة",meaning:"The Repentance",ayahs:129,type:"Medinan"},{n:10,name:"Yunus",ar:"يونس",meaning:"Jonah",ayahs:109,type:"Meccan"},{n:11,name:"Hud",ar:"هود",meaning:"Hud",ayahs:123,type:"Meccan"},{n:12,name:"Yusuf",ar:"يوسف",meaning:"Joseph",ayahs:111,type:"Meccan"},{n:13,name:"Ar-Ra'd",ar:"الرعد",meaning:"The Thunder",ayahs:43,type:"Medinan"},{n:14,name:"Ibrahim",ar:"إبراهيم",meaning:"Abraham",ayahs:52,type:"Meccan"},{n:15,name:"Al-Hijr",ar:"الحجر",meaning:"The Rocky Tract",ayahs:99,type:"Meccan"},{n:16,name:"An-Nahl",ar:"النحل",meaning:"The Bee",ayahs:128,type:"Meccan"},{n:17,name:"Al-Isra",ar:"الإسراء",meaning:"The Night Journey",ayahs:111,type:"Meccan"},{n:18,name:"Al-Kahf",ar:"الكهف",meaning:"The Cave",ayahs:110,type:"Meccan"},{n:19,name:"Maryam",ar:"مريم",meaning:"Mary",ayahs:98,type:"Meccan"},{n:20,name:"Ta-Ha",ar:"طه",meaning:"Ta-Ha",ayahs:135,type:"Meccan"},{n:21,name:"Al-Anbiya",ar:"الأنبياء",meaning:"The Prophets",ayahs:112,type:"Meccan"},{n:22,name:"Al-Hajj",ar:"الحج",meaning:"The Pilgrimage",ayahs:78,type:"Medinan"},{n:23,name:"Al-Mu'minun",ar:"المؤمنون",meaning:"The Believers",ayahs:118,type:"Meccan"},{n:24,name:"An-Nur",ar:"النور",meaning:"The Light",ayahs:64,type:"Medinan"},{n:25,name:"Al-Furqan",ar:"الفرقان",meaning:"The Criterion",ayahs:77,type:"Meccan"},{n:26,name:"Ash-Shu'ara",ar:"الشعراء",meaning:"The Poets",ayahs:227,type:"Meccan"},{n:27,name:"An-Naml",ar:"النمل",meaning:"The Ant",ayahs:93,type:"Meccan"},{n:28,name:"Al-Qasas",ar:"القصص",meaning:"The Stories",ayahs:88,type:"Meccan"},{n:29,name:"Al-Ankabut",ar:"العنكبوت",meaning:"The Spider",ayahs:69,type:"Meccan"},{n:30,name:"Ar-Rum",ar:"الروم",meaning:"The Romans",ayahs:60,type:"Meccan"},{n:31,name:"Luqman",ar:"لقمان",meaning:"Luqman",ayahs:34,type:"Meccan"},{n:32,name:"As-Sajda",ar:"السجدة",meaning:"The Prostration",ayahs:30,type:"Meccan"},{n:33,name:"Al-Ahzab",ar:"الأحزاب",meaning:"The Combined Forces",ayahs:73,type:"Medinan"},{n:34,name:"Saba",ar:"سبأ",meaning:"Sheba",ayahs:54,type:"Meccan"},{n:35,name:"Fatir",ar:"فاطر",meaning:"Originator",ayahs:45,type:"Meccan"},{n:36,name:"Ya-Sin",ar:"يس",meaning:"Ya Sin",ayahs:83,type:"Meccan"},{n:37,name:"As-Saffat",ar:"الصافات",meaning:"Those who set the Ranks",ayahs:182,type:"Meccan"},{n:38,name:"Sad",ar:"ص",meaning:"The Letter Saad",ayahs:88,type:"Meccan"},{n:39,name:"Az-Zumar",ar:"الزمر",meaning:"The Troops",ayahs:75,type:"Meccan"},{n:40,name:"Ghafir",ar:"غافر",meaning:"The Forgiver",ayahs:85,type:"Meccan"},{n:41,name:"Fussilat",ar:"فصلت",meaning:"Explained in Detail",ayahs:54,type:"Meccan"},{n:42,name:"Ash-Shura",ar:"الشورى",meaning:"The Consultation",ayahs:53,type:"Meccan"},{n:43,name:"Az-Zukhruf",ar:"الزخرف",meaning:"Ornaments of Gold",ayahs:89,type:"Meccan"},{n:44,name:"Ad-Dukhan",ar:"الدخان",meaning:"The Smoke",ayahs:59,type:"Meccan"},{n:45,name:"Al-Jathiya",ar:"الجاثية",meaning:"The Crouching",ayahs:37,type:"Meccan"},{n:46,name:"Al-Ahqaf",ar:"الأحقاف",meaning:"The Sand Dunes",ayahs:35,type:"Meccan"},{n:47,name:"Muhammad",ar:"محمد",meaning:"Muhammad",ayahs:38,type:"Medinan"},{n:48,name:"Al-Fath",ar:"الفتح",meaning:"The Victory",ayahs:29,type:"Medinan"},{n:49,name:"Al-Hujurat",ar:"الحجرات",meaning:"The Rooms",ayahs:18,type:"Medinan"},{n:50,name:"Qaf",ar:"ق",meaning:"The Letter Qaf",ayahs:45,type:"Meccan"},{n:51,name:"Adh-Dhariyat",ar:"الذاريات",meaning:"The Winnowing Winds",ayahs:60,type:"Meccan"},{n:52,name:"At-Tur",ar:"الطور",meaning:"The Mount",ayahs:49,type:"Meccan"},{n:53,name:"An-Najm",ar:"النجم",meaning:"The Star",ayahs:62,type:"Meccan"},{n:54,name:"Al-Qamar",ar:"القمر",meaning:"The Moon",ayahs:55,type:"Meccan"},{n:55,name:"Ar-Rahman",ar:"الرحمان",meaning:"The Beneficent",ayahs:78,type:"Medinan"},{n:56,name:"Al-Waqi'a",ar:"الواقعة",meaning:"The Inevitable",ayahs:96,type:"Meccan"},{n:57,name:"Al-Hadid",ar:"الحديد",meaning:"The Iron",ayahs:29,type:"Medinan"},{n:58,name:"Al-Mujadila",ar:"المجادلة",meaning:"The Pleading Woman",ayahs:22,type:"Medinan"},{n:59,name:"Al-Hashr",ar:"الحشر",meaning:"The Exile",ayahs:24,type:"Medinan"},{n:60,name:"Al-Mumtahana",ar:"الممتحنة",meaning:"She that is Examined",ayahs:13,type:"Medinan"},{n:61,name:"As-Saf",ar:"الصف",meaning:"The Ranks",ayahs:14,type:"Medinan"},{n:62,name:"Al-Jumu'a",ar:"الجمعة",meaning:"Friday",ayahs:11,type:"Medinan"},{n:63,name:"Al-Munafiqun",ar:"المنافقون",meaning:"The Hypocrites",ayahs:11,type:"Medinan"},{n:64,name:"At-Taghabun",ar:"التغابن",meaning:"Mutual Disillusion",ayahs:18,type:"Medinan"},{n:65,name:"At-Talaq",ar:"الطلاق",meaning:"The Divorce",ayahs:12,type:"Medinan"},{n:66,name:"At-Tahrim",ar:"التحريم",meaning:"The Prohibition",ayahs:12,type:"Medinan"},{n:67,name:"Al-Mulk",ar:"الملك",meaning:"The Sovereignty",ayahs:30,type:"Meccan"},{n:68,name:"Al-Qalam",ar:"القلم",meaning:"The Pen",ayahs:52,type:"Meccan"},{n:69,name:"Al-Haqqa",ar:"الحاقة",meaning:"The Reality",ayahs:52,type:"Meccan"},{n:70,name:"Al-Ma'arij",ar:"المعارج",meaning:"The Ascending Stairways",ayahs:44,type:"Meccan"},{n:71,name:"Nuh",ar:"نوح",meaning:"Noah",ayahs:28,type:"Meccan"},{n:72,name:"Al-Jinn",ar:"الجن",meaning:"The Jinn",ayahs:28,type:"Meccan"},{n:73,name:"Al-Muzzammil",ar:"المزمل",meaning:"The Enshrouded One",ayahs:20,type:"Meccan"},{n:74,name:"Al-Muddaththir",ar:"المدثر",meaning:"The Cloaked One",ayahs:56,type:"Meccan"},{n:75,name:"Al-Qiyama",ar:"القيامة",meaning:"The Resurrection",ayahs:40,type:"Meccan"},{n:76,name:"Al-Insan",ar:"الإنسان",meaning:"The Man",ayahs:31,type:"Medinan"},{n:77,name:"Al-Mursalat",ar:"المرسلات",meaning:"The Emissaries",ayahs:50,type:"Meccan"},{n:78,name:"An-Naba",ar:"النبأ",meaning:"The Tidings",ayahs:40,type:"Meccan"},{n:79,name:"An-Nazi'at",ar:"النازعات",meaning:"Those who drag forth",ayahs:46,type:"Meccan"},{n:80,name:"Abasa",ar:"عبس",meaning:"He Frowned",ayahs:42,type:"Meccan"},{n:81,name:"At-Takwir",ar:"التكوير",meaning:"The Overthrowing",ayahs:29,type:"Meccan"},{n:82,name:"Al-Infitar",ar:"الإنفطار",meaning:"The Cleaving",ayahs:19,type:"Meccan"},{n:83,name:"Al-Mutaffifin",ar:"المطففين",meaning:"The Defrauding",ayahs:36,type:"Meccan"},{n:84,name:"Al-Inshiqaq",ar:"الإنشقاق",meaning:"The Sundering",ayahs:25,type:"Meccan"},{n:85,name:"Al-Buruj",ar:"البروج",meaning:"The Mansions of Stars",ayahs:22,type:"Meccan"},{n:86,name:"At-Tariq",ar:"الطارق",meaning:"The Nightcomer",ayahs:17,type:"Meccan"},{n:87,name:"Al-A'la",ar:"الأعلى",meaning:"The Most High",ayahs:19,type:"Meccan"},{n:88,name:"Al-Ghashiya",ar:"الغاشية",meaning:"The Overwhelming",ayahs:26,type:"Meccan"},{n:89,name:"Al-Fajr",ar:"الفجر",meaning:"The Dawn",ayahs:30,type:"Meccan"},{n:90,name:"Al-Balad",ar:"البلد",meaning:"The City",ayahs:20,type:"Meccan"},{n:91,name:"Ash-Shams",ar:"الشمس",meaning:"The Sun",ayahs:15,type:"Meccan"},{n:92,name:"Al-Layl",ar:"الليل",meaning:"The Night",ayahs:21,type:"Meccan"},{n:93,name:"Ad-Duha",ar:"الضحى",meaning:"The Morning Hours",ayahs:11,type:"Meccan"},{n:94,name:"Ash-Sharh",ar:"الشرح",meaning:"The Relief",ayahs:8,type:"Meccan"},{n:95,name:"At-Tin",ar:"التين",meaning:"The Fig",ayahs:8,type:"Meccan"},{n:96,name:"Al-Alaq",ar:"العلق",meaning:"The Clot",ayahs:19,type:"Meccan"},{n:97,name:"Al-Qadr",ar:"القدر",meaning:"The Power",ayahs:5,type:"Meccan"},{n:98,name:"Al-Bayyina",ar:"البينة",meaning:"The Clear Proof",ayahs:8,type:"Medinan"},{n:99,name:"Az-Zalzala",ar:"الزلزلة",meaning:"The Earthquake",ayahs:8,type:"Medinan"},{n:100,name:"Al-Adiyat",ar:"العاديات",meaning:"The Courser",ayahs:11,type:"Meccan"},{n:101,name:"Al-Qari'a",ar:"القارعة",meaning:"The Calamity",ayahs:11,type:"Meccan"},{n:102,name:"At-Takathur",ar:"التكاثر",meaning:"The Rivalry",ayahs:8,type:"Meccan"},{n:103,name:"Al-Asr",ar:"العصر",meaning:"The Declining Day",ayahs:3,type:"Meccan"},{n:104,name:"Al-Humaza",ar:"الهمزة",meaning:"The Traducer",ayahs:9,type:"Meccan"},{n:105,name:"Al-Fil",ar:"الفيل",meaning:"The Elephant",ayahs:5,type:"Meccan"},{n:106,name:"Quraysh",ar:"قريش",meaning:"Quraysh",ayahs:4,type:"Meccan"},{n:107,name:"Al-Ma'un",ar:"الماعون",meaning:"Small Kindnesses",ayahs:7,type:"Meccan"},{n:108,name:"Al-Kawthar",ar:"الكوثر",meaning:"The Abundance",ayahs:3,type:"Meccan"},{n:109,name:"Al-Kafirun",ar:"الكافرون",meaning:"The Disbelievers",ayahs:6,type:"Meccan"},{n:110,name:"An-Nasr",ar:"النصر",meaning:"The Divine Support",ayahs:3,type:"Medinan"},{n:111,name:"Al-Masad",ar:"المسد",meaning:"The Palm Fibre",ayahs:5,type:"Meccan"},{n:112,name:"Al-Ikhlas",ar:"الإخلاص",meaning:"The Sincerity",ayahs:4,type:"Meccan"},{n:113,name:"Al-Falaq",ar:"الفلق",meaning:"The Daybreak",ayahs:5,type:"Meccan"},{n:114,name:"An-Nas",ar:"الناس",meaning:"The Mankind",ayahs:6,type:"Meccan"}];

/* ── HELPERS ── */
function Waveform({playing=true,color='#C8A45A',size=1}){
  const bars=[{c:'wv1',h:16},{c:'wv2',h:10},{c:'wv3',h:22},{c:'wv4',h:14},{c:'wv5',h:8},{c:'wv1',h:18},{c:'wv2',h:12},{c:'wv3',h:20},{c:'wv4',h:10},{c:'wv5',h:16}];
  return <div style={{display:'flex',alignItems:'center',gap:2*size,height:30*size}}>{bars.map((b,i)=><div key={i} className={playing?b.c:''} style={{width:3*size,height:playing?undefined:b.h*size,minHeight:3*size,background:color,borderRadius:2,opacity:0.75}}/>)}</div>;
}
function Toast({msg}){return <div style={{position:'fixed',top:70,left:'50%',transform:'translateX(-50%)',background:'var(--bg3)',border:'0.5px solid var(--border2)',borderRadius:30,padding:'10px 22px',zIndex:999,fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'var(--gold)',whiteSpace:'nowrap',animation:'fadeUp 0.3s ease both',boxShadow:'0 8px 40px rgba(0,0,0,0.5)'}}>{msg}</div>;}
function GoldLine(){return <div style={{display:'flex',alignItems:'center',gap:10,padding:'0 20px',margin:'4px 0'}}><div style={{flex:1,height:'0.5px',background:'var(--border)'}}/><div style={{width:4,height:4,borderRadius:'50%',background:'var(--gold)',opacity:0.4}}/><div style={{flex:1,height:'0.5px',background:'var(--border)'}}/></div>;}

// Check if episode is "live" — uploaded within last 3 hours
function isEpisodeLive(ep) {
  if (!ep?.created_at) return false;
  const uploaded = new Date(ep.created_at).getTime();
  const now = Date.now();
  const threeHours = 3 * 60 * 60 * 1000;
  return (now - uploaded) < threeHours;
}

/* ── SETUP SCREEN ── */
function SetupScreen({onDone}){
  const [name,setName]=useState('');
  const [slide,setSlide]=useState(0);
  const [nameErr,setNameErr]=useState(false);

  const features=[
    {icon:'📖',ar:'اقْرَأْ',title:'Read the complete Quran',desc:'All 114 Surahs in continuous Mushaf style. Arabic + translations in 8 languages including Urdu, English, French and more.'},
    {icon:'🎙',ar:'تَرْتِيلًا',title:'Daily recitations until Ramadan',desc:'One anonymous voice reciting every single day from March 25, 2026 until Ramadan 2027. 365 days. One mission.'},
    {icon:'🎵',ar:'صَوْت',title:'5 world-renowned Qaris',desc:'Mishary Alafasy, As-Sudais, Al-Husary, Al-Minshawi, Basfar. Tap any ayah to listen. Switch reciter in one tap.'},
    {icon:'🏆',ar:'مُسَابَقَة',title:'Earn points & rank up',desc:'1 point per ayah. 50 bonus points per surah completed. Compete on the global leaderboard with readers worldwide.'},
    {icon:'🎓',ar:'عِلْم',title:'Learn from great scholars',desc:'Dr. Israr Ahmed, Mufti Menk, Nouman Ali Khan, Omar Suleiman and more. Lectures and bayans inside the app.'},
    {icon:'🌍',ar:'لِلنَّاس',title:'Free for every human on earth',desc:'No ads. No subscriptions. No data sold. Built as sadaqah. If Allah has blessed you, you can support us anytime.'},
  ];

  useEffect(()=>{
    const t=setInterval(()=>setSlide(s=>(s+1)%features.length),3500);
    return()=>clearInterval(t);
  },[]);

  const handleBegin=()=>{
    if(!name.trim()){setNameErr(true);return;}
    onDone(name.trim());
  };

  return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
      {/* Background radial glow */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:'70vh',background:'radial-gradient(ellipse at 50% -10%,rgba(200,164,90,0.1) 0%,transparent 65%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:0,right:0,width:400,height:400,background:'radial-gradient(ellipse at right bottom,rgba(200,164,90,0.04) 0%,transparent 70%)',pointerEvents:'none'}}/>

      {/* Main layout — split on desktop */}
      <div style={{flex:1,display:'flex',alignItems:'stretch',maxWidth:1100,margin:'0 auto',width:'100%',padding:'0 0'}}>

        {/* LEFT — branding + carousel */}
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',padding:'40px 48px',borderRight:'0.5px solid var(--border)'}}>
          {/* Logo */}
          <div style={{marginBottom:40}}>
            <div style={{fontFamily:'Amiri,serif',fontSize:12,color:'var(--gold)',opacity:0.5,letterSpacing:3,marginBottom:4}}>نور القرآن</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:300,color:'var(--cream)',letterSpacing:3,lineHeight:1}}>NurQuran</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:'italic',color:'var(--cream3)',marginTop:6}}>The Light of the Quran</div>
          </div>

          {/* Quote */}
          <div style={{marginBottom:40,padding:'20px 24px',background:'var(--gold3)',border:'0.5px solid var(--border2)',borderRadius:16,position:'relative'}}>
            <div style={{fontFamily:'Amiri,serif',fontSize:28,color:'var(--gold)',lineHeight:1.9,marginBottom:8,letterSpacing:1}}>اقْرَأْ بِاسْمِ رَبِّكَ</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:'italic',color:'var(--cream2)',lineHeight:1.7}}>Read in the name of your Lord<br/><span style={{fontSize:13,color:'var(--cream3)'}}>— Surah Al-Alaq, the first revelation</span></div>
          </div>

          {/* Feature carousel */}
          <div style={{background:'var(--bg2)',border:'0.5px solid var(--border)',borderRadius:16,padding:'22px 24px',minHeight:130,position:'relative',overflow:'hidden'}}>
            {features.map((f,i)=>(
              <div key={i} style={{position:i===0?'relative':'absolute',top:0,left:0,right:0,padding:'22px 24px',opacity:slide===i?1:0,transform:slide===i?'translateY(0)':'translateY(8px)',transition:'all 0.5s ease',pointerEvents:slide===i?'all':'none'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:16}}>
                  <div style={{width:44,height:44,borderRadius:12,background:'var(--gold3)',border:'0.5px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{f.icon}</div>
                  <div>
                    <div style={{fontFamily:'Amiri,serif',fontSize:11,color:'var(--gold)',letterSpacing:2,marginBottom:4,opacity:0.7}}>{f.ar}</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'var(--cream)',marginBottom:6}}>{f.title}</div>
                    <div style={{fontSize:13,color:'var(--cream3)',lineHeight:1.7}}>{f.desc}</div>
                  </div>
                </div>
              </div>
            ))}
            {/* Dots */}
            <div style={{display:'flex',gap:5,justifyContent:'center',marginTop:8,paddingTop:100}}>
              {features.map((_,i)=>(
                <div key={i} onClick={()=>setSlide(i)} style={{width:i===slide?20:6,height:6,borderRadius:3,background:i===slide?'var(--gold)':'var(--border2)',cursor:'pointer',transition:'all 0.3s'}}/>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div style={{display:'flex',gap:16,marginTop:24}}>
            {[{n:'114',l:'Surahs'},{n:'6,236',l:'Ayahs'},{n:'5',l:'Qaris'},{n:'8',l:'Languages'}].map(s=>(
              <div key={s.l} style={{flex:1,textAlign:'center'}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'var(--gold)'}}>{s.n}</div>
                <div style={{fontSize:11,color:'var(--cream3)',letterSpacing:0.5}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — sign in form */}
        <div style={{width:400,flexShrink:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'40px 40px'}}>

          {/* Bismillah */}
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{fontFamily:'Amiri,serif',fontSize:26,color:'var(--gold)',lineHeight:1.9,letterSpacing:1}}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>
            <div style={{fontSize:11,color:'var(--cream3)',letterSpacing:1.5,marginTop:4}}>Begin with the name of Allah</div>
          </div>

          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'var(--cream)',marginBottom:6}}>Welcome</div>
          <div style={{fontSize:13,color:'var(--cream3)',lineHeight:1.7,marginBottom:28}}>Enter your name to begin your Quran journey. No account needed — just your name and intention.</div>

          {/* Name input */}
          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,color:'var(--cream3)',letterSpacing:1,display:'block',marginBottom:8}}>YOUR NAME</label>
            <input
              value={name}
              onChange={e=>{setName(e.target.value);setNameErr(false)}}
              onKeyDown={e=>{if(e.key==='Enter')handleBegin()}}
              placeholder="e.g. Sameed"
              style={{width:'100%',background:'var(--bg3)',border:`1px solid ${nameErr?'var(--red)':'var(--border2)'}`,borderRadius:12,padding:'14px 18px',color:'var(--cream)',fontSize:16,outline:'none',fontFamily:"'DM Sans',sans-serif",transition:'border 0.2s'}}
            />
            {nameErr&&<div style={{color:'var(--red)',fontSize:12,marginTop:6}}>Please enter your name to begin</div>}
          </div>

          {/* Coming soon badge */}
          <div style={{background:'rgba(200,164,90,0.06)',border:'0.5px solid var(--border)',borderRadius:10,padding:'10px 14px',marginBottom:20,display:'flex',gap:10,alignItems:'flex-start'}}>
            <span style={{fontSize:16,flexShrink:0}}>🔐</span>
            <div style={{fontSize:12,color:'var(--cream3)',lineHeight:1.7}}>
              <span style={{color:'var(--gold)'}}>Unique accounts coming soon</span> — your identity and progress will be fully secured so no two readers share the same data.
            </div>
          </div>

          <button onClick={handleBegin} style={{width:'100%',background:'var(--gold)',border:'none',borderRadius:12,padding:'15px',color:'#08100A',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,cursor:'pointer',letterSpacing:0.5,marginBottom:10,transition:'opacity 0.2s'}}>
            Begin Reading →
          </button>
          <button onClick={()=>onDone('Guest')} style={{width:'100%',background:'transparent',border:'0.5px solid var(--border)',borderRadius:12,padding:'13px',color:'var(--cream3)',fontFamily:"'Cormorant Garamond',serif",fontSize:14,cursor:'pointer',marginBottom:28}}>
            Continue as Guest
          </button>

          {/* Support — subtle */}
          <div style={{borderTop:'0.5px solid var(--border)',paddingTop:20}}>
            <div style={{fontSize:12,color:'var(--cream3)',lineHeight:1.8,textAlign:'center'}}>
              This app is <span style={{color:'var(--cream)'}}>100% free</span>, no ads, no subscriptions.<br/>
              If Allah has blessed you, <span style={{color:'var(--gold)',cursor:'pointer'}} onClick={()=>window.open('https://ko-fi.com','_blank')}>support us here ↗</span> — sadaqah jariyah.
            </div>
          </div>

          <div style={{marginTop:16,fontSize:10,color:'var(--cream3)',textAlign:'center',opacity:0.6,lineHeight:1.9}}>
            All 114 Surahs · 5 Qaris · 8 Languages<br/>Daily Recitations · Free Forever · No Ads
          </div>
        </div>
      </div>

      {/* Mobile layout override */}
      <style>{`
        @media(max-width:768px){
          .setup-left{display:none!important}
          .setup-right{width:100%!important;padding:32px 24px!important}
        }
      `}</style>
    </div>
  );
}

/* ── SIDEBAR ── */
function Sidebar({view,setView,pts,userName,theme,setTheme,onAdmin,completed,onLogout}){
  const totalRead=Object.keys(completed).length;
  const pct=Math.round(totalRead/6236*100);
  const navItems=[
    {v:'home',icon:'⌂',label:'Home'},
    {v:'search',icon:'◎',label:'Explore Surahs'},
    {v:'recitations',icon:'◈',label:'Daily Recitations'},
    {v:'scholars',icon:'▣',label:'Scholars & Bayans'},
    {v:'leaderboard',icon:'◆',label:'Ranks'},
    {v:'profile',icon:'◉',label:'My Profile'},
    {v:'about',icon:'◇',label:'About Us'},
    {v:'privacy',icon:'○',label:'Privacy Policy'},
  ];
  return(
    <div className="sidebar">
      {/* Logo */}
      <div style={{padding:'20px 20px 12px',borderBottom:'0.5px solid var(--border)'}}>
        <div style={{fontFamily:'Amiri,serif',fontSize:10,color:'var(--gold)',opacity:0.45,letterSpacing:3,marginBottom:2}}>نور القرآن</div>
        <div onClick={()=>{const now=Date.now();const key='nq_tap';const taps=JSON.parse(localStorage.getItem(key)||'[]').filter(t=>now-t<1500);taps.push(now);localStorage.setItem(key,JSON.stringify(taps));if(taps.length>=3){onAdmin();localStorage.removeItem(key)}}} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'var(--gold)',letterSpacing:2,userSelect:'none',cursor:'default'}}>NurQuran</div>
      </div>
      {/* Compact profile strip */}
      <div onClick={()=>setView('profile')} style={{padding:'10px 18px',borderBottom:'0.5px solid var(--border)',cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:34,height:34,borderRadius:'50%',background:'var(--gold3)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:'var(--gold)',flexShrink:0}}>{userName.slice(0,2).toUpperCase()}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:'var(--cream)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{userName}</div>
          <div style={{fontSize:10,color:'var(--gold)',marginTop:1}}>✦ {pts} pts · {pct}% Quran</div>
        </div>
      </div>
      {/* Nav */}
      <div style={{flex:1,padding:'8px 8px',overflowY:'auto'}}>
        {navItems.map(t=>(
          <button key={t.v} onClick={()=>setView(t.v)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:9,border:'none',background:view===t.v?'var(--gold3)':'transparent',color:view===t.v?'var(--gold)':'var(--cream3)',cursor:'pointer',marginBottom:1,transition:'all 0.15s',textAlign:'left',borderLeft:view===t.v?'2px solid var(--gold)':'2px solid transparent'}}>
            <span style={{fontSize:13,width:16,textAlign:'center',flexShrink:0}}>{t.icon}</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.label}</span>
          </button>
        ))}
      </div>
      {/* Bottom — compact */}
      <div style={{padding:'10px 12px',borderTop:'0.5px solid var(--border)'}}>
        {/* Theme row */}
        <div style={{display:'flex',gap:5,marginBottom:8}}>
          {[['dark','🌑'],['light','☀'],['midnight','✦'],['parchment','🌿']].map(([t,icon])=>(
            <button key={t} onClick={()=>setTheme(t)} title={t} style={{flex:1,padding:'6px 0',borderRadius:7,border:'1px solid',borderColor:theme===t?'var(--gold)':'var(--border)',background:theme===t?'var(--gold3)':'var(--bg3)',color:theme===t?'var(--gold)':'var(--cream3)',cursor:'pointer',fontSize:13,transition:'all 0.15s'}}>
              {icon}
            </button>
          ))}
        </div>
        <button onClick={()=>window.open('https://ko-fi.com','_blank')} style={{width:'100%',background:'rgba(255,100,100,0.1)',border:'0.5px solid rgba(255,100,100,0.25)',borderRadius:8,padding:'8px',color:'#FF6464',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:"'DM Sans',sans-serif",marginBottom:6}}>
          ❤ Support NurQuran — Sadaqah
        </button>
        <div style={{display:'flex',gap:6}}>
          <button onClick={onAdmin} style={{flex:1,background:'var(--gold3)',border:'0.5px solid var(--border2)',borderRadius:8,padding:'8px',color:'var(--gold)',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:"'DM Sans',sans-serif"}}>
            🎙 Studio
          </button>
          <button onClick={onLogout} style={{flex:1,background:'transparent',border:'0.5px solid var(--border)',borderRadius:8,padding:'8px',color:'var(--cream3)',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:"'DM Sans',sans-serif"}}>
            ⎋ Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MOBILE NAV ── */
function MobileNav({view,setView}){
  const tabs=[{v:'home',icon:'⌂',label:'Home'},{v:'search',icon:'◎',label:'Explore'},{v:'recitations',icon:'◈',label:'Recite'},{v:'leaderboard',icon:'◆',label:'Ranks'},{v:'profile',icon:'◉',label:'Profile'}];
  return(
    <div className="mobile-nav">
      {tabs.map(t=>(
        <button key={t.v} onClick={()=>setView(t.v)} style={{flex:1,background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,color:view===t.v?'var(--gold)':'var(--cream3)',padding:'4px 0',transition:'color 0.2s'}}>
          <span style={{fontSize:17}}>{t.icon}</span>
          <span style={{fontSize:9,letterSpacing:0.5,fontWeight:view===t.v?500:400}}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── HOME ── */
function HomeView({userName,pts,completed,setView,openSurah,lastRead,liveEpisode,liveCount}){
  const totalRead=Object.keys(completed).length;
  const pct=Math.round(totalRead/6236*100);
  const live=isEpisodeLive(liveEpisode);

  return(
    <div style={{paddingBottom:20}}>
      {/* Hero with mosque image */}
      <div style={{position:'relative',overflow:'hidden',borderBottom:'0.5px solid var(--border)'}}>
        <div style={{position:'relative',height:260,overflow:'hidden'}}>
          <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=85" alt="Masjid al-Haram" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 40%',filter:'brightness(0.28) saturate(0.8)'}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom, transparent 0%, var(--bg) 100%)'}}/>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 24px'}}>
            <div style={{fontFamily:'Amiri,serif',fontSize:28,color:'var(--gold)',lineHeight:1.9,letterSpacing:2,textShadow:'0 2px 20px rgba(0,0,0,0.8)',textAlign:'center'}}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'rgba(242,234,216,0.6)',letterSpacing:2,marginTop:4}}>In the name of Allah, the Most Gracious, the Most Merciful</div>
          </div>
        </div>
        <div style={{padding:'16px 24px 20px',background:'radial-gradient(ellipse at 50% 0%,rgba(200,164,90,0.04) 0%,transparent 70%)'}}>
        <div style={{fontFamily:'Amiri,serif',fontSize:11,color:'var(--gold)',opacity:0.55,letterSpacing:3,marginBottom:10}}>SALAM, {userName.toUpperCase()}</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:300,lineHeight:1.2,marginBottom:20}}>Continue your<br/><em style={{color:'var(--gold)'}}>sacred journey</em></div>
        {lastRead&&(
          <div onClick={()=>{const s=SURAHS.find(x=>x.n===lastRead.n);if(s)openSurah(s)}} style={{background:'var(--bg3)',border:'0.5px solid var(--border2)',borderRadius:12,padding:'14px 18px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div><div style={{fontSize:11,color:'var(--cream3)',letterSpacing:1,marginBottom:3}}>CONTINUE READING</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'var(--cream)'}}>{lastRead.name}</div><div style={{fontSize:12,color:'var(--gold)',marginTop:2}}>Ayah {lastRead.ayah} of {lastRead.total}</div></div>
            <div style={{fontSize:22,color:'var(--gold)',opacity:0.5}}>›</div>
          </div>
        )}
        <div style={{height:2,background:'var(--bg4)',borderRadius:2,marginBottom:6}}>
          <div style={{height:2,width:pct+'%',background:'linear-gradient(90deg,var(--gold2),var(--gold))',borderRadius:2,transition:'width 1s'}}/>
        </div>
        <div style={{textAlign:'center',fontSize:11,color:'var(--cream3)',letterSpacing:0.5}}>{totalRead.toLocaleString()} of 6,236 ayahs · {pct}% of the complete Quran</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,padding:'16px'}}>
        {[{l:'Points',v:pts.toLocaleString()},{l:'Ayahs Read',v:totalRead},{l:'Progress',v:pct+'%'}].map(s=>(
          <div key={s.l} style={{background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:12,padding:'14px 10px',textAlign:'center'}}>
            <div style={{fontSize:11,color:'var(--cream3)',marginBottom:4,letterSpacing:0.5}}>{s.l.toUpperCase()}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'var(--gold)'}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Recitation strip — LIVE or COMING SOON */}
      <div onClick={()=>setView('recitations')} style={{margin:'0 16px 16px',background:'var(--bg3)',border:'0.5px solid var(--border2)',borderRadius:14,padding:'16px 18px',cursor:'pointer',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,right:0,width:'40%',height:'100%',background:'radial-gradient(ellipse at right,rgba(200,164,90,0.05) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          {live?(
            <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(224,82,82,0.12)',border:'1px solid rgba(224,82,82,0.3)',borderRadius:20,padding:'4px 10px'}}>
              <div className="live-dot"/><span style={{fontSize:11,fontWeight:500,color:'var(--red)',letterSpacing:1}}>LIVE NOW</span>
            </div>
          ):(
            <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(200,164,90,0.1)',border:'1px solid var(--border2)',borderRadius:20,padding:'4px 10px'}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:'var(--gold)',animation:'pulse 3s infinite'}}/><span style={{fontSize:11,color:'var(--gold)',letterSpacing:1}}>DAILY RECITATION</span>
            </div>
          )}
          <span style={{fontSize:12,color:'var(--cream3)'}}>{liveCount} listening now</span>
        </div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,marginBottom:4,color:'var(--cream)'}}>{live?`Day ${liveEpisode?.day} — ${liveEpisode?.surah_name}`:'Daily Recitations'}</div>
        <div style={{fontSize:13,color:'var(--cream3)',marginBottom:14}}>
          {live?liveEpisode?.description:'Recording uploads daily at Fajr time · Have patience, it goes live shortly ☽'}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Waveform playing={live} color="var(--gold)" size={0.85}/>
          <span style={{fontSize:12,color:'var(--gold)'}}>Listen →</span>
        </div>
      </div>

      <GoldLine/>

      {/* Showcase — what makes NurQuran different */}
      <div style={{padding:'0 16px 20px'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:11,color:'var(--gold)',letterSpacing:2,opacity:0.7,marginBottom:14}}>WHY NURQURAN</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10}}>
          {[
            {icon:'📖',title:'Full Quran',desc:'All 114 Surahs in continuous Mushaf style. Arabic + translation in 6 languages.'},
            {icon:'🎙',title:'Daily Recitations',desc:'One anonymous voice reciting every day from Rajab until Ramadan 2027.'},
            {icon:'🎵',title:'5 Famous Qaris',desc:'Alafasy, As-Sudais, Al-Husary, Al-Minshawi, Basfar. Switch with one tap.'},
            {icon:'🏆',title:'Earn Points',desc:'1 point per ayah. 50 bonus per surah. Compete on the global leaderboard.'},
            {icon:'🎓',title:'Learn from Scholars',desc:'Lectures by Dr. Israr Ahmed, Mufti Menk, Nouman Ali Khan and more.'},
            {icon:'🌍',title:'Free for Humanity',desc:'No ads. No subscriptions. No data sold. Built as sadaqah for every human.'},
          ].map(f=>(
            <div key={f.title} style={{background:'var(--bg2)',border:'0.5px solid var(--border)',borderRadius:14,padding:'16px 16px',transition:'all 0.2s'}}>
              <div style={{fontSize:24,marginBottom:10}}>{f.icon}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'var(--cream)',marginBottom:6}}>{f.title}</div>
              <div style={{fontSize:12,color:'var(--cream3)',lineHeight:1.7}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <GoldLine/>


      {/* Featured Surahs — 8 most read */}
      <div style={{padding:'0 16px 20px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:11,color:'var(--gold)',letterSpacing:2,opacity:0.7}}>FEATURED SURAHS</div>
          <button onClick={()=>setView('search')} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:'var(--gold)',background:'var(--gold3)',border:'0.5px solid var(--border2)',borderRadius:20,padding:'4px 14px',cursor:'pointer'}}>
            View All 114 →
          </button>
        </div>
        <div className="surah-grid">
          {FEATURED_SURAHS.map((s,i)=>{
            const done=Array.from({length:s.ayahs},(_,j)=>completed[s.n+':'+(j+1)]).filter(Boolean).length;
            const p=Math.round(done/s.ayahs*100);
            return(
              <div key={s.n} className="row-hover" onClick={()=>openSurah(s)} style={{display:'flex',alignItems:'center',padding:'12px 14px',borderRadius:10,border:'0.5px solid var(--border)',cursor:'pointer',background:'var(--bg2)',animation:`fadeUp 0.3s ${i*0.05}s both`,transition:'all 0.2s',boxShadow:'0 2px 12px rgba(0,0,0,0.15)'}}>
                <div style={{width:38,height:38,borderRadius:10,background:p>0?'var(--gold3)':'var(--bg3)',border:'0.5px solid '+(p>0?'var(--border2)':'var(--border)'),display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:p>0?'var(--gold)':'var(--cream3)',flexShrink:0,marginRight:12}}>{s.n}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:2}}>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'var(--cream)'}}>{s.name}</span>
                    <span style={{fontFamily:'Amiri,serif',fontSize:18,color:'var(--gold)',opacity:0.85,flexShrink:0,marginLeft:8}}>{s.ar}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:11,color:'var(--cream3)'}}>{s.meaning} · {s.ayahs} ayahs</span>
                    {p>0&&<span style={{fontSize:11,color:'var(--gold)',flexShrink:0}}>{p}%</span>}
                  </div>
                  {p>0&&<div style={{height:2,background:'var(--bg4)',borderRadius:2,marginTop:5}}><div style={{height:2,width:p+'%',background:'var(--gold)',opacity:0.6,borderRadius:2}}/></div>}
                </div>
              </div>
            );
          })}
        </div>
        {/* View all button bottom */}
        <div style={{textAlign:'center',marginTop:16}}>
          <button onClick={()=>setView('search')} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'var(--cream)',background:'var(--bg3)',border:'0.5px solid var(--border2)',borderRadius:12,padding:'12px 32px',cursor:'pointer',transition:'all 0.2s',display:'inline-flex',alignItems:'center',gap:8}}>
            <span>Explore All 114 Surahs</span><span style={{color:'var(--gold)'}}>→</span>
          </button>
        </div>
      </div>

      {/* Daily Reminder / News section */}
      <GoldLine/>
      <div style={{padding:'16px 16px 20px'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:11,color:'var(--gold)',letterSpacing:2,opacity:0.7,marginBottom:14}}>DAILY REMINDER</div>
        <div style={{background:'var(--bg2)',border:'0.5px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
          {/* Today verse */}
          <div style={{padding:'20px 22px',borderBottom:'0.5px solid var(--border)',background:'radial-gradient(ellipse at right,rgba(200,164,90,0.04) 0%,transparent 70%)'}}>
            <div style={{fontSize:10,color:'var(--gold)',letterSpacing:2,marginBottom:10,opacity:0.7}}>VERSE OF THE DAY</div>
            <div style={{fontFamily:'Amiri,serif',fontSize:24,color:'var(--cream)',direction:'rtl',textAlign:'right',lineHeight:2,marginBottom:12}}>وَلَذِكْرُ اللَّهِ أَكْبَرُ</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:'italic',color:'var(--cream2)',marginBottom:6}}>And the remembrance of Allah is greater.</div>
            <div style={{fontSize:11,color:'var(--cream3)',opacity:0.7}}>— Surah Al-Ankabut 29:45</div>
          </div>
          {/* Updates */}
          {[
            {icon:'🌙',title:'Recitations begin March 25, 2026',desc:'Day 1 of 365 — Al-Fatiha. Subscribe to get notified when it goes live.'},
            {icon:'🔐',title:'Unique accounts — coming soon',desc:'Your identity and progress will be fully secured in the next update.'},
            {icon:'💛',title:'Donations & Sadaqah — coming soon',desc:'A transparent system to support this work. Every contribution will be announced publicly.'},
          ].map((u,i)=>(
            <div key={i} style={{display:'flex',gap:14,padding:'14px 22px',borderBottom:i<2?'0.5px solid var(--border)':'none',alignItems:'flex-start'}}>
              <span style={{fontSize:18,flexShrink:0,marginTop:2}}>{u.icon}</span>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'var(--cream)',marginBottom:4}}>{u.title}</div>
                <div style={{fontSize:12,color:'var(--cream3)',lineHeight:1.7}}>{u.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── READER — inline interaction, no popup ── */
function ReaderView({surah,content,loading,completed,markRead,allSurahs,openSurah,showToast}){
  const [activeAyah,setActiveAyah]=useState(null);
  const [qari,setQari]=useState(QARIS[0]);
  const [translation,setTranslation]=useState(TRANSLATIONS[0]);
  const [flipping,setFlipping]=useState(false);
  const [transCache,setTransCache]=useState({});
  const [fontSize,setFontSize]=useState(26);
  const [quranFont,setQuranFont]=useState('Amiri');
  const audioRef=useRef(null);

  const doFlip=(dir)=>{
    if(flipping)return;
    setFlipping(true);
    setTimeout(()=>{
      const idx=allSurahs.findIndex(s=>s.n===surah.n);
      if(dir==='next'&&idx<allSurahs.length-1)openSurah(allSurahs[idx+1]);
      if(dir==='prev'&&idx>0)openSurah(allSurahs[idx-1]);
      setFlipping(false);
    },400);
  };

  const getAudioUrl=(ayahN)=>{
    const globalN=(SURAH_OFFSETS[surah.n-1]||1)+(ayahN-1);
    return `https://cdn.islamic.network/quran/audio/128/${qari.id}/${globalN}.mp3`;
  };

  const loadTrans=(ayahN)=>{
    const key=translation.id+':'+surah.n;
    if(transCache[key]) return;
    fetch(`https://api.alquran.cloud/v1/surah/${surah.n}/${translation.id}`)
      .then(r=>r.json())
      .then(d=>{
        const map={};
        d.data.ayahs.forEach(a=>{map[a.numberInSurah]=a.text});
        setTransCache(prev=>({...prev,[key]:map}));
      }).catch(()=>{});
  };

  const getTrans=(n)=>{
    const key=translation.id+':'+surah.n;
    return transCache[key]?.[n]||null;
  };

  const tapAyah=(ayah)=>{
    if(activeAyah?.n===ayah.n){setActiveAyah(null);return;}
    setActiveAyah(ayah);
    loadTrans(ayah.n);
    setTimeout(()=>audioRef.current?.play(),200);
  };

  if(loading)return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}>
      <div style={{fontFamily:'Amiri,serif',fontSize:32,color:'var(--gold)',opacity:0.4,animation:'pulse 1.5s infinite'}}>جَارٍ التَّحْمِيل</div>
      <div style={{fontSize:13,color:'var(--cream3)',letterSpacing:1}}>Loading {surah?.name}...</div>
    </div>
  );
  if(!content)return null;

  const totalDone=content.filter(a=>completed[surah.n+':'+a.n]).length;
  const pct=Math.round(totalDone/content.length*100);
  const prevS=allSurahs.find(s=>s.n===surah.n-1);
  const nextS=allSurahs.find(s=>s.n===surah.n+1);

  return(
    <div style={{paddingBottom:20,animation:flipping?'flipIn 0.4s ease both':'none'}}>

      {/* Surah header */}
      <div style={{borderBottom:'0.5px solid var(--border)',background:'radial-gradient(ellipse at 50% 0%,rgba(200,164,90,0.07) 0%,transparent 70%)'}}>
        {/* Arabic title */}
        <div style={{textAlign:'center',padding:'24px 20px 16px'}}>
          <div style={{fontFamily:'Amiri,serif',fontSize:48,color:'var(--gold)',lineHeight:1.6,textShadow:'0 2px 30px rgba(200,164,90,0.25)'}}>{surah.ar}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'var(--cream3)',marginTop:4,letterSpacing:1.5}}>{surah.meaning} · {surah.type} · {surah.ayahs} Ayahs</div>
          {surah.n!==9&&<div style={{fontFamily:'Amiri,serif',fontSize:22,color:'var(--cream2)',marginTop:12,opacity:0.55,lineHeight:2}}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>}
          {/* Progress + tools row */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:14,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:20}}>
              <div style={{width:40,height:3,background:'var(--bg4)',borderRadius:2}}><div style={{height:3,width:pct+'%',background:'var(--gold)',borderRadius:2,transition:'width 0.5s'}}/></div>
              <span style={{fontSize:11,color:'var(--cream3)',fontVariantNumeric:'tabular-nums'}}>{totalDone}/{content.length}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:20,overflow:'hidden'}}>
              <button onClick={()=>setFontSize(f=>Math.max(18,f-2))} style={{background:'none',border:'none',color:'var(--cream3)',cursor:'pointer',padding:'5px 12px',fontSize:14,fontWeight:500}}>A−</button>
              <span style={{fontSize:11,color:'var(--cream3)',minWidth:24,textAlign:'center'}}>{fontSize}</span>
              <button onClick={()=>setFontSize(f=>Math.min(40,f+2))} style={{background:'none',border:'none',color:'var(--cream3)',cursor:'pointer',padding:'5px 12px',fontSize:14,fontWeight:500}}>A+</button>
            </div>
            <select onChange={e=>setQuranFont(e.target.value)} value={quranFont} style={{background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:20,padding:'5px 10px',color:'var(--cream3)',fontSize:11,cursor:'pointer',outline:'none'}}>
              <option value="Amiri">Amiri</option>
              <option value="Scheherazade New">Scheherazade</option>
              <option value="serif">Classic</option>
            </select>
            <button onClick={()=>{content.forEach(a=>markRead(surah.n,a.n,content.length));showToast('✦ All ayahs marked as read!')}} style={{background:'var(--gold)',border:'none',borderRadius:20,padding:'5px 14px',color:'#08100A',cursor:'pointer',fontSize:11,fontFamily:"'Cormorant Garamond',serif",fontWeight:600}}>Mark All ✦</button>
          </div>
        </div>

        {/* Qari selector */}
        <div style={{padding:'10px 16px',borderTop:'0.5px solid var(--border)',background:'rgba(0,0,0,0.15)'}}>
          <div style={{fontSize:10,color:'var(--cream3)',letterSpacing:1.5,marginBottom:8,textAlign:'center'}}>RECITER — tap to switch</div>
          <div style={{display:'flex',gap:6,justifyContent:'center',flexWrap:'wrap'}}>
            {QARIS.map(q=>(
              <button key={q.id} onClick={()=>{setQari(q);if(activeAyah)setTimeout(()=>audioRef.current?.play(),100)}}
                className={'qari-pill'+(qari.id===q.id?' active':'')}>
                {qari.id===q.id&&<span style={{marginRight:4}}>▶</span>}{q.name.split(' ').slice(-1)[0]}
                {qari.id===q.id&&<span style={{marginLeft:4,fontSize:9,opacity:0.7}}>{q.style}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Translation selector */}
        <div style={{padding:'10px 16px 14px',borderTop:'0.5px solid var(--border)',background:'rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:10,color:'var(--cream3)',letterSpacing:1.5,marginBottom:8,textAlign:'center'}}>TRANSLATION — tap to switch</div>
          <div style={{display:'flex',gap:5,justifyContent:'center',flexWrap:'wrap'}}>
            {TRANSLATIONS.map(t=>(
              <button key={t.id} onClick={()=>{setTranslation(t);setTransCache({})}}
                className={'trans-pill'+(translation.id===t.id?' active':'')}>
                {t.name.split(' — ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quran text — inline expandable */}
      <div style={{margin:'16px',background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:16,overflow:'hidden',boxShadow:'0 8px 40px rgba(0,0,0,0.3)'}}>
        {/* Ornament */}
        <div style={{textAlign:'center',padding:'20px 0 8px'}}>
          <svg width="180" height="16" viewBox="0 0 180 16"><line x1="0" y1="8" x2="72" y2="8" stroke="rgba(200,164,90,0.2)" strokeWidth="0.8"/><polygon points="80,2 86,8 80,14 74,8" fill="none" stroke="rgba(200,164,90,0.4)" strokeWidth="0.8"/><circle cx="90" cy="8" r="1.5" fill="rgba(200,164,90,0.5)"/><polygon points="100,2 94,8 100,14 106,8" fill="none" stroke="rgba(200,164,90,0.4)" strokeWidth="0.8"/><line x1="108" y1="8" x2="180" y2="8" stroke="rgba(200,164,90,0.2)" strokeWidth="0.8"/></svg>
        </div>

        {/* Continuous text */}
        <div style={{padding:'8px 24px 24px',fontFamily:quranFont+',serif',fontSize:fontSize,lineHeight:2.8,textAlign:'right',direction:'rtl',wordSpacing:6}}>
          {content.map(a=>{
            const isRead=!!completed[surah.n+':'+a.n];
            const isActive=activeAyah?.n===a.n;
            const trans=getTrans(a.n);
            return(
              <span key={a.n}>
                {/* Ayah text */}
                <span
                  onClick={()=>tapAyah(a)}
                  style={{color:isRead?'var(--gold)':isActive?'var(--cream)':'var(--cream)',opacity:isRead?0.65:1,cursor:'pointer',transition:'all 0.2s',background:isActive?'rgba(200,164,90,0.1)':'transparent',borderRadius:4,padding:'0 2px'}}
                >{a.ar}</span>
                {/* Ayah number badge */}
                <span
                  onClick={()=>tapAyah(a)}
                  className={'ayah-num'+(isRead?' done':'')}
                  style={{cursor:'pointer'}}
                >{a.n}</span>
                {' '}
                {/* Inline expansion */}
                {isActive&&(
                  <span style={{display:'block',direction:'ltr',textAlign:'left',margin:'4px 0 16px',borderRadius:16,overflow:'hidden',border:'1px solid var(--border2)',background:'var(--bg3)'}}>
                    {/* Ayah label bar */}
                    <span style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',borderBottom:'0.5px solid var(--border)',background:'rgba(200,164,90,0.06)'}}>
                      <span style={{fontFamily:'Amiri,serif',fontSize:11,color:'var(--gold)',letterSpacing:2,opacity:0.7}}>{surah.name.toUpperCase()} · AYAH {a.n}</span>
                      <span onClick={(e)=>{e.stopPropagation();setActiveAyah(null)}} style={{cursor:'pointer',color:'var(--cream3)',fontSize:18,lineHeight:1,padding:'0 4px'}}>×</span>
                    </span>
                    {/* Translation */}
                    <span style={{display:'block',padding:'14px 18px 10px',borderBottom:'0.5px solid var(--border)'}}>
                      {trans?(
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontStyle:'italic',color:'var(--cream2)',lineHeight:1.9,display:'block',direction:translation.lang==='ur'?'rtl':'ltr',textAlign:translation.lang==='ur'?'right':'left'}}>{trans}</span>
                      ):(
                        <span style={{fontSize:13,color:'var(--cream3)',display:'block',animation:'pulse 1.5s infinite'}}>Loading {translation.name.split(' — ')[0]}...</span>
                      )}
                    </span>
                    {/* Custom audio section */}
                    <span style={{display:'block',padding:'14px 18px',borderBottom:'0.5px solid var(--border)',background:'rgba(0,0,0,0.2)'}}>
                      <span style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                        <span style={{display:'flex',alignItems:'center',gap:6,padding:'4px 12px',background:'var(--gold3)',border:'0.5px solid var(--border2)',borderRadius:20}}>
                          <span style={{fontSize:14}}>🎵</span>
                          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'var(--gold)'}}>{qari.name}</span>
                          <span style={{fontSize:10,color:'var(--cream3)',background:'var(--bg4)',padding:'2px 6px',borderRadius:10}}>{qari.style}</span>
                        </span>
                      </span>
                      <audio
                        ref={audioRef}
                        key={qari.id+':'+a.n}
                        src={getAudioUrl(a.n)}
                        controls
                        style={{width:'100%',height:36,borderRadius:10,accentColor:'#C8A45A',colorScheme:'dark'}}
                        onError={e=>{e.target.load()}}
                      />
                    </span>
                    {/* Mark read */}
                    <span style={{display:'block',padding:'12px 14px'}}>
                      <button
                        onClick={(e)=>{e.stopPropagation();markRead(surah.n,a.n,content.length);setActiveAyah(null)}}
                        style={{width:'100%',background:isRead?'transparent':'var(--gold)',border:isRead?'0.5px solid var(--border)':'none',borderRadius:10,padding:'12px',cursor:'pointer',fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:isRead?'var(--gold)':'#08100A',letterSpacing:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}
                      >
                        {isRead?<><span>✓</span><span>Already Read</span></>:<><span>✦</span><span>Mark as Read · +1 point</span></>}
                      </button>
                    </span>
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* Bottom ornament */}
        <div style={{textAlign:'center',padding:'0 0 20px'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:11,color:'rgba(200,164,90,0.3)',letterSpacing:3}}>· {surah.n} ·</div>
        </div>
      </div>

      <div style={{textAlign:'center',fontSize:11,color:'var(--cream3)',margin:'8px 0 12px',letterSpacing:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
        <span style={{fontSize:14}}>👆</span> Tap any ayah to read translation and hear recitation
      </div>

      {/* Page flip nav */}
      <div style={{display:'flex',margin:'0 16px',border:'0.5px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
        {prevS&&(
          <button onClick={()=>doFlip('prev')} disabled={flipping}
            style={{flex:1,background:'var(--bg3)',border:'none',borderRight:'0.5px solid var(--border)',padding:'14px 16px',color:'var(--cream2)',cursor:'pointer',fontFamily:"'Cormorant Garamond',serif",fontSize:15,textAlign:'left',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:22,color:'var(--gold)'}}>‹</span>
            <div><div style={{fontSize:10,color:'var(--cream3)',marginBottom:2,letterSpacing:1}}>PREV</div>{prevS.name}</div>
          </button>
        )}
        {nextS&&(
          <button onClick={()=>doFlip('next')} disabled={flipping}
            style={{flex:1,background:'var(--bg3)',border:'none',padding:'14px 16px',color:'var(--cream2)',cursor:'pointer',fontFamily:"'Cormorant Garamond',serif",fontSize:15,textAlign:'right',display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8}}>
            <div><div style={{fontSize:10,color:'var(--cream3)',marginBottom:2,letterSpacing:1}}>NEXT</div>{nextS.name}</div>
            <span style={{fontSize:22,color:'var(--gold)'}}>›</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── RECITATIONS ── */
function RecitationsView({episodes,liveCount,loading,userName}){
  const [active,setActive]=useState(null);
  const [playing,setPlaying]=useState(false);
  const [tickIdx,setTickIdx]=useState(0);
  const daysLeft=Math.max(0,Math.round((new Date('2027-02-16')-new Date())/86400000));
  const pct=episodes.length>0?Math.round(episodes.length/365*100):0;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{if(episodes.length>0&&!active)setActive(episodes[0]);},[episodes]);
  useEffect(()=>{const t=setInterval(()=>setTickIdx(i=>(i+1)%ACTIVITY.length),3500);return()=>clearInterval(t);},[]);

  const live=isEpisodeLive(active);

  return(
    <div style={{paddingBottom:20}}>
      <div style={{margin:16,borderRadius:18,overflow:'hidden',background:'var(--bg3)',border:'0.5px solid var(--border2)',position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 20% 80%,rgba(200,164,90,0.06) 0%,transparent 60%)',pointerEvents:'none'}}/>
        <div style={{padding:'22px 22px 20px',position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
            {live?(
              <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(224,82,82,0.12)',border:'1px solid rgba(224,82,82,0.3)',borderRadius:20,padding:'4px 10px'}}>
                <div className="live-dot"/><span style={{fontSize:11,fontWeight:500,color:'var(--red)',letterSpacing:1}}>LIVE NOW</span>
              </div>
            ):(
              <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--gold3)',border:'0.5px solid var(--border2)',borderRadius:20,padding:'4px 10px'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'var(--gold)',animation:'pulse 3s infinite'}}/><span style={{fontSize:11,color:'var(--gold)',letterSpacing:1}}>UPLOADING SHORTLY</span>
              </div>
            )}
            <div style={{fontSize:12,color:'var(--cream3)',display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',animation:'pulse 2s infinite'}}/>{liveCount} listening
            </div>
          </div>
          {active?(
            <>
              <div style={{fontFamily:'Amiri,serif',fontSize:11,color:'var(--gold)',letterSpacing:3,marginBottom:6,opacity:0.7}}>DAY {active.day} OF 365</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:300,lineHeight:1.1,marginBottom:4,color:'var(--cream)'}}>{active.surah_name}</div>
              <div style={{fontFamily:'Amiri,serif',fontSize:26,color:'var(--gold)',marginBottom:10}}>{active.surah_ar}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'var(--cream3)',lineHeight:1.7,fontStyle:'italic',marginBottom:18}}>{active.description}</div>
              {!live&&<div style={{background:'rgba(200,164,90,0.08)',border:'0.5px solid var(--border)',borderRadius:10,padding:'12px 16px',marginBottom:16,fontSize:13,color:'var(--cream3)',lineHeight:1.7}}>🕐 Today's recitation hasn't gone live yet. Please have patience — the audio will be uploaded shortly after Fajr. Come back soon ☽</div>}
              {active.audio_url?(
                <div style={{background:'var(--bg4)',borderRadius:14,padding:'16px 18px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
                    <button onClick={()=>setPlaying(p=>!p)} style={{width:44,height:44,borderRadius:'50%',background:'var(--gold)',border:'none',cursor:'pointer',fontSize:16,color:'#08100A',flexShrink:0,fontWeight:600}}>{playing?'⏸':'▶'}</button>
                    <div><div style={{fontSize:13,color:'var(--cream)',marginBottom:2}}>{active.surah_name} · Ayahs {active.ayah_range}</div><div style={{fontSize:11,color:'var(--cream3)'}}>{active.duration} · Anonymous Recitation</div></div>
                  </div>
                  <Waveform playing={playing} color="var(--gold)" size={1}/>
                  <audio src={active.audio_url} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} style={{width:'100%',marginTop:12,height:32}} controls/>
                </div>
              ):(
                <div style={{background:'var(--bg4)',borderRadius:14,padding:'20px',textAlign:'center'}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'var(--cream2)',marginBottom:8}}>{episodes.length===0?'First Recitation Starting Mar 25, 2026':'Coming Shortly'}</div>
                  <div style={{fontSize:13,color:'var(--cream3)',lineHeight:1.7}}>{episodes.length===0?'The journey begins 25 March 2026. One recitation every day until Ramadan 2027.':'Upload in progress. Refresh in a few minutes.'}</div>
                </div>
              )}
            </>
          ):(
            <div style={{textAlign:'center',padding:'40px 0'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'var(--cream2)',marginBottom:8}}>Journey Begins March 25, 2026</div>
              <div style={{fontSize:13,color:'var(--cream3)',lineHeight:1.8}}>One recitation every day · Complete Quran by Ramadan 2027<br/>365 days · 114 Surahs · One anonymous voice for all humanity</div>
            </div>
          )}
        </div>
      </div>

      {/* Live ticker */}
      <div style={{margin:'0 16px 14px',background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:12,padding:'11px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'var(--gold)',animation:'pulse 1.8s infinite',flexShrink:0}}/>
          <div style={{fontSize:12,color:'var(--cream2)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ACTIVITY[tickIdx]}</div>
        </div>
      </div>

      {/* Ramadan countdown */}
      <div style={{margin:'0 16px 16px',background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:14,padding:'18px 20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'var(--cream)'}}>Journey to Ramadan 2027</div>
            <div style={{fontSize:12,color:'var(--cream3)',marginTop:2}}>{daysLeft} days remaining · {episodes.length} episodes recorded</div>
          </div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:'var(--gold)'}}>{pct}%</div>
        </div>
        <div style={{height:4,background:'var(--bg4)',borderRadius:4}}><div style={{height:'100%',width:pct+'%',background:'linear-gradient(90deg,var(--gold2),var(--gold))',borderRadius:4}}/></div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:11,color:'var(--cream3)'}}><span>Mar 25, 2026</span><span style={{color:'var(--gold)'}}>☽ Ramadan 2027</span></div>
      </div>

      <GoldLine/>

      <div style={{padding:'12px 16px 4px',fontFamily:"'Cormorant Garamond',serif",fontSize:11,color:'var(--gold)',letterSpacing:2,opacity:0.7}}>ALL EPISODES</div>
      {episodes.length===0&&!loading&&(
        <div style={{padding:'40px 20px',textAlign:'center'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'var(--cream2)',marginBottom:8}}>First episode coming March 25, 2026</div>
          <div style={{fontSize:12,color:'var(--cream3)'}}>Use 🎙 Recording Studio (sidebar or mobile header) to post recitations</div>
        </div>
      )}
      {episodes.map(ep=>{
        const epLive=isEpisodeLive(ep);
        return(
          <div key={ep.id} className="row-hover" onClick={()=>{setActive(ep);window.scrollTo({top:0,behavior:'smooth'})}} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderBottom:'0.5px solid rgba(255,255,255,0.03)',cursor:'pointer',background:active?.id===ep.id?'var(--bg3)':'transparent',borderLeft:active?.id===ep.id?'2px solid var(--gold)':'2px solid transparent',transition:'all 0.2s'}}>
            <div style={{width:44,height:44,borderRadius:12,background:active?.id===ep.id?'var(--gold)':'var(--bg3)',border:'0.5px solid '+(active?.id===ep.id?'var(--gold)':'var(--border)'),display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:active?.id===ep.id?'#08100A':'var(--cream3)',flexShrink:0}}>
              {active?.id===ep.id&&playing?<Waveform playing={true} color={active?.id===ep.id?'#08100A':'var(--gold)'} size={0.35}/>:ep.day}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:'var(--cream)'}}>{ep.surah_name}</span>
                {epLive&&<span style={{fontSize:10,background:'rgba(224,82,82,0.12)',color:'var(--red)',border:'0.5px solid rgba(224,82,82,0.3)',borderRadius:10,padding:'2px 7px'}}>LIVE</span>}
              </div>
              <div style={{fontSize:12,color:'var(--cream3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ep.description}</div>
              <div style={{display:'flex',gap:12,marginTop:3,fontSize:11,color:'var(--cream3)'}}><span>{ep.date}</span><span>{ep.duration}</span><span style={{color:'var(--gold)',opacity:0.7}}>{ep.listens||0} listens</span></div>
            </div>
          </div>
        );
      })}
      {active&&<div style={{margin:'16px',background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:16,overflow:'hidden'}}><CommentsSection episode={active} userName={userName||'Anonymous'}/></div>}
    </div>
  );
}

/* ── LEADERBOARD ── */
function LeaderboardView({userName,pts,completed}){
  const [board,setBoard]=useState([]);const [loading,setLoading]=useState(true);
  const myAyahs=Object.keys(completed).length;
  useEffect(()=>{getLeaderboard().then(d=>{setBoard(d);setLoading(false)});},[]);
  const full=[...board];
  if(!full.find(u=>u.name===userName)&&pts>0)full.push({name:userName,pts,ayahs_read:myAyahs,streak:1});
  full.sort((a,b)=>b.pts-a.pts);
  const myRank=full.findIndex(u=>u.name===userName)+1;
  return(
    <div style={{paddingBottom:20}}>
      <div style={{padding:'28px 24px 20px',textAlign:'center',borderBottom:'0.5px solid var(--border)',background:'radial-gradient(ellipse at 50% 0%,rgba(200,164,90,0.04) 0%,transparent 70%)'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:300,marginBottom:8,color:'var(--cream)'}}>The Ranks</div>
        <div style={{fontSize:13,color:'var(--cream3)',lineHeight:1.7}}>1 point per ayah · 50 bonus points per completed surah</div>
        {myRank>0&&<div style={{marginTop:14,display:'inline-block',background:'var(--gold3)',border:'0.5px solid var(--border2)',borderRadius:20,padding:'6px 18px',fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'var(--gold)'}}>Your rank: #{myRank} of {full.length} readers worldwide</div>}
      </div>
      {loading&&<div style={{textAlign:'center',padding:'40px 0',fontSize:13,color:'var(--cream3)',animation:'pulse 1.5s infinite'}}>Loading rankings...</div>}
      {full.map((u,i)=>{
        const isMe=u.name===userName;
        const medal=i===0?'◈':i===1?'◆':i===2?'◇':'';
        return(
          <div key={u.name} style={{display:'flex',alignItems:'center',padding:'16px 20px',borderBottom:'0.5px solid rgba(255,255,255,0.03)',background:isMe?'var(--bg3)':'transparent',borderLeft:isMe?'2px solid var(--gold)':'2px solid transparent'}}>
            <div style={{width:36,fontFamily:"'Cormorant Garamond',serif",fontSize:medal?22:15,color:i<3?'var(--gold)':'var(--cream3)',textAlign:'center',flexShrink:0}}>{medal||'#'+(i+1)}</div>
            <div style={{flex:1,marginLeft:14}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:isMe?'var(--gold)':'var(--cream)',marginBottom:3}}>{isMe?'✦ ':''}{u.name}</div>
              <div style={{fontSize:12,color:'var(--cream3)'}}>{(u.ayahs_read||0).toLocaleString()} ayahs · {u.streak||1} day streak</div>
            </div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'var(--gold)',background:'var(--gold3)',padding:'6px 14px',borderRadius:20,border:'0.5px solid var(--border)'}}>{u.pts}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── PROFILE ── */
function ProfileView({userName,pts,completed,theme,setTheme,onLogout}){
  const [bio,setBio]=useState(()=>localStorage.getItem('nq_bio')||'');
  const [editing,setEditing]=useState(false);
  const [verse,setVerse]=useState(()=>localStorage.getItem('nq_verse')||'');
  const totalRead=Object.keys(completed).length;
  const pct=Math.round(totalRead/6236*100);
  return(
    <div style={{paddingBottom:20}}>
      {/* Profile hero */}
      <div style={{padding:'32px 24px 24px',textAlign:'center',borderBottom:'0.5px solid var(--border)',background:'radial-gradient(ellipse at 50% 0%,rgba(200,164,90,0.06) 0%,transparent 70%)'}}>
        <div style={{width:80,height:80,borderRadius:'50%',background:'var(--gold3)',border:'2px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:32,color:'var(--gold)',margin:'0 auto 16px'}}>{userName.slice(0,2).toUpperCase()}</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:'var(--cream)',marginBottom:4}}>{userName}</div>
        <div style={{fontSize:13,color:'var(--gold)',marginBottom:16}}>✦ {pts.toLocaleString()} points · {totalRead.toLocaleString()} ayahs read</div>
        {/* Progress ring substitute */}
        <div style={{display:'inline-block',background:'var(--gold3)',border:'0.5px solid var(--border2)',borderRadius:20,padding:'6px 18px',fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'var(--gold)',marginBottom:20}}>{pct}% of the complete Quran</div>
        {/* Bio */}
        <div style={{maxWidth:480,margin:'0 auto'}}>
          {editing?(
            <div>
              <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Write something about yourself or your journey with the Quran..." rows={3} style={{width:'100%',background:'var(--bg3)',border:'0.5px solid var(--border2)',borderRadius:10,padding:'12px 16px',color:'var(--cream)',fontSize:14,outline:'none',resize:'none',fontFamily:"'DM Sans',sans-serif",marginBottom:8}}/>
              <input value={verse} onChange={e=>setVerse(e.target.value)} placeholder="Your favourite Quran verse or meaning (optional)..." style={{width:'100%',background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:10,padding:'12px 16px',color:'var(--cream)',fontSize:14,outline:'none',marginBottom:10,fontFamily:"'Amiri',serif"}}/>
              <button onClick={()=>{localStorage.setItem('nq_bio',bio);localStorage.setItem('nq_verse',verse);setEditing(false)}} style={{background:'var(--gold)',border:'none',borderRadius:10,padding:'10px 24px',color:'#08100A',fontFamily:"'Cormorant Garamond',serif",fontSize:16,cursor:'pointer',marginRight:8}}>Save</button>
              <button onClick={()=>setEditing(false)} style={{background:'transparent',border:'0.5px solid var(--border)',borderRadius:10,padding:'10px 18px',color:'var(--cream3)',cursor:'pointer',fontSize:14}}>Cancel</button>
            </div>
          ):(
            <div onClick={()=>setEditing(true)} style={{cursor:'pointer',padding:'14px 18px',background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:12,textAlign:'left'}}>
              {bio?<p style={{fontSize:14,color:'var(--cream2)',lineHeight:1.7,marginBottom:verse?10:0}}>{bio}</p>:<p style={{fontSize:13,color:'var(--cream3)',fontStyle:'italic'}}>Tap to add a bio or share your thoughts on your Quran journey...</p>}
              {verse&&<div style={{fontFamily:'Amiri,serif',fontSize:17,color:'var(--gold)',textAlign:'right',direction:'rtl',paddingTop:10,borderTop:'0.5px solid var(--border)'}}>{verse}</div>}
              <div style={{fontSize:11,color:'var(--cream3)',marginTop:8}}>✏ Tap to edit</div>
            </div>
          )}
        </div>
      </div>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,padding:'20px 16px'}}>
        {[{l:'Total Points',v:pts.toLocaleString()},{l:'Ayahs Read',v:totalRead.toLocaleString()},{l:'Surahs Started',v:Object.keys(completed).map(k=>k.split(':')[0]).filter((v,i,a)=>a.indexOf(v)===i).length},{l:'Quran Progress',v:pct+'%'}].map(s=>(
          <div key={s.l} style={{background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:12,padding:'16px',textAlign:'center'}}>
            <div style={{fontSize:11,color:'var(--cream3)',marginBottom:6,letterSpacing:0.5}}>{s.l.toUpperCase()}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:'var(--gold)'}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{padding:'0 16px'}}>
        <button onClick={onLogout} style={{width:'100%',marginBottom:12,background:'transparent',border:'0.5px solid var(--border)',borderRadius:12,padding:'13px',color:'var(--cream3)',fontFamily:"'Cormorant Garamond',serif",fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          <span>⎋</span> Sign Out
        </button>
        <div style={{background:'var(--gold3)',border:'0.5px solid var(--border2)',borderRadius:12,padding:'16px 20px',textAlign:'center',marginBottom:12}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'var(--cream)',marginBottom:6}}>Share your profile</div>
          <div style={{fontSize:12,color:'var(--cream3)',marginBottom:12}}>Copy this and share with friends to invite them to read together</div>
          <div style={{background:'var(--bg3)',borderRadius:8,padding:'10px 14px',fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:'var(--gold)',wordBreak:'break-all'}}>I have read {totalRead} ayahs of the Quran on NurQuran ({pct}%). Join me — it is free! 🌙</div>
        </div>
        {/* Coming soon notice */}
        <div style={{background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:12,padding:'16px 20px'}}>
          <div style={{fontFamily:'Amiri,serif',fontSize:16,color:'var(--gold)',marginBottom:6,textAlign:'center'}}>قَرِيبًا إِن شَاءَ اللَّه</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:'var(--cream)',marginBottom:8,textAlign:'center'}}>Coming in the next update</div>
          <div style={{fontSize:12,color:'var(--cream3)',lineHeight:1.9}}>
            🔐 <strong style={{color:'var(--cream2)'}}>Unique accounts</strong> — your identity will be secured so no two readers share the same name or progress.<br/>
            💛 <strong style={{color:'var(--cream2)'}}>Donations & Sadaqah</strong> — a transparent system to support this work when you are ready.<br/>
            📿 <strong style={{color:'var(--cream2)'}}>Zakat al-Fitr calculator</strong> — before Ramadan 2027, insha'Allah.
          </div>
          <div style={{fontSize:11,color:'var(--gold)',marginTop:12,textAlign:'center',opacity:0.7}}>JazakAllahu Khayran for your patience and trust</div>
        </div>
      </div>
    </div>
  );
}

/* ── ABOUT ── */
function AboutView(){
  return(
    <div style={{paddingBottom:20}}>
      <div style={{padding:'36px 28px',maxWidth:700,margin:'0 auto'}}>
        <div style={{fontFamily:'Amiri,serif',fontSize:32,color:'var(--gold)',lineHeight:1.9,textAlign:'center',marginBottom:8}}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:300,textAlign:'center',marginBottom:6,color:'var(--cream)'}}>About NurQuran</div>
        <div style={{fontFamily:'Amiri,serif',fontSize:13,color:'var(--cream3)',textAlign:'center',letterSpacing:2,marginBottom:36}}>نور القرآن · The Light of the Quran</div>
        {[
          {title:'Why we built this',body:"Most Quran apps are built by corporations. NurQuran is built by one person with one purpose — to make the Quran accessible to every human on earth, in every language, on any device, for free. No ads. No subscriptions. No data sold. Just the Quran."},
          {title:'The recitation mission',body:"Starting March 25, 2026, one anonymous voice will recite a portion of the Quran every single day. 365 days. 114 Surahs. The complete Quran read before Ramadan 2027. We are not doing this for fame. We are doing this because Allah's words deserve to be heard."},
          {title:'10 minutes a day',body:"You do not need to read the whole Quran today. You need to read a little, every day, for the rest of your life. NurQuran tracks your progress, reminds you to return, and celebrates every ayah you complete. 10 minutes of Quran a day is worth more than hours of anything else."},
          {title:'For every human',body:"The Quran is not for Muslims only — it is a guidance for all of mankind. NurQuran is translated into 6+ languages and is available anywhere in the world with internet access. Every person deserves access to the words of Allah."},
          {title:'Open to correction',body:"We are human. The recitations may have errors in tajweed. That is why we have a correction system — listeners can flag mistakes and the reciter can improve. We believe in humility. If you hear something wrong, please let us know."},
          {title:'Contact',body:"This is a community project. If you want to contribute translations, report an issue, or simply say salam — reach out through the feedback section inside the app."},
          {title:'Coming in next update — InshaAllah',body:"We are actively working on: (1) Unique user accounts so no two readers share the same identity — your progress will truly be yours. (2) A transparent donation and Sadaqah system so you can support this work when you are ready. (3) Zakat al-Fitr calculator before Ramadan 2027. These features will arrive after we establish trust with our community. Please make dua for us."},
        ].map(s=>(
          <div key={s.title} style={{marginBottom:30}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'var(--gold)',marginBottom:10,paddingBottom:8,borderBottom:'0.5px solid var(--border)'}}>{s.title}</div>
            <div style={{fontSize:15,color:'var(--cream2)',lineHeight:1.9}}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── PRIVACY ── */
function PrivacyView(){
  return(
    <div style={{paddingBottom:20}}>
      <div style={{padding:'36px 28px',maxWidth:700,margin:'0 auto'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:300,textAlign:'center',marginBottom:6,color:'var(--cream)'}}>Privacy Policy</div>
        <div style={{fontSize:12,color:'var(--cream3)',textAlign:'center',marginBottom:36}}>Last updated: March 22, 2026</div>
        {[
          {title:'What we collect',body:"We store your chosen display name and your reading progress (which ayahs you have marked as read) locally on your device. If you appear on the leaderboard, your display name and point total are stored in our database (Supabase). We do not collect your real name, email, phone number, or any identifying information."},
          {title:'What we do not collect',body:"We do not collect your IP address, location, device identifiers, or browsing history. We do not use cookies for tracking. We do not run any advertising scripts. We do not sell any data to anyone, ever."},
          {title:'Third-party services',body:"We use Supabase (database), Cloudinary (audio storage), and the AlQuran Cloud API (Quran text and audio). Each of these services has their own privacy policy. We use them only for the functionality of the app."},
          {title:'Your data',body:"Your reading progress is stored locally on your device. You can clear it any time by clearing your browser data. Your leaderboard entry can be removed by contacting us. We retain no personal information beyond your display name and points."},
          {title:'Children',body:"NurQuran is appropriate for all ages. We do not knowingly collect any data from children under 13."},
          {title:'Changes',body:"If we ever change this policy, we will update this page. Your continued use of the app means you accept any updates."},
          {title:'Contact',body:"For any privacy concerns, please use the feedback section inside the app."},
        ].map(s=>(
          <div key={s.title} style={{marginBottom:28}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'var(--gold)',marginBottom:8,paddingBottom:6,borderBottom:'0.5px solid var(--border)'}}>{s.title}</div>
            <div style={{fontSize:14,color:'var(--cream2)',lineHeight:1.9}}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SEARCH ── */
function SearchView({openSurah}){
  const [q,setQ]=useState('');
  const results=q?SURAHS.filter(s=>s.name.toLowerCase().includes(q.toLowerCase())||s.ar.includes(q)||s.meaning.toLowerCase().includes(q.toLowerCase())||String(s.n).includes(q)):SURAHS;
  return(
    <div style={{paddingBottom:20}}>
      <div style={{padding:'16px',borderBottom:'0.5px solid var(--border)',position:'sticky',top:0,background:'var(--bg)',zIndex:50}}>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by surah name, number or meaning…" style={{width:'100%',background:'var(--bg3)',border:'0.5px solid var(--border2)',borderRadius:12,padding:'14px 18px',color:'var(--cream)',fontSize:15,outline:'none',fontFamily:"'DM Sans',sans-serif"}}/>
      </div>
      <div style={{padding:'8px'}}>
        <div className="surah-grid">
          {results.map(s=>(
            <div key={s.n} className="row-hover" onClick={()=>openSurah(s)} style={{display:'flex',alignItems:'center',padding:'12px 14px',borderRadius:10,border:'0.5px solid var(--border)',cursor:'pointer',background:'var(--bg2)',transition:'background 0.15s'}}>
              <div style={{width:34,height:34,borderRadius:8,background:'var(--bg4)',border:'0.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'var(--cream3)',flexShrink:0,marginRight:12}}>{s.n}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'var(--cream)'}}>{s.name}</span>
                  <span style={{fontFamily:'Amiri,serif',fontSize:18,color:'var(--gold)',opacity:0.85,flexShrink:0,marginLeft:8}}>{s.ar}</span>
                </div>
                <span style={{fontSize:11,color:'var(--cream3)'}}>{s.meaning} · {s.ayahs} ayahs · {s.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ── SCHOLARS VIEW ── */
function ScholarsView(){
  const [activeScholar,setActiveScholar]=useState(SCHOLARS[0]);
  const [activeVid,setActiveVid]=useState(SCHOLARS[0].videos[0]);

  return(
    <div style={{paddingBottom:20}}>
      {/* Header */}
      <div style={{padding:'28px 24px 20px',borderBottom:'0.5px solid var(--border)',background:'radial-gradient(ellipse at 50% 0%,rgba(200,164,90,0.05) 0%,transparent 70%)'}}>
        <div style={{fontFamily:'Amiri,serif',fontSize:11,color:'var(--gold)',opacity:0.55,letterSpacing:3,marginBottom:8}}>ISLAMIC KNOWLEDGE</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:300,lineHeight:1.2,color:'var(--cream)',marginBottom:6}}>Learn from<br/><em style={{color:'var(--gold)'}}>great scholars</em></div>
        <div style={{fontSize:13,color:'var(--cream3)',lineHeight:1.7}}>Watch lectures, tafseer, and bayans from the most trusted Islamic scholars. Deepen your understanding of the Quran.</div>
      </div>

      {/* Scholar selector - horizontal scroll */}
      <div style={{overflowX:'auto',padding:'16px 16px 8px',display:'flex',gap:10,scrollbarWidth:'none'}}>
        {SCHOLARS.map(s=>(
          <button key={s.name} onClick={()=>{setActiveScholar(s);setActiveVid(s.videos[0])}} style={{
            flexShrink:0,padding:'10px 16px',borderRadius:30,border:'1px solid',
            borderColor:activeScholar.name===s.name?'var(--gold)':'var(--border)',
            background:activeScholar.name===s.name?'var(--gold3)':'var(--bg3)',
            color:activeScholar.name===s.name?'var(--gold)':'var(--cream3)',
            cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'Cormorant Garamond',serif",fontSize:15,
            transition:'all 0.2s'
          }}>{s.name}</button>
        ))}
      </div>

      {/* Active scholar card */}
      <div style={{margin:'8px 16px 16px',background:'var(--bg3)',border:'0.5px solid var(--border2)',borderRadius:16,overflow:'hidden'}}>
        <div style={{padding:'18px 20px 16px',borderBottom:'0.5px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'var(--cream)',marginBottom:2}}>{activeScholar.name}</div>
              <div style={{fontFamily:'Amiri,serif',fontSize:18,color:'var(--gold)',marginBottom:6}}>{activeScholar.ar}</div>
              <div style={{fontSize:13,color:'var(--cream3)',lineHeight:1.6}}>{activeScholar.desc}</div>
            </div>
            <div style={{flexShrink:0,background:'var(--gold3)',border:'0.5px solid var(--border2)',borderRadius:20,padding:'4px 12px',fontSize:11,color:'var(--gold)',letterSpacing:0.5,whiteSpace:'nowrap'}}>{activeScholar.tag}</div>
          </div>
        </div>

        {/* Video player */}
        <div style={{position:'relative',paddingBottom:'56.25%',height:0,background:'#000'}}>
          <iframe
            key={activeVid.id}
            style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}
            src={`https://www.youtube.com/embed/${activeVid.id}?rel=0&modestbranding=1`}
            allowFullScreen
            title={activeVid.title}
          />
        </div>

        {/* Video list */}
        <div style={{padding:'12px 0'}}>
          <div style={{padding:'0 16px 10px',fontSize:11,color:'var(--cream3)',letterSpacing:1}}>MORE LECTURES</div>
          {activeScholar.videos.map((v,i)=>(
            <div key={v.id} onClick={()=>setActiveVid(v)} style={{
              display:'flex',alignItems:'center',gap:12,padding:'10px 16px',cursor:'pointer',
              background:activeVid.id===v.id?'var(--gold3)':'transparent',
              borderLeft:activeVid.id===v.id?'2px solid var(--gold)':'2px solid transparent',
              transition:'all 0.15s'
            }}>
              <div style={{width:32,height:32,borderRadius:8,background:activeVid.id===v.id?'var(--gold)':'var(--bg4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:activeVid.id===v.id?'#08100A':'var(--cream3)',flexShrink:0,fontWeight:600}}>
                {activeVid.id===v.id?'▶':i+1}
              </div>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:activeVid.id===v.id?'var(--gold)':'var(--cream)'}}>{v.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All scholars grid */}
      <div style={{padding:'0 16px 4px',fontFamily:"'Cormorant Garamond',serif",fontSize:11,color:'var(--gold)',letterSpacing:2,opacity:0.7}}>ALL SCHOLARS</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10,padding:'10px 16px'}}>
        {SCHOLARS.map(s=>(
          <div key={s.name} onClick={()=>{setActiveScholar(s);setActiveVid(s.videos[0]);window.scrollTo({top:0,behavior:'smooth'})}}
            className="row-hover"
            style={{background:'var(--bg2)',border:'0.5px solid var(--border)',borderRadius:14,padding:'16px',cursor:'pointer',transition:'all 0.2s'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'var(--cream)'}}>{s.name}</div>
              <div style={{fontSize:10,color:'var(--gold)',background:'var(--gold3)',padding:'3px 10px',borderRadius:20,border:'0.5px solid var(--border2)',whiteSpace:'nowrap'}}>{s.tag.split(' · ')[0]}</div>
            </div>
            <div style={{fontFamily:'Amiri,serif',fontSize:16,color:'var(--gold)',marginBottom:6,opacity:0.8}}>{s.ar}</div>
            <div style={{fontSize:12,color:'var(--cream3)',lineHeight:1.6,marginBottom:10}}>{s.desc}</div>
            <div style={{fontSize:11,color:'var(--gold)',opacity:0.7}}>{s.videos.length} lectures available →</div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ── ERROR BOUNDARY ── */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { /* silent — no console logs shown to user */ }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:32,background:'var(--bg)',flexDirection:'column',textAlign:'center'}}>
        <div style={{fontFamily:'Amiri,serif',fontSize:36,color:'var(--gold)',lineHeight:1.9,marginBottom:8}}>إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:'var(--cream3)',marginBottom:40,letterSpacing:1}}>Indeed, to Allah we belong and to Him we shall return</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:300,color:'var(--cream)',marginBottom:8}}>Something went wrong</div>
        <div style={{fontSize:14,color:'var(--cream3)',lineHeight:1.9,maxWidth:400,marginBottom:8}}>
          Alhamdulillah for the good times, and patience in the difficult ones. We are aware of this issue and are working to fix it.
        </div>
        <div style={{fontSize:13,color:'var(--gold)',marginBottom:36,fontStyle:'italic'}}>جَزَاكَ اللَّهُ خَيْرًا — JazakAllahu Khayran for your patience</div>
        <button onClick={()=>window.location.reload()} style={{background:'var(--gold)',border:'none',borderRadius:12,padding:'14px 32px',color:'#08100A',fontFamily:"'Cormorant Garamond',serif",fontSize:17,cursor:'pointer',letterSpacing:0.5,marginBottom:12}}>
          Try Again
        </button>
        <button onClick={()=>{window.location.href='/'}} style={{background:'transparent',border:'0.5px solid var(--border)',borderRadius:12,padding:'12px 28px',color:'var(--cream3)',fontFamily:"'Cormorant Garamond',serif",fontSize:15,cursor:'pointer'}}>
          Return Home
        </button>
      </div>
    );
  }
}

/* ── NOT FOUND / OFFLINE PAGE ── */
// eslint-disable-next-line no-unused-vars
function ErrorPage({type='notfound'}){
  const msgs = {
    notfound: {
      ar:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
      arTrans:'Allah is sufficient for us and He is the best disposer of affairs',
      title:'Page Not Found',
      body:'The page you are looking for does not exist or may have moved. Please return to the home page.',
    },
    offline: {
      ar:'وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ',
      arTrans:'And be patient — indeed, Allah does not waste the reward of the righteous',
      title:'You are offline',
      body:'It looks like your internet connection is unavailable. Please check your connection and try again. Your reading progress is saved locally.',
    },
    error: {
      ar:'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
      arTrans:'Indeed, with hardship comes ease',
      title:'Something went wrong',
      body:'We are aware of the issue and our team is working on it. Alhamdulillah for your patience. Please try again shortly.',
    }
  };
  const m = msgs[type] || msgs.notfound;
  return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:32,background:'var(--bg)',flexDirection:'column',textAlign:'center',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:'50vh',background:'radial-gradient(ellipse at 50% -10%,rgba(200,164,90,0.06) 0%,transparent 65%)',pointerEvents:'none'}}/>
      <div style={{fontFamily:'Amiri,serif',fontSize:30,color:'var(--gold)',lineHeight:1.9,marginBottom:6,letterSpacing:1}}>{m.ar}</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'var(--cream3)',marginBottom:44,letterSpacing:1,fontStyle:'italic'}}>{m.arTrans}</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:300,color:'var(--cream)',marginBottom:10}}>{m.title}</div>
      <div style={{fontSize:14,color:'var(--cream3)',lineHeight:1.9,maxWidth:420,marginBottom:8}}>{m.body}</div>
      <div style={{fontSize:13,color:'var(--gold)',marginBottom:36,opacity:0.7}}>— NurQuran · نور القرآن</div>
      <button onClick={()=>{window.location.href='/'}} style={{background:'var(--gold)',border:'none',borderRadius:12,padding:'14px 32px',color:'#08100A',fontFamily:"'Cormorant Garamond',serif",fontSize:17,cursor:'pointer',letterSpacing:0.5}}>
        Return to NurQuran
      </button>
    </div>
  );
}


/* ── FOOTER ── */
function Footer({setView}){
  return(
    <footer style={{background:'var(--bg2)',borderTop:'0.5px solid var(--border)',padding:'40px 24px 24px',marginTop:'auto'}}>
      <div style={{maxWidth:860,margin:'0 auto'}}>
        {/* Top row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:32,marginBottom:36}}>
          {/* Brand */}
          <div>
            <div style={{fontFamily:'Amiri,serif',fontSize:10,color:'var(--gold)',opacity:0.5,letterSpacing:3,marginBottom:4}}>نور القرآن</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'var(--gold)',letterSpacing:2,marginBottom:10}}>NurQuran</div>
            <div style={{fontSize:12,color:'var(--cream3)',lineHeight:1.9}}>
              Free for every human on earth.<br/>
              No ads. No subscriptions.<br/>
              Built as sadaqah jariyah. 🌙
            </div>
          </div>
          {/* Quick links */}
          <div>
            <div style={{fontSize:11,color:'var(--gold)',letterSpacing:2,marginBottom:14,opacity:0.7}}>EXPLORE</div>
            {[
              {label:'Read Quran',v:'search'},
              {label:'Daily Recitations',v:'recitations'},
              {label:'Scholars & Bayans',v:'scholars'},
              {label:'Leaderboard',v:'leaderboard'},
              {label:'My Profile',v:'profile'},
            ].map(l=>(
              <div key={l.v} onClick={()=>setView(l.v)} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'var(--cream3)',cursor:'pointer',marginBottom:8,transition:'color 0.15s'}}
                onMouseEnter={e=>e.target.style.color='var(--gold)'}
                onMouseLeave={e=>e.target.style.color='var(--cream3)'}
              >{l.label}</div>
            ))}
          </div>
          {/* Info */}
          <div>
            <div style={{fontSize:11,color:'var(--gold)',letterSpacing:2,marginBottom:14,opacity:0.7}}>INFO</div>
            {[
              {label:'About Us',v:'about'},
              {label:'Privacy Policy',v:'privacy'},
            ].map(l=>(
              <div key={l.v} onClick={()=>setView(l.v)} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'var(--cream3)',cursor:'pointer',marginBottom:8,transition:'color 0.15s'}}
                onMouseEnter={e=>e.target.style.color='var(--gold)'}
                onMouseLeave={e=>e.target.style.color='var(--cream3)'}
              >{l.label}</div>
            ))}
          </div>
          {/* Mission */}
          <div>
            <div style={{fontSize:11,color:'var(--gold)',letterSpacing:2,marginBottom:14,opacity:0.7}}>THE MISSION</div>
            <div style={{fontFamily:'Amiri,serif',fontSize:16,color:'var(--gold)',lineHeight:1.9,marginBottom:8}}>وَذَكِّرْ فَإِنَّ الذِّكْرَىٰ تَنفَعُ الْمُؤْمِنِينَ</div>
            <div style={{fontSize:12,color:'var(--cream3)',lineHeight:1.7,fontStyle:'italic'}}>And remind, for indeed reminding benefits the believers.<br/><span style={{opacity:0.6}}>— Surah Adh-Dhariyat 51:55</span></div>
          </div>
        </div>

        {/* Divider */}
        <div style={{height:'0.5px',background:'var(--border)',marginBottom:20}}/>

        {/* Bottom row */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{fontSize:12,color:'var(--cream3)',lineHeight:1.8}}>
            © 2026 NurQuran · Built with ❤ for every human on earth<br/>
            <span style={{opacity:0.6}}>Recitations begin March 25, 2026 · Journey to Ramadan 2027</span>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <div style={{fontSize:11,color:'var(--cream3)',background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:20,padding:'5px 14px'}}>🕌 114 Surahs</div>
            <div style={{fontSize:11,color:'var(--cream3)',background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:20,padding:'5px 14px'}}>📖 6,236 Ayahs</div>
            <div style={{fontSize:11,color:'var(--cream3)',background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:20,padding:'5px 14px'}}>🌍 Free Forever</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── MAIN APP ── */
export default function App(){
  const [userName,setUserName]=useState(()=>localStorage.getItem('nq_user')||'');
  const [view,setView]=useState('home');
  const [surah,setSurah]=useState(null);
  const [content,setContent]=useState(null);
  const [loading,setLoading]=useState(false);
  const [completed,setCompleted]=useState(()=>{try{return JSON.parse(localStorage.getItem('nq_done_'+storedUser)||'{}')}catch{return{}}});
  const storedUser = localStorage.getItem('nq_user')||'';
  const [pts,setPts]=useState(()=>parseInt(localStorage.getItem('nq_pts_'+storedUser)||'0'));
  const [lastRead,setLastRead]=useState(()=>{try{return JSON.parse(localStorage.getItem('nq_last')||'null')}catch{return null}});
  const [toast,setToast]=useState(null);
  const [episodes,setEpisodes]=useState([]);
  const [liveCount,setLiveCount]=useState(0);
  const [epLoading,setEpLoading]=useState(true);
  const [showAdmin,setShowAdmin]=useState(false);
  const [theme,setTheme]=useState(()=>localStorage.getItem('nq_theme')||'dark');
  const presenceRef=useRef(null);
  const [translationId]=useState('en.sahih'); // eslint-disable-line

  useEffect(()=>{
    document.body.className=theme==='dark'?'':theme;
    localStorage.setItem('nq_theme',theme);
  },[theme]);
  useEffect(()=>{if(userName)localStorage.setItem('nq_done_'+userName,JSON.stringify(completed));},[completed,userName]);
  useEffect(()=>{if(userName)localStorage.setItem('nq_pts_'+userName,pts);},[pts,userName]);
  useEffect(()=>{if(lastRead)localStorage.setItem('nq_last',JSON.stringify(lastRead));},[lastRead]);
  useEffect(()=>{getEpisodes().then(d=>{setEpisodes(d);setEpLoading(false)});},[]);
  useEffect(()=>{
    if(!userName)return;
    const sync=()=>upsertUser(userName,pts,Object.keys(completed).length);
    sync();const t=setInterval(sync,30000);return()=>clearInterval(t);
  },[userName,pts,completed]);
  useEffect(()=>{
    if(!userName)return;
    presenceRef.current=subscribeToPresence('nurquran-global',userName,setLiveCount);
    return()=>unsubscribePresence(presenceRef.current);
  },[userName]);

  const showToast=m=>{setToast(m);setTimeout(()=>setToast(null),2800)};
  // Offline detection
  useEffect(()=>{
    const handleOffline=()=>showToast('⚠ You are offline — Quran text may not load');
    const handleOnline=()=>showToast('✦ Back online — Alhamdulillah');
    window.addEventListener('offline',handleOffline);
    window.addEventListener('online',handleOnline);
    return()=>{window.removeEventListener('offline',handleOffline);window.removeEventListener('online',handleOnline)};
  },[]);


  const liveEp=episodes[0]||null;

  const openSurah=async s=>{
    setSurah(s);setContent(null);setView('reader');setLoading(true);
    try{
      const [ar,tr]=await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${s.n}/quran-uthmani`).then(r=>r.json()),
        fetch(`https://api.alquran.cloud/v1/surah/${s.n}/${translationId}`).then(r=>r.json()),
      ]);
      setContent(ar.data.ayahs.map((a,i)=>({n:a.numberInSurah,ar:a.text,en:tr.data.ayahs[i]?.text||''})));
      setLastRead({n:s.n,name:s.name,ayah:1,total:s.ayahs});
    }catch{showToast('⚠ Check your internet connection')}
    setLoading(false);
  };

  const markRead=(sn,an,total)=>{
    const k=sn+':'+an;if(completed[k])return;
    const nc={...completed,[k]:true};setCompleted(nc);setPts(p=>p+1);
    setLastRead(l=>l?{...l,ayah:an}:l);
    showToast('✦ +1 point · Ayah '+an);
    const allDone=Array.from({length:total},(_,i)=>sn+':'+(i+1)).every(k2=>nc[k2]||k2===k);
    if(allDone){setPts(p=>p+50);setTimeout(()=>showToast('✦ Surah complete · +50 bonus points!'),600)}
  };

  if(!userName)return <SetupScreen onDone={n=>{setUserName(n);localStorage.setItem('nq_user',n)}}/>;

  return(
    <ErrorBoundary>
    <div className="app-shell">
      {toast&&<Toast msg={toast}/>}
      {showAdmin&&<AdminRecorder onClose={()=>setShowAdmin(false)} onEpisodeAdded={ep=>{setEpisodes(prev=>[ep,...prev]);setShowAdmin(false);showToast('✦ Episode '+ep.day+' is now live')}}/>}

      <Sidebar view={view} setView={setView} pts={pts} userName={userName} theme={theme} setTheme={setTheme} onAdmin={()=>setShowAdmin(true)} completed={completed} onLogout={()=>{localStorage.removeItem('nq_user');localStorage.removeItem('nq_last');setUserName('');setView('home');setCompleted({});setPts(0);setLastRead(null);}}/>

      <div className="main-area">
        {/* Mobile top header */}
        <div className="mobile-header mobile-header-bg" style={{display:'none',position:'sticky',top:0,zIndex:90,background:'rgba(8,16,10,0.96)',backdropFilter:'blur(20px)',borderBottom:'0.5px solid var(--border)',alignItems:'center',justifyContent:'space-between',padding:'0 14px',height:52,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {(view!=='home')&&<button onClick={()=>setView('home')} style={{background:'none',border:'0.5px solid var(--border2)',borderRadius:7,color:'var(--gold)',padding:'5px 10px',cursor:'pointer',fontSize:12}}>← Back</button>}
            {view==='home'&&<div onClick={()=>setView('profile')} style={{width:30,height:30,borderRadius:'50%',background:'var(--gold3)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:12,color:'var(--gold)',cursor:'pointer',flexShrink:0}}>{userName.slice(0,2).toUpperCase()}</div>}
          </div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'var(--gold)',letterSpacing:2}}>نور · Nur</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <button onClick={()=>setTheme(t=>{const themes=['dark','light','midnight','parchment'];return themes[(themes.indexOf(t)+1)%themes.length]})} style={{background:'var(--bg3)',border:'0.5px solid var(--border)',borderRadius:6,color:'var(--cream3)',cursor:'pointer',fontSize:13,padding:'4px 8px'}}>◑</button>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:11,color:'var(--gold)',background:'var(--gold3)',padding:'4px 9px',borderRadius:16,border:'0.5px solid var(--border2)'}}>✦{pts}</div>
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'center'}}>
          <div className="content-wrap">
            {view==='home'&&<HomeView userName={userName} pts={pts} completed={completed} setView={setView} openSurah={openSurah} lastRead={lastRead} liveEpisode={liveEp} liveCount={liveCount}/>}
            {view==='reader'&&surah&&<ReaderView surah={surah} content={content} loading={loading} completed={completed} markRead={markRead} allSurahs={SURAHS} openSurah={openSurah} showToast={showToast}/>}
            {view==='recitations'&&<RecitationsView episodes={episodes} liveCount={liveCount} loading={epLoading} userName={userName}/>}
            {view==='leaderboard'&&<LeaderboardView userName={userName} pts={pts} completed={completed}/>}
            {view==='search'&&<SearchView openSurah={s=>{openSurah(s);}}/>}
            {view==='profile'&&<ProfileView userName={userName} pts={pts} completed={completed} theme={theme} setTheme={setTheme} onLogout={()=>{localStorage.removeItem('nq_user');localStorage.removeItem('nq_last');setUserName('');setView('home');setCompleted({});setPts(0);setLastRead(null);}}/>}
            {view==='about'&&<AboutView/>}
            {view==='privacy'&&<PrivacyView/>}
            {view==='scholars'&&<ScholarsView/>}
          </div>
        </div>

        {/* Footer — only on desktop non-reader pages */}
        {view!=='reader'&&<div style={{display:'none'}} className="desktop-footer"><Footer setView={setView}/></div>}
        <MobileNav view={view} setView={setView}/>
      </div>
    </div>
    </ErrorBoundary>
  );
}