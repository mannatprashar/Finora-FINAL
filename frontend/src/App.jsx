import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, AudioLines, Bot, ChevronRight, CircleHelp, Download, MessageCircle, Mic, Paperclip, Plus, Send, Sparkles, Volume2, VolumeX, Wallet, X, SlidersHorizontal, RotateCcw, Upload, ChartNoAxesCombined, Menu, BookOpenCheck, Eye, Image, Brain, Volume2 as VolumeSpeaker, WandSparkles, Activity, Layers3, ScanEye, AudioWaveform,} from 'lucide-react';


const API_BASE='http://127.0.0.1:5000';
async function apiRequest(path,options={}){
 const response=await fetch(`${API_BASE}${path}`,options);
 const raw=await response.text();
 let data=null;
 try{data=raw?JSON.parse(raw):{};}catch{throw new Error(raw?.slice(0,180)||`Server returned ${response.status}`);}
 if(!response.ok)throw new Error(data?.error||`Request failed (${response.status})`);
 return data;
}  

const initialExpenses=[{name:'Housing',value:12500,color:'#a9f5c7'},{name:'Food',value:6200,color:'#79dca7'},{name:'Transport',value:2800,color:'#4eae82'},{name:'Lifestyle',value:4500,color:'#b9a5ff'},{name:'Other',value:2000,color:'#f4bd79'}];
const money=n=>'₹'+Math.round(Number(n)||0).toLocaleString('en-IN');
const pct=n=>`${Number(n).toFixed(1)}%`;
const learningSources=[
 {id:'rbi',title:'RBI — Financial Education',url:'https://www.rbi.org.in/financialeducation/'},
 {id:'sebi',title:'SEBI — Investor Education',url:'https://investor.sebi.gov.in/'},
 {id:'investor',title:'SEBI — Investor Awareness',url:'https://www.sebi.gov.in/investor-education.html'}
];
function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i],next=text[i+1];
  if(c==='"'&&quoted&&next==='"'){cell+='"';i++}
  else if(c==='"'){quoted=!quoted}
  else if(c===','&&!quoted){row.push(cell.trim());cell=''}
  else if((c==='\\n'||c==='\\r')&&!quoted){if(c==='\\r'&&next==='\\n')i++;row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);row=[];cell=''}
  else cell+=c;
 }
 row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);
 if(quoted)throw new Error('CSV contains an unclosed quoted field.');
 return rows;
}


function OrbScene(){
 const mount=useRef(null);
 useEffect(()=>{const host=mount.current;if(!host)return;let renderer,frame,resizeObserver;let cleanup=()=>{};
 try{
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,Math.max(host.clientWidth,1)/Math.max(host.clientHeight,1),.1,100);camera.position.z=5.7;
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;host.appendChild(renderer.domElement);
  const group=new THREE.Group();scene.add(group);
  const uniforms={uTime:{value:0}};
  const geo=new THREE.SphereGeometry(1.43,112,112);
  const mat=new THREE.ShaderMaterial({uniforms,vertexShader:`
   uniform float uTime; varying vec3 vNormal; varying vec3 vView; varying vec3 vPos; varying vec2 vUv;
   void main(){ vec3 p=position; float ripple=sin(p.y*5.0+uTime*.8)*cos(p.x*4.0-uTime*.45)*.025; p+=normal*ripple; vec4 mv=modelViewMatrix*vec4(p,1.0); vNormal=normalize(normalMatrix*normal); vView=-mv.xyz; vPos=p; vUv=uv; gl_Position=projectionMatrix*mv; }
  `,fragmentShader:`
   uniform float uTime; varying vec3 vNormal; varying vec3 vView; varying vec3 vPos; varying vec2 vUv;
   void main(){
    vec3 n=normalize(vNormal); vec3 viewDir=normalize(vView); float fres=pow(1.0-max(dot(n,viewDir),0.0),2.35);
    float flow=sin(vPos.y*5.5+uTime*.72+sin(vPos.x*4.0+uTime*.35))*0.5+0.5;
    float bands=smoothstep(.18,.95,flow); vec3 deep=vec3(.018,.055,.075); vec3 teal=vec3(.12,.78,.62); vec3 violet=vec3(.42,.31,.92); vec3 mint=vec3(.57,1.0,.78);
    vec3 col=mix(deep,teal,bands*.78); col=mix(col,violet,smoothstep(.35,.95,sin(vPos.x*3.4-vPos.z*2.6+uTime*.42)*.5+.5)*.58);
    col=mix(col,mint,pow(max(dot(n,normalize(vec3(-.55,.7,1.0))),0.0),5.0)*.78);
    col+=fres*vec3(.34,.95,.78)*1.5; float shimmer=pow(max(sin(vPos.x*13.0+vPos.y*9.0+uTime*1.8),0.0),18.0)*.09; col+=shimmer*vec3(.7,.9,1.0);
    gl_FragColor=vec4(col,1.0);
   }
  `});
  const orb=new THREE.Mesh(geo,mat);group.add(orb);
  const shell=new THREE.Mesh(new THREE.SphereGeometry(1.49,48,48),new THREE.MeshBasicMaterial({color:0x8dffe0,wireframe:true,transparent:true,opacity:.075}));group.add(shell);
  const ringMat=new THREE.MeshBasicMaterial({color:0x8effd2,transparent:true,opacity:.78});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.95,.009,8,220),ringMat);ring.rotation.set(1.05,.25,.28);group.add(ring);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(2.18,.005,8,220),new THREE.MeshBasicMaterial({color:0xa99bff,transparent:true,opacity:.62}));ring2.rotation.set(.3,1.13,.62);group.add(ring2);
  const ring3=new THREE.Mesh(new THREE.TorusGeometry(1.78,.003,8,180),new THREE.MeshBasicMaterial({color:0x6edfff,transparent:true,opacity:.36}));ring3.rotation.set(1.42,.5,-.35);group.add(ring3);
  const count=1250,points=new Float32Array(count*3);for(let i=0;i<count;i++){const r=2.35+Math.random()*2.4,a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1);points[i*3]=r*Math.sin(b)*Math.cos(a);points[i*3+1]=r*Math.cos(b);points[i*3+2]=r*Math.sin(b)*Math.sin(a)}
  const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.BufferAttribute(points,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xa5ffe0,size:.012,transparent:true,opacity:.72,sizeAttenuation:true}));scene.add(stars);
  const key=new THREE.PointLight(0x75ffd0,48,12);key.position.set(2.2,2.3,3.2);scene.add(key);const violetLight=new THREE.PointLight(0x8170ff,26,10);violetLight.position.set(-2,-1,2);scene.add(violetLight);scene.add(new THREE.AmbientLight(0xffffff,.75));
  let px=0,py=0,targetX=0,targetY=0;const onPointer=e=>{const r=host.getBoundingClientRect();targetY=((e.clientX-r.left)/r.width-.5)*.34;targetX=((e.clientY-r.top)/r.height-.5)*.22};const onLeave=()=>{targetX=0;targetY=0};host.addEventListener('pointermove',onPointer);host.addEventListener('pointerleave',onLeave);
  const resize=()=>{if(!renderer)return;const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)};resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const clock=new THREE.Clock();const animate=()=>{frame=requestAnimationFrame(animate);const t=clock.getElapsedTime();uniforms.uTime.value=t;px+=(targetX-px)*.035;py+=(targetY-py)*.035;group.rotation.y=t*.095+px;group.rotation.x=Math.sin(t*.22)*.08+py;orb.position.y=Math.sin(t*.68)*.045;shell.rotation.y=-t*.035;ring.rotation.z=t*.12;ring2.rotation.x=.3+Math.sin(t*.2)*.09;ring3.rotation.y=-t*.08;stars.rotation.y=t*.008;renderer.render(scene,camera)};animate();
  cleanup=()=>{host.removeEventListener('pointermove',onPointer);host.removeEventListener('pointerleave',onLeave);resizeObserver?.disconnect();cancelAnimationFrame(frame);geo.dispose();mat.dispose();shell.geometry.dispose();shell.material.dispose();ring.geometry.dispose();ring.material.dispose();ring2.geometry.dispose();ring2.material.dispose();ring3.geometry.dispose();ring3.material.dispose();starsGeo.dispose();stars.material.dispose();renderer.dispose();if(host.contains(renderer.domElement))host.removeChild(renderer.domElement)};
 }catch(e){console.warn('WebGL unavailable',e)}
 return()=>cleanup();
 },[]);
 return <div className="orb-wrap"><div className="orb-glow"/><div className="orb-aura aura-one"/><div className="orb-aura aura-two"/><div ref={mount} className="orb-canvas"/><div className="orb-caption"><span className="live-dot"/> FINORA / LIVE FINANCIAL INTELLIGENCE</div></div>
}
function CitedAnswer({content,sources=[]}){
 const parts=String(content||'').split(/(\[S\d+\])/g);
 return <>{parts.map((part,i)=>{const match=part.match(/^\[S(\d+)\]$/);if(!match)return <React.Fragment key={i}>{part}</React.Fragment>;
  const source=sources.find(s=>s.id===part);
  return source?<a className="inline-citation" key={i} href={source.url} target="_blank" rel="noreferrer" title={`${source.title}: ${source.snippet||''}`}>{part}</a>:<span key={i}>{part}</span>;
 })}</>;
}

