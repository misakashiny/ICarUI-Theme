/* Simulation writes preview values only; every visible instrument pixel uses canvas.js. */
"use strict";
(async function () {
  const $=id=>document.getElementById(id), S=window.CanvasState, cv=$('display');
  const variant=window.VIDEO_RPM_VARIANTS['720x720'];
  const result=window.validateText(JSON.stringify(variant.design));
  if(result.errors.length)throw Error(result.errors.join('\n'));
  const design=result.design; S.design=design; S.simSprings=null; S.showGrid=false; S.selection=[];
  const imageLoads=design.assets.map(a=>new Promise((resolve,reject)=>{
    const src=window.VIDEO_RPM_ASSETS[a.id], img=new Image(); a.data=src; S.assetUrls[a.id]=src; S.imgCache[src]=img;
    img.onload=resolve; img.onerror=()=>reject(Error('素材无法解码：'+a.path)); img.src=src;
  }));
  await Promise.all(imageLoads);
  const group=window.createNode('group',{id:'video-rpm-preview',w:360,h:360}); group.children=design.nodes;
  const frames=[
    [0,3000,42,2,33],[1.5,3350,47,2,33],[3.4,4640,61,2,34],[4.6,5260,71,2,34],
    [5.1,5620,78,2,35],[5.9,5740,80,2,35],[6.15,4300,81,3,35],
    [7.7,5110,98,3,35],[8.7,5460,105,3,36],[9.7,5750,110,3,36],[10,4320,112,4,36],
    [12.4,2900,84,4,35],[14.5,1500,40,3,34],[16.2,850,0,0,33],[17.3,1500,20,1,33],[18,3000,42,2,33]
  ];
  let playing=true, mode='auto', time=0, clock=0, last=0, lastDraw=0, raf=0, manualRpm=3500, manualGear=3, renders=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){playing=false;time=3400;clock=3400;}
  const effects=[];(function walk(ns){for(const n of ns){if(n.effects)effects.push([n,n.effects]);walk(n.children||[]);}})(design.nodes);
  function sample(t){
    const seconds=((t%18000)+18000)%18000/1000; let i=0;while(i<frames.length-2&&seconds>=frames[i+1][0])i++;
    const a=frames[i],b=frames[i+1],p=(seconds-a[0])/(b[0]-a[0]);
    return {rpm:Math.round((a[1]+(b[1]-a[1])*p)/10)*10,speed:Math.round(a[2]+(b[2]-a[2])*p),gear:a[3],intake:Math.round(a[4]+(b[4]-a[4])*p)};
  }
  function values(){return mode==='auto'?sample(time):{rpm:manualRpm,speed:Math.round(manualRpm/55),gear:manualGear,intake:35};}
  function draw(){
    const v=values();S.previewValues={};for(const [pid,value] of Object.entries({'obd.rpm':v.rpm,'obd.speed':v.speed,'obd.gear':v.gear,'obd.intake':v.intake}))S.previewValues[window.resolvePid(pid)]=value;
    S.__animPaused=true;S.__animMs=clock;
    window.drawNodePreview(group,cv,{wholeDesign:true,scope:'video-rpm-demo'});renders++;
    $('rpmOutput').textContent=String(v.rpm);$('rpm').value=v.rpm;
    $('state').textContent=v.rpm>=5400?'SHIFT · 已达到模拟升挡提醒点':'正常 · 灯带随转速变化';$('state').classList.toggle('alert',v.rpm>=5400);
    $('play').textContent=playing?(mode==='manual'?'暂停光效':'暂停演示'):(mode==='manual'?'继续光效':'继续演示');
    $('playState').textContent=(mode==='manual'?'固定转速':playing?'自动循环演示':'演示已暂停')+' · 示例读数';
    cv.dataset.rpm=v.rpm;cv.dataset.gear=v.gear;cv.dataset.alert=String(v.rpm>=5400);
    return v;
  }
  // Match the existing theme-library preview and the reference video's 30 fps target.
  function frame(now){if(playing){const dt=last?Math.min(now-last,80):0;clock+=dt;if(mode==='auto')time+=dt;if(!lastDraw||now-lastDraw>=1000/30-1){lastDraw=now;draw();}}last=now;raf=requestAnimationFrame(frame);}
  function manual(rpm){mode='manual';manualRpm=Math.max(0,Math.min(6500,Number(rpm)));playing=true;window.NodeEffects.release('video-rpm-demo');draw();}
  $('rpm').addEventListener('input',e=>manual(e.target.value));
  document.querySelectorAll('[data-rpm]').forEach(b=>b.onclick=()=>manual(b.dataset.rpm));
  $('play').onclick=()=>{playing=!playing;last=0;lastDraw=0;draw();};
  $('restart').onclick=()=>{mode='auto';time=0;clock=0;playing=true;last=0;lastDraw=0;window.NodeEffects.release('video-rpm-demo');draw();};
  $('shift').onclick=()=>{mode='auto';time=5850;playing=true;last=0;draw();};
  function setEffects(){
    for(const [n,rules] of effects)n.effects=rules.filter(r=>
      (r.from!==5400||$('light').checked)&&(r.kind!=='sparks'||$('sparks').checked)&&(r.kind!=='ripple'||$('ripples').checked));
    window.NodeEffects.release('video-rpm-demo');draw();
  }
  for(const id of ['light','sparks','ripples'])$(id).onchange=setEffects;
  document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;last=0;draw();}});
  window.RpmDemo={
    ready:true,validation:result,
    state:()=>({playing,mode,time,clock,renders,...values()}),
    seek(t){playing=false;mode='auto';time=t;clock=t;window.NodeEffects.release('video-rpm-demo');return draw();},
    renderAt(t){playing=false;mode='auto';time=t;clock=t;return draw();},
    manual, pause(){playing=false;draw();},
    async package(){
      const native=window.validateText(JSON.stringify(variant.design));
      const built=await window.PackKit.buildPackage({design:native.design,designJson:JSON.stringify(variant.design,null,2),crc32:window.ZipKit.crc32,now:'2026-10-30T00:00:00+08:00',readBytes:async ref=>{
        const a=native.design.assets.find(a=>a.path===ref.path);const binary=atob(window.VIDEO_RPM_ASSETS[a.id].split(',')[1]);return {bytes:Uint8Array.from(binary,c=>c.charCodeAt(0)),w:a.w,h:a.h};
      }});
      if(built.missing.length)throw Error('主题包缺少素材');
      const zip=window.ZipKit.buildZip(built.entries);let binary='';for(const b of zip.bytes)binary+=String.fromCharCode(b);
      return {base64:btoa(binary),manifest:built.manifest};
    }
  };
  draw();raf=requestAnimationFrame(frame);
})().catch(e=>{document.getElementById('state').textContent='演示未能加载：'+e.message;console.error(e);});
