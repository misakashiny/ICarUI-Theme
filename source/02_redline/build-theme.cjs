/* Reference 2, authored from editable v3 nodes. No reference-image pixels used.
 * Coordinates below are pixels in the 1672 x 941 design; the helpers implement
 * ICarUI's per-axis positioning and short-axis, centered leaf geometry.
 * Run from any directory: node tools/icarui/themes/02_redline/build-theme.cjs
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const PackKit = require('../../js/pack.js');
const ZipKit = require('../../js/zip.js');
const W=1672,H=941,U=360/H;
const C={bg:'#0B1B2B',track:'#13283D',tick:'#48647F',red:'#FF1023',cyan:'#AEEFFF',white:'#F8F9FC',amber:'#FFAF19',bar:'#2B4662',rpm:'#38203D'};
let serial=0,ox=0,oy=0,list=[];
const nodes=list;
const round=n=>Math.round(n*1e5)/1e5;
function leaf(type,name,x,y,w,h,extra={}) {
  const n={id:'ref02_'+(++serial),type,name,x:round((x-ox+w/2)*360/W-w*U/2),y:round((y-oy)*U),w:round(w*U),h:round(h*U),rotation:0,scale:1,alpha:255,z:list.length,...extra};
  list.push(n);return n;
}
function group(name,x,y,w,h,fn){
  const parent=list,px=ox,py=oy;
  const n={id:'ref02_'+(++serial),type:'group',name,x:round((x-ox)*360/W),y:round((y-oy)*360/H),w:round(w*360/W),h:round(h*360/H),z:list.length,children:[]};
  parent.push(n);list=n.children;ox=x;oy=y;fn();list=parent;ox=px;oy=py;return n;
}
function rect(name,x,y,w,h,color,r=0){
  if(w*U<10||h*U<10)return poly(name,[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],color);
  return leaf('shape',name,x,y,w,h,{kind:r?'roundRect':'rect',fill:color,stroke:'none',strokeWidth:0,cornerRadius:r*U});
}
function poly(name,pts,fill,stroke='none',width=0){
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);let x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
  const pad=Math.max(.5,width/2);x-=pad;y-=pad;w+=2*pad;h+=2*pad;
  // A transparent envelope keeps fine details inside native View bounds and
  // leaves a useful selection target, without changing their visible weight.
  const minBox=10.1/U;
  if(w<minBox){x-=(minBox-w)/2;w=minBox;}if(h<minBox){y-=(minBox-h)/2;h=minBox;}
  return leaf('shape',name,x,y,w,h,{kind:'polyline',fill,stroke,strokeWidth:width*U,points:pts.map(p=>({x:round((p[0]-x)/w),y:round((p[1]-y)/h)}))});
}
function text(name,s,x,y,w,h,size,opts={}){
  const {pid,decimals=0,multiplier=1,offset=0,align='left',weight=700,color=C.white,family='condensed',spacing=0}=opts;
  return leaf('text',name,x,y,w,h,{text:s,font:{family,size:size*U,weight,italic:false,letterSpacing:spacing*U,align,color},...(pid?{textBinding:{pid,decimals,multiplier,offset,prefix:'',suffix:''}}:{})});
}
function bar(name,x,y,w,h,pid,min,max,color=C.cyan){
  const boxH=Math.max(h,10.1/U);
  return leaf('pathProgress',name,x,y-(boxH-h)/2,w,boxH,{pid,minVal:min,maxVal:max,points:[{x:0,y:.5},{x:1,y:.5}],curve:1,forward:true,thickness:h*U,activeColor:color,inactiveColor:C.bar,noDataColor:C.bar,fill:false,gradientTo:'none'});
}
function bez(p,t){const v=1-t;return v*v*v*p[0]+3*v*v*t*p[1]+3*v*t*t*p[2]+t*t*t*p[3];}
function curveAt(x,xs,ys){let a=0,b=1;for(let i=0;i<35;i++){const t=(a+b)/2;if(bez(xs,t)<x)a=t;else b=t;}return bez(ys,(a+b)/2);}
function top(x){return x<=352?553-(x-55)*323/297:x>=590?130:curveAt(x,[352,447,507,590],[230,155,130,130]);}
function bottom(x){return x<=352?654-(x-55)*300/297:x>=604?247:curveAt(x,[352,444,515,604],[354,270,248,247]);}

group('01 转速带 · 0–8000 RPM',47,75,1285,587,()=>{
  const marks=[55,205,352,510,670,837,999,1163,1324];
  for(let i=0;i<8;i++){
    const a=marks[i],b=marks[i+1],t=[],lo=[];
    for(let j=0;j<=12;j++){const x=a+(b-a)*j/12;t.push([x,top(x)]);lo.push([x,bottom(x)]);}
    poly('转速底轨 '+i,t.concat([...lo].reverse(),[t[0]]),C.track);
    const ymin=Math.min(...t.map(p=>p[1])),ymax=Math.max(...lo.map(p=>p[1]));
    // Separate ranges keep the authored, unequally spaced RPM ticks calibrated.
    // Area fill is clipped by an editable lower-contour cover; no raster mask.
    const thickness=.5,pad=thickness/2;
    leaf('pathProgress',`${i}–${i+1} 千转实时填充`,a-pad,ymin-pad,b-a+thickness,ymax-ymin+thickness,{pid:'obd.rpm',minVal:i*1000,maxVal:(i+1)*1000,points:t.map(p=>({x:round((p[0]-a)/(b-a)),y:round((p[1]-ymin)/(ymax-ymin))})),curve:1,forward:true,thickness:thickness*U,activeColor:C.cyan,inactiveColor:C.track,noDataColor:C.track,fill:true,fillColor:C.cyan,gradientTo:'none'});
    const cover=[[a-1,bottom(a)],...lo,[b+1,bottom(b)],[b+1,ymax+2],[a-1,ymax+2],[a-1,bottom(a)]];
    poly('转速下沿遮罩 '+i,cover,C.bg);
  }
  for(let i=1;i<8;i++){
    const x=marks[i],y=top(x)+9,bot=bottom(x)-7;
    rect('刻度线 '+i,x-1.2,y,2.4,Math.max(1,bot-y),C.tick);
  }
  for(let i=0;i<8;i++){
    const a=marks[i],b=marks[i+1],t=[],lo=[];
    for(let j=0;j<=12;j++){const x=a+(b-a)*j/12;t.push([x,top(x)]);lo.push([x,bottom(x)]);}
    poly('红色上轮廓 '+i,t,'none',C.red,6.5);
    poly('红色下轮廓 '+i,lo,'none',C.red,6.5);
  }
  const labels=[[55,520],[204,365],[353,201],[510,106],[670,95],[837,95],[1001,95],[1164,95],[1325,95]];
  labels.forEach(([x,y],i)=>text('转速刻度 '+i,String(i),x-23,y-24,46,48,39,{align:'center'}));
});

group('02 转速数值',1345,129,292,124,()=>{
  rect('紫色数值底板',1345,129,292,124,C.rpm);
  rect('紫色边缘',1345,129,292,1,'#62415D');
  text('发动机转速','1568',1370,139,241,92,90,{pid:'obd.rpm',align:'right',spacing:0});
  text('转速单位','RPM',1525,215,85,36,31,{align:'right'});
});

group('03 燃油 · 百分比',47,66,212,72,()=>{
  rect('油枪底座',47,111,34,5,C.white,2);
  rect('油枪机身',51,69,24,44,C.white,2);
  rect('油枪显示窗',54,73,17,14,C.bg,1);
  poly('油枪软管',[[75,73],[82,78],[85,87],[85,104],[89,108],[92,106],[92,92],[88,84],[85,78]],'none',C.white,3.5);
  poly('油枪手柄',[[83,70],[89,77],[88,81]],'none',C.white,3.5);
  text('燃油液位百分比','33.6',150,62,105,53,43,{pid:'obd.fuel_level',decimals:1,align:'right',spacing:-1});
  bar('燃油液位条',47,127,209,8,'obd.fuel_level',0,100,C.white);
});
group('04 TC · 暂无信号',50,171,213,62,()=>{
  text('牵引力控制标题','TC',50,168,79,42,32);
  rect('TC状态线',51,221,100,2,C.tick);
  text('TC未绑定提示','NO DATA',168,198,115,32,25,{color:C.amber});
  rect('未绑定提示线',168,228,94,1.5,C.amber);
});

const metrics=[
  ['05 冷却液温度','WATER','80',510,650,'°C','obd.coolant',0,1],
  ['06 机油温度','OIL TEMP','78',813,962,'°C','obd.oil_temp',0,1],
  ['07 机油压力 · 自定义源','OIL PRESS','1.7',1118,1260,'bar','user.oil_pressure_bar',1,1],
  ['08 空燃比 λ · 自定义源','LAMBDA','0.85',1427,1587,'λ','user.lambda',2,1]
];
for(const [name,title,s,x,ux,unit,pid,dec,mul] of metrics)group(name,x,359,210,121,()=>{
  text(title+' 标题',title,x,354,209,42,32,{spacing:-.5});
  text(title+' 读数',s,x-2,397,179,101,88,{pid,decimals:dec,multiplier:mul,spacing:-2.5});
  text(title+' 单位',unit,ux+24,440,53,40,29,{weight:500});
});

group('09 车速',641,568,518,329,()=>{
  text('车速单位','km/h',800,562,200,55,39,{align:'center',weight:400,family:'sans'});
  text('车速读数','24',644,600,518,297,282,{pid:'obd.speed',align:'center',family:'sans',spacing:-12});
});
group('10 挡位 · 自定义源',1339,575,262,327,()=>{
  text('挡位标题','GEAR',1374,573,180,48,36,{align:'center',spacing:-.5});
  text('挡位读数','5',1339,611,262,291,284,{pid:'obd.gear',align:'center',family:'sans'});
});
group('11 增压 · kPa换算bar',55,699,312,163,()=>{
  text('增压标题','BOOST',56,697,170,41,32,{spacing:-.5});
  text('增压读数','-0.41',53,738,250,109,94,{pid:'calc.boost',decimals:2,multiplier:.01,spacing:-3});
  text('增压单位','bar',316,784,56,44,30,{weight:500});
  bar('增压进度 · -1至2bar',55,847,308,12,'calc.boost',-100,200);
});
group('12 总里程',642,878,302,37,()=>{
  text('总里程标题','ODO',642,878,85,39,27,{spacing:-.5});
  text('总里程读数','701',771,877,105,40,28,{pid:'obd.odo',align:'right'});
  text('里程单位','km',903,877,53,40,27,{weight:500});
});

const design={schema:'icar.ui/3',meta:{name:'红线赛车 · 参考图2',author:'ICarUI',description:'按用户参考图2复刻。1672×941，矢量图层可编辑。演示读数不写入车辆数据。TC无数据；挡位、油压bar、lambda须配置真实来源；燃油按百分比显示。'},canvas:{unit:360,designW:W,designH:H,scaleMode:0},theme:'neon',themeColors:{background:C.bg,surface:C.track,surfaceEdge:C.tick,accent:C.cyan,accentHot:C.white,accentDim:C.bar,track:C.bar,tick:C.tick,needle:C.red,value:C.white,label:C.white,dim:C.tick,glow:false,title:'红线赛车',description:'参考图2'},assets:[],nodes};
const samples={'obd.rpm':1568,'obd.speed':24,'obd.coolant':80,'obd.oil_temp':78,'obd.fuel_level':33.6,'calc.boost':-41,'obd.odo':701,'obd.gear':5,'user.oil_pressure_bar':1.7,'user.lambda':.85};

// The existing renderer positions by each axis but sizes leaves by the short
// axis. Author a complete layout for each target aspect, instead of stretching
// the same segmented track into gaps. File schema and renderer stay unchanged.
function retarget(width,height){
  if(width===W&&height===H)return structuredClone(design);
  const d=structuredClone(design),k=Math.min(width/W,height/H),offX=(width-W*k)/2,offY=(height-H*k)/2;
  const leafScale=H/Math.min(width,height)*k;
  function walk(items,root=true){for(const n of items){
    if(n.type==='group'){
      n.x=round((n.x*W/360*k+(root?offX:0))*360/width);n.y=round((n.y*H/360*k+(root?offY:0))*360/height);
      n.w=round(n.w*W*k/width);n.h=round(n.h*H*k/height);walk(n.children,false);
    }else{
      const cx=(n.x+n.w/2)*W/360*k+(root?offX:0),cy=(n.y+n.h/2)*H/360*k+(root?offY:0);
      n.w=round(n.w*leafScale);n.h=round(n.h*leafScale);n.x=round(cx*360/width-n.w/2);n.y=round(cy*360/height-n.h/2);
      for(const key of ['strokeWidth','cornerRadius','thickness','size','unitSize'])if(typeof n[key]==='number')n[key]=round(n[key]*leafScale);
      if(n.font){n.font.size=round(n.font.size*leafScale);n.font.letterSpacing=round(n.font.letterSpacing*leafScale);}
    }
  }}
  walk(d.nodes);d.canvas.designW=width;d.canvas.designH=height;d.meta.name+=' · '+width+'×'+height;
  return d;
}

async function main(){
  const dir=__dirname,json=JSON.stringify(design,null,2)+'\n';
  fs.writeFileSync(path.join(dir,'红线赛车_可编辑主题.json'),json);
  fs.writeFileSync(path.join(dir,'preview-values.json'),JSON.stringify(samples,null,2)+'\n');
  const pack=await PackKit.buildPackage({design,designJson:json,crc32:ZipKit.crc32,readBytes:async()=>({missing:'No external assets expected'})});
  if(pack.missing.length)throw Error('Unexpected missing assets');
  fs.writeFileSync(path.join(dir,'红线赛车_主题包.icarzip'),ZipKit.buildZip(pack.entries).bytes);
  const variants={'1672x941':{design,json:'红线赛车_可编辑主题.json',pack:'红线赛车_主题包.icarzip'}};
  fs.mkdirSync(path.join(dir,'其他比例'),{recursive:true});
  for(const [w,h] of [[1920,720],[1280,800]]){
    const d=retarget(w,h),j=JSON.stringify(d,null,2)+'\n',stem='其他比例/红线赛车_'+w+'x'+h;
    const p=await PackKit.buildPackage({design:d,designJson:j,crc32:ZipKit.crc32,readBytes:async()=>({missing:'No assets'})});
    fs.writeFileSync(path.join(dir,stem+'.json'),j);fs.writeFileSync(path.join(dir,stem+'.icarzip'),ZipKit.buildZip(p.entries).bytes);
    variants[w+'x'+h]={design:d,json:stem+'.json',pack:stem+'.icarzip'};
  }
  fs.writeFileSync(path.join(dir,'theme-data.js'),'window.REF02_VARIANTS = '+JSON.stringify(variants)+';\nwindow.REF02_THEME = window.REF02_VARIANTS["1672x941"].design;\nwindow.REF02_SAMPLES = '+JSON.stringify(samples)+';\n');
  console.log(JSON.stringify({nodes:serial,design:path.join(dir,'红线赛车_可编辑主题.json'),packBytes:fs.statSync(path.join(dir,'红线赛车_主题包.icarzip')).size}));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={design,samples,retarget};
