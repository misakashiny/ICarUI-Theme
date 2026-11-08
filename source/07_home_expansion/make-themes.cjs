/* Editable companions to ICarOBD 1.21.25. No screenshots or private assets in designs.
 * Coordinate contract: axis positions use 0..360; leaf dimensions and fonts use the shorter axis.
+ * Leaf content is uniformly scaled around the authored box center in BOTH runtimes.
 * Run from the repository's browser export workflow; JSON is the design, not a new schema.
 */
const styles={
 ice:{name:'冰川 HUD',bg:'#08131C',surface:'#12232E',track:'#2A4352',ink:'#EDF8FF',muted:'#B0CADB',accent:'#75D7FF'},
 redline:{name:'赤线性能',bg:'#130E12',surface:'#24191F',track:'#493640',ink:'#FFF5F7',muted:'#D5BBC6',accent:'#FF8998'},
 expedition:{name:'远征仪表',bg:'#14120B',surface:'#252117',track:'#494030',ink:'#FFF6DF',muted:'#D0C3A4',accent:'#F4CA7B'},
 neon:{name:'霓虹赛道',bg:'#080A0E',surface:'#17110D',track:'#46391E',ink:'#FFF4DF',muted:'#D8BFA0',accent:'#FF9A28'}
};
const samples={'std_0D':68,'std_0C':2350,'std_05':86,'std_42':14.2,'std_2F':63,'calc_avg_l100':6.8};
function build(key,landscape){
 const p=styles[key],W=landscape?1280:720,H=landscape?720:1280,k=360/Math.min(W,H),nodes=[];
 const n=(type,id,x,y,w,h,props={})=>{const v={id,type,name:id,x:(x+w/2)*360/W-w*k/2,y:(y+h/2)*360/H-h*k/2,w:w*k,h:h*k,alpha:255,rotation:0,scale:1,z:nodes.length,...props};nodes.push(v);return v;};
 const text=(id,value,x,y,w,h,size,color=p.muted,align='left')=>n('text',id,x,y,w,h,{text:value,font:{family:'sans',size:size*k,weight:500,align,color}});
 const shape=(id,x,y,w,h,fill=p.surface,kind='roundRect',extra={})=>n('shape',id,x,y,w,h,{kind,fill,stroke:'none',strokeWidth:0,cornerRadius:12*k,...extra});
 const val=(id,pid,unit,x,y,w,h,size,decimals=0)=>n('valueText',id,x,y,w,h,{pid,decimals,unit,size:size*k,unitSize:24*k,align:key==='redline'?2:1,color:p.ink,noDataColor:p.muted});
 const bar=(id,pid,max,x,y,w,h)=>n('pathProgress',id,x,y,w,h,{pid,minVal:0,maxVal:max,points:[{x:0,y:.5},{x:1,y:.5}],curve:0,thickness:5*k,activeColor:p.accent,inactiveColor:p.track});
 text('theme-title',p.name,32,24,W-230,48,30,p.ink);text('brand','ICarOBD',W-182,28,150,40,23,p.muted,'right');
 shape('header-rule',32,90,W-64,2,p.track,'rect');
 const main=landscape?[[32,140,324,404],[380,140,324,404]]:key==='redline'?[[32,144,316,570],[372,144,316,570]]:[[32,130,656,350],[32,506,656,246]];
 for(let i=0;i<2;i++){
  const[x,y,w,h]=main[i],pid=i?'obd.rpm':'obd.speed',max=i?8000:240,unit=i?'rpm':'km/h',title=i?'发动机转速':'车速',id=i?'rpm':'speed';
  if(key==='redline'){
   shape(id+'-panel',x,y,w,h,p.surface);shape(id+'-mark',x+20,y+26,36,5,p.accent,'rect');text(id+'-label',title,x+20,y+52,w-40,44,26);
   val(id+'-value',pid,unit,x+20,y+h*.28,w-40,h*.33,i?72:132);
   bar(id+'-bar',pid,max,x+24,y+h*.78,w-48,14);text(id+'-range','0   /   '+max,x+24,y+h*.85,w-48,32,20);
  }else if(key==='expedition'||key==='neon'){
   const d=Math.min(w-28,h-18),cx=x+w/2,cy=y+h/2;
   n('segmentedArc',id+'-ring',cx-d/2,cy-d/2,d,d,{pid,minVal:0,maxVal:max,startAngle:145,sweepAngle:250,segmentCount:key==='neon'?48:40,gapAngle:2.0,thickness:(key==='neon'?7:3)*k,radiusRatio:.44,activeColor:p.accent,inactiveColor:p.track,noDataColor:p.track});
   text(id+'-label',title,cx-d*.4,cy-d*.23,d*.8,36,24,p.muted,'center');val(id+'-value',pid,unit,cx-d*.38,cy-d*.08,d*.76,d*.27,i?60:92);
   text(id+'-range','0  —  '+max,cx-d*.32,cy+d*.25,d*.64,30,19,p.muted,'center');
   if(key==='neon'){const e={enabled:true,pid,op:'gte',from:0,kind:'neon',color:p.accent,size:.7,intensity:.28,periodMs:900};nodes.find(n=>n.id===id+'-ring').effects=[e];shape(id+'-edge',x+18,y+h-4,w-36,2,p.accent,'rect');}
  }else{
   text(id+'-label',title,x+16,y+16,w-32,40,27);val(id+'-value',pid,unit,x+16,y+h*.24,w-32,h*.37,i?80:150);
   const count=18,bw=(w-32)/count;
   for(let j=0;j<count;j++){const bh=22+j*2.6;n('pathProgress',id+'-step-'+j,x+16+j*bw,y+h*.70+40-bh,bw*.75,bh,{pid,minVal:j*max/count,maxVal:(j+1)*max/count,points:[{x:.5,y:1},{x:.5,y:0}],thickness:bw*.45*k,activeColor:p.accent,inactiveColor:p.track,curve:0});}
   text(id+'-range','0   /   '+max,x+16,y+h-28,w-32,28,19);
  }
 }
 const metrics=[['coolant','冷却液温度','obd.coolant','°C',120,0],['voltage','控制模块电压','obd.voltage','V',18,1],['fuel','燃油液位','obd.fuel_level','%',100,0],['average','平均油耗','calc.avg_l100','L/100km',20,1]];
 const ox=landscape?756:32,oy=landscape?140:812,cw=landscape?238:316,ch=landscape?190:174,gap=24;
 metrics.forEach(([id,label,pid,unit,max,dec],i)=>{const x=ox+(i%2)*(cw+gap),y=oy+Math.floor(i/2)*(ch+gap);shape(id+'-panel',x,y,cw,ch);text(id+'-label',label,x+18,y+18,cw-36,36,24);val(id+'-value',pid,unit,x+18,y+61,cw-36,ch-91,56,dec);bar(id+'-bar',pid,max,x+18,y+ch-18,cw-36,5);});
 text('editing-note','ICarOBD  /  DRIVE INSTRUMENTS',32,H-54,W-64,28,18,p.muted);
 return {schema:'icar.ui/3',meta:{name:p.name+' · '+(landscape?'横屏':'竖屏'),author:'ICarUI',description:'与 ICarOBD 1.21.25 默认仪表风格配套。全部为可编辑控件；横竖版分别排版。平均油耗需要已启用并有数据的计算 PID。无数据时保留缺失状态。'},canvas:{unit:360,designW:W,designH:H,scaleMode:0,fitToDevice:true},theme:'neon',themeColors:{background:p.bg,surface:p.surface,value:p.ink,label:p.muted,dim:p.muted,accent:p.accent,track:p.track,easingTauMs:90,valueSmoothingMs:0},assets:[],nodes};
}
module.exports={styles,samples,build};
if(require.main===module)console.log(JSON.stringify({samples,designs:Object.fromEntries(Object.keys(styles).flatMap(key=>[false,true].map(land=>[key+'-'+(land?'landscape':'portrait'),build(key,land)])))},null,2));
