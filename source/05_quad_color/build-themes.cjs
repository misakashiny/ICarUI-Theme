/* Four editable dual-column dashboards with native gauge parts and data-triggered glow.
 * Scene art is independent; all runtime values come from existing data sources.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const PackKit=require('../../js/pack.js'),ZipKit=require('../../js/zip.js');
const W=560,H=315,U=360/H,round=n=>Math.round(n*1e5)/1e5;
const C={bg:'#03070B',panel:'#090F16',edge:'#263746',white:'#F4F7FF',dim:'#9BAEBF',blue:'#00BEFF',cyan:'#00E4EE',red:'#FF355B',amber:'#FFBA23',green:'#00E8AE',purple:'#CA6AFF'};
const M={rpm:['发动机转速','obd.rpm','rpm',0,8000,0,C.red],speed:['车速','obd.speed','km/h',0,240,0,C.blue],coolant:['冷却液温度','obd.coolant','°C',0,150,0,C.blue],oil:['机油温度','obd.oil_temp','°C',0,160,0,C.amber],intake:['进气温度','obd.intake','°C',0,60,0,C.cyan],load:['发动机负荷','obd.load','%',0,100,0,C.green],voltage:['控制模块电压','obd.voltage','V',0,24,1,C.purple],fuel:['瞬时油耗','calc.l100','L/100km',0,16,1,C.cyan]};
const configs=[
 ['01','橙金脉冲',{speed:78,rpm:2680,coolant:88,voltage:14.2,fuel:8.6,load:42,intake:28,oil:92},'#FFBC16','#FF8E18','#967459'],
 ['02','冰蓝极光',{speed:105,rpm:3210,coolant:76,voltage:14.3,fuel:7.4,load:35,intake:32,oil:81},'#00BFFF','#00D9F5','#288BB4'],
 ['03','赤红追击',{speed:62,rpm:2860,coolant:95,voltage:14.1,fuel:10.2,load:58,intake:36,oil:102},'#FF3B3F','#FF6149','#9D3742'],
 ['04','青绿矩阵',{speed:120,rpm:4020,coolant:82,voltage:14.4,fuel:6.8,load:27,intake:24,oil:78},'#00F0A7','#00DFA5','#289C88']
];
function build([key,title,values,accent,endColor,edge]){
 let serial=0,ox=0,oy=0,list=[];const nodes=list,assetIds=new Set(),stem=key+'_'+title;
 function leaf(type,name,x,y,w,h,extra={}){const n={id:'nine'+key+'_'+(++serial),type,name,x:round((x-ox+w/2)*360/W-w*U/2),y:round((y-oy)*U),w:round(w*U),h:round(h*U),rotation:0,scale:1,alpha:255,z:list.length,...extra};list.push(n);return n;}
 function group(name,x,y,w,h,fn){const p=list,px=ox,py=oy,n={id:'nine'+key+'_'+(++serial),type:'group',name,x:round((x-ox)*360/W),y:round((y-oy)*360/H),w:round(w*360/W),h:round(h*360/H),z:list.length,children:[]};p.push(n);list=n.children;ox=x;oy=y;fn();list=p;ox=px;oy=py;return n;}
 function poly(name,pts,fill='none',stroke='none',sw=0){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),pad=Math.max(.5,sw/2);let x=Math.min(...xs)-pad,y=Math.min(...ys)-pad,w=Math.max(...xs)-x+pad,h=Math.max(...ys)-y+pad,m=11.5/U;if(w<m){x-=(m-w)/2;w=m;}if(h<m){y-=(m-h)/2;h=m;}return leaf('shape',name,x,y,w,h,{kind:'polyline',fill,stroke,strokeWidth:sw*U,points:pts.map(p=>({x:round((p[0]-x)/w),y:round((p[1]-y)/h)}))});}
 const line=(name,pts,color=C.edge,sw=1)=>poly(name,pts,'none',color,sw);
 function rect(name,x,y,w,h,fill,stroke='none',sw=0,r=0){const pts=[];if(r){for(const [cx,cy,a]of[[x+r,y+r,180],[x+w-r,y+r,270],[x+w-r,y+h-r,0],[x+r,y+h-r,90]])for(let i=0;i<=4;i++)pts.push([cx+r*Math.cos((a+i*22.5)*Math.PI/180),cy+r*Math.sin((a+i*22.5)*Math.PI/180)]);}else pts.push([x,y],[x+w,y],[x+w,y+h],[x,y+h]);pts.push(pts[0]);return poly(name,pts,fill,stroke,sw);}
 function text(name,s,x,y,w,h,size,o={}){const {pid,decimals=0,align='left',weight=700,color=C.white,italic=false}=o;return leaf('text',name,x,y,w,h,{text:String(s),font:{family:'sans',size:size*U,weight,italic,letterSpacing:0,align,color},...(pid?{textBinding:{pid,decimals,multiplier:1,offset:0,prefix:'',suffix:''}}:{})});}
 function image(id,x,y,w,h){assetIds.add(id);const n={id:'nine'+key+'_'+(++serial),type:'image',name:'独立素材 · '+id,assetId:id,x:round((x-ox)*360/W),y:round((y-oy)*360/H),w:round(w*360/W),h:round(h*360/H),rotation:0,scale:1,alpha:255,z:list.length};list.push(n);return n;}
 function icon(k,x,y,s,col){const P=points=>points.map(([a,b])=>[x+a*s/24,y+b*s/24]);let p;
  if(k==='rpm'){line('转速图标',P([[3,18],[1,13],[3,7],[8,3],[15,2],[21,7],[23,13],[21,18]]),col,1.5);line('转速图标针',P([[11,15],[18,6]]),col,1.5);}
  else if(k==='coolant'){p=[[9,17],[9,3],[11,1],[13,3],[13,17],[16,19],[16,22],[7,22],[6,19],[9,17]];line('温度图标',P(p),col,1.5);for(let i=0;i<3;i++)line('温度刻线 '+i,P([[17,6+i*4],[21,6+i*4]]),col,1.2);}
  else if(k==='oil'){p=[[1,6],[5,6],[8,10],[15,10],[20,6],[23,7],[19,16],[18,21],[8,21],[4,10],[1,9],[1,6]];line('油壶图标',P(p),col,1.5);line('油壶盖',P([[9,7],[14,7],[11.5,7],[11.5,4],[9,4],[14,4]]),col,1.5);}
  else if(k==='voltage'){line('电池图标',P([[1,6],[23,6],[23,21],[1,21],[1,6],[5,6],[5,3],[8,3],[8,6],[17,6],[17,3],[20,3],[20,6]]),col,1.5);line('正负极',P([[5,13],[10,13],[7.5,13],[7.5,10],[7.5,16],[7.5,13],[16,13],[20,13]]),col,1.3);}
  else if(k==='load'){line('发动机图标',P([[1,10],[4,10],[4,5],[9,5],[9,2],[15,2],[15,5],[19,5],[19,10],[23,10],[23,19],[20,19],[20,22],[7,22],[4,18],[1,18],[1,10]]),col,1.5);}
  else if(k==='speed'){line('汽车图标',P([[2,10],[5,4],[19,4],[22,10],[23,11],[23,20],[19,20],[19,18],[5,18],[5,20],[1,20],[1,11],[2,10],[22,10]]),col,1.5);line('汽车灯',P([[4,14],[8,14],[16,14],[20,14]]),col,1.8);}
  else if(k==='intake'){for(let i=0;i<3;i++)line('进气图标 '+i,P([[1,4+i*7],[14+i*2,4+i*7],[18+i*2,6+i*7],[17+i*2,8+i*7]]),col,1.9);}
  else{line('油泵图标',P([[3,23],[3,2],[14,2],[14,23],[1,23],[17,23],[14,23],[14,12],[18,12],[18,19],[22,19],[22,6],[18,2]]),col,1.4);line('油泵窗口',P([[5,5],[12,5],[12,10],[5,10],[5,5]]),col,1.3);}
 }
 function read(k,x,y,w,h,size,col=C.white,align='left'){const m=M[k];return text(m[0]+' 读数',values[k],x,y,w,h,size,{pid:m[1],decimals:m[5],color:col,align});}
 function panel(name,x,y,w,h,col,chamfer=false){if(chamfer)return poly(name,[[x+10,y],[x+w-9,y],[x+w,y+10],[x+w,y+h],[x+10,y+h],[x,y+h-10],[x+10,y]],C.panel,col,.55);return rect(name,x,y,w,h,C.panel,col,.55,8);}
 function glow(pid,color,size=2,intensity=.48){return [{enabled:true,pid,op:'gte',from:.001,to:1000000,kind:'neon',intensity,color,size,periodMs:1200}];}
 function progress(k,x,y,w,h,marker){const m=M[k];const n=leaf('pathProgress',m[0]+' 实时进度',x,y-7,w,h+14,{pid:m[1],minVal:m[3],maxVal:m[4],points:[{x:.012,y:.5},{x:.988,y:.5}],curve:1,forward:true,thickness:h*U,activeColor:accent,gradientTo:endColor,inactiveColor:'#353D42',fill:false,effects:glow(m[1],accent,2.6,.52)});
  if(marker!==undefined){const pad=h/2,xx=x+pad+(.012+.976*marker)*(w-h);line(m[0]+' 装饰参考线（不配置报警）',[[xx,y-1.5],[xx,y+h+1.5]],'#FF5064',2.6);}return n;}
 function metric(k,x,y,w,h,marker){const m=M[k];group(m[0]+' 状态卡',x,y,w,h,()=>{
  rect('状态卡边框',x,y,w,h,'#080B0F',edge,.65,8).alpha=235;
  icon(k,x+12,y+8,19,C.white);
  const long=k==='fuel';text(m[0]+' 标题',m[0],x+44,y+7,long?91:137,20,14);
  read(k,x+w-(long?158:83),y+2,long?64:59,25,23,C.white,'right');text(m[0]+' 单位',m[2],x+w-(long?87:22),y+10,long?83:22,18,long?12:13,{weight:400});
  progress(k,x+10,y+h-17,w-20,10,marker);
 });}
 const dialKey=key==='03'?'rpm':'speed',topH=({ '01':110,'02':126,'03':146,'04':136 })[key];
 const cx=142,cy=8+topH-14,r=Math.min(123,topH-17),max=dialKey==='rpm'?8000:240;
 group('四色主题画面',0,0,W,H,()=>{
  image('backdrop-'+key,0,0,W,H);
  rect('主仪表边框',8,8,269,topH,'#070B11',edge,.7,9).alpha=185;
  if(key==='04'){
   for(let i=-4;i<=4;i++)line('透视网格纵 '+i,[[cx+i*8,cy-3],[cx+i*34,cy+12]],'#064641',.45);
   for(let i=0;i<4;i++)line('透视网格横 '+i,[[22,cy+2+i*3],[262,cy+2+i*3]],'#07514C',.4);
  }
  const palette=key==='01'?['#FFC619','#FF9C19','#FF5A25','#FF344E']:key==='02'?['#00DBFF','#00BAFF','#087DFF','#1651DE']:key==='03'?['#FF4E41','#FF3036','#F11329','#FF6D27']:['#4DFF37','#00EF87','#00E4BF','#05CFFF'];
  const arc=(name,rr,t,color,start,sweep,opts={})=>{
   const sz=2*(rr+t/2+4);return leaf('segmentedArc',name,cx-sz/2,cy-sz/2,sz,sz,{pid:M[dialKey][1],minVal:0,maxVal:max,startAngle:start,sweepAngle:sweep,segmentCount:opts.count||1,gapAngle:opts.gap||0,radiusRatio:rr/sz,thickness:t*U,activeColor:color,inactiveColor:opts.dynamic?'#21313E':color,noDataColor:opts.dynamic?'#1B2731':color,...(opts.zones?{zoneColors:opts.zones}:{}),...(opts.glow?{effects:glow(M[dialKey][1],color,2,.5)}:{})});
  };
  for(let i=0;i<4;i++)arc('外弧色带 '+i,r,4,palette[i],180+i*45,45,{glow:true});
  arc('实时细弧',r-4,1.5,accent,180,180,{dynamic:true,zones:palette.map((color,i)=>({at:i/3,color}))});
  if(key!=='01')arc('中心暗圈',r*.55,1.2,key==='03'?'#7C1C2A':'#28526A',180,180);
  if(key==='03'){arc('外围装饰弧',r+5,2,'#5A1119',188,164);arc('细分转速刻度',r-11,2.5,'#FBA2A5',180,180,{count:80,gap:1.7});}
  const major=dialKey==='rpm'?8:key==='02'?8:6,minor=major*5;
  const point=(rr,a)=>[cx+rr*Math.cos(a*Math.PI/180),cy+rr*Math.sin(a*Math.PI/180)];
  for(let i=0;i<=minor;i++){const a=180+i*180/minor;line('仪表刻度 '+i,[point(r-6,a),point(r-(i%5===0?14:10),a)],i%5===0?'#F0F6FA':palette[Math.min(3,Math.floor(i/(minor+1)*4))],i%5===0?1.5:1);}
  for(let i=0;i<=major;i++){const a=180+i*180/major,p=point(r-25,a),value=dialKey==='rpm'?i:Math.round(240*i/major);text('刻度数字 '+value,value,p[0]-15,p[1]-7,30,17,12,{align:'center',weight:600});}
  const sz=r*2+10,len=r-12;assetIds.add('needle-'+key);
  leaf('gauge','主仪表动态指针',cx-sz/2,cy-sz/2,sz,sz,{pid:M[dialKey][1],min:0,max,style:0,showLabel:false,showRange:false,labelFont:{family:'sans',size:.001,weight:400,align:'left',color:'#070B11'},card:{show:false},parts:[{kind:'needle',assetId:'needle-'+key,x:sz/2*U,y:(sz/2-1.25)*U,w:len*U,h:2.5*U,pivotX:0,pivotY:.5,rotation:0,sweepFrom:180,sweepTo:360,sweepFollow:false,alpha:255}]});
  read(dialKey,cx-72,cy-49,144,46,dialKey==='rpm'?35:39,C.white,'center');
  text('主仪表单位',dialKey==='rpm'?'rpm':key==='04'?'km/h':'车速',cx-42,cy-11,84,17,key==='04'?11:10,{align:'center',weight:500});
  if(key==='03')text('转速量程','发动机转速   0–8000rpm',cx-95,cy+3,190,16,10,{align:'center',weight:500});
  if(key==='04')text('速度标题','车速',cx-35,cy+4,70,15,10,{align:'center',weight:500});
  if(key==='03'){
   image('red-road',283,8,269,topH);rect('车速卡片边框',283,8,269,topH,'none',edge,.7,8);
   text('车速标题','车速',294,18,90,25,17);read('speed',301,42,125,78,64,C.white,'center').font.italic=true;text('车速单位','km/h',427,82,110,31,23,{weight:500});
  }else{
   rect('转速卡片边框',283,8,269,topH,'#080C10',edge,.7,8).alpha=226;
   text('转速标题','发动机转速',293,15,137,25,16);text('转速量程','0–8000rpm',448,17,94,19,12,{align:'right',weight:400});
   read('rpm',315,topH*.33,160,60,49,C.white,'right');text('转速单位','rpm',484,topH*.33+24,61,30,23,{weight:400});
   progress('rpm',292,topH-14,250,12);
  }
  const rowH=(315-16-topH-18)/3;
  const left=['coolant','fuel','intake'],right=['voltage','load','oil'],marks={coolant:2/3,fuel:.7,intake:.68,voltage:.68,load:.67,oil:.67};
  for(let i=0;i<3;i++){const y=8+topH+6+i*(rowH+6);metric(left[i],8,y,269,rowH,marks[left[i]]);metric(right[i],283,y,269,rowH,marks[right[i]]);}
 });
 const assets=[...assetIds].map(id=>({id,name:id,kind:'custom',path:'assets/'+id+'.png'}));
 const samples=Object.fromEntries(Object.entries(values).map(([k,v])=>[M[k][1],v]));
 const design={schema:'icar.ui/3',meta:{name:stem+' · 四色双栏',author:'ICarUI',description:'四宫格参考图第'+key+'款。原生绑定指针/读数/进度；红色短线仅装饰参考，不修改报警配置。'},canvas:{unit:360,designW:W,designH:H,scaleMode:0},theme:'neon',themeColors:{background:'#04070A',surface:'#0A0D11',surfaceEdge:edge,accent,accentHot:endColor,accentDim:edge,track:'#353D42',tick:C.white,needle:accent,value:C.white,label:C.white,dim:'#8298AA',glow:true,title,description:'四色双栏 '+key},assets,nodes};
 return {key,title,stem,nodes:serial,design,samples,needle:{cx,cy,r:r-12,pid:M[dialKey][1],max}};
}
const themes=Object.fromEntries(configs.map(c=>[c[0],build(c)]));
function retarget(design,width,height){const d=structuredClone(design),k=Math.min(width/W,height/H),offX=(width-W*k)/2,offY=(height-H*k)/2,ls=H/Math.min(width,height)*k;
 function walk(items,root=true){for(const n of items){if(n.type==='group'||n.type==='image'){n.x=round((n.x*W/360*k+(root?offX:0))*360/width);n.y=round((n.y*H/360*k+(root?offY:0))*360/height);n.w=round(n.w*W*k/width);n.h=round(n.h*H*k/height);if(n.children)walk(n.children,false);}else{const cx=(n.x+n.w/2)*W/360*k+(root?offX:0),cy=(n.y+n.h/2)*H/360*k+(root?offY:0);n.w=round(n.w*ls);n.h=round(n.h*ls);n.x=round(cx*360/width-n.w/2);n.y=round(cy*360/height-n.h/2);for(const part of n.parts||[])for(const p of ['x','y','w','h'])if(typeof part[p]==='number')part[p]=round(part[p]*ls);for(const p of ['strokeWidth','cornerRadius','thickness'])if(typeof n[p]==='number')n[p]=round(n[p]*ls);if(n.font){n.font.size=round(n.font.size*ls);n.font.letterSpacing=round(n.font.letterSpacing*ls);}}}}
 walk(d.nodes);d.canvas.designW=width;d.canvas.designH=height;if(width!==1672)d.meta.name+=' · '+width+'×'+height;return d;}
function png(w,h,pixel){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const rgba=pixel(x,y),p=y*(w*4+1)+1+x*4;for(let c=0;c<4;c++)raw[p+c]=Math.max(0,Math.min(255,Math.round(rgba[c])));}function chunk(type,data){const t=Buffer.from(type),b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);t.copy(b,4);data.copy(b,8);b.writeUInt32BE(ZipKit.crc32(Buffer.concat([t,data]))>>>0,data.length+8);return b;}const hdr=Buffer.alloc(13);hdr.writeUInt32BE(w);hdr.writeUInt32BE(h,4);hdr[8]=8;hdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);}
function codeAssets(){fs.mkdirSync(path.join(__dirname,'assets'),{recursive:true});for(const [key,title,values,accent]of configs){const rgb=accent.match(/\w\w/g).map(h=>parseInt(h,16));
 // Original procedural background: subtle radial light, no baked instrument UI.
 fs.writeFileSync(path.join(__dirname,'assets/backdrop-'+key+'.png'),png(1120,630,(x,y)=>{const xx=x/2,yy=y/2,r=Math.hypot((xx-125)/1.1,yy-90),a=.09*Math.exp(-r*r/7000)+.12*Math.exp(-((xx-35)**2+(yy-105)**2)/1000),texture=1.2*Math.sin(x*.045+y*.09);return [4+rgb[0]*a+texture,6+rgb[1]*a+texture,9+rgb[2]*a+texture,255];}));
 // The blank inner half keeps the needle off the central numeric readout.
 fs.writeFileSync(path.join(__dirname,'assets/needle-'+key+'.png'),png(1000,32,(x,y)=>{const half=13-10*(x/999),edge=half-Math.abs(y+.5-16),alpha=x<500?0:Math.max(0,Math.min(1,edge));return [...rgb,alpha*255];}));
}}
async function main(){codeAssets();fs.mkdirSync(path.join(__dirname,'其他比例'),{recursive:true});const variants={},data={},report=[];
 for(const [key,t]of Object.entries(themes)){variants[key]={};for(const a of t.design.assets){const b=fs.readFileSync(path.join(__dirname,a.path));a.w=b.readUInt32BE(16);a.h=b.readUInt32BE(20);a.bytes=b.length;data[a.id]='data:image/png;base64,'+b.toString('base64');}
  for(const [w,h]of[[1672,941],[1920,720],[1280,800]]){const d=retarget(t.design,w,h),base=w===1672?t.stem:'其他比例/'+t.stem+'_'+w+'x'+h,jp=base+'.json',pp=base+'.icarzip',json=JSON.stringify(d,null,2)+'\n';const pack=await PackKit.buildPackage({design:d,designJson:json,crc32:ZipKit.crc32,readBytes:async ref=>{const a=d.assets.find(a=>a.path===ref.path);return {bytes:new Uint8Array(fs.readFileSync(path.join(__dirname,ref.path))),w:a?.w,h:a?.h};}});if(pack.missing.length)throw Error(JSON.stringify(pack.missing));fs.writeFileSync(path.join(__dirname,jp),json);fs.writeFileSync(path.join(__dirname,pp),ZipKit.buildZip(pack.entries).bytes);variants[key][w+'x'+h]={design:d,json:jp,pack:pp};}
  report.push({key,title:t.title,nodes:t.nodes,assets:t.design.assets.length,samples:t.samples,needle:t.needle});
 }
 fs.writeFileSync(path.join(__dirname,'theme-data.js'),'window.QUAD_VARIANTS='+JSON.stringify(variants)+';\nwindow.QUAD_META='+JSON.stringify(report)+';\nwindow.QUAD_ASSETS='+JSON.stringify(data)+';\n');fs.writeFileSync(path.join(__dirname,'theme-inventory.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});module.exports={themes,retarget,M};