function layoutMindMap(map){
 const center=map?.center; if(!center)return [];
 const nodes=Array.isArray(map.nodes)?map.nodes:[];
 const byParent={};
 nodes.forEach(node=>{(byParent[node.parent]||=[]).push(node);});
 const placed=[{...center,x:480,y:230,depth:0}];
 const place=(parentId,cx,cy,radius,depth)=>{
  const kids=byParent[parentId]||[];
  kids.forEach((kid,index)=>{
   const angle=-Math.PI/2+(Math.PI*2*index)/Math.max(kids.length,1);
   const x=cx+Math.cos(angle)*radius;
   const y=cy+Math.sin(angle)*radius*0.62;
   placed.push({...kid,x,y,px:cx,py:cy,depth});
   if(depth<2)place(kid.id,x,y,Math.max(110,radius*0.48),depth+1);
  });
 };
 place(center.id,480,230,250,1);
 return placed;
}
function MindMapView({map}){
 const stage=useRef(null);
 const drag=useRef(null);
 const [view,setView]=useState({x:0,y:0,scale:1});
 const [activeId,setActiveId]=useState(map?.center?.id);
 const placed=useMemo(()=>layoutMindMap(map),[map]);
 const active=placed.find(node=>node.id===activeId)||placed[0];
 useEffect(()=>{const el=stage.current;if(!el)return;const onWheel=event=>{event.preventDefault();const delta=event.deltaY<0?.08:-.08;setView(current=>({...current,scale:Math.min(2.6,Math.max(.45,current.scale+delta))}));};el.addEventListener('wheel',onWheel,{passive:false});return()=>el.removeEventListener('wheel',onWheel);},[]);
 return <div className="learning-panel">
  <div className="generated-label"><Layers3 size={12}/> MIND MAP · CLICK A NODE</div>
  <div className="mindmap-stage" ref={stage}
   onPointerDown={event=>{if(event.target===event.currentTarget||event.target.tagName==='svg')drag.current={x:event.clientX,y:event.clientY,ox:view.x,oy:view.y};}}
   onPointerMove={event=>{if(!drag.current)return;setView(current=>({...current,x:drag.current.ox+event.clientX-drag.current.x,y:drag.current.oy+event.clientY-drag.current.y}));}}
   onPointerUp={()=>{drag.current=null}} onPointerLeave={()=>{drag.current=null}}>
   <svg viewBox="0 0 960 460" style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.scale})`}}>
    {placed.filter(node=>node.px!=null).map(node=><line key={'e'+node.id} x1={node.px} y1={node.py} x2={node.x} y2={node.y} className="mindmap-edge"/>)}
    {placed.map(node=><g key={node.id} className={node.id===active?.id?'mindmap-node is-active':'mindmap-node'} transform={`translate(${node.x},${node.y})`} onClick={()=>setActiveId(node.id)}>
     <rect x={-78} y={-22} width={156} height={44} rx={12}/>
     <text textAnchor="middle" y={5}>{String(node.title||'').slice(0,22)}</text>
    </g>)}
   </svg>
  </div>
  <div className="mindmap-zoom"><button type="button" onClick={()=>setView(v=>({...v,scale:Math.min(2.6,v.scale+.12)}))}>Zoom in</button><button type="button" onClick={()=>setView(v=>({...v,scale:Math.max(.45,v.scale-.12)}))}>Zoom out</button><button type="button" onClick={()=>setView({x:0,y:0,scale:1})}>Reset</button></div>
  {active&&<div className="node-explain"><b>{active.title}</b><p>{active.explanation}</p></div>}
 </div>;
}
function QuizView({quiz,onDifficulty}){
 const [step,setStep]=useState(0);
 const [picked,setPicked]=useState(null);
 const [score,setScore]=useState(0);
 const [finished,setFinished]=useState(false);
 const questions=quiz?.questions||[];
 const current=questions[step];
 useEffect(()=>{setStep(0);setPicked(null);setScore(0);setFinished(false);},[quiz]);
 if(!current&&!finished)return null;
 const choose=choice=>{if(picked!==null)return;setPicked(choice);if(choice===current.answer)setScore(value=>value+1);};
 const next=()=>{if(step+1>=questions.length){setFinished(true);return;}setStep(value=>value+1);setPicked(null);};
 return <div className="learning-panel quiz-panel">
  <div className="generated-label"><CircleHelp size={12}/> QUIZ · {String(quiz.difficulty||'medium').toUpperCase()} · {finished?questions.length:step+1}/{questions.length}</div>
  <label className="quiz-difficulty">Difficulty <select value={quiz.difficulty||'medium'} onChange={event=>onDifficulty(event.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
  {finished?<div className="quiz-score"><b>{score}/{questions.length}</b><span>answered from this conversation</span></div>:<div>
   <p className="quiz-prompt">{current.prompt}</p>
   <div className="quiz-choices">{current.choices.map((choice,index)=><button type="button" key={index} className={picked===null?'':index===current.answer?'is-correct':picked===index?'is-wrong':''} onClick={()=>choose(index)}>{choice}</button>)}</div>
   {picked!==null&&<div className="node-explain"><b>{picked===current.answer?'Correct':'Not quite'}</b><p>{current.explanation}</p><button type="button" className="speak-answer" onClick={next}>{step+1>=questions.length?'See score':'Next question'}</button></div>}
  </div>}
 </div>;
}
function SlideDeck({deck}){
 const [index,setIndex]=useState(0);
 const [saving,setSaving]=useState(false);
 const [note,setNote]=useState('');
 const slides=deck?.slides||[];
 const slide=slides[index]||{title:deck?.title||'Finora briefing',bullets:[]};
 const download=async()=>{
  if(!deck?.file||saving)return;
  setSaving(true);setNote('');
  try{
   const response=await fetch(`${deck.file}?download=1`);
   if(!response.ok)throw new Error('The slide file could not be downloaded.');
   const blob=await response.blob();
   const url=URL.createObjectURL(blob);
   const link=document.createElement('a');
   const name=(deck.title||'finora-slides').replace(/[^\w\- ]+/g,' ').trim().slice(0,48)||'finora-slides';
   link.href=url;link.download=`${name}.pptx`;
   document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1500);
   setNote('Saved .pptx');
  }catch(error){setNote(error.message||'Could not save the PowerPoint.');}
  finally{setSaving(false)}
 };
 return <div className="learning-panel">
  <div className="generated-label"><BookOpenCheck size={12}/> SLIDE {slides.length?index+1:0} / {slides.length}</div>
  <div className="slide-card"><b>{slide.title}</b><ul>{(slide.bullets||[]).map((bullet,bulletIndex)=><li key={bulletIndex}>{bullet}</li>)}</ul></div>
  <div className="slide-controls"><button type="button" onClick={()=>setIndex(value=>Math.max(0,value-1))} disabled={index===0}>Previous</button><button type="button" onClick={()=>setIndex(value=>Math.min(slides.length-1,value+1))} disabled={!slides.length||index>=slides.length-1}>Next</button><button type="button" className="slide-download" onClick={download} disabled={saving||!deck?.file}>{saving?'Saving…':note||'Download .pptx'}</button></div>
 </div>;
}
function ChatPanel({onClose,context,embedded=false,voiceEnabled=false}){
 const [messages,setMessages]=useState([{role:'assistant',content:'Hi, I’m Finora. Ask me to explain a money concept, explore a scenario, or interpret the numbers in your workspace. I’ll show assumptions and keep the maths transparent.'}]);
 const [value,setValue]=useState('');
 const [busy,setBusy]=useState(false);
 const [mode,setMode]=useState('demo');
 const [attachment,setAttachment]=useState(null);
 const [videoBusy,setVideoBusy]=useState(null);
 const [actionBusy,setActionBusy]=useState(null);
 const [listening,setListening]=useState(false);
 const fileRef=useRef(null);
 const recognitionRef=useRef(null);
 const bodyRef=useRef(null);
 const panelFocus=useRef(null);
 const seenCount=useRef(messages.length);
 const scrollInChat=(selector)=>{
  const scroller=bodyRef.current;
  const node=scroller?.querySelector(selector);
  if(!node||!scroller)return;
  const top=node.getBoundingClientRect().top-scroller.getBoundingClientRect().top+scroller.scrollTop-8;
  scroller.scrollTo({top:Math.max(0,top),behavior:'smooth'});
 };
 useEffect(()=>{
  const focus=panelFocus.current;
  const grew=messages.length!==seenCount.current;
  seenCount.current=messages.length;
  if(focus){
   panelFocus.current=null;
   requestAnimationFrame(()=>scrollInChat(`[data-panel="${focus}"]`));
   return;
  }
  if(grew||busy)requestAnimationFrame(()=>scrollInChat('.message:last-of-type'));
 },[messages,busy]);
 const readImage=async(file)=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(file)});
 const pickImage=async(e)=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;const max=50*1024*1024;if(file.size>max){setMessages(m=>[...m,{role:'assistant',content:'That file is over 50 MB. Please choose a smaller file.'}]);return;}const isImage=file.type.startsWith('image/');try{const data=isImage?await readImage(file):null;setAttachment({name:file.name,data,file,isImage,type:file.type,size:file.size});}catch{setMessages(m=>[...m,{role:'assistant',content:'I could not read that file. Try another one.'}]);}};
 const send=async(text=value)=>{
  const clean=text.trim();if((!clean&&!attachment)||busy)return;
  const prior=messages.slice(-10).filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role,content:m.content}));
  const image=attachment;
  const userContent=clean||'Analyze this visual and explain what matters financially.';
  setMessages(m=>[...m,{role:'user',content:userContent,image:image?.data,attachmentName:image?.name,attachmentType:image?.type,isImage:image?.isImage}]);setValue('');setAttachment(null);setBusy(true);
  try{
   let data;
   if(image?.file){
    const formData=new FormData();
formData.append('image', image.file, image.name || 'upload');
    formData.append('message',userContent);
    formData.append('history',JSON.stringify(prior));
    if(context)formData.append('context',context);
    // Let the browser set multipart/form-data and its boundary.
    data=await apiRequest('/api/chat',{method:'POST',body:formData});
   }else{
    data=await apiRequest('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:clean,history:prior,context})});
   }
   setMode(data.mode||'demo');
   const visualUrl=data.visual?(data.visual.startsWith('http')?data.visual:`${API_BASE}${data.visual}`):null;
   const documentContext=[typeof data.vision==='string'?data.vision:'',data.file_context||''].filter(Boolean).join('\n\n');
   setMessages(m=>[...m,{role:'assistant',content:data.reply,mode:data.mode,sources:data.sources||[],visual:visualUrl,visualError:data.visual_error,vision:Boolean(data.vision),documentContext,topic:userContent}]);
   if(voiceEnabled&&data.reply){speak(data.reply)}
  }catch(e){setMessages(m=>[...m,{role:'assistant',content:`The Finora API request failed: ${e.message||'Could not connect'}. Check that the backend is running.`}]);}
  finally{setBusy(false)}
 };
 const suggestions=['Explain my spending pattern','What changes if I save ₹2,000 more?','Explain compound interest','How does loan EMI work?'];
 const speak=(text)=>{if(!('speechSynthesis' in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text||''));u.rate=.96;u.pitch=1;window.speechSynthesis.speak(u)};
 const toggleListen=()=>{
  const SpeechRec=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRec){setMessages(m=>[...m,{role:'assistant',content:'Speech recognition is not supported in this browser. Try Chrome or Edge.'}]);return;}
  if(listening){recognitionRef.current?.stop();setListening(false);return;}
  try{
   const rec=new SpeechRec();rec.continuous=false;rec.interimResults=false;rec.lang='en-US';
   rec.onstart=()=>setListening(true);
   rec.onresult=e=>{const transcript=e.results?.[0]?.[0]?.transcript||'';if(transcript){setValue(v=>v?(v+' '+transcript):transcript)}};
   rec.onerror=()=>setListening(false);
   rec.onend=()=>setListening(false);
   recognitionRef.current=rec;rec.start();
  }catch{setListening(false)}
 };
 const generateVideo=async(message,index)=>{
  if(videoBusy!==null)return;setVideoBusy(index);
  try{
   const data=await apiRequest('/api/generate-video',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({prompt:`Create an 8-second elegant educational animation that visually explains this Finora financial concept. Use clean editorial motion, warm cream, charcoal, muted olive and burnt orange, simple diagrams and readable labels. No financial predictions or fake numbers. Concept: ${message}`})
   });
   const videoUrl=data.video?(data.video.startsWith('http')?data.video:`${API_BASE}${data.video}`):null;
   panelFocus.current=`${index}:video`;
   setMessages(m=>m.map((x,i)=>i===index?{...x,video:videoUrl}:x));
  }catch(e){
   setMessages(m=>[...m,{role:'assistant',content:`Video generation could not finish: ${e.message||'Try again later.'}`}]);
  }finally{setVideoBusy(null)}
 };
 const runAction=async(kind,index,extra={})=>{
  if(actionBusy)return;
  const message=messages[index];
  const previous=[...messages].slice(0,index).reverse().find(item=>item.role==='user');
  setActionBusy(`${index}:${kind}`);
  try{
   const data=await apiRequest(`/api/actions/${kind}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:message.topic||previous?.content||message.content,answer:message.content,document:message.documentContext||'',workspace:context||'',sources:message.sources||[],difficulty:extra.difficulty||'medium'})});
   panelFocus.current=`${index}:${kind}`;
   setMessages(current=>current.map((item,itemIndex)=>{
    if(itemIndex!==index)return item;
    if(kind==='mindmap')return {...item,mindmap:data,actionError:''};
    if(kind==='infographic'){const image=data.image?(data.image.startsWith('http')?data.image:`${API_BASE}${data.image}`):'';return {...item,infographic:{...data,image},actionError:''};}
    if(kind==='quiz')return {...item,quiz:data,actionError:''};
    const file=data.file?(data.file.startsWith('http')?data.file:`${API_BASE}${data.file}`):'';
    return {...item,slides:{...data,file},actionError:''};
   }));
  }catch(e){setMessages(current=>current.map((item,itemIndex)=>itemIndex===index?{...item,actionError:e.message||'That action could not finish.'}:item));}
  finally{setActionBusy(null)}
 };
 return <div className={embedded?'chat-embedded':'chat-overlay'} onMouseDown={e=>{if(!embedded&&e.target===e.currentTarget)onClose()}}><div className={embedded?'chat-panel embedded':'chat-panel'}>
  <div className="chat-head"><div className="bot-mark"><Bot size={19}/></div><div className="chat-title"><b>Finora multimodal intelligence</b><small><span className="live-dot"/> {mode==='ai'?'AI CONNECTED':'LOCAL DEMO MODE'}</small></div>{!embedded&&<button className="icon-btn" onClick={onClose} aria-label="Close chat"><X/></button>}</div>
  <div className="chat-body" ref={bodyRef}><div className="chat-intro"><span className="eyebrow">YOUR FINANCIAL CO-PILOT</span><h3>Make sense<br/><i>of money.</i></h3><p>Ask a question, upload a visual, explore your numbers, or hear the answer aloud.</p><div className="chat-capability-strip"><span><Brain size={12}/> LLM · THINK</span><span><WandSparkles size={12}/> LIM · CREATE</span><span><ScanEye size={12}/> LVM · SEE</span><span><AudioWaveform size={12}/> VOICE · SPEAK</span></div></div>
   {messages.map((m,i)=><div key={i} className={'message '+m.role}>
    <div className="message-label">{m.role==='user'?'YOU':'FINORA'}{m.vision&&<span className="message-mode">LVM · SEE</span>}</div>
    {m.role==='user'&&m.image&&<img className="chat-image user-upload" src={m.image} alt="Uploaded visual"/>}{m.role==='user'&&m.attachmentName&&!m.image&&<div className="file-chip"><Paperclip size={14}/><span>{m.attachmentName}</span></div>}
    {m.content&&<div className="message-content"><CitedAnswer content={m.content} sources={m.sources||[]}/></div>}
    {m.visual&&<div className="generated-visual"><div className="generated-label"><WandSparkles size={12}/> LIM · EXPLANATORY VISUAL</div><img className="chat-image" src={m.visual} alt="Finora generated explanatory visual"/></div>}{m.visualError&&!m.visual&&<div className="multimodal-error"><WandSparkles size={13}/><span>LIM unavailable: {m.visualError}</span></div>}
    {m.video&&<div className="generated-video" data-panel={`${i}:video`}><div className="generated-label"><Sparkles size={12}/> FINORA · GENERATED MOTION</div><video controls playsInline src={m.video}/></div>}
    {m.role==='assistant'&&<div className="answer-actions"><button className="speak-answer" onClick={()=>speak(m.content)} title="Speak this answer"><VolumeSpeaker size={14}/> Speak</button><button className="speak-answer video-action" onClick={()=>generateVideo(m.content,i)} disabled={videoBusy!==null} title="Generate an explanatory video"><Sparkles size={14}/> {videoBusy===i?'Generating…':'Generate video'}</button><button className="speak-answer" onClick={()=>runAction('mindmap',i)} disabled={!!actionBusy}><Layers3 size={14}/> {actionBusy===`${i}:mindmap`?'Mapping…':'Mind Map'}</button><button className="speak-answer" onClick={()=>runAction('infographic',i)} disabled={!!actionBusy}><ChartNoAxesCombined size={14}/> {actionBusy===`${i}:infographic`?'Drawing…':'Infographic'}</button><button className="speak-answer" onClick={()=>runAction('quiz',i)} disabled={!!actionBusy}><CircleHelp size={14}/> {actionBusy===`${i}:quiz`?'Writing…':'Quiz Me'}</button><button className="speak-answer" onClick={()=>runAction('slides',i)} disabled={!!actionBusy}><BookOpenCheck size={14}/> {actionBusy===`${i}:slides`?'Building…':'Create Slides'}</button></div>}
    {m.actionError&&<div className="multimodal-error"><span>{m.actionError}</span></div>}
    {m.mindmap&&<div data-panel={`${i}:mindmap`}><MindMapView map={m.mindmap}/></div>}
    {m.infographic&&<div className="learning-panel" data-panel={`${i}:infographic`}><div className="generated-label"><ChartNoAxesCombined size={12}/> INFOGRAPHIC · {m.infographic.chart==='notes'?'CONCEPTS':'DATA'}</div>{m.infographic.image&&<img className="chat-image" src={m.infographic.image} alt={m.infographic.title||'Finora infographic'}/>}<div className="export-row"><a href={`${m.infographic.image}${m.infographic.image.includes('?')?'&':'?'}download=1`} download>Save infographic</a>{m.infographic.source&&<span>{m.infographic.source}</span>}</div></div>}
    {m.quiz&&<div data-panel={`${i}:quiz`}><QuizView quiz={m.quiz} onDifficulty={level=>runAction('quiz',i,{difficulty:level})}/></div>}
    {m.slides&&<div data-panel={`${i}:slides`}><SlideDeck deck={m.slides}/></div>}
    {m.sources?.length>0&&<div className="message-sources"><small>RETRIEVED EVIDENCE · {m.sources.length}</small>{m.sources.map(s=><a key={s.id} href={s.url} target="_blank" rel="noreferrer" title={s.snippet||s.section}><b>[{s.id}]</b> {s.title} ↗<span>{s.publisher}{s.section?` · ${s.section}`:''}</span><em>{s.snippet}</em></a>)}</div>}
   </div>)}
   {busy&&<div className="message assistant"><div className="message-label">FINORA</div><div className="multimodal-typing"><span>THINK</span><i/><i/><i/><span>CREATE</span></div></div>}
  </div>
  <div className="suggestions">{suggestions.map(s=><button key={s} onClick={()=>send(s)}>{s}<ChevronRight size={13}/></button>)}</div>
  {attachment&&<div className="attachment-preview">{attachment.isImage?<img src={attachment.data} alt="Ready to analyze"/>:<div className="file-preview-icon"><Paperclip size={17}/></div>}<span title={attachment.name}>{attachment.name}</span><small>{Math.max(0.1,attachment.size/1024/1024).toFixed(1)} MB</small><button type="button" onClick={()=>setAttachment(null)} aria-label="Remove attachment"><X size={13}/></button></div>}
  <form className="chat-input" onSubmit={e=>{e.preventDefault();send()}}><input ref={fileRef} type="file" accept="image/*,.pdf,.csv,.xlsx,.txt,.md,.docx,.json" hidden onChange={pickImage}/><button type="button" className="attach-btn" onClick={()=>fileRef.current?.click()} aria-label="Upload a file" title="Upload image, PDF, spreadsheet or document"><Paperclip size={16}/></button><button type="button" className={listening?"attach-btn listening":"attach-btn"} onClick={toggleListen} aria-label={listening?"Listening...":"Voice input"} title={listening?"Listening...":"Voice input"}><Mic size={16}/></button><input value={value} onChange={e=>setValue(e.target.value)} placeholder="Ask about your numbers..." aria-label="Message Finora"/><button type="submit" disabled={(!value.trim()&&!attachment)||busy} aria-label="Send message"><Send size={17}/></button></form><div className="chat-foot">LLM · LIM · LVM · VOICE · Educational exploration · Not financial advice</div>
 </div></div>
}


