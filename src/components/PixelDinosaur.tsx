'use client'
import { useEffect, useRef } from 'react'
const PX = 3
const PALETTE = {
  running: { 1:'#374151',2:'#1F2937',3:'#6B7280',4:'#EF4444',5:'#111827',6:'#22D3EE' },
  completed: { 1:'#FBBF24',2:'#92400E',3:'#FDE68A',4:'#EF4444',5:'#1F2937',6:'#60A5FA' },
  idle: { 1:'#4B5563',2:'#374151',3:'#6B7280',4:'#6B7280',5:'#374151',6:'#4B5563' },
}
const W1 = [
  [0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0],
  [0,0,0,0,0,0,0,0,2,1,1,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,2,4,5,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,2,1,1,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,0,2,2,5,5,2,0,0],
  [0,0,0,0,0,0,6,0,2,2,1,1,0,0,0,0],
  [0,0,0,0,0,6,2,2,1,3,1,1,0,0,0,0],
  [0,0,0,0,6,2,1,3,3,1,1,5,0,0,0,0],
  [0,0,0,6,2,1,1,3,3,1,1,0,0,0,0,0],
  [0,0,6,2,1,1,1,1,1,1,2,0,0,0,0,0],
  [0,2,2,2,0,0,2,1,1,2,0,0,0,0,0,0],
  [0,0,0,0,0,0,2,1,0,1,2,0,0,0,0,0],
  [0,0,0,0,0,2,1,0,0,0,1,2,0,0,0,0],
  [0,0,0,0,0,5,5,5,0,5,5,5,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]
const W2 = [
  [0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0],
  [0,0,0,0,0,0,0,0,2,1,1,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,2,4,5,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,2,1,1,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,0,2,2,5,5,2,0,0],
  [0,0,0,0,0,0,6,0,2,2,1,1,0,0,0,0],
  [0,0,0,0,0,6,2,2,1,3,1,1,0,0,0,0],
  [0,0,0,0,6,2,1,3,3,1,1,5,0,0,0,0],
  [0,0,0,6,2,1,1,3,3,1,1,0,0,0,0,0],
  [0,0,6,2,1,1,1,1,1,1,2,0,0,0,0,0],
  [0,2,2,2,0,0,2,1,1,2,0,0,0,0,0,0],
  [0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],
  [0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],
  [0,0,0,0,0,0,5,5,5,5,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]
const W3 = [
  [0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0],
  [0,0,0,0,0,0,0,0,2,1,1,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,2,4,5,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,2,1,1,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,0,2,2,5,5,2,0,0],
  [0,0,0,0,0,0,6,0,2,2,1,1,0,0,0,0],
  [0,0,0,0,0,6,2,2,1,3,1,1,0,0,0,0],
  [0,0,0,0,6,2,1,3,3,1,1,5,0,0,0,0],
  [0,0,0,6,2,1,1,3,3,1,1,0,0,0,0,0],
  [0,0,6,2,1,1,1,1,1,1,2,0,0,0,0,0],
  [0,2,2,2,0,0,2,1,1,2,0,0,0,0,0,0],
  [0,0,0,0,0,2,1,0,0,1,2,0,0,0,0,0],
  [0,0,0,0,2,1,0,0,0,0,1,2,0,0,0,0],
  [0,0,0,0,5,5,5,0,0,5,5,5,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]
const J1 = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0],
  [0,0,0,0,0,0,0,0,2,1,1,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,2,4,5,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,2,1,1,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,0,2,2,5,5,2,0,0],
  [0,0,0,0,0,0,6,0,2,2,1,1,0,0,0,0],
  [0,0,0,0,0,6,2,2,1,3,1,1,0,0,0,0],
  [0,0,0,0,6,2,1,3,3,1,1,5,0,0,0,0],
  [0,0,0,6,2,1,1,3,3,1,1,0,0,0,0,0],
  [0,0,6,2,1,1,1,1,1,1,2,0,0,0,0,0],
  [0,2,2,2,0,0,2,1,1,2,0,0,0,0,0,0],
  [0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],
  [0,0,0,0,0,0,5,5,5,5,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]
const IDLE_F = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0],
  [0,0,0,0,0,0,0,0,2,1,1,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,2,5,5,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,2,1,1,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,0,2,2,1,1,2,0,0],
  [0,0,0,0,0,0,6,0,2,2,1,1,0,0,0,0],
  [0,0,0,0,0,6,2,2,1,3,1,1,0,0,0,0],
  [0,0,0,0,6,2,1,3,3,1,1,0,0,0,0,0],
  [0,0,0,6,2,1,1,3,3,1,1,0,0,0,0,0],
  [0,0,6,2,1,1,1,1,1,1,2,0,0,0,0,0],
  [0,2,2,2,0,0,2,1,1,2,0,0,0,0,0,0],
  [0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],
  [0,0,0,0,0,0,5,5,5,5,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]
const WALK = [W1, W2, W3, W2]
function flip(f: number[][]) { return f.map(r => [...r].reverse()) }
interface FP { x:number;y:number;vx:number;vy:number;color:string;life:number;size:number }
interface FW { x:number;y:number;particles:FP[] }
const BC = ['#FFFFFF','#E0F2FE','#BAE6FD','#67E8F9','#22D3EE','#06B6D4']
const FC = ['#22D3EE','#06B6D4','#10B981','#3B82F6','#EC4899','#8B5CF6','#FBBF24','#FFF']
function spawnB(mx:number,my:number,dir:number):FP[] {
  const ps:FP[]=[];for(let i=0;i<8;i++){ps.push({x:mx,y:my+(Math.random()-0.5)*6,
    vx:dir*(3+Math.random()*5),vy:(Math.random()-0.5)*1.2,
    color:BC[Math.floor(Math.random()*BC.length)],life:0.8+Math.random()*0.2,size:1+Math.floor(Math.random()*3)})}
  return ps
}
function spawnFW(x:number,y:number):FW {
  const ps:FP[]=[];for(let i=0;i<28;i++){const a=(Math.PI*2*i)/28+(Math.random()-0.5)*0.5;const sp=1.2+Math.random()*3
    ps.push({x:0,y:0,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,
      color:FC[Math.floor(Math.random()*FC.length)],life:1,size:1+Math.floor(Math.random()*2)})}
  return {x,y,particles:ps}
}
export default function PixelDinosaur({status}:{status:'running'|'completed'|'idle'}) {
  const wrapRef=useRef<HTMLDivElement>(null),canvasRef=useRef<HTMLCanvasElement>(null)
  const sRef=useRef({frame:0,tick:0,posX:10,dir:1,jumpPhase:0,fire:[] as FP[],fireworks:[] as FW[],cW:400,cH:80})
  useEffect(()=>{
    const wrap=wrapRef.current;if(!wrap)return
    const ro=new ResizeObserver(entries=>{for(const e of entries){
      const w=Math.floor(e.contentRect.width);sRef.current.cW=w;sRef.current.cH=80
      if(canvasRef.current){canvasRef.current.width=w;canvasRef.current.height=80}}})
    ro.observe(wrap);return()=>ro.disconnect()
  },[])
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return
    const ctx=canvas.getContext('2d');if(!ctx)return
    const pal=PALETTE[status]||PALETTE.idle,s=sRef.current;let animId:number
    const sprW=16*PX,sprH=16*PX
    const draw=(frame:number[][],ox:number,oy:number)=>{
      frame.forEach((row,y)=>row.forEach((c,x)=>{if(!c)return
        ctx.fillStyle=pal[c as keyof typeof pal]||'#FFF';ctx.fillRect(ox+x*PX,oy+y*PX,PX,PX)}))}
    const drawGlow=(frame:number[][],ox:number,oy:number)=>{
      if(status==='idle')return;const ga=0.25+Math.sin(s.tick*0.08)*0.15;ctx.globalAlpha=ga
      ctx.fillStyle=status==='running'?'#22D3EE':'#60A5FA'
      frame.forEach((row,y)=>row.forEach((c,x)=>{if(c!==6)return
        ctx.fillRect(ox+x*PX-2,oy+y*PX-2,PX+4,PX+4)}));ctx.globalAlpha=1}
    const drawB=()=>{s.fire.forEach(p=>{if(p.life<=0)return
      ctx.globalAlpha=Math.min(1,p.life*1.5);ctx.fillStyle=p.color
      const sz=Math.max(1,Math.round(p.size*p.life))*PX
      ctx.fillRect(Math.round(p.x),Math.round(p.y),sz,sz)
      ctx.globalAlpha=p.life*0.2;ctx.fillRect(Math.round(p.x)-2,Math.round(p.y)-2,sz+4,sz+4)});ctx.globalAlpha=1}
    const updateB=()=>{s.fire.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.01;p.life-=0.02});s.fire=s.fire.filter(p=>p.life>0)}
    const drawFW=()=>{s.fireworks.forEach(fw=>fw.particles.forEach(p=>{if(p.life<=0)return
      ctx.globalAlpha=p.life;ctx.fillStyle=p.color
      ctx.fillRect(Math.round(fw.x+p.x),Math.round(fw.y+p.y),p.size*PX,p.size*PX)}));ctx.globalAlpha=1}
    const updateFW=()=>{s.fireworks.forEach(fw=>fw.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.055;p.life-=0.014}))
      s.fireworks=s.fireworks.filter(fw=>fw.particles.some(p=>p.life>0))}
    const drawG=()=>{ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(0,s.cH-2,s.cW,2)
      for(let gx=0;gx<s.cW;gx+=6){ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(gx,s.cH-3,2,1)}}
    const mp=(sx:number,sy:number,d:number)=>({x:d===1?sx+14*PX:sx+2*PX,y:sy+4*PX})
    const animate=()=>{
      const w=s.cW,h=s.cH;ctx.clearRect(0,0,w,h);s.tick++;drawG()
      const gY=h-sprH-4,lB=4,rB=w-sprW-4
      if(status==='running'){
        if(s.tick%7===0)s.frame=(s.frame+1)%WALK.length
        s.posX+=s.dir*1.0;if(s.posX>=rB){s.posX=rB;s.dir=-1}if(s.posX<=lB){s.posX=lB;s.dir=1}
        let fr=WALK[s.frame];if(s.dir===-1)fr=flip(fr)
        const bob=Math.sin(s.tick*0.15)*1.2,sx=Math.round(s.posX),sy=gY+bob
        draw(fr,sx,sy);drawGlow(fr,sx,sy)
        if(s.tick%3===0&&(s.tick%120)<45){const m=mp(sx,sy,s.dir);s.fire.push(...spawnB(m.x,m.y,s.dir))}
        updateB();drawB()
      }else if(status==='completed'){
        if(s.tick%5===0)s.jumpPhase=(s.jumpPhase+1)%30
        s.posX+=s.dir*0.7;if(s.posX>=rB){s.posX=rB;s.dir=-1}if(s.posX<=lB){s.posX=lB;s.dir=1}
        const ph=s.jumpPhase,jY=ph<15?-Math.sin((ph/15)*Math.PI)*20:0
        let fr=s.dir===-1?flip(J1):J1;const sx=Math.round(s.posX),sy=gY+jY
        draw(fr,sx,sy);drawGlow(fr,sx,sy)
        if(jY<-2){ctx.globalAlpha=0.15;ctx.fillStyle='#22D3EE'
          const sw=sprW*(1+jY/80);ctx.fillRect(sx+(sprW-sw)/2,h-5,sw,3);ctx.globalAlpha=1}
        if(s.tick%2===0){const m=mp(sx,sy,s.dir);s.fire.push(...spawnB(m.x,m.y,s.dir))}
        updateB();drawB()
        if(s.tick%30===0)s.fireworks.push(spawnFW(15+Math.random()*(w-30),5+Math.random()*30))
        updateFW();drawFW()
        const cc=['#67E8F9','#34D399','#60A5FA','#C084FC','#FB923C','#FDE68A']
        for(let i=0;i<8;i++){const cx=((s.tick*(1.5+i*0.7)+i*73)%(w+20))-10
          const cy=((s.tick*(0.8+i*0.3)+i*41)%(h+10))-5
          ctx.globalAlpha=0.6;ctx.fillStyle=cc[i%cc.length];ctx.fillRect(cx,cy,PX,PX)}
        ctx.globalAlpha=1
        if(ph<15){ctx.globalAlpha=0.9;ctx.fillStyle='#22D3EE'
          ctx.font="bold 9px 'Press Start 2P', monospace"
          ctx.fillText('DONE!',sx-6,gY-10+jY);ctx.globalAlpha=1}
      }else{
        const br=Math.sin(s.tick*0.04)*0.8;draw(IDLE_F,w/2-sprW/2,gY+br)
        const za=Math.sin(s.tick*0.05)*0.5+0.5;ctx.globalAlpha=za;ctx.fillStyle='#6B7280'
        ctx.font="8px 'Press Start 2P', monospace";const zf=Math.sin(s.tick*0.03)*3
        ctx.fillText('z',w/2+24+zf,gY-2);ctx.fillText('z',w/2+32+zf,gY-10)
        ctx.fillText('Z',w/2+40+zf,gY-18);ctx.globalAlpha=1}
      animId=requestAnimationFrame(animate)}
    animate();return()=>cancelAnimationFrame(animId)
  },[status])
  return(<div ref={wrapRef} style={{width:'100%',height:80,position:'relative'}}>
    <canvas ref={canvasRef} width={400} height={80} style={{width:'100%',height:80,imageRendering:'pixelated',display:'block'}}/>
  </div>)
}
