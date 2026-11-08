/* Two editable ICARUI v3 themes. Vehicle PNGs are separate image assets.
 * Pixel coordinates refer to the supplied 1672 × 941 references.
 * Run: node tools/icarui/themes/01_neon_pair/build-themes.cjs
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const PackKit=require('../../js/pack.js'),ZipKit=require('../../js/zip.js');
const W=1672,H=941,U=360/H;
const C={bg:'#050607',pink:'#FF0066',white:'#FAFAFC',gray:'#55585B',silver:'#B6BDC5',line:'#D7D9DC',dim:'#74757B'};
const samples={'obd.rpm':4500,'obd.speed':135,'obd.gear':4,'obd.coolant':96,'obd.oil_temp':105,'calc.boost':80,'user.oil_pressure_bar':4.3,'calc.trip':12.8,'obd.voltage':13.8};
const round=n=>Math.round(n*1e5)/1e5;
function build(kind){
  let serial=0,ox=0,oy=0,list=[];const nodes=list,front=kind==='speed',stem=front?'霓虹赛道_车速版':'霓虹赛道_挡位版';
  function leaf(type,name,x,y,w,h,extra={}){
    const n={id:kind+'_'+(++serial),type,name,x:round((x-ox+w/2)*360/W-w*U/2),y:round((y-oy)*U),w:round(w*U),h:round(h*U),rotation:0,scale:1,alpha:255,z:list.length,...extra};list.push(n);return n;
  }
  function group(name,x,y,w,h,fn){const parent=list,px=ox,py=oy;const n={id:kind+'_'+(++serial),type:'group',name,x:round((x-ox)*360/W),y:round((y-oy)*360/H),w:round(w*360/W),h:round(h*360/H),z:list.length,children:[]};parent.push(n);list=n.children;ox=x;oy=y;fn();list=parent;ox=px;oy=py;return n;}
  function poly(name,pts,fill='none',stroke='none',width=0){
    const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),pad=Math.max(.5,width/2);let x=Math.min(...xs)-pad,y=Math.min(...ys)-pad,w=Math.max(...xs)-x+pad,h=Math.max(...ys)-y+pad;
    const m=11.5/U;if(w<m){x-=(m-w)/2;w=m;}if(h<m){y-=(m-h)/2;h=m;}
    return leaf('shape',name,x,y,w,h,{kind:'polyline',fill,stroke,strokeWidth:width*U,points:pts.map(p=>({x:round((p[0]-x)/w),y:round((p[1]-y)/h)}))});
  }
  function rect(name,x,y,w,h,fill,stroke='none',sw=0){return poly(name,[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],fill,stroke,sw);}
  function line(name,pts,color=C.line,width=1.5){return poly(name,pts,'none',color,width);}
  function text(name,s,x,y,w,h,size,o={}){const {pid,decimals=0,multiplier=1,align='left',weight=700,color=C.white,family='sans',spacing=0,italic=false}=o;return leaf('text',name,x,y,w,h,{text:s,font:{family,size:size*U,weight,italic,letterSpacing:spacing*U,align,color},...(pid?{textBinding:{pid,decimals,multiplier,offset:0,prefix:'',suffix:''}}:{})});}
  function image(name,assetId,x,y,w,h){const n={id:kind+'_'+(++serial),type:'image',name,assetId,x:round((x-ox)*360/W),y:round((y-oy)*360/H),w:round(w*360/W),h:round(h*360/H),rotation:0,scale:1,alpha:255,z:list.length};list.push(n);return n;}
  function arc(name,cx,cy,r,t,color,count=1,gap=0,pid='obd.rpm'){
    const size=2*(r+t/2+5);return leaf('segmentedArc',name,cx-size/2,cy-size/2,size,size,{pid,minVal:0,maxVal:8000,radiusRatio:r/size,thickness:t*U,startAngle:135,sweepAngle:270,segmentCount:count,gapAngle:gap,activeColor:color,inactiveColor:count===1?color:(front?C.gray:C.silver),noDataColor:count===1?color:'#414348'});
  }
  function bar(name,x,y,w,h,pid,min,max){
    rect(name+' 底轨',x,y,w,h,front?'#303438':C.silver);
    return leaf('pathProgress',name+' 实时填充',x,y,w,h,{pid,minVal:min,maxVal:max,points:[{x:0,y:0},{x:1,y:0}],curve:1,forward:true,thickness:.5*U,activeColor:C.pink,inactiveColor:front?'#303438':C.silver,noDataColor:'#414348',fill:true,fillColor:C.pink,gradientTo:'none'});
  }
  const carId=front?'car-front':'car-angle',bgId=front?'background-speed':'background-gear';
  image('01 背景纹理 · 独立可替换素材',bgId,0,0,W,H);
  const cx=835,cy=front?468:459,ring=front?299:285,thick=front?88:96,outer=front?354:344;
  group('02 转速环 · 0–8000 RPM',410,35,850,715,()=>{
    arc('粉色分段转速',cx,cy,ring,thick,C.pink,24,.7);
    arc('白色外轮廓',cx,cy,outer,5,C.white);
    arc('内轮廓',cx,cy,front?245:225,1.7,C.dim);
    const point=(r,a)=>[cx+r*Math.cos(a*Math.PI/180),cy+r*Math.sin(a*Math.PI/180)];
    if(front){for(let i=0;i<=80;i++)if(i%10!==0)line('细刻度 '+i,[point(369,135+i*270/80),point(378,135+i*270/80)],C.white,1.5);}
    else for(let i=0;i<=32;i++)line('内侧细刻度 '+i,[point(207,135+i*270/32),point(223,135+i*270/32)],i<19?'#886075':C.dim,2.8);
    for(let i=0;i<=8;i++){
      const a=135+i*270/8;line('主刻度 '+i,[point(outer+1,a),point(outer+26,a)],C.white,5);
      const p=point(front?400:390,a);text('转速刻度 '+i,String(i),p[0]-34,p[1]-35,68,70,front?52:55,{align:'center'});
    }
  });
  if(front){
    function panel(name,title,x,y,w,pid,min,max,value,unit,dec=0,mul=1){
      group(name,x,y,w,207,()=>{
        line(title+' 左边框',[[x+37,y],[x+16,y],[x,y+16],[x,y+175],[x+21,y+196],[x+37,y+196]]);
        line(title+' 右边框',[[x+w-37,y+15],[x+w-16,y+15],[x+w,y+31],[x+w,y+177],[x+w-34,y+199],[x+w-54,y+199]]);
        text(title+' 标题',title,x+47,y-1,w-94,35,23,{align:'center',weight:400,spacing:5});
        const by=y+49,bx=x+17,bw=w-36;rect(title+' 条边框',bx,by,bw,50,'none',C.line,1.5);bar(title,bx+7,by+8,bw-14,33,pid,min,max);
        const tickCount=title==='BOOST'?3:2;
        for(let i=0;i<=tickCount;i++){
          const tx=bx+10+(bw-20)*i/tickCount;line(title+' 标线 '+i,[[tx,by+50],[tx,by+62]],C.line,1.5);
          text(title+' 刻度 '+i,String(Math.round((min+(max-min)*i/tickCount)*mul)),tx-28,by+64,56,33,23,{align:'center',weight:400});
        }
        const places={'WATER TEMP':[136,275,136,280],'OIL TEMP':[1353,275,136,1500],'BOOST':[113,587,155,280],'OIL PRESS':[1367,587,132,1500]};
        const [vx,vy,vw,ux]=places[title];
        text(title+' 读数',value,vx,vy,vw,86,74,{pid,decimals:dec,multiplier:mul,color:C.pink,align:'center'});
        text(title+' 单位',unit,ux,vy+31,87,42,32,{weight:400});
      });
    }
    panel('03 冷却液温度','WATER TEMP',64,126,353,'obd.coolant',40,120,'96','°C');
    panel('04 机油温度','OIL TEMP',1254,126,354,'obd.oil_temp',60,140,'105','°C');
    panel('05 增压 · kPa换bar','BOOST',64,439,315,'calc.boost',0,300,'0.8','bar',1,.01);
    panel('06 机油压力 · 自定义源','OIL PRESS',1291,439,317,'user.oil_pressure_bar',0,8,'4.3','bar',1);
    group('07 中央车速与挡位',650,258,370,453,()=>{
      text('转速数值','4500',728,263,215,65,54,{pid:'obd.rpm',align:'center'});
      text('转速单位','RPM',754,318,163,40,28,{align:'center',weight:400,spacing:2});
      line('RPM左横线',[[701,319],[748,319]],C.dim);line('RPM右横线',[[925,319],[972,319]],C.dim);
      text('车速读数','135',646,382,378,160,154,{pid:'obd.speed',align:'center',italic:true,spacing:-5});
      text('车速单位','km/h',715,526,240,48,39,{align:'center'});
      line('粉色分隔线',[[680,582],[992,582]],C.pink,2);
      text('挡位读数','4',758,586,155,110,101,{pid:'obd.gear',align:'center'});
      text('挡位标题','GEAR',731,681,209,38,24,{align:'center',weight:400,spacing:5});
      line('挡位左线',[[703,651],[764,651]],C.dim);line('挡位右线',[[905,651],[966,651]],C.dim);
    });
    group('08 底部行程与电压',39,785,1594,110,()=>{
      line('行程上沿',[[100,791],[605,791],[639,820]]);line('电压上沿',[[1033,820],[1067,791],[1573,791]]);
      poly('左粉色斜杠',[[39,833],[74,790],[92,790],[57,833],[39,833]],C.pink);
      poly('右粉色斜杠',[[1581,790],[1599,790],[1633,833],[1615,833],[1581,790]],C.pink);
      line('左下装饰',[[60,843],[145,843]],C.pink,2);line('右下装饰',[[1527,843],[1613,843]],C.pink,2);
      poly('左收口',[[420,846],[667,844],[675,849],[420,846]],C.pink);poly('右收口',[[995,849],[1003,844],[1220,846],[995,849]],C.pink);
      text('行程标题','TRIP',158,812,94,32,19,{weight:400,spacing:5});
      text('行程读数','12.8',257,795,116,65,52,{pid:'calc.trip',decimals:1});text('行程单位','km',380,815,71,38,29,{weight:400});
      text('电压标题','VOLTAGE',1236,812,124,32,18,{weight:400,spacing:5});
      text('电压读数','13.8',1368,795,114,65,52,{pid:'obd.voltage',decimals:1});text('电压单位','V',1493,815,42,38,29,{weight:400});
      line('车底粉线',[[650,882],[1026,882]],C.pink,1);
    });
    image('09 红色赛车 · 正面透明素材',carId,686,726,300,300*935/1683);
  }else{
    function panel(name,title,x,y,w,pid,min,max,value,unit,dec=0,mul=1){
      group(name,x,y,w,174,()=>{
        const by=y+67,bx=x+18,bw=w-36;
        line(title+' 上刻度框',[[x+14,y+35],[x+14,y+53],[x+w-14,y+53],[x+w-14,y+35]],C.white,3);
        const count=unit==='bar'&&title==='BOOST'?3:2;
        for(let i=0;i<=count;i++){
          const tx=x+14+(w-28)*i/count;if(i>0&&i<count)line(title+' 刻度线 '+i,[[tx,y+37],[tx,y+53]],C.white,3);
          text(title+' 刻度 '+i,String(Math.round((min+(max-min)*i/count)*mul)),tx-35,y-1,70,38,31,{align:'center',weight:400});
        }
        rect(title+' 条边框',bx,by,bw,68,'none',C.line,2);bar(title,bx+6,by+4,bw-12,60,pid,min,max);
        line(title+' 左下框',[[x,y+67],[x,y+154],[x+73,y+154]],C.line,2.6);
        line(title+' 右下框',[[x+w,y+67],[x+w,y+154],[x+w-70,y+154]],C.line,2.6);
        text(title+' 读数',value,bx+22,by-3,bw*.60,72,55,{pid,decimals:dec,multiplier:mul,color:'#030407'});
        text(title+' 单位',unit,bx+(unit==='°C'?138:bw*.70),by+13,bw*.28,51,36,{color:'#030407',weight:400});
        text(title+' 标题',title,x+51,y+139,w-102,45,32,{align:'center'});
      });
    }
    panel('03 冷却液温度','WATER TEMP',79,73,390,'obd.coolant',40,120,'96','°C');
    panel('04 机油温度','OIL TEMP',1204,73,387,'obd.oil_temp',60,140,'105','°C');
    panel('05 增压 · kPa换bar','BOOST',83,298,351,'calc.boost',0,300,'0.8','bar',1,.01);
    panel('06 机油压力 · 自定义源','OIL PRESS',1235,298,354,'user.oil_pressure_bar',0,8,'4.3','bar',1);
    group('07 中央挡位',650,285,370,285,()=>{
      text('转速环单位','RPM ×1000',703,289,264,43,27,{align:'center'});
      const gear=text('挡位读数','4',695,340,280,234,235,{pid:'obd.gear',align:'center',italic:true});
      gear.effects=[{enabled:true,pid:'obd.gear',op:'between',from:0,to:10,kind:'neon',color:C.pink,size:3,intensity:.45}];
      text('挡位标题','GEAR',760,535,150,42,26,{align:'center',spacing:2});
      line('挡位左线',[[735,551],[780,551]],C.dim,2);line('挡位右线',[[890,551],[938,551]],C.dim,2);
    });
    group('08 侧裙轮廓与底栏',0,440,W,453,()=>{
      for(const flip of [false,true]){
        const pts=a=>a.map(([x,y])=>[flip?W-x:x,y]),s=flip?'右':'左';
        poly(s+'侧内框',pts([[0,440],[117,548],[200,548],[221,556],[369,689],[413,722],[468,722],[563,815],[0,815],[0,440]]),'#080A0D');
        line(s+'银色轮廓',pts([[0,443],[117,549],[199,549],[218,555],[369,689]]),'#ADB1B8',3);
        poly(s+'上粉色切口',pts([[9,482],[61,535],[76,535],[24,482],[9,482]]),C.pink);
        poly(s+'下粉色切口',pts([[44,683],[81,723],[96,723],[59,683],[44,683]]),C.pink);
        const p=pts([[369,689]])[0];poly(s+'轮廓端点',Array.from({length:25},(_,i)=>[p[0]+9*Math.cos(i*Math.PI/12),p[1]+9*Math.sin(i*Math.PI/12)]),'#080A0D',C.line,3);
      }
      poly('行程粉色底板',[[0,750],[438,750],[563,869],[83,869],[0,750]],C.pink);
      poly('车速粉色底板',[[1234,750],[1672,750],[1590,869],[1101,869],[1234,750]],C.pink);
      text('行程标题','TRIP',89,790,117,52,38);
      text('行程读数','12.8',196,757,187,105,93,{pid:'calc.trip',decimals:1,spacing:-4});
      text('行程单位','km',389,799,97,61,47);
      text('车速读数','135',1220,740,247,132,114,{pid:'obd.speed',align:'right',spacing:-4});
      text('车速单位','km/h',1488,799,150,61,47);
    });
    image('09 红色赛车 · 斜前透明素材',carId,499,558,580,580*941/1671);
  }
  const assets=[{id:carId,name:front?'红色赛车正面':'红色赛车斜前',path:'assets/'+carId+'.png',kind:'custom',w:front?1683:1671,h:front?935:941},{id:bgId,name:front?'深黑背景':'碳纤维背景',path:'assets/'+bgId+'.png',kind:'custom',w:836,h:471}];
  return {stem,nodes:serial,design:{schema:'icar.ui/3',meta:{name:stem.replace('_',' · '),author:'ICarUI',description:'按用户参考图1复刻。原生可编辑图层、独立透明赛车素材。读数仅演示；挡位和油压须配置实际来源；增压kPa换bar。车辆由内置imagegen参考重建，非原像素裁切。'},canvas:{unit:360,designW:W,designH:H,scaleMode:0},theme:'neon',themeColors:{background:C.bg,surface:'#121418',surfaceEdge:C.line,accent:C.pink,accentHot:C.white,accentDim:'#5E0030',track:C.gray,tick:C.line,needle:C.pink,value:C.white,label:C.white,dim:C.dim,glow:false,title:stem,description:'参考图1'},assets,nodes}};
}
const themes={speed:build('speed'),gear:build('gear')};
function retarget(design,width,height){
  const d=structuredClone(design);if(width===W&&height===H)return d;
  const k=Math.min(width/W,height/H),offX=(width-W*k)/2,offY=(height-H*k)/2,ls=H/Math.min(width,height)*k;
  function walk(items,root=true){for(const n of items){
    if(n.type==='group'||n.type==='image'){
      n.x=round((n.x*W/360*k+(root?offX:0))*360/width);n.y=round((n.y*H/360*k+(root?offY:0))*360/height);n.w=round(n.w*W*k/width);n.h=round(n.h*H*k/height);if(n.children)walk(n.children,false);
    }else{
      const cx=(n.x+n.w/2)*W/360*k+(root?offX:0),cy=(n.y+n.h/2)*H/360*k+(root?offY:0);n.w=round(n.w*ls);n.h=round(n.h*ls);n.x=round(cx*360/width-n.w/2);n.y=round(cy*360/height-n.h/2);
      for(const key of ['strokeWidth','cornerRadius','thickness','size','unitSize'])if(typeof n[key]==='number')n[key]=round(n[key]*ls);if(n.font){n.font.size=round(n.font.size*ls);n.font.letterSpacing=round(n.font.letterSpacing*ls);}for(const effect of n.effects||[])if(effect.size)effect.size=round(effect.size*ls);
    }
  }}walk(d.nodes);d.canvas.designW=width;d.canvas.designH=height;d.meta.name+=' · '+width+'×'+height;return d;
}
// Original procedural backgrounds, not modifications of any reference image.
function texture(carbon){
  const w=836,h=471,raw=Buffer.alloc((w*4+1)*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const p=y*(w*4+1)+1+x*4,rad=Math.max(0,1-Math.hypot((x-w/2)/(w*.65),(y-h*.45)/(h*.85)));
    const weave=carbon?(((Math.floor(x/3)+Math.floor(y/3))%2)?2.6:.3):0;
    const edge=carbon?Math.min(1,Math.abs(x-w/2)/(w*.42)):1;
    const v=Math.round(3+2.8*rad+weave*(.4+edge));raw[p]=v;raw[p+1]=v+1;raw[p+2]=v+2;raw[p+3]=255;
  }
  function chunk(type,data){const t=Buffer.from(type),b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);t.copy(b,4);data.copy(b,8);b.writeUInt32BE(ZipKit.crc32(Buffer.concat([t,data]))>>>0,data.length+8);return b;}
  const hdr=Buffer.alloc(13);hdr.writeUInt32BE(w);hdr.writeUInt32BE(h,4);hdr[8]=8;hdr[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
async function main(){
  const dir=__dirname,variants={},data={};fs.mkdirSync(path.join(dir,'其他比例'),{recursive:true});
  for(const key of ['speed','gear'])fs.writeFileSync(path.join(dir,'assets/background-'+key+'.png'),texture(key==='gear'));
  for(const [key,entry] of Object.entries(themes)){
    variants[key]={};for(const a of entry.design.assets){a.bytes=fs.statSync(path.join(dir,a.path)).size;data[a.id]='data:image/png;base64,'+fs.readFileSync(path.join(dir,a.path)).toString('base64');}
    for(const [w,h] of [[W,H],[1920,720],[1280,800]]){
      const d=retarget(entry.design,w,h),base=w===W?entry.stem:'其他比例/'+entry.stem+'_'+w+'x'+h,jsonPath=base+(w===W?'_可编辑主题':'')+'.json',packPath=base+(w===W?'_主题包':'')+'.icarzip';
      const json=JSON.stringify(d,null,2)+'\n';
      const p=await PackKit.buildPackage({design:d,designJson:json,crc32:ZipKit.crc32,readBytes:async ref=>{const a=d.assets.find(a=>a.id===ref.id||a.path===ref.path);return {bytes:new Uint8Array(fs.readFileSync(path.join(dir,ref.path))),w:a?.w,h:a?.h};}});
      if(p.missing.length)throw Error(JSON.stringify(p.missing));fs.writeFileSync(path.join(dir,jsonPath),json);fs.writeFileSync(path.join(dir,packPath),ZipKit.buildZip(p.entries).bytes);
      variants[key][w+'x'+h]={design:d,json:jsonPath,pack:packPath};
    }
  }
  fs.writeFileSync(path.join(dir,'preview-values.json'),JSON.stringify(samples,null,2)+'\n');
  fs.writeFileSync(path.join(dir,'theme-data.js'),'window.NEON_VARIANTS='+JSON.stringify(variants)+';\nwindow.NEON_SAMPLES='+JSON.stringify(samples)+';\nwindow.NEON_ASSETS='+JSON.stringify(data)+';\n');
  console.log(JSON.stringify(Object.fromEntries(Object.entries(themes).map(([k,v])=>[k,{nodes:v.nodes,pack:v.stem+'_主题包.icarzip'}]))));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={themes,samples,retarget};
