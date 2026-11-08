/* Editable Road King theme; classic gauge parts drive the two needles.
 * Run: node tools/icarui/themes/03_road_king/build-theme.cjs
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const PackKit=require('../../js/pack.js'),ZipKit=require('../../js/zip.js');
const W=1672,H=941,U=360/H,stem='公路之王';
const C={bg:'#171E1B',face:'#19201D',cream:'#FFF0CF',gold:'#FFD16D',gray:'#B5B9B2',dim:'#80877D',edge:'#343D36'};
let serial=0,ox=0,oy=0,list=[];const nodes=list,round=n=>Math.round(n*1e5)/1e5;
function leaf(type,name,x,y,w,h,extra={}){const n={id:'road_'+(++serial),type,name,x:round((x-ox+w/2)*360/W-w*U/2),y:round((y-oy)*U),w:round(w*U),h:round(h*U),rotation:0,scale:1,alpha:255,z:list.length,...extra};list.push(n);return n;}
function group(name,x,y,w,h,fn){const old=list,px=ox,py=oy,n={id:'road_'+(++serial),type:'group',name,x:round((x-ox)*360/W),y:round((y-oy)*360/H),w:round(w*360/W),h:round(h*360/H),z:list.length,children:[]};list.push(n);list=n.children;ox=x;oy=y;fn();list=old;ox=px;oy=py;return n;}
function poly(name,pts,fill='none',stroke='none',sw=0){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),pad=Math.max(.5,sw/2);let x=Math.min(...xs)-pad,y=Math.min(...ys)-pad,w=Math.max(...xs)-x+pad,h=Math.max(...ys)-y+pad;const m=11.5/U;if(w<m){x-=(m-w)/2;w=m;}if(h<m){y-=(m-h)/2;h=m;}return leaf('shape',name,x,y,w,h,{kind:'polyline',fill,stroke,strokeWidth:sw*U,points:pts.map(p=>({x:round((p[0]-x)/w),y:round((p[1]-y)/h)}))});}
function line(name,pts,color=C.cream,sw=2){return poly(name,pts,'none',color,sw);}
function circle(name,cx,cy,r,fill,stroke='none',sw=0){return leaf('shape',name,cx-r,cy-r,2*r,2*r,{kind:'circle',fill,stroke,strokeWidth:sw*U});}
function text(name,s,x,y,w,h,size,o={}){const {pid,decimals=0,multiplier=1,align='left',weight=700,color=C.cream,spacing=0}=o;return leaf('text',name,x,y,w,h,{text:s,font:{family:'sans',size:size*U,weight,italic:false,letterSpacing:spacing*U,align,color},...(pid?{textBinding:{pid,decimals,multiplier,offset:0,prefix:'',suffix:''}}:{})});}
function image(name,assetId,x,y,w,h){const n={id:'road_'+(++serial),type:'image',name,assetId,x:round((x-ox)*360/W),y:round((y-oy)*360/H),w:round(w*360/W),h:round(h*360/H),rotation:0,scale:1,alpha:255,z:list.length};list.push(n);return n;}
function arc(name,cx,cy,r,start,end,color,sw=3){
  // Native analytic arc survives the editor's two-decimal point export.
  // All colours are identical: this decorative outline is always static.
  const size=2*(r+sw/2+5);
  return leaf('segmentedArc',name,cx-size/2,cy-size/2,size,size,{pid:'obd.rpm',minVal:0,maxVal:8000,startAngle:start,sweepAngle:end-start,segmentCount:1,gapAngle:0,radiusRatio:r/size,thickness:sw*U,activeColor:color,inactiveColor:color,noDataColor:color});
}
image('01 手绘公路 · 独立背景','road-background',0,0,W,H);
image('02 公路之王 · 独立标题','road-title',525,0,620,209);
function dial(name,cx,cy,pid,max,steps,sample,unit){
  group(name,cx-300,cy-300,600,600,()=>{
    circle('深色圆盘',cx,cy,295,C.face);
    circle('圆盘外框',cx,cy,295,'none',C.edge,3.3);
    arc('奶油色内圈',cx,cy,279,125,410,C.cream,3.6);
    arc('金色高位弧',cx,cy,279,355,390,C.gold,4);
    const point=(r,a)=>[cx+r*Math.cos(a*Math.PI/180),cy+r*Math.sin(a*Math.PI/180)];
    const minors=steps===8?2:4,total=steps*minors;
    for(let i=0;i<=total;i++){
      const major=i%minors===0,a=150+i*240/total,col=major?((steps===8?i>=14:i>0)?C.gold:C.cream):C.dim;
      line('刻度 '+i,[point(major?241:254,a),point(269,a)],col,major?6.5:4.5);
    }
    for(let i=0;i<=steps;i++){
      const a=150+i*240/steps,p=point(215,a),label=steps===8?i:i*40;
      text('刻度数字 '+label,String(label),p[0]-55,p[1]-29,110,58,steps===8?46:40,{align:'center',weight:600});
    }
    // Needle has no separate PID so it inherits this explicitly authored range.
    // Binding the part directly would instead select the PID catalogue range.
    const size=580;
    // Editor gauge parts always draw a style footer. Its own label font is
    // subpixel; the real, readable labels and values are separate text nodes.
    leaf('gauge',unit+' 实时指针',cx-size/2,cy-size/2,size,size,{pid,min:0,max,style:0,showLabel:false,showRange:false,labelFont:{family:'sans',size:.001,weight:400,align:'left',color:C.face},card:{show:false},parts:[{kind:'needle',assetId:'road-needle',x:size/2*U,y:(size/2-6)*U,w:235*U,h:12*U,pivotX:0,pivotY:.5,rotation:0,sweepFrom:150,sweepTo:390,sweepFollow:false,alpha:255}]});
    circle('指针轴心',cx,cy,34,'#2A332D','#050806',2.5);
    if(unit==='RPM')text('转速刻度倍率','×1000',cx-80,cy+43,160,40,29,{align:'center',color:C.gray,weight:400});
    text(unit==='RPM'?'转速读数':'车速读数',sample,cx-176,cy+105,352,118,108,{pid,align:'center',spacing:-3});
    text('仪表单位 '+unit,unit,cx-115,cy+211,230,56,38,{align:'center',color:C.dim,weight:500});
  });
}
dial('03 左转速表 · 0–8000 RPM',322,417,'obd.rpm',8000,8,'2800','RPM');
dial('04 右车速表 · 0–200 km/h',1342,417,'obd.speed',200,5,'88','km/h');
group('05 挡位 · 预留实际来源',760,174,153,132,()=>{
  text('挡位标题','挡位',761,172,150,41,30,{align:'center',weight:500,color:C.gray});
  const corners=[[780,229,180],[892,229,270],[892,287,0],[780,287,90]],box=[];
  for(const [cx,cy,a] of corners)for(let i=0;i<=6;i++)box.push([cx+15*Math.cos((a+i*15)*Math.PI/180),cy+15*Math.sin((a+i*15)*Math.PI/180)]);
  box.push(box[0]);line('圆角挡位框',box,'#424A40',2.6);
  text('挡位读数','4',777,211,118,96,84,{pid:'obd.gear',align:'center',color:C.gold});
});
image('06 专注司机 · 独立透明素材','road-driver',553,311,564,429);
// The panel masks the driver's lower edge and stays independently editable.
group('07 前景公路面板',0,720,W,221,()=>{
poly('07 前景面板',[[0,761],[97,745],[210,731],[357,720],[1316,720],[1476,732],[1580,746],[1672,761],[1672,941],[0,941],[0,761]],'#171E1B');
line('面板上沿',[[0,791],[109,769],[219,751],[354,747],[1325,747],[1443,749],[1561,767],[1672,790]],'#4D554A',3);
for(const flip of [false,true]){
  const p=a=>a.map(([x,y])=>[flip?W-x:x,y]),side=flip?'右':'左';
  poly(side+'路面标记',p([[0,862],[94,821],[118,821],[0,901],[0,862]]),'#71786B');
  poly(side+'短标记',p([[118,825],[187,793],[208,793],[144,825],[118,825]]),'#596153');
}
});
const metrics=[['水温','80','obd.coolant',0,1,270,357,'°C'],['油温','92','obd.oil_temp',0,1,621,704,'°C'],['油压','3.8','user.oil_pressure_bar',1,1,945,1043,'bar'],['增压','0.2','calc.boost',1,.01,1304,1403,'bar']];
for(const [label,s,pid,dec,mul,x,ux,unit] of metrics)group('08 '+label,x-20,777,220,98,()=>{
  text(label+' 标题',label,x-17,777,160,43,30,{align:'center',weight:500,color:C.gray});
  text(label+' 读数',s,x-14,812,116,71,59,{pid,decimals:dec,multiplier:mul,align:'center',spacing:-1});
  text(label+' 单位',unit,ux,829,86,44,34,{weight:400,color:C.gray});
});
for(const x of [491,841,1191])line('底栏分隔 '+x,[[x,798],[x,864]],'#3A433A',2);
const design={schema:'icar.ui/3',meta:{name:'公路之王 · 手绘双仪表',author:'ICarUI',description:'参考图3。手绘装饰为独立素材，刻度/实时指针/读数为可编辑节点。转速0–8000、车速0–200，指针依照真实量程；挡位与油压需真实来源。'},canvas:{unit:360,designW:W,designH:H,scaleMode:0},theme:'amber',themeColors:{background:C.bg,surface:C.face,surfaceEdge:C.edge,accent:C.gold,accentHot:C.cream,accentDim:C.dim,track:C.edge,tick:C.cream,needle:C.gold,value:C.cream,label:C.gray,dim:C.dim,glow:false,title:'公路之王',description:'手绘公路双圆仪表'},assets:[['road-background','road-background.png','手绘公路'],['road-driver','driver.png','专注司机'],['road-title','title.png','公路之王标题'],['road-needle','needle.png','金色指针']].map(([id,file,name])=>({id,path:'assets/'+file,name,kind:'custom'})),nodes};
const samples={'obd.rpm':2800,'obd.speed':88,'obd.gear':4,'obd.coolant':80,'obd.oil_temp':92,'user.oil_pressure_bar':3.8,'calc.boost':20};
function retarget(width,height){
  const d=structuredClone(design);if(width===W&&height===H)return d;
  const k=Math.min(width/W,height/H),offX=(width-W*k)/2,offY=(height-H*k)/2,ls=H/Math.min(width,height)*k;
  function parts(items){for(const p of items||[]){for(const key of ['x','y','w','h'])if(typeof p[key]==='number')p[key]=round(p[key]*ls);parts(p.children);}}
  function walk(items,root=true){for(const n of items){
    if(n.type==='group'||n.type==='image'){n.x=round((n.x*W/360*k+(root?offX:0))*360/width);n.y=round((n.y*H/360*k+(root?offY:0))*360/height);n.w=round(n.w*W*k/width);n.h=round(n.h*H*k/height);if(n.children)walk(n.children,false);}
    else{const cx=(n.x+n.w/2)*W/360*k+(root?offX:0),cy=(n.y+n.h/2)*H/360*k+(root?offY:0);n.w=round(n.w*ls);n.h=round(n.h*ls);n.x=round(cx*360/width-n.w/2);n.y=round(cy*360/height-n.h/2);for(const key of ['strokeWidth','cornerRadius','thickness'])if(typeof n[key]==='number')n[key]=round(n[key]*ls);if(n.font){n.font.size=round(n.font.size*ls);n.font.letterSpacing=round(n.font.letterSpacing*ls);}parts(n.parts);}
  }}walk(d.nodes);d.canvas.designW=width;d.canvas.designH=height;d.meta.name+=' · '+width+'×'+height;return d;
}
function needlePNG(){
  // Original code-drawn needle asset for the existing gauge-parts renderer.
  // Points right at zero rotation; pivot is at the centre of its left edge.
  const w=940,h=48,raw=Buffer.alloc((w*4+1)*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const p=y*(w*4+1)+1+x*4,half=19-14*Math.pow(x/(w-1),2),d=half-Math.abs(y+.5-h/2),a=Math.max(0,Math.min(1,d));
    raw[p]=255;raw[p+1]=209;raw[p+2]=109;raw[p+3]=Math.round(a*255);
  }
  function chunk(type,data){const t=Buffer.from(type),b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);t.copy(b,4);data.copy(b,8);b.writeUInt32BE(ZipKit.crc32(Buffer.concat([t,data]))>>>0,data.length+8);return b;}
  const hdr=Buffer.alloc(13);hdr.writeUInt32BE(w);hdr.writeUInt32BE(h,4);hdr[8]=8;hdr[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
async function main(){
  fs.mkdirSync(path.join(__dirname,'其他比例'),{recursive:true});fs.writeFileSync(path.join(__dirname,'assets/needle.png'),needlePNG());
  const variants={},data={};for(const a of design.assets){const bytes=fs.readFileSync(path.join(__dirname,a.path));a.w=bytes.readUInt32BE(16);a.h=bytes.readUInt32BE(20);a.bytes=bytes.length;data[a.id]='data:image/png;base64,'+bytes.toString('base64');}
  for(const [w,h] of [[W,H],[1920,720],[1280,800]]){
    const d=retarget(w,h),base=w===W?stem:'其他比例/'+stem+'_'+w+'x'+h,jp=base+(w===W?'_可编辑主题':'')+'.json',pp=base+(w===W?'_主题包':'')+'.icarzip',json=JSON.stringify(d,null,2)+'\n';
    const pack=await PackKit.buildPackage({design:d,designJson:json,crc32:ZipKit.crc32,readBytes:async ref=>{const a=d.assets.find(a=>a.path===ref.path);return{bytes:new Uint8Array(fs.readFileSync(path.join(__dirname,ref.path))),w:a?.w,h:a?.h};}});if(pack.missing.length)throw Error(JSON.stringify(pack.missing));
    fs.writeFileSync(path.join(__dirname,jp),json);fs.writeFileSync(path.join(__dirname,pp),ZipKit.buildZip(pack.entries).bytes);variants[w+'x'+h]={design:d,json:jp,pack:pp};
  }
  fs.writeFileSync(path.join(__dirname,'preview-values.json'),JSON.stringify(samples,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'theme-data.js'),'window.ROAD_VARIANTS='+JSON.stringify(variants)+';\nwindow.ROAD_SAMPLES='+JSON.stringify(samples)+';\nwindow.ROAD_ASSETS='+JSON.stringify(data)+';\n');
  console.log(JSON.stringify({nodes:serial,assets:design.assets.map(({id,bytes,w,h})=>({id,bytes,w,h})),pack:stem+'_主题包.icarzip'}));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={design,samples,retarget};
