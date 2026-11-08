/* Nine editable dashboard themes. All data visuals use the production ICARUI schema.
 * Scene art is independent; preview-only histories never enter a design package.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const PackKit=require('../../js/pack.js'),ZipKit=require('../../js/zip.js');
const W=560,H=315,U=360/H,round=n=>Math.round(n*1e5)/1e5;
const C={bg:'#03070B',panel:'#090F16',edge:'#263746',white:'#F4F7FF',dim:'#9BAEBF',blue:'#00BEFF',cyan:'#00E4EE',red:'#FF355B',amber:'#FFBA23',green:'#00E8AE',purple:'#CA6AFF'};
const M={rpm:['发动机转速','obd.rpm','rpm',0,8000,0,C.red],speed:['车速','obd.speed','km/h',0,260,0,C.blue],coolant:['冷却液温度','obd.coolant','°C',-40,120,0,C.blue],oil:['机油温度','obd.oil_temp','°C',-40,150,0,C.amber],intake:['进气温度','obd.intake','°C',-40,100,0,C.cyan],load:['发动机负荷','obd.load','%',0,100,0,C.green],voltage:['控制模块电压','obd.voltage','V',8,18,1,C.purple],fuel:['瞬时油耗','calc.l100','L/100km',0,40,1,C.cyan]};
const configs=[
 ['01','霓虹极速',{speed:128,rpm:3560,coolant:88,voltage:14.3}],
 ['02','午夜山路',{speed:96,rpm:2680,coolant:82,oil:86,intake:28,load:46,voltage:14.2}],
 ['03','赤焰机械',{rpm:2980,speed:112,coolant:90,oil:84,load:38}],
 ['04','落日双仪',{speed:120,rpm:3200,coolant:88,oil:92,intake:28,fuel:8.6,voltage:14.1}],
 ['05','六联趋势',{rpm:4120,speed:108,coolant:86,oil:94,load:62,voltage:14.2}],
 ['06','全息座驾',{rpm:2860,speed:98,coolant:84,oil:90,intake:32,voltage:14.3}],
 ['07','蓝域巡航',{speed:72,rpm:1980,load:28,fuel:6.4,coolant:76,oil:82,voltage:14.1}],
 ['08','三联竞速',{rpm:3440,coolant:88,oil:96,speed:110,load:58,fuel:7.8,voltage:14.2}],
 ['09','冰火涡轮',{speed:135,rpm:3760,coolant:93,oil:88,load:72,voltage:14.4}]
];
function build([key,title,values]){
 let serial=0,ox=0,oy=0,list=[];const nodes=list,assetIds=new Set(),stem=key+'_'+title;
 function leaf(type,name,x,y,w,h,extra={}){const n={id:'nine'+key+'_'+(++serial),type,name,x:round((x-ox+w/2)*360/W-w*U/2),y:round((y-oy)*U),w:round(w*U),h:round(h*U),rotation:0,scale:1,alpha:255,z:list.length,...extra};list.push(n);return n;}
 function group(name,x,y,w,h,fn){const p=list,px=ox,py=oy,n={id:'nine'+key+'_'+(++serial),type:'group',name,x:round((x-ox)*360/W),y:round((y-oy)*360/H),w:round(w*360/W),h:round(h*360/H),z:list.length,children:[]};p.push(n);list=n.children;ox=x;oy=y;fn();list=p;ox=px;oy=py;return n;}
 function poly(name,pts,fill='none',stroke='none',sw=0){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),pad=Math.max(.5,sw/2);let x=Math.min(...xs)-pad,y=Math.min(...ys)-pad,w=Math.max(...xs)-x+pad,h=Math.max(...ys)-y+pad,m=11.5/U;if(w<m){x-=(m-w)/2;w=m;}if(h<m){y-=(m-h)/2;h=m;}return leaf('shape',name,x,y,w,h,{kind:'polyline',fill,stroke,strokeWidth:sw*U,points:pts.map(p=>({x:round((p[0]-x)/w),y:round((p[1]-y)/h)}))});}
 const line=(name,pts,color=C.edge,sw=1)=>poly(name,pts,'none',color,sw);
 function rect(name,x,y,w,h,fill,stroke='none',sw=0,r=0){const pts=[];if(r){for(const [cx,cy,a]of[[x+r,y+r,180],[x+w-r,y+r,270],[x+w-r,y+h-r,0],[x+r,y+h-r,90]])for(let i=0;i<=4;i++)pts.push([cx+r*Math.cos((a+i*22.5)*Math.PI/180),cy+r*Math.sin((a+i*22.5)*Math.PI/180)]);}else pts.push([x,y],[x+w,y],[x+w,y+h],[x,y+h]);pts.push(pts[0]);return poly(name,pts,fill,stroke,sw);}
 function text(name,s,x,y,w,h,size,o={}){const {pid,decimals=0,align='left',weight=700,color=C.white,italic=false}=o;return leaf('text',name,x,y,w,h,{text:String(s),font:{family:'sans',size:size*U,weight,italic,letterSpacing:0,align,color},...(pid?{textBinding:{pid,decimals,multiplier:1,offset:0,prefix:'',suffix:''}}:{})});}
 function image(id,x,y,w,h){assetIds.add(id);const n={id:'nine'+key+'_'+(++serial),type:'image',name:'独立素材 · '+id,assetId:id,x:round((x-ox)*360/W),y:round((y-oy)*360/H),w:round(w*360/W),h:round(h*360/H),rotation:0,scale:1,alpha:255,z:list.length};list.push(n);return n;}
 function arc(name,cx,cy,r,t,color,start=140,sweep=260,o={}){const sz=2*(r+t/2+3);return leaf('segmentedArc',name,cx-sz/2,cy-sz/2,sz,sz,{pid:o.pid||'obd.rpm',minVal:o.min??0,maxVal:o.max??8000,startAngle:start,sweepAngle:sweep,segmentCount:o.count||1,gapAngle:o.gap||0,radiusRatio:r/sz,thickness:t*U,activeColor:color,inactiveColor:o.dynamic?'#182535':color,noDataColor:o.dynamic?'#1B2731':color,...(o.zones?{zoneColors:o.zones}:{} )});}
 function bar(k,x,y,w,h,col){const m=M[k],thick=h;return leaf('pathProgress',m[0]+' 实时进度',x,y-5,w,h+10,{pid:m[1],minVal:m[3],maxVal:m[4],points:[{x:.015,y:.5},{x:.985,y:.5}],curve:1,forward:true,thickness:thick*U,activeColor:col||m[6],inactiveColor:'#25323D',noDataColor:'#16232C',fill:false,fillColor:col||m[6],gradientTo:'none'});}
 function icon(k,x,y,s,col){const P=points=>points.map(([a,b])=>[x+a*s/24,y+b*s/24]);let p;
  if(k==='rpm'){arc('转速图标',x+s/2,y+s/2,s*.42,1.5,col,145,250);line('转速图标针',P([[11,15],[18,6]]),col,1.5);}
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
 function metric(k,x,y,w,h,opt={}){const m=M[k],col=opt.color||m[6];group(m[0]+' 卡片',x,y,w,h,()=>{
  if(!opt.flat)panel('卡片边框',x,y,w,h,col,opt.cut);
  if(opt.tiny){icon(k,x+w/2-10,y+8,20,col);text(m[0]+' 标题',m[0],x+2,y+34,w-4,18,10.5,{align:'center'});const long=m[2].length>3,uw=long?52:29;read(k,x+6,y+51,w-uw-12,24,k==='fuel'?18.5:21,col,'right');text(m[0]+' 单位',m[2],x+w-uw,y+58,uw-2,15,long?8.2:10,{weight:400});if(opt.bar!==false)bar(k,x+10,y+h-13,w-20,7,col);}
  else if(opt.inline){icon(k,x+12,y+10,23,col);text(m[0]+' 标题',m[0],x+46,y+8,w-125,19,12);read(k,x+w-107,y+5,65,28,22);text(m[0]+' 单位',m[2],x+w-40,y+14,40,14,10,{weight:400});bar(k,x+47,y+h-13,w-61,7,col);}
  else {icon(k,x+14,y+13,24,col);text(m[0]+' 标题',m[0],x+50,y+8,w-58,20,12.5);read(k,x+50,y+27,w-96,30,25);text(m[0]+' 单位',m[2],x+w-44,y+40,43,17,m[2].length>3?8:11,{weight:400});if(opt.bar!==false)bar(k,x+15,y+h-15,w-30,10,col);}
 });}
 function dial(k,cx,cy,r,opt={}){const m=M[k],start=opt.start??140,sweep=opt.sweep??260,max=opt.max??m[4],min=opt.min??Math.max(0,m[3]),col=opt.color||m[6],major=opt.major??(k==='rpm'?8:13),size=opt.valueSize||r*.35;
 group(m[0]+' 圆仪表',cx-r-14,cy-r-14,2*r+28,2*r+28,()=>{
  if(opt.face!==false)leaf('shape','仪表暗底',cx-r,cy-r,r*2,r*2,{kind:'circle',fill:'#060C13',stroke:'#152433',strokeWidth:1*U,alpha:opt.translucent?205:255});
  arc('外圈轮廓',cx,cy,r,1,col,start,sweep);
  const palette=opt.palette||[C.blue,C.blue,C.purple,C.red,C.red];
  for(let i=0;i<palette.length;i++)arc('装饰色带 '+i,cx,cy,r-6,opt.band||6,palette[i],start+i*sweep/palette.length,sweep/palette.length-.7);
  arc('细刻度环',cx,cy,r-13,3,'#95B8D3',start,sweep,{count:major*4,gap:sweep/(major*4)*.76});
  arc('实时数值环',cx,cy,r-20,3,col,start,sweep,{pid:m[1],min,max,dynamic:true,count:100,gap:.25,zones:palette.map((color,i)=>({at:i/(palette.length-1),color}))});
  if(opt.labels!==false)for(let i=0;i<=major;i++){const a=(start+sweep*i/major)*Math.PI/180,p=rr=>[cx+rr*Math.cos(a),cy+rr*Math.sin(a)];line('主刻度 '+i,[p(r-10),p(r-20)],C.white,1.2);const q=p(r-34),label=k==='rpm'?(min+(max-min)*i/major)/1000:Math.round(min+(max-min)*i/major);text('刻度 '+label,label,q[0]-14,q[1]-8,28,17,r>110?13:10.5,{align:'center',weight:500});}
  if(opt.title!==false)text(m[0]+' 标题',k==='speed'?'车速':m[0],cx-r*.6,cy-42,r*1.2,22,r>110?15:12,{align:'center'});
  read(k,cx-r*.7,cy-17,r*1.4,size*1.3,size,C.white,'center');
  text(m[0]+' 单位',m[2],cx-r*.5,cy+size*1.0-7,r,23,r>110?15:12,{align:'center',weight:400});
 });}
 group('主题画面',0,0,W,H,()=>{
 if(key==='01'){
  image('neon-road',8,125,330,186);panel('右信息区',347,14,205,286,'#152A38');
  dial('speed',174,190,160,{valueSize:53,title:false,face:false,palette:[C.blue,C.blue,'#675BFF','#E53BDE',C.red]});
  // Scene lies behind native instrument, leaving luminous road visible below.
  metric('rpm',350,19,198,83);metric('coolant',350,110,198,83);metric('voltage',350,201,198,83,{color:C.amber});
 }else if(key==='02'){
  image('night',8,-29,544,305);rect('底栏深色面板',9,224,542,85,'#050C12','#174257',.5,5);
  text('车速标题','车速',58,45,100,25,18);read('speed',33,70,145,72,67);text('速度单位','km/h',61,143,85,25,18,{weight:400});
  text('转速标题','发动机转速',395,45,145,25,17);read('rpm',387,78,152,48,43);text('转速单位','rpm',437,120,55,22,13,{weight:400});bar('rpm',369,149,165,9);text('转速下限','0',367,158,35,20,11,{weight:400});text('转速上限','8000',498,158,42,20,11,{weight:400});
  ['coolant','oil','intake','load','voltage'].forEach((k,i)=>{metric(k,12+i*108,226,106,81,{tiny:true,flat:true,bar:false,color:k==='voltage'?C.green:undefined});if(i)line('底栏分隔 '+i,[[11+i*108,235],[11+i*108,298]],'#183543',.5);});
 }else if(key==='03'){
  // Layered native outlines imitate the machined bezel; inner arcs carry RPM.
  dial('rpm',155,157,145,{valueSize:44,title:false,band:12,palette:['#00A6FF','#B4C5D3','#D3D6DD',C.red,C.red]});
  arc('机械盘内圈',155,157,78,2,'#494C52',0,360);arc('红色内环',155,157,77,2,C.red,180,120);
  ['speed','coolant','oil','load'].forEach((k,i)=>metric(k,319,15+i*75,230,64,{inline:true,cut:true}));
 }else if(key==='04'){
  image('sunset',8,5,544,304);
  dial('speed',124,123,106,{valueSize:49,labels:false,translucent:true,palette:[C.blue,'#0E9AFA','#314998'],start:145,sweep:220});
  dial('rpm',437,123,106,{valueSize:39,labels:false,translucent:true,palette:['#82265D',C.red,C.amber],start:175,sweep:220});
  ['coolant','oil','intake','fuel','voltage'].forEach((k,i)=>metric(k,9+i*109,218,105,89,{tiny:true,color:k==='fuel'?C.purple:k==='voltage'?C.green:undefined}));
 }else if(key==='05'){
  ['rpm','speed','coolant','oil','load','voltage'].forEach((k,i)=>{const x=10+i%2*275,y=8+Math.floor(i/2)*103,m=M[k];group(m[0]+' 趋势卡片',x,y,265,97,()=>{panel('趋势卡片边框',x,y,265,97,m[6]);icon(k,x+15,y+11,25,m[6]);text(m[0]+' 标题',m[0],x+53,y+8,195,21,13);read(k,x+80,y+32,116,28,25,C.white,'right');text(m[0]+' 单位',m[2],x+201,y+40,55,17,12,{weight:400});leaf('gauge',m[0]+' 实时历史曲线',x+5,y+57,255,38,{pid:m[1],min:m[3],max:m[4],style:3,showLabel:false,showRange:false,labelFont:{family:'sans',size:.001,weight:400,align:'left',color:C.panel},card:{show:false}});});});
 }else if(key==='06'){
  image('wire-car',179,5,203,305);
  const left=['rpm','coolant','intake'],right=['speed','oil','voltage'];
  for(let i=0;i<3;i++){const y=18+i*101;for(const [side,k]of[[0,left[i]],[1,right[i]]]){const col=k==='voltage'?C.green:M[k][6],x=side?393:10;line('信号连接 '+k,side?[[393,y+35],[375,y+35],[361,y+58]]:[[165,y+35],[183,y+35],[197,y+58]],col,1);metric(k,x,y,157,88,{cut:true,color:col});}}
 }else if(key==='07'){
  image('neon-road',159,165,241,150);dial('speed',280,156,113,{labels:false,valueSize:59,palette:['#008BFF',C.blue,C.blue,'#065DAB'],start:137,sweep:266,face:false});
  arc('中心内框',280,156,74,1,'#007CB9',0,360);
  ['rpm','load','fuel'].forEach((k,i)=>metric(k,10,17+i*97,163,88,{cut:true,color:k==='rpm'?C.blue:undefined}));
  ['coolant','oil','voltage'].forEach((k,i)=>metric(k,388,17+i*97,162,88,{cut:true,color:k==='voltage'?C.green:undefined}));
 }else if(key==='08'){
  dial('coolant',87,117,79,{max:120,min:40,major:4,valueSize:28,title:false,palette:[C.blue,C.blue,C.red]});
  dial('rpm',280,134,99,{valueSize:39,title:false,palette:[C.amber,C.red,C.red],major:8});
  dial('oil',474,117,79,{max:150,min:50,major:4,valueSize:28,title:false,palette:[C.blue,C.amber,C.amber]});
  text('水温标题','冷却液温度',25,10,124,20,13,{align:'center'});text('转速标题','发动机转速',208,5,144,23,15,{align:'center'});text('油温标题','机油温度',416,10,116,20,13,{align:'center'});
  ['speed','load','fuel','voltage'].forEach((k,i)=>metric(k,11+i*137,207,127,100,{tiny:true,bar:false,color:k==='speed'?C.white:M[k][6]}));
 }else{
  image('energy-ring',1,10,300,300);text('车速标题','车速',100,95,100,23,17,{align:'center'});read('speed',63,121,174,73,66,C.white,'center');text('车速单位','km/h',104,194,95,28,19,{align:'center',weight:400});
  ['rpm','coolant','oil','load','voltage'].forEach((k,i)=>metric(k,300,18+i*57,250,53,{inline:true}));
 }
 // Single editable outline provides a coherent edge without baking UI into art.
 rect('画面外框',3,3,554,309,'none','#183442',.6,8);
 });
 const assets=[...assetIds].map(id=>({id,name:id,kind:'custom',path:'assets/'+id+'.png'}));
 const samples=Object.fromEntries(Object.entries(values).map(([k,v])=>[M[k][1],v]));
 const design={schema:'icar.ui/3',meta:{name:stem+' · 九款仪表',author:'ICarUI',description:'九宫格参考图第'+key+'款。真实绑定控件与独立参考重建素材；示例数值仅用于预览。'},canvas:{unit:360,designW:W,designH:H,scaleMode:0},theme:'neon',themeColors:{background:C.bg,surface:C.panel,surfaceEdge:C.edge,accent:C.cyan,accentHot:C.red,accentDim:'#124663',track:'#1B2B3A',tick:C.dim,needle:C.red,value:C.white,label:C.white,dim:'#627785',glow:false,title,description:'九宫格主题 '+key},assets,nodes};
 return {key,title,stem,nodes:serial,design,samples};
}
const themes=Object.fromEntries(configs.map(c=>[c[0],build(c)]));
function retarget(design,width,height){const d=structuredClone(design),k=Math.min(width/W,height/H),offX=(width-W*k)/2,offY=(height-H*k)/2,ls=H/Math.min(width,height)*k;
 function walk(items,root=true){for(const n of items){if(n.type==='group'||n.type==='image'){n.x=round((n.x*W/360*k+(root?offX:0))*360/width);n.y=round((n.y*H/360*k+(root?offY:0))*360/height);n.w=round(n.w*W*k/width);n.h=round(n.h*H*k/height);if(n.children)walk(n.children,false);}else{const cx=(n.x+n.w/2)*W/360*k+(root?offX:0),cy=(n.y+n.h/2)*H/360*k+(root?offY:0);n.w=round(n.w*ls);n.h=round(n.h*ls);n.x=round(cx*360/width-n.w/2);n.y=round(cy*360/height-n.h/2);for(const p of ['strokeWidth','cornerRadius','thickness'])if(typeof n[p]==='number')n[p]=round(n[p]*ls);if(n.font){n.font.size=round(n.font.size*ls);n.font.letterSpacing=round(n.font.letterSpacing*ls);}}}}
 walk(d.nodes);d.canvas.designW=width;d.canvas.designH=height;if(width!==1672)d.meta.name+=' · '+width+'×'+height;return d;}
async function main(){fs.mkdirSync(path.join(__dirname,'其他比例'),{recursive:true});const variants={},data={},report=[];
 for(const [key,t]of Object.entries(themes)){variants[key]={};for(const a of t.design.assets){const b=fs.readFileSync(path.join(__dirname,a.path));a.w=b.readUInt32BE(16);a.h=b.readUInt32BE(20);a.bytes=b.length;data[a.id]='data:image/png;base64,'+b.toString('base64');}
  for(const [w,h]of[[1672,941],[1920,720],[1280,800]]){const d=retarget(t.design,w,h),base=w===1672?t.stem:'其他比例/'+t.stem+'_'+w+'x'+h,jp=base+'.json',pp=base+'.icarzip',json=JSON.stringify(d,null,2)+'\n';
   const pack=await PackKit.buildPackage({design:d,designJson:json,crc32:ZipKit.crc32,readBytes:async ref=>{const a=d.assets.find(a=>a.path===ref.path);return{bytes:new Uint8Array(fs.readFileSync(path.join(__dirname,ref.path))),w:a?.w,h:a?.h};}});if(pack.missing.length)throw Error(JSON.stringify(pack.missing));fs.writeFileSync(path.join(__dirname,jp),json);fs.writeFileSync(path.join(__dirname,pp),ZipKit.buildZip(pack.entries).bytes);variants[key][w+'x'+h]={design:d,json:jp,pack:pp};}
  report.push({key,title:t.title,nodes:t.nodes,assets:t.design.assets.length,samples:t.samples});
 }
 fs.writeFileSync(path.join(__dirname,'theme-data.js'),'window.NINE_VARIANTS='+JSON.stringify(variants)+';\nwindow.NINE_META='+JSON.stringify(report)+';\nwindow.NINE_ASSETS='+JSON.stringify(data)+';\n');fs.writeFileSync(path.join(__dirname,'theme-inventory.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={themes,retarget,M};