function DollarCursor(){
 const ref=useRef(null);
 const glow=useRef(null);
 useEffect(()=>{
  const fine=window.matchMedia('(pointer:fine)').matches;
  if(!fine)return;
  const el=ref.current, g=glow.current;
  const move=e=>{
   if(!el||!g)return;
   el.style.transform=`translate3d(${e.clientX-14}px,${e.clientY-14}px,0)`;
   g.style.transform=`translate3d(${e.clientX-27}px,${e.clientY-27}px,0)`;
  };
  const down=()=>el?.classList.add('is-pressed');
  const up=()=>el?.classList.remove('is-pressed');
  window.addEventListener('pointermove',move,{passive:true});
  window.addEventListener('pointerdown',down);
  window.addEventListener('pointerup',up);
  return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up)};
 },[]);
 return <><div ref={glow} className="dollar-cursor-glow" aria-hidden="true"/><div ref={ref} className="dollar-cursor" aria-hidden="true"><span>$</span></div></>;
}

function App(){
 const [chat,setChat]=useState(false),[menu,setMenu]=useState(false),[tab,setTab]=useState('savings');
 const [monthly,setMonthly]=useState(5000),[months,setMonths]=useState(24),[rate,setRate]=useState(8);
 const [expenses,setExpenses]=useState(initialExpenses),[income,setIncome]=useState(40000);
 const [loan,setLoan]=useState(300000),[loanRate,setLoanRate]=useState(10),[loanYears,setLoanYears]=useState(3);
 const [sound,setSound]=useState(false),[csvName,setCsvName]=useState(''),[csvRows,setCsvRows]=useState([]),[csvError,setCsvError]=useState('');
 const [marketSymbol,setMarketSymbol]=useState('^NSEI'),[marketQuote,setMarketQuote]=useState(null),[marketBusy,setMarketBusy]=useState(false),[marketError,setMarketError]=useState('');
 const [sceneLocked,setSceneLocked]=useState(false);
 useEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  const ctx=gsap.context(()=>{
    const q=(sel)=>gsap.utils.toArray(sel);

    gsap.timeline({defaults:{ease:'power3.out'}})
      .from('.topbar',{y:-30,opacity:0,duration:.7})
      .from('.hero-copy .eyebrow',{y:20,opacity:0,duration:.45},'-=.25')
      .from('.hero h1',{y:70,opacity:0,clipPath:'inset(0 0 100% 0)',duration:1.05},'-=.15')
      .from('.hero-copy > p',{y:25,opacity:0,duration:.6},'-=.55')
      .from('.hero-cta > *',{y:20,opacity:0,stagger:.08,duration:.45},'-=.35')
      .from('.hero-scene',{scale:.9,opacity:0,rotationY:-5,duration:1.1},'-=.8');

    gsap.to('.hero-copy',{yPercent:-18,opacity:.55,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
    gsap.to('.hero-scene',{yPercent:14,scale:1.08,rotationZ:1.2,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1.15}});
    gsap.to('.hero-orbit',{rotation:12,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1.5}});

    q('.story-reveal').forEach((el,i)=>{
      gsap.fromTo(el,{y:80,opacity:0,clipPath:'inset(0 0 18% 0)'},{y:0,opacity:1,clipPath:'inset(0 0 0% 0)',duration:.95,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 82%',once:true}});
    });

    q('.chapter-number').forEach(el=>{
      gsap.fromTo(el,{x:-30,opacity:0},{x:0,opacity:1,duration:.6,scrollTrigger:{trigger:el,start:'top 84%',once:true}});
    });

    q('.assistant-shell').forEach(el=>gsap.fromTo(el,{y:90,scale:.97,opacity:0},{y:0,scale:1,opacity:1,duration:1.05,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 78%',once:true}}));

    q('.capability-card').forEach((el,i)=>gsap.fromTo(el,{y:120,z:-420,opacity:0,rotateX:16,rotateY:i%2?8:-8,scale:.72},{y:0,z:0,opacity:1,rotateX:0,rotateY:0,scale:1,duration:.95,delay:i*.08,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',end:'top 58%',scrub:1}}));

    const capabilityGrid=document.querySelector('.capability-grid');
    if(capabilityGrid){
      gsap.fromTo(capabilityGrid,{perspective:900,rotateX:7,scale:.94},{rotateX:0,scale:1,ease:'none',scrollTrigger:{trigger:capabilityGrid,start:'top 92%',end:'bottom 48%',scrub:1.2}});
      gsap.to('.capability-card',{y:-18,rotateZ:i=>i%2?1.2:-1.2,ease:'none',stagger:.04,scrollTrigger:{trigger:capabilityGrid,start:'top 55%',end:'bottom 20%',scrub:1.1}});
    }

    q('.lab-tabs button').forEach((el,i)=>gsap.fromTo(el,{y:25,opacity:0},{y:0,opacity:1,duration:.45,delay:i*.05,scrollTrigger:{trigger:'.lab-tabs',start:'top 85%',once:true}}));
    q('.lab-grid').forEach(el=>gsap.fromTo(el,{y:70,opacity:0},{y:0,opacity:1,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 82%',once:true}}));
    q('.creator-card').forEach(el=>gsap.fromTo(el,{scale:.92,opacity:0,y:60},{scale:1,opacity:1,y:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 80%',once:true}}));
    q('.closing-copy').forEach(el=>gsap.fromTo(el,{x:-70,opacity:0},{x:0,opacity:1,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 78%',once:true}}));
    q('.closing-orb').forEach(el=>gsap.to(el,{y:-45,rotation:18,ease:'none',scrollTrigger:{trigger:'.closing',start:'top bottom',end:'bottom top',scrub:1.2}}));

    const journey=document.querySelector('.intelligence-journey');
    if(journey){
      const nodes=q('.journey-node');
      const title=document.querySelector('.journey-title');
      const copy=document.querySelector('.journey-copy');
      const steps=[
        ['01','Think.','LLM reasons over your question and grounded financial context.'],
        ['02','Create.','LIM turns the explanation into a visual learning moment.'],
        ['03','See.','LVM understands charts, documents and other visual inputs.'],
        ['04','Speak.','Voice turns the same answer into an audible explanation.']
      ];
      const tl=gsap.timeline({
        defaults:{ease:'none'},
        scrollTrigger:{trigger:journey,start:'top top',end:'bottom bottom',scrub:2.4,pin:'.journey-sticky',anticipatePin:1,invalidateOnRefresh:true}
      });
      tl.fromTo('.journey-stage',{scale:.78,rotationX:9,rotationY:-14,z:-520},{scale:1,rotationX:0,rotationY:0,z:0,duration:1.6})
        .fromTo(nodes,{x:i=>i%2?260:-260,y:i=>i<2?-150:150,z:-760,scale:.48,opacity:0,rotateX:i=>i%2?24:-24,rotateY:i=>i%2?35:-35},{x:0,y:0,z:0,scale:1,opacity:1,rotateX:0,rotateY:0,duration:1.8,stagger:.18},.35)
        .to('.journey-core',{scale:1.12,z:55,duration:1.2},2.15)
        .to('.ring-a',{rotationZ:120,duration:1.6},2.15)
        .to('.ring-b',{rotationZ:-105,duration:1.6},2.15)
        .to(nodes,{x:i=>i%2?170:-170,y:i=>i<2?-105:105,z:120,scale:.94,duration:1.5,stagger:.08},2.45)
        .to('.journey-stage',{scale:1.16,rotationY:6,rotationX:-3,z:170,duration:1.7},3.25)
.to(nodes,{x:i=>i%2?300:-300,y:i=>i<2?-180:180,z:260,scale:.82,opacity:.92,duration:1.7,stagger:.08},3.45)
        .to('.journey-core',{scale:1.34,z:240,duration:1.7},3.6)
        .to('.journey-stage',{scale:1.58,rotationY:-9,rotationX:5,z:520,duration:2.2},4.6)
        .to(nodes,{z:-260,opacity:.15,scale:.66,duration:1.9,stagger:.05},4.75)
        .to('.journey-core',{scale:.72,z:-120,opacity:.35,duration:1.5},5.45)
        .to('.journey-stage',{scale:1.8,rotationY:0,rotationX:0,z:760,opacity:.08,duration:1.4},6.1);
      ScrollTrigger.create({trigger:journey,start:'top top',end:'bottom bottom',scrub:true,onUpdate:self=>{
        const idx=Math.min(3,Math.floor(self.progress*4));
        if(title){title.textContent=steps[idx][1]}
        if(copy){copy.textContent=steps[idx][2]}
        const step=document.querySelector('.journey-step');if(step)step.textContent=steps[idx][0];
      }});
    }

    const progress=document.querySelector('.scroll-progress-bar');
    if(progress){gsap.to(progress,{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.2}});}

    q('.chapter-link').forEach(link=>{
      const target=document.querySelector(link.getAttribute('href'));
      if(!target)return;
      ScrollTrigger.create({trigger:target,start:'top 45%',end:'bottom 45%',onEnter:()=>q('.chapter-link').forEach(x=>x.classList.toggle('active',x===link)),onEnterBack:()=>q('.chapter-link').forEach(x=>x.classList.toggle('active',x===link))});
    });
  });
  return()=>ctx.revert();
 },[]);

 const loadMarket=async()=>{setMarketBusy(true);setMarketError('');try{const d=await apiRequest(`/api/market/quote?symbol=${encodeURIComponent(marketSymbol)}`);setMarketQuote(d)}catch(e){setMarketQuote(null);setMarketError(e.message||'Market data unavailable')}finally{setMarketBusy(false)}};
 const future=useMemo(()=>{const r=rate/1200;return r===0?monthly*months:monthly*(Math.pow(1+r,months)-1)/r},[monthly,months,rate]);
 const invested=monthly*months;
 const emi=useMemo(()=>{const r=loanRate/1200,n=loanYears*12;return r===0?loan/n:loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1)},[loan,loanRate,loanYears]);
 const totalSpend=expenses.reduce((a,b)=>a+b.value,0),left=income-totalSpend;
 const savingsData=useMemo(()=>Array.from({length:months+1},(_,i)=>{const r=rate/1200;return {month:i,value:Math.round(i===0?0:r===0?monthly*i:monthly*(Math.pow(1+r,i)-1)/r),contributed:monthly*i}}),[monthly,months,rate]);
 const spendingData=expenses.map(x=>({...x}));
 const context=`Current interactive workspace: monthly savings ${monthly}, horizon ${months} months, illustrative annual rate ${rate}%; projected value ${Math.round(future)}; monthly income ${income}; monthly expenses ${totalSpend}; remaining ${left}; loan principal ${loan}; loan annual rate ${loanRate}%; loan term ${loanYears} years; estimated EMI ${Math.round(emi)}.${csvRows.length?` Imported CSV summary: ${csvRows.length} transactions/rows; categories: ${csvRows.map(x=>`${x.name}=${x.value}`).join('; ')}.`:''}`;
 const fileRef=useRef(null);
 const importCSV=e=>{const file=e.target.files?.[0];if(!file)return;setCsvError('');setCsvName(file.name);const reader=new FileReader();reader.onload=()=>{try{const rows=parseCSV(String(reader.result));if(rows.length<2)throw new Error('Add a header row and at least one data row.');const headers=rows[0].map(x=>x.toLowerCase());const ci=headers.findIndex(x=>['category','name','type','description'].includes(x));const vi=headers.findIndex(x=>['amount','value','spend','expense'].includes(x));if(ci<0||vi<0)throw new Error('CSV needs category and amount columns (or name and value).');const parsed=rows.slice(1).map((r,i)=>({name:r[ci]||`Row ${i+1}`,value:Number(String(r[vi]||'').replace(/[₹,\\s]/g,''))}));if(parsed.some(x=>!x.name||!Number.isFinite(x.value)||x.value<0))throw new Error('Each row needs a category and a non-negative numeric amount.');const grouped=Object.values(parsed.reduce((a,x)=>{a[x.name]=(a[x.name]||{name:x.name,value:0});a[x.name].value+=x.value;return a},{}));setCsvRows(grouped);setExpenses(grouped.slice(0,12).map((x,i)=>({...x,color:['#a9f5c7','#79dca7','#4eae82','#b9a5ff','#f4bd79','#6ebbe5'][i%6]})));}catch(err){setCsvError(err.message);setCsvRows([])}};reader.onerror=()=>setCsvError('Could not read this file.');reader.readAsText(file);e.target.value=''};
 return <main>
 <DollarCursor/>
 <div className="scroll-progress"><div className="scroll-progress-bar"/></div>
 <header className="topbar"><a className="brand" href="#"><span className="brand-icon">f.</span> finora<span className="brand-period">®</span></a><nav className={menu?'nav open':'nav'}><a href="#world" onClick={()=>setMenu(false)}>World</a><a href="#capabilities" onClick={()=>setMenu(false)}>Capabilities</a><a href="#lab" onClick={()=>setMenu(false)}>Explore data</a><a href="#intelligence" onClick={()=>setMenu(false)}>Intelligence</a></nav><div className="top-actions"><button className="audio-btn" onClick={()=>setSound(!sound)} title="Toggle sound">{sound?<Volume2 size={15}/>:<VolumeX size={15}/>}<span>{sound?'SOUND ON':'SOUND OFF'}</span></button><button className="talk-btn" onClick={()=>setChat(true)}>Open Finora <span>↗</span></button><button className="icon-btn mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Toggle menu"><Menu/></button></div></header>
 <aside className="chapter-rail" aria-label="Page chapters"><span className="chapter-rail-label">FINORA / 2026</span><a className="chapter-link active" href="#world">01</a><a className="chapter-link" href="#finora-chat">02</a><a className="chapter-link" href="#intelligence">03</a><a className="chapter-link" href="#capabilities">04</a><a className="chapter-link" href="#lab">05</a></aside>
 <section className="hero" id="world"><div className="hero-copy"><div className="eyebrow"><span className="live-dot"/> AN INTERACTIVE FINANCIAL WORLD</div><h1>Money is a<br/><span>living system.</span><br/><em>Explore it.</em></h1><p>Finora is not just a language model. Ask, see, generate, and listen — with LLM reasoning, LIM visual creation, LVM vision, and voice working around one financial copilot.</p><div className="hero-cta"><button className="primary-btn" onClick={()=>document.querySelector('#finora-chat')?.scrollIntoView({behavior:'smooth'})}>Open the copilot <span>↗</span></button><button className={sceneLocked?"scene-lock locked":"scene-lock"} onClick={()=>setSceneLocked(v=>!v)}><span>{sceneLocked?"●":"○"}</span>{sceneLocked?"SCENE LOCKED":"TAP TO LOCK"}</button><a className="scroll-link" href="#finora-chat"><span className="scroll-icon"><ArrowDownRight size={15}/></span> ENTER THE INTELLIGENCE</a></div></div><div className="hero-visual hero-immersive"><div className={sceneLocked?"hero-scene scene-is-locked":"hero-scene"}><OrbScene/><div className="hero-orbit orbit-a"/><div className="hero-orbit orbit-b"/><div className="float-note note-top hero-float"><span className="note-symbol">↗</span><div><b>Money, in motion</b><small>INTERACTIVE MODEL</small></div></div><div className="float-note note-bottom hero-float"><span className="note-symbol">✳</span><div><b>Explore every possibility</b><small>CHANGE THE VARIABLES</small></div></div><div className="scene-index">FIG. 01 <span>—</span> THE FINORA CORE / 3D</div></div></div><div className="hero-bottom"><span>SCROLL / ENTER THE WORLD</span><div className="scroll-line"/></div></section>
 <section className="assistant-stage story-reveal" id="finora-chat"><div className="assistant-heading"><div className="section-kicker chapter-number">/ 01 — THE FINORA COPILOT</div><div><h2>The chatbot is the<br/><em>centre of everything.</em></h2><p>LLM reasoning is only one layer. Finora is designed as a multimodal financial intelligence system — text, visuals, vision, data and voice around one conversation.</p></div></div><div className="assistant-shell multimodal-shell"><div className="assistant-side"><span className="assistant-orb-label"><i/> FINORA MULTIMODAL INTELLIGENCE</span><h3>Ask it.<br/><em>See it.</em><br/>Hear it.</h3><p>Your conversation stays central while every other intelligence layer plugs into the answer.</p><div className="intelligence-badges"><span><Brain size={14}/> LLM / THINK</span><span><WandSparkles size={14}/> LIM / CREATE</span><span><ScanEye size={14}/> LVM / SEE</span><span><AudioWaveform size={14}/> VOICE / SPEAK</span></div><div className="assistant-signal"><span className="signal-bars"><i/><i/><i/><i/><i/><i/><i/></span><span>CHAT FIRST · MULTIMODAL BY DESIGN</span></div></div><ChatPanel embedded context={context} voiceEnabled={sound}/></div></section>

 <section className="intelligence-journey" id="intelligence"><div className="journey-sticky"><div className="journey-top"><span className="section-kicker">/ 02 — BEYOND THE LLM</span><span className="journey-progress">ONE CONVERSATION / FOUR INTELLIGENCE LAYERS</span></div><div className="journey-stage"><div className="journey-orbit orbit-outer"></div><div className="journey-orbit orbit-inner"></div><div className="journey-core"><div className="core-ring ring-a"></div><div className="core-ring ring-b"></div><div className="core-glow"></div><span>FINORA</span></div><div className="journey-node node-llm"><Brain size={20}/><b>LLM</b><small>THINK · REASON</small></div><div className="journey-node node-lim"><WandSparkles size={20}/><b>LIM</b><small>CREATE · VISUALIZE</small></div><div className="journey-node node-lvm"><ScanEye size={20}/><b>LVM</b><small>SEE · UNDERSTAND</small></div><div className="journey-node node-voice"><AudioWaveform size={20}/><b>VOICE</b><small>SPEAK · LISTEN</small></div><div className="journey-caption"><span className="journey-step">01</span><h2 className="journey-title">Think.</h2><p className="journey-copy">The language model reasons over your question and grounded financial context.</p></div></div></div></section>
 <section className="ticker"><div className="ticker-track">{['EXPLORE THE VARIABLES','SEE THE RIPPLE EFFECT','UNDERSTAND THE WHY','FINANCE IN MOTION','EXPLORE THE VARIABLES','SEE THE RIPPLE EFFECT'].map((x,i)=><span key={i}>{x}<b>✳</b></span>)}</div></section>

 <section className="section capabilities story-reveal" id="capabilities"><div className="section-kicker">/ 03 — WHAT FINORA CAN DO</div><div className="capabilities-head"><div><h2>One co-pilot.<br/><em>Many ways forward.</em></h2><p>The conversation remains the product. These intelligence layers expand what a single Finora answer can do: reason, create visuals, understand visuals, speak, and connect to the financial workspace.</p></div><span className="capabilities-count">INTELLIGENCE / 04 + TOOLS</span></div><div className="capability-grid">
 {[
  {n:'01',icon:<Brain size={19}/>,title:'LLM — Think & reason',text:'The conversational reasoning layer. It interprets questions, follows context and explains financial concepts with grounded evidence.'},
  {n:'02',icon:<WandSparkles size={19}/>,title:'LIM — Create visuals',text:'A visual-generation layer for turning financial explanations into diagrams, visual stories and image-based learning moments.'},
  {n:'03',icon:<ScanEye size={19}/>,title:'LVM — See & understand',text:'A vision layer for understanding charts, documents, screenshots and other visual financial inputs.'},
  {n:'04',icon:<AudioWaveform size={19}/>,title:'Voice — Speak the answer',text:'Spoken responses turn the same Finora answer into an audible explanation when voice is enabled.'},
  {n:'05',icon:<Bot size={19}/>,title:'Ask financial questions',text:'Explore financial concepts in plain language and keep the conversation going with contextual follow-up questions.'},
  {n:'06',icon:<BookOpenCheck size={19}/>,title:'Evidence-linked answers',text:'Grounded answers can surface the financial-education sources used to support the explanation.'},
  {n:'07',icon:<ChartNoAxesCombined size={19}/>,title:'Savings growth lab',text:'Adjust contributions, time horizon and illustrative rate to see how a savings scenario changes.'},
  {n:'08',icon:<Wallet size={19}/>,title:'Spending analysis',text:'Edit income and expense categories, inspect your spending mix and see what remains after expenses.'},
  {n:'09',icon:<Upload size={19}/>,title:'CSV import & preview',text:'Import a CSV, preview grouped categories in the browser and ask Finora to interpret the workspace.'},
  {n:'10',icon:<SlidersHorizontal size={19}/>,title:'Loan EMI explorer',text:'Tune principal, interest rate and tenure to explore an estimated monthly EMI and repayment scenario.'},
  {n:'11',icon:<Activity size={19}/>,title:'Market pulse',text:'Request an on-demand public market snapshot when supported data is available, with provider details.'},
  {n:'12',icon:<Sparkles size={19}/>,title:'Interactive explanations',text:'Ask Finora to explain the figures, assumptions and relationships currently shown in the financial playground.'}
 ].map(item=><article className="capability-card multimodal-card" key={item.n}><div className="capability-top"><span>{item.n}</span><i>{item.icon}</i></div><h3>{item.title}</h3><p>{item.text}</p></article>)}
 </div><p className="capabilities-note">Scope note: educational exploration only. Retrieval uses a small local library of concise summaries; AI answers can make mistakes. Market data may be delayed or unavailable. Finora does not provide personalized financial advice.</p></section>

 <section className="section lab story-reveal" id="lab"><div className="section-kicker">/ 03 — THE PLAYGROUND</div><div className="dashboard-head"><div><h2>Touch the data.<br/><em>Change the story.</em></h2><p>Three live tools. Each control updates its visualisation and the figures the assistant can discuss.</p></div><div className="sample-tag"><span className="live-dot"/> LIVE INTERACTION</div></div>
 <div className="lab-tabs">{[{id:'savings',label:'Growth lab',icon:<ChartNoAxesCombined size={16}/>},{id:'spending',label:'Spending map',icon:<Wallet size={16}/>},{id:'loan',label:'Loan explorer',icon:<SlidersHorizontal size={16}/>},{id:'market',label:'Market pulse',icon:<ChartNoAxesCombined size={16}/> }].map(t=><button key={t.id} className={tab===t.id?'active':''} onClick={()=>setTab(t.id)}>{t.icon}{t.label}</button>)}</div>
 {tab==='savings'&&<div className="lab-grid cinematic-grid"><div className="viz-card"><div className="card-top"><div><span className="card-label">PROJECTED SAVINGS VALUE</span><h3>{money(future)}</h3></div><span className="growth-tag"><ArrowUpRight size={14}/> SCENARIO</span></div><div className="chart-wrap large"><ResponsiveContainer width="100%" height="100%"><AreaChart data={savingsData}><defs><linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8cffb4" stopOpacity={.36}/><stop offset="100%" stopColor="#8cffb4" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#ffffff12" vertical={false}/><XAxis dataKey="month" tick={{fill:'#818b84',fontSize:10}} tickLine={false} axisLine={false} tickFormatter={v=>v===0?'Now':`${v}m`}/><YAxis tick={{fill:'#818b84',fontSize:10}} tickLine={false} axisLine={false} tickFormatter={v=>`₹${Math.round(v/1000)}k`} width={42}/><Tooltip contentStyle={{background:'#111713',border:'1px solid #344239',borderRadius:10,color:'#fff'}} formatter={(v,n)=>[money(v),n==='value'?'Projected value':'Contributed']}/><Area type="monotone" dataKey="contributed" stroke="#8b93a0" strokeDasharray="4 4" strokeWidth={1.5} fill="transparent"/><Area type="monotone" dataKey="value" stroke="#8cffb4" strokeWidth={2.5} fill="url(#savingsFill)"/></AreaChart></ResponsiveContainer></div><div className="chart-legend"><span><i/> PROJECTED VALUE</span><span><i className="muted-dot"/> CONTRIBUTIONS</span><span>Illustrative, not a forecast</span></div></div><div className="controls-card"><div className="controls-title"><span className="card-label">CHANGE THE INPUTS</span><button className="reset-btn" onClick={()=>{setMonthly(5000);setMonths(24);setRate(8)}}><RotateCcw size={13}/> Reset</button></div><Control label="Monthly contribution" value={money(monthly)} min="500" max="25000" step="500" val={monthly} set={setMonthly} left="₹500" right="₹25,000"/><Control label="Time horizon" value={`${months} months`} min="3" max="60" step="1" val={months} set={setMonths} left="3 months" right="60 months"/><Control label="Illustrative annual rate" value={pct(rate)} min="0" max="15" step=".5" val={rate} set={setRate} left="0%" right="15%"/><div className="scenario-result"><div><small>CONTRIBUTED</small><b>{money(invested)}</b></div><div><small>ILLUSTRATIVE GROWTH</small><b className="green">{money(future-invested)}</b></div></div><button className="ask-context" onClick={()=>setChat(true)}>Ask Finora about this scenario <ChevronRight size={15}/></button></div></div>}
 {tab==='spending'&&<div className="lab-grid"><div className="viz-card"><div className="card-top"><div><span className="card-label">MONTHLY SPENDING MIX</span><h3>{money(totalSpend)}</h3></div><span className="growth-tag">EDITABLE DATA</span></div><div className="pie-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={spendingData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="83%" paddingAngle={3} stroke="none">{spendingData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={{background:'#111713',border:'1px solid #344239',borderRadius:10,color:'#fff'}} formatter={v=>[money(v),'Spend']}/></PieChart></ResponsiveContainer><div className="pie-center"><small>MONTHLY TOTAL</small><b>{money(totalSpend)}</b></div></div><div className="expense-legend">{spendingData.map(e=><div key={e.name}><i style={{background:e.color}}/><span>{e.name}</span><b>{money(e.value)}</b><small>{totalSpend?pct(e.value/totalSpend*100):'0%'}</small></div>)}</div></div><div className="controls-card"><div className="controls-title"><span className="card-label">EDIT YOUR CATEGORIES</span><button className="reset-btn" onClick={()=>setExpenses(initialExpenses)}><RotateCcw size={13}/> Reset</button></div><Control label="Monthly income" value={money(income)} min="5000" max="200000" step="1000" val={income} set={setIncome} left="₹5k" right="₹2L"/>{expenses.map((e,i)=><div className="expense-edit" key={e.name}><label>{e.name}</label><div className="edit-row"><input aria-label={`${e.name} expense`} type="range" min="0" max="30000" step="500" value={e.value} onChange={ev=>setExpenses(old=>old.map((x,j)=>j===i?{...x,value:+ev.target.value}:x))}/><b>{money(e.value)}</b></div></div>)}<div className="scenario-result"><div><small>LEFT AFTER SPENDING</small><b className={left<0?'red':'green'}>{money(left)}</b></div><div><small>SPENDING / INCOME</small><b>{income?pct(totalSpend/income*100):'—'}</b></div></div><div className="import-row"><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={importCSV}/><button className="ask-context" onClick={()=>fileRef.current?.click()}><Upload size={14}/> Import CSV</button><button className="ask-context" onClick={()=>setChat(true)}>Interpret spending <ChevronRight size={14}/></button></div>{csvName&&<small className="csv-name">Loaded: {csvName}</small>}{csvError&&<p className="csv-error" role="alert">{csvError}</p>}{csvRows.length>0&&<div className="csv-preview"><div className="controls-title"><span className="card-label">CSV PREVIEW · {csvRows.length} CATEGORIES</span><button className="reset-btn" onClick={()=>{setCsvRows([]);setCsvName('');setCsvError('');}}>Clear</button></div><div className="csv-table">{csvRows.slice(0,8).map(r=><div key={r.name}><span>{r.name}</span><b>{money(r.value)}</b></div>)}</div><button className="ask-context" onClick={()=>{setChat(true);}}>Ask Finora to analyse this CSV <ChevronRight size={14}/></button></div>}<p className="fineprint">CSV format: a header row with category and amount (or name and value). Data is processed in your browser and sent to the assistant only when you ask it to analyse the workspace.</p></div></div>}
 {tab==='loan'&&<div className="lab-grid"><div className="viz-card"><div className="card-top"><div><span className="card-label">ESTIMATED MONTHLY EMI</span><h3>{money(emi)}</h3></div><span className="growth-tag">LOAN SCENARIO</span></div><div className="loan-bars"><div><span>Principal</span><b>{money(loan)}</b><div className="bar-track"><i style={{width:`${loan/(loan+Math.max(0,emi*loanYears*12-loan))*100}%`}}/></div></div><div><span>Estimated interest</span><b>{money(Math.max(0,emi*loanYears*12-loan))}</b><div className="bar-track purple"><i style={{width:`${Math.max(0,emi*loanYears*12-loan)/(emi*loanYears*12)*100}%`}}/></div></div></div><div className="loan-summary"><span>Total repayment</span><b>{money(emi*loanYears*12)}</b></div><p className="fineprint">Fixed-rate EMI estimate. Excludes fees and other lender charges.</p></div><div className="controls-card"><div className="controls-title"><span className="card-label">TUNE THE LOAN</span><button className="reset-btn" onClick={()=>{setLoan(300000);setLoanRate(10);setLoanYears(3)}}><RotateCcw size={13}/> Reset</button></div><Control label="Loan amount" value={money(loan)} min="10000" max="2000000" step="10000" val={loan} set={setLoan} left="₹10k" right="₹20L"/><Control label="Annual interest rate" value={pct(loanRate)} min="1" max="24" step=".5" val={loanRate} set={setLoanRate} left="1%" right="24%"/><Control label="Loan tenure" value={`${loanYears} years`} min="1" max="10" step="1" val={loanYears} set={setLoanYears} left="1 year" right="10 years"/><button className="ask-context" onClick={()=>setChat(true)}>Ask Finora to explain this EMI <ChevronRight size={15}/></button></div></div>}
 {tab==='market'&&<div className="market-panel"><div className="market-controls"><div><span className="card-label">PUBLIC MARKET SNAPSHOT</span><h3>Market pulse</h3><p className="fineprint">Quotes are fetched on demand. They may be delayed and are not trading signals.</p></div><div className="market-actions"><select aria-label="Market symbol" value={marketSymbol} onChange={e=>{setMarketSymbol(e.target.value);setMarketQuote(null);setMarketError('')}}><option value="^NSEI">NIFTY 50</option><option value="^BSESN">BSE SENSEX</option><option value="RELIANCE.NS">Reliance Industries</option><option value="TCS.NS">TCS</option></select><button className="primary-btn" onClick={loadMarket} disabled={marketBusy}>{marketBusy?'Loading…':'Fetch latest quote'} <span>↻</span></button></div></div>{marketError&&<p className="csv-error" role="alert">{marketError}</p>}{marketQuote&&<div className="market-quote"><span className="card-label">{marketQuote.name} · {marketQuote.symbol}</span><h2>{new Intl.NumberFormat('en-IN',{style:'currency',currency:marketQuote.currency||'INR',maximumFractionDigits:2}).format(marketQuote.price)}</h2><strong className={marketQuote.change>=0?'green':'red'}>{marketQuote.change>=0?'+':''}{marketQuote.change} ({marketQuote.change_percent}%)</strong><p className="fineprint">Previous close: {marketQuote.previous_close} · Provider timestamp: {marketQuote.as_of?new Date(marketQuote.as_of*1000).toLocaleString():'Not supplied'}</p><a href={marketQuote.source_url} target="_blank" rel="noreferrer">Source: {marketQuote.source} ↗</a><p className="fineprint">{marketQuote.disclaimer}</p><button className="ask-context" onClick={()=>setChat(true)}>Ask Finora to explain this quote <ChevronRight size={14}/></button></div>}</div>}
 </section>
 <footer><a className="brand" href="#"><span className="brand-icon">f.</span> finora<span className="brand-period">®</span></a><span>Designed &amp; developed by Mannat Prashar.</span><span>ILLUSTRATIVE DATA · NOT FINANCIAL ADVICE</span></footer>
 
 {chat&&<ChatPanel onClose={()=>setChat(false)} context={context} voiceEnabled={sound}/>}
 </main>
}
function Control({label,value,min,max,step,val,set,left,right}){return <div className="control-group"><div className="control-label"><label>{label}</label><strong>{value}</strong></div><input type="range" min={min} max={max} step={step} value={val} onChange={e=>set(+e.target.value)}/><div className="range-labels"><span>{left}</span><span>{right}</span></div></div>}
export default App;
``