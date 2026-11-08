'use strict';
(() => {
 const $=id=>document.getElementById(id),S=window.CanvasState;
 const host=createNode('group',{id:'nine-preview-root',w:360,h:360});
 let current='01',values={},timer=null,mode='reference',started=0;
 function parseDesign(d){const r=validateText(JSON.stringify(d));if(r.errors.length)throw Error(r.errors.join(';'));return validateText(toV2Json(r.design));}
 const profile=[.52,.65,.59,.77,.67,.91,.99,.94,.81,.72,.76,.86,.77,.62,.72,.79,.68,.74,1];
 function meta(){return NINE_META.find(x=>x.key===current);}
 function stop(){if(timer!==null){cancelAnimationFrame(timer);timer=null;}}
 function histories(seed=false){if(seed)S.history={};for(const [pid,v]of Object.entries(values)){const id=resolvePid(pid);if(seed)S.history[id]=profile.map(x=>v*x);else{const a=S.history[id]||(S.history[id]=[]);a.push(v);if(a.length>60)a.shift();}}}
 function activate(id,label){mode=id;['reference','animate','zero','missing'].forEach(k=>$(k).classList.toggle('active',k===id));$('status').textContent=label;}
 function paint(){for(const a of S.design.assets)a.data=NINE_ASSETS[a.id];S.previewValues=Object.fromEntries(Object.entries(values).map(([k,v])=>[resolvePid(k),v]));S.showGrid=false;S.selection=[];draw();drawNodePreview(host,$('display'),{wholeDesign:true});for(const [id,pid,unit]of[['rpm','obd.rpm','RPM'],['speed','obd.speed','km/h']]){const v=values[pid];$(id+'Text').textContent=Number.isFinite(v)?Math.round(v)+' '+unit:'无数据';if(Number.isFinite(v))$(id).value=String(v);}}
 function reset(){stop();values={...meta().samples};histories(true);activate('reference','参考读数 · 曲线为模拟历史');paint();}
 function select(){stop();current=$('theme').value;const variant=NINE_VARIANTS[current][$('aspect').value],r=parseDesign(variant.design);if(r.errors.length)throw Error(r.errors.join(';'));S.design=r.design;host.children=S.design.nodes;for(const id of ['display','cv']){$(id).width=r.design.canvas.designW;$(id).height=r.design.canvas.designH;}$('display').style.aspectRatio=r.design.canvas.designW+'/'+r.design.canvas.designH;$('downloadPack').href=variant.pack;$('downloadJson').href=variant.json;$('heading').textContent=current+' / '+meta().title;document.querySelectorAll('.tile').forEach(el=>el.classList.toggle('selected',el.dataset.key===current));reset();}
 $('reference').onclick=reset;
 $('zero').onclick=()=>{stop();values=Object.fromEntries(Object.keys(meta().samples).map(k=>[k,0]));histories(true);activate('zero','有效零值 · 曲线归零');paint();};
 $('missing').onclick=()=>{stop();values={};S.history={};activate('missing','无数据 · 无历史数据');paint();};
 for(const [id,pid]of[['rpm','obd.rpm'],['speed','obd.speed']])$(id).oninput=()=>{stop();values={...meta().samples,...values,[pid]:Number($(id).value)};histories();activate('manual','手动演示 · 不连接车辆');paint();};
 $('animate').onclick=()=>{if(mode==='animate'){stop();activate('manual','演示已暂停');return;}stop();values={...meta().samples};S.history={};started=performance.now();activate('animate','模拟数据与历史 · 不连接设备');let last=0;function tick(now){if(now-last>125){const t=(now-started)/1000,phase=(t%12)/12;values=Object.fromEntries(Object.entries(meta().samples).map(([k,v],i)=>[k,k==='obd.rpm'?800+7200*phase:k==='obd.speed'?260*phase:v*(.85+.15*Math.sin(t*.7+i))]));histories();paint();last=now;}timer=requestAnimationFrame(tick);}timer=requestAnimationFrame(tick);};
 $('theme').onchange=select;$('aspect').onchange=select;
 $('fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():$('screen').requestFullscreen().catch(()=>{$('status').textContent='未允许全屏';});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(mode==='animate')activate('manual','演示已暂停');}});window.addEventListener('pagehide',stop);
 NINE_META.forEach(m=>{const o=document.createElement('option');o.value=m.key;o.textContent=m.key+' · '+m.title;$('theme').appendChild(o);const b=document.createElement('button');b.className='tile';b.dataset.key=m.key;b.innerHTML='<canvas width="560" height="315" aria-label="'+m.title+'预览"></canvas><span>'+m.key+' / '+m.title+'</span>';b.onclick=()=>{$('theme').value=m.key;select();};$('gallery').appendChild(b);});
 Promise.all(Object.entries(NINE_ASSETS).map(([id,url])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{S.assetUrls[id]=url;S.imgCache[url]=img;resolve();};img.onerror=()=>reject(Error('素材加载失败：'+id));img.src=url;}))).then(()=>{
  NINE_META.forEach(m=>{S.design=parseDesign(NINE_VARIANTS[m.key]['1672x941'].design).design;host.children=S.design.nodes;for(const a of S.design.assets)a.data=NINE_ASSETS[a.id];S.previewValues=Object.fromEntries(Object.entries(m.samples).map(([k,v])=>[resolvePid(k),v]));S.history=Object.fromEntries(Object.entries(m.samples).map(([k,v])=>[resolvePid(k),profile.map(x=>x*v)]));S.showGrid=false;S.selection=[];draw();drawNodePreview(host,document.querySelector('.tile[data-key="'+m.key+'"] canvas'),{wholeDesign:true});});
  select();window.NINE_READY=true;
 }).catch(e=>{$('status').textContent=e.message;});
})();
