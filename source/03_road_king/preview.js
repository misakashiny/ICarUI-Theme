'use strict';
(() => {
  const $=id=>document.getElementById(id),S=window.CanvasState;
  const parsed=validateText(JSON.stringify(window.ROAD_VARIANTS["1672x941"].design));
  if(parsed.errors.length){$('status').textContent='加载失败：'+parsed.errors.join('；');return;}
  S.design=parsed.design;S.showGrid=false;S.selection=[];
  const host=createNode('group',{id:'road-preview-root',w:360,h:360});host.children=S.design.nodes;
  let timer=null,started=0,mode='reference',values={...ROAD_SAMPLES};
  function paint(){
    for(const a of S.design.assets)a.data=ROAD_ASSETS[a.id];
    S.previewValues=Object.fromEntries(Object.entries(values).map(([pid,value])=>[resolvePid(pid),value]));
    draw();drawNodePreview(host,$('display'),{wholeDesign:true});
    const rpm=values['obd.rpm'];$('rpmText').textContent=Number.isFinite(rpm)?Math.round(rpm)+' RPM':'无数据';
    if(Number.isFinite(rpm))$('rpm').value=String(rpm);
    const speed=values['obd.speed'];$('speedText').textContent=Number.isFinite(speed)?Math.round(speed)+' km/h':'无数据';if(Number.isFinite(speed))$('speed').value=String(speed);
  }
  function stop(){if(timer!==null){cancelAnimationFrame(timer);timer=null;}}
  function activate(id,label){mode=id;for(const key of ['reference','animate','zero','missing'])$(key).classList.toggle('active',key===id);$('status').textContent=label;}
  $('reference').onclick=()=>{stop();values={...ROAD_SAMPLES};activate('reference','原图示例读数');paint();};
  $('zero').onclick=()=>{stop();values=Object.fromEntries(Object.keys(ROAD_SAMPLES).map(k=>[k,0]));activate('zero','有效零值');paint();};
  $('missing').onclick=()=>{stop();values={};activate('missing','未连接数据源');paint();};
  $('rpm').oninput=()=>{stop();values={...ROAD_SAMPLES,...values,'obd.rpm':Number($('rpm').value)};activate('manual','手动转速预览');paint();};
  $('speed').oninput=()=>{stop();values={...ROAD_SAMPLES,...values,'obd.speed':Number($('speed').value)};activate('manual','手动车速预览');paint();};
  $('animate').onclick=()=>{
    if(mode==='animate'){stop();activate('manual','演示已暂停');return;}
    stop();activate('animate','模拟数据 · 不连接设备');started=performance.now();let last=0;
    function tick(now){
      if(now-last>32){
        const phase=((now-started)/9000)%1,rpm=800+7200*phase;
        values={...ROAD_SAMPLES,'obd.rpm':rpm,'obd.speed':Math.round(phase*200),'obd.gear':Math.min(6,1+Math.floor(phase*6)),'calc.boost':phase*180};paint();last=now;
      }
      timer=requestAnimationFrame(tick);
    }
    timer=requestAnimationFrame(tick);
  };
  $('fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():$('screen').requestFullscreen().catch(()=>{$('status').textContent='浏览器未允许全屏';});
  function switchDesign(){
    const variant=ROAD_VARIANTS[$('aspect').value],r=validateText(JSON.stringify(variant.design));
    if(r.errors.length){$('status').textContent='比例切换失败';return;}
    S.design=r.design;host.children=S.design.nodes;
    for(const id of ['display','cv']){$(id).width=r.design.canvas.designW;$(id).height=r.design.canvas.designH;}
    $('display').style.aspectRatio=r.design.canvas.designW+'/'+r.design.canvas.designH;
    $('downloadPack').href=variant.pack;$('downloadJson').href=variant.json;paint();
  };
  $('aspect').onchange=switchDesign;
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&timer!==null){stop();activate('manual','演示已暂停');}});
  window.addEventListener('pagehide',stop);
  Promise.all(Object.entries(ROAD_ASSETS).map(([id,url])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{S.assetUrls[id]=url;S.imgCache[url]=img;resolve();};img.onerror=()=>reject(Error('素材加载失败：'+id));img.src=url;}))).then(()=>{$('reference').click();window.ROAD_READY=true;}).catch(e=>{$('status').textContent=e.message;});
})();
