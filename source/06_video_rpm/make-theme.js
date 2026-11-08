/* Builds editable icar.ui/3 nodes and ordinary PNG assets, using existing primitives only. */
"use strict";
(function () {
  const assets = {}, definitions = [];
  function picture(id, name, w, h, paint) {
    const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2;
    const c = cv.getContext('2d'); c.scale(2, 2); paint(c);
    assets[id] = cv.toDataURL('image/png');
    definitions.push({id, name, kind:'custom', path:'assets/' + id + '.png', w:cv.width, h:cv.height});
  }
  const rad = d => d * Math.PI / 180;
  const mix = (a,b,t) => '#' + [0,1,2].map(i => Math.round(parseInt(a.slice(1+i*2,3+i*2),16)*(1-t)+parseInt(b.slice(1+i*2,3+i*2),16)*t).toString(16).padStart(2,'0')).join('');
  function engine(c, x, y, color) {
    c.save(); c.translate(x,y); c.strokeStyle=color; c.lineWidth=1.45; c.lineJoin='round';
    c.beginPath(); c.moveTo(-8,-4); c.lineTo(-5,-4); c.lineTo(-5,-7); c.lineTo(2,-7); c.lineTo(2,-4); c.lineTo(6,-4); c.lineTo(8,-1); c.lineTo(11,-1); c.lineTo(11,5); c.lineTo(7,5); c.lineTo(5,7); c.lineTo(-7,7); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(-11,-2); c.lineTo(-11,5); c.moveTo(-1,-10); c.lineTo(-1,-7); c.moveTo(-4,-10); c.lineTo(3,-10); c.stroke(); c.restore();
  }
  picture('rpm-face', '暗色灯段、刻度与页码', 360, 360, c => {
    c.strokeStyle='#191514'; c.lineWidth=1.2; c.beginPath(); c.arc(180,180,175,0,Math.PI*2); c.stroke();
    for(let i=0;i<64;i++) {
      const t=(i+.5)/64, a=rad(135+i*270/64), b=rad(135+(i+1)*270/64-1.15);
      c.strokeStyle=t>.83?mix('#3e0e0c','#6c100b',(t-.83)/.17):mix('#34150a','#3c240a',t);
      c.lineWidth=11.5; c.lineCap='butt'; c.beginPath(); c.arc(180,180,154,a,b); c.stroke();
    }
    for(let i=0;i<=13;i++) {
      const a=rad(135+i*270/13), long=i%2===0;
      c.strokeStyle=i>=11?'#a7331b':'#b9b3a8'; c.lineWidth=long?1.55:1.1;
      c.beginPath(); c.moveTo(180+Math.cos(a)*140,180+Math.sin(a)*140); c.lineTo(180+Math.cos(a)*(long?133:136),180+Math.sin(a)*(long?133:136)); c.stroke();
    }
    c.strokeStyle='#ff9517'; c.lineWidth=1.6;
    c.beginPath(); c.arc(89,268,5.6,rad(135),rad(405)); c.stroke();
    c.beginPath(); c.moveTo(89,268); c.lineTo(92,264); c.stroke();
    c.strokeStyle='#ff9517'; c.lineWidth=1.2;
    c.beginPath(); c.roundRect(236,263,3.2,10,1.6); c.moveTo(237.6,261); c.lineTo(237.6,268); c.arc(237.6,273,3,0,Math.PI*2); c.stroke();
    for(let i=0;i<13;i++) {
      c.fillStyle=i===3?'#ff9f17':'#68645e'; c.beginPath();
      if(i===3)c.roundRect(135+i*7,320,10,3.2,1.6); else c.arc(137+i*7,321.6,1.65,0,Math.PI*2);
      c.fill();
    }
  });
  picture('rpm-tip', '随转速移动的高光端点', 360, 360, c => {
    const g=c.createRadialGradient(334,180,0,334,180,13);
    g.addColorStop(0,'rgba(255,243,168,.98)'); g.addColorStop(.23,'rgba(255,175,32,.9)'); g.addColorStop(.5,'rgba(255,91,0,.45)'); g.addColorStop(1,'rgba(255,80,0,0)');
    c.fillStyle=g; c.beginPath(); c.arc(334,180,13,0,Math.PI*2); c.fill();
    c.save(); c.translate(334,180); c.rotate(rad(0)); c.fillStyle='#fff5c2'; c.fillRect(-3,-1.4,6,2.8); c.restore();
  });
  picture('rpm-engine', '正常状态 ENGINE', 118, 32, c => {
    engine(c,24,16,'#ff9c1a'); c.font='700 13px "Arial Narrow",sans-serif'; c.fillStyle='#ff9e20'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('E N G I N E',73,17);
  });
  picture('rpm-shift', '升挡状态 SHIFT', 118, 32, c => {
    c.fillStyle='#fff4da'; c.beginPath(); c.roundRect(3,2,112,28,14); c.fill();
    c.fillStyle='#ff5d15'; c.beginPath(); c.moveTo(22,18); c.lineTo(28,10); c.lineTo(34,18); c.lineTo(30,18); c.lineTo(30,23); c.lineTo(26,23); c.lineTo(26,18); c.fill();
    c.font='900 18px "Arial Narrow",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('SHIFT',73,17);
  });

  let z=0;
  const n=(type,id,name,x,y,w,h,props={})=>({id,type,name,x,y,w,h,rotation:0,scale:1,alpha:255,z:z++,...props});
  const effect=(kind,props={})=>({enabled:true,pid:'obd.rpm',op:'gte',from:5400,to:6500,hysteresis:0,delayMs:0,kind,periodMs:900,duty:.34,phase:0,intensity:1,color:'#ff3316',size:2.4,...props});
  const label=(id,name,text,x,y,w,h,size,color='#c5c1b8',spacing=1)=>n('text',id,name,x,y,w,h,{text,font:{family:'condensed',size,weight:700,italic:false,letterSpacing:spacing,align:'center',color}});
  const shape=(id,name,kind,x,y,w,h,props={})=>n('shape',id,name,x,y,w,h,{kind,fill:'#050404',stroke:'none',strokeWidth:0,cornerRadius:0,...props});
  const value=(id,name,pid,x,y,w,h,size,props={})=>n('valueText',id,name,x,y,w,h,{pid,decimals:0,unit:'',prefix:'',suffix:'',size,unitSize:10,align:1,color:'#fffdf6',noDataColor:'#77736d',...props});
  const nodes=[];
  nodes.push(shape('rpm-disc','圆形黑色底板','circle',4,4,352,352));
  nodes.push(shape('rpm-alert-wash','5400 转 · 红色脉冲底光','circle',19,19,322,322,{fill:'#070201',effects:[effect('flash',{color:'#ff1808',size:2.3,intensity:.78,duty:.45})]}));
  nodes.push(n('image','rpm-face-image','暗轨、刻度和页码',0,0,360,360,{assetId:'rpm-face'}));
  nodes.push(n('segmentedArc','rpm-segments','转速灯带 · 64 段',0,0,360,360,{
    pid:'obd.rpm',minVal:0,maxVal:6500,startAngle:135,sweepAngle:270,segmentCount:64,gapAngle:1.15,thickness:11.5,radiusRatio:154/360,
    activeColor:'#ff971d',inactiveColor:'#00000000',noDataColor:'#00000000',
    zoneColors:[{at:0,color:'#ff7618'},{at:.55,color:'#ffae18'},{at:.78,color:'#ffd83c'},{at:.87,color:'#ffb425'},{at:1,color:'#ff3219'}],
    effects:[effect('neon',{from:0,color:'#ff991b',size:1.05,intensity:.32})]
  }));
  nodes.push(n('gauge','rpm-highlight','灯带末端 · 转速驱动光点',0,0,360,360,{
    pid:'obd.rpm',min:0,max:6500,style:0,cardStyle:3,showLabel:false,showRange:false,
    parts:[{kind:'needle',assetId:'rpm-tip',pid:'',x:0,y:0,w:360,h:360,pivotX:.5,pivotY:.5,rotation:0,alpha:255,sweepFrom:135,sweepTo:405,sweepFollow:false}]
  }));
  nodes.push(shape('rpm-ripples','5400 转 · 向外扩散的三重波纹','circle',12,12,336,336,{
    fill:'none',stroke:'none',effects:[effect('ripple',{color:'#FFE4AD',lifeMs:560,waveCount:3,startRadius:.18,endRadius:.99,lineWidth:1.05,intensity:.94})]
  }));
  nodes.push(shape('rpm-alert-rim','5400 转 · 外圈闪光','ring',11,11,338,338,{fill:'none',stroke:'#160a02',strokeWidth:2.2,effects:[effect('flash',{color:'#fff4b5',size:2.1,duty:.31}),effect('pulse',{scale:.019,intensity:1})]}));
  nodes.push(shape('rpm-alert-echo','5400 转 · 第二道光环','ring',18,18,324,324,{fill:'none',stroke:'#0c0502',strokeWidth:1.3,effects:[effect('flash',{color:'#ffaf36',phase:.12,duty:.25,size:1.7,intensity:.7}),effect('pulse',{scale:.027,phase:.12,intensity:1})]}));
  nodes.push(shape('rpm-sparks','5400 转 · 金色火花与短尾迹','circle',12,12,336,336,{
    fill:'none',stroke:'none',effects:[effect('sparks',{color:'#FFBF52',lifeMs:600,count:64,startRadius:.32,endRadius:.98,particleSize:1.05,trail:10,seed:37,intensity:1})]
  }));
  nodes.push(n('image','rpm-status','ENGINE / SHIFT · 转速状态',121,76,118,32,{
    assetId:'rpm-engine',statePid:'obd.rpm',stateWarn:5400,stateCritical:6500,
    states:{normal:{assetId:'rpm-engine',alpha:255,blink:false},warn:{assetId:'rpm-shift',alpha:255,blink:false},critical:{assetId:'rpm-shift',alpha:255,blink:false}},
    effects:[effect('flash',{color:'#ffe2a3',size:1.25,intensity:.62,duty:.28})]
  }));
  nodes.push(value('rpm-value','主转速 · 5400 转变橙色','obd.rpm',62,113,236,86,82,{warnHigh:5400,criticalHigh:6200,warnColor:'#ff7b1b',criticalColor:'#ff3e25',effects:[effect('neon',{from:0,color:'#fff6dd',size:.5,intensity:.15}),effect('flash',{color:'#ff6c12',size:1.3,intensity:.62,duty:.3})]}));
  nodes.push(label('rpm-unit','转速单位','RPM',141,201,78,15,9,'#c2beb6',1.7));
  nodes.push(shape('rpm-gear-box','挡位框','roundRect',158,235,44,57,{fill:'#070605',stroke:'#f89520',strokeWidth:1.5,cornerRadius:8,effects:[effect('neon',{from:0,color:'#ff971d',size:.65,intensity:.2})]}));
  nodes.push(value('rpm-gear','模拟挡位 · 使用时需绑定真实来源','obd.gear',160,239,40,46,43));
  nodes.push(label('rpm-gear-caption','挡位标题','GEAR',153,295,54,13,8,'#c5c0b7',1.6));
  nodes.push(value('rpm-speed','模拟车速','obd.speed',66,239,65,29,26));
  nodes.push(label('rpm-speed-unit','车速单位','KM/H',90,260,44,14,8,'#c9c5bd',.5));
  nodes.push(value('rpm-intake','模拟进气温度','obd.intake',224,239,65,29,25,{unit:'°C',unitSize:13}));
  nodes.push(label('rpm-intake-label','进气标题','INTAKE',242,260,47,14,8,'#c9c5bd',.6));
  const design={schema:'icar.ui/3',meta:{name:'视频转速 · 粒子火花与扩散波纹',author:'ICarUI',description:'参考视频的圆形转速演示。64段灯带、转速光点、5400转升挡提醒、三重扩散波纹与金色粒子短尾迹。两种新光效可在本次更新的ICarUI特效面板编辑。演示数据仅用于预览；挡位需配置真实数据来源。'},canvas:{unit:360,designW:720,designH:720,scaleMode:1},theme:'neon',themeColors:{background:'#000000',value:'#fffdf6',label:'#c5c1b8',dim:'#6f6960',accent:'#ff991b',track:'#2a150b'},assets:definitions,nodes:[{id:'video-rpm-control',type:'group',name:'视频转速＋升挡提醒 · 可整体复用',x:0,y:0,w:360,h:360,alpha:255,scale:1,rotation:0,z:0,children:nodes}]};
  window.VIDEO_RPM_ASSETS=assets;
  window.VIDEO_RPM_SAMPLES={'obd.rpm':4640,'obd.speed':61,'obd.gear':2,'obd.intake':34};
  window.VIDEO_RPM_VARIANTS={'720x720':{design,json:'视频转速_720x720.json',pack:'视频转速_720x720.icarzip'}};
})();
