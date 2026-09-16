"use strict";
const $ = id => document.getElementById(id);
const config = window.MIGAJITAS || {};
const paragraphs = Array.isArray(config.carta) ? config.carta : [];
for (const text of paragraphs) { const p = document.createElement("p"); p.textContent = text; $("letter-text").append(p); }
$("signature").textContent = config.firma || "Javiera";
const songs = [
 {name:"Eres", artist:"Café Tacvba", id:"6kdCN6gTWLcLxmLXoUcwuI"},
 {name:"Solo un Segundo", artist:"Bacilos", id:"1hMQi73KABRBsxSmFNnxBS"},
 {name:"All the Time", artist:"The Kooks", id:config.kooksTrackId || "4J6efqS8fTv0teJdgMuwCm"}
];
function selectSong(index) {
 const song=songs[index];
 document.querySelectorAll(".song-button").forEach((b,i)=>b.setAttribute("aria-pressed",String(i===index)));
 $("player").replaceChildren();
 if(song.id && /^[a-zA-Z0-9]{22}$/.test(song.id)) {
  const frame=document.createElement("iframe");frame.title=song.name+" — "+song.artist;
  frame.src="https://open.spotify.com/embed/track/"+song.id+"?theme=0";
  frame.height="152";frame.allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  $("player").append(frame);$("spotify-link").href="https://open.spotify.com/track/"+song.id;
  $("spotify-link").textContent="Escuchar en Spotify ↗";
 } else {
  const note=document.createElement("p");note.className="music-note";note.textContent="Abre esta canción en Spotify para escucharla.";$("player").append(note);
  $("spotify-link").href="https://open.spotify.com/search/"+encodeURIComponent(song.name+" "+song.artist);
  $("spotify-link").textContent="Buscar All the Time · The Kooks en Spotify ↗";
 }
}
songs.forEach((song,i)=>{const button=document.createElement("button");button.className="song-button";button.textContent=song.name+" · "+song.artist;button.addEventListener("click",()=>selectSong(i));$("song-buttons").append(button);});
selectSong(0);
function loadMusic() {} // El reproductor permanece montado al cambiar de pantalla.
function show(id, focusId) {
  for (const name of ["welcome", "goodbye", "letter-view"]) $(name).hidden = name !== id;
  if (focusId) $(focusId).focus({preventScroll:true});
  window.scrollTo({top:0, behavior:"instant"});
}
$("read").addEventListener("click", () => { show("letter-view", "letter-title"); loadMusic(); });
$("read-again").addEventListener("click", () => show("letter-view", "letter-title"));
$("decline").addEventListener("click", () => show("goodbye", "bye-title"));
function goBack() { show("welcome", "read"); }
$("back").addEventListener("click", goBack);
$("close-letter").addEventListener("click", goBack);
let perhaps = 0;
$("later").addEventListener("click", () => {
  const labels = ["Tal vez…", "Mmm, puede ser", "Me da curiosidad", "Quizás…"];
  $("later").textContent = labels[perhaps++ % labels.length];
  $("cat-speech").textContent = "Miau… tú decides.";
  $("hint").textContent = "La carta seguirá aquí. Puedes leerla o elegir «Ahora no».";
});
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let paused = motionPreference.matches;
function setMotion() {
  document.body.classList.toggle("paused", paused);
  $("motion").setAttribute("aria-pressed", String(paused));
  $("motion").textContent = paused ? "Activar animación" : "Pausar animación";
}
$("motion").addEventListener("click", () => { paused = !paused; setMotion(); });
setMotion();

// Cada gesto tiene su propio ritmo. El movimiento continuo usa el reloj del navegador.
const sequences = {
 idle:[[0,2200],[1,110],[0,1500],[2,220],[3,160],[2,200],[3,160],[2,320],[0,1500],[4,950],[5,140],[4,850],[0,1200]],
 groom:[[0,350],[2,320],[3,140],[2,220],[3,140],[2,220],[3,140],[2,420],[0,1000]],
 letter:[[4,1900],[5,150],[4,1100],[5,150],[4,900]],
 walk:[[6,160],[7,160]],
 rose:[[0,900],[1,170],[2,170],[3,280],[4,1600],[5,130],[6,900],[7,220],[2,180],[1,180]]
};
const characters = Array.from(document.querySelectorAll(".sprite, .animated-character")).map((element,index)=>{
 const layers=[document.createElement("span"),document.createElement("span")];
 layers.forEach((layer,i)=>{layer.className="pose-layer";layer.setAttribute("aria-hidden","true");layer.style.opacity=i===0?"1":"0";element.append(layer);});
 return {element,layers,front:0,frame:-1,time:index*417,mode:element.dataset.mode||"idle",until:0,index};
});
function frameAt(mode,time){
 const sequence=sequences[mode]||sequences.idle;
 const duration=sequence.reduce((sum,pair)=>sum+pair[1],0);
 let local=time%duration;
 for(const [frame,hold] of sequence){if(local<hold)return frame;local-=hold;}
 return sequence[0][0];
}
function setPose(character,frame,immediate=false){
 if(character.frame===frame)return;
 const next=1-character.front;
 const layer=character.layers[next];
 layer.style.backgroundPosition=((frame%4)*100/3)+"% "+(frame<4?0:100)+"%";
 if(immediate){character.layers.forEach(l=>l.style.transition="none");}
 character.layers[character.front].style.opacity="0";layer.style.opacity="1";
 character.front=next;character.frame=frame;
 if(immediate)requestAnimationFrame(()=>character.layers.forEach(l=>l.style.transition=""));
}
characters.forEach(c=>setPose(c,frameAt(c.mode,c.time),true));
let lastTime=0;
function animate(now){
 const delta=lastTime?Math.min(now-lastTime,60):0;lastTime=now;
 if(!paused&&!document.hidden){
  characters.forEach(c=>{
   if(c.element.closest("[hidden]"))return;
   if(c.mode==="rose"&&!roseVisible)return;
   c.time+=delta;
   if(c.until&&c.time>=c.until){c.mode="idle";c.element.dataset.mode="idle";c.time=0;c.until=0;$("cat-speech").textContent="Tengo algo para ti.";}
   setPose(c,frameAt(c.mode,c.time));
   const seconds=c.time/1000;
   const breath=Math.sin(seconds*2.1+c.index)*.007;
   const walking=c.mode==="walk";
   const travel=walking?Math.sin(seconds*.65)*(c.element.classList.contains("hero-cat")?48:9):0;
   const bob=walking?-Math.abs(Math.sin(seconds*Math.PI/.16))*2.5:Math.sin(seconds*2.1+c.index)*1.5;
   const tilt=c.mode==="letter"||c.mode==="rose"?Math.sin(seconds*1.15)*1.3:Math.sin(seconds*1.1)*.3;
   c.element.style.transform=`translate(${travel}px,${bob}px) rotate(${tilt}deg) scaleY(${1+breath})`;
  });
 }
 requestAnimationFrame(animate);
}
let roseVisible=false;
const finale=$("rose-finale");
if("IntersectionObserver" in window){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){roseVisible=entry.isIntersecting;if(roseVisible)finale.classList.add("is-visible");}},{threshold:.15});observer.observe(finale);
}else{roseVisible=true;finale.classList.add("is-visible");}
requestAnimationFrame(animate);
document.querySelectorAll("[data-cat-action]").forEach(button=>button.addEventListener("click",()=>{
 const hero=characters.find(c=>c.element.classList.contains("hero-cat"));
 hero.mode=button.dataset.catAction;hero.element.dataset.mode=hero.mode;hero.time=0;hero.until=6500;
 setPose(hero,frameAt(hero.mode,0),paused);
 $("cat-speech").textContent={groom:"Un momento… mi patita.",letter:"Esta cartita es para ti.",walk:"¡Ya voy con el correo!"}[hero.mode];
}));
