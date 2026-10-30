/* GHOST WEB STYLE PRESETS — visual text ramps, testing only.
 * The existing Style toolbar/layout remains untouched.
 * Web cards are rendered into the original textStyleGrid so the existing
 * Style search + favourite filter infrastructure continues to work.
 */
(function(){
  "use strict";
  function byId(id){ return document.getElementById(id); }
  function api(){ return window.GhostWebStyleAPI || {}; }
  function setStatus(text,kind){
    var n=byId("textStyleStatus");
    if(!n)return;
    n.hidden=!text;
    n.textContent=text||"";
    n.className="tool-inline-status"+(kind?" "+kind:"");
  }
  function esc(s){ return String(s||"").replace(/[&<>\"]/g,function(c){return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"})[c];}); }
  function gradientCss(g){
    var colors=(g&&g.colors)||[];
    var stops=[];
    for(var i=0;i<colors.length;i++){
      var c=colors[i];
      var pos=(typeof c.position==="number")?Math.round(c.position*100):Math.round(i*100/Math.max(1,colors.length-1));
      stops.push(String(c.color||"#fff")+" "+pos+"%");
    }
    return "linear-gradient("+Number(g&&g.angle||135)+"deg,"+stops.join(",")+")";
  }
  function card(p,index){
    if(!p || !p.id || !p.gradient || !p.gradient.colors || p.gradient.colors.length!==4) return null;
    var phrases=["নতুন রঙ","স্বপ্ন ছোঁয়া","মনের কথা","রঙিন দিন","শুভ সকাল","ভালো থাকুন","আজকের গল্প","আলোর পথে","নতুন শুরু","তোমার গল্প"];
    var phrase=phrases[index%phrases.length];
    var card=document.createElement("div");
    card.className="tk-card tk-web-bangla-ramp-card";
    card.setAttribute("role","button");
    card.setAttribute("tabindex","0");
    card.setAttribute("data-search",(phrase+" "+(p.name||"")+" web preset").toLowerCase());
    card.setAttribute("data-cat","color");
    card.title=phrase;

    var preview=document.createElement("div");
    preview.className="tk-web-bangla-ramp-preview";
    preview.style.backgroundImage=gradientCss(p.gradient);

    /* bundled demo image (ramp_XX.png) sits on top; if it cannot load we
       simply keep the CSS gradient preview underneath. */
    var shot=document.createElement("img");
    shot.className="tk-web-bangla-ramp-shot";
    shot.alt=(p.name||p.id||"preset");
    shot.setAttribute("loading","lazy");
    shot.onerror=function(){ if(shot.parentNode) shot.parentNode.removeChild(shot); preview.classList.remove("has-shot"); };
    shot.onload=function(){ preview.classList.add("has-shot"); };
    shot.src="presets/web-style-testing/"+encodeURIComponent(String(p.id))+".png";
    preview.appendChild(shot);

    var glow=document.createElement("span");
    glow.className="tk-web-bangla-ramp-glow";
    preview.appendChild(glow);

    var text=document.createElement("span");
    text.className="tk-web-bangla-ramp-text";
    text.textContent=phrase;
    text.style.backgroundImage=gradientCss(p.gradient);
    text.style.webkitBackgroundClip="text";
    text.style.backgroundClip="text";
    text.style.color="transparent";
    preview.appendChild(text);

    var star=document.createElement("button");
    star.type="button";
    star.className="tk-web-bangla-ramp-star";
    star.setAttribute("aria-label","Favourite");
    star.innerHTML="<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"><path d=\"M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.563.563 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z\"/></svg>";
    star.addEventListener("click",function(e){
      e.preventDefault(); e.stopPropagation();
      var key="ghost.toolkit.bookmarks";
      var map={};
      try{map=JSON.parse(localStorage.getItem(key)||"{}")}catch(ignore){}
      var k="web-style|"+p.id;
      map[k]=!map[k];
      try{localStorage.setItem(key,JSON.stringify(map));}catch(ignore2){}
      star.classList.toggle("is-on",!!map[k]);
      card.classList.toggle("is-bookmarked",!!map[k]);
      var global=byId("tkBookmarkFilter");
      if(global && typeof global.click==="function"){
        var active=global.getAttribute("aria-pressed")==="true";
        if(active) global.click();
        if(active) global.click();
      }
    });
    try{
      var bm={}; bm=JSON.parse(localStorage.getItem("ghost.toolkit.bookmarks")||"{}");
      if(bm["web-style|"+p.id]){star.classList.add("is-on");card.classList.add("is-bookmarked");}
    }catch(ignore3){}
    preview.appendChild(star);
    card.appendChild(preview);

    var handler=function(){
      setStatus("Applying…","");
      if(typeof api().call!=="function"){setStatus("Web preset bridge unavailable.","error");return;}
      api().call("toolkitApplyWebStylePreset",[String(p.id)]).then(function(res){
        if(typeof api().reportResult==="function") api().reportResult("textStyleStatus",res,(res&&res.ok)?"Applied.":"");
        else setStatus((res&&res.ok)?"Applied.":(res&&res.error)||"Apply failed.",res&&res.ok?"":"error");
      }).catch(function(e){setStatus(e.message||"Apply failed.","error");});
    };
    card.addEventListener("click",function(e){if(e.target===star || star.contains(e.target))return;handler();});
    card.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();handler();}});
    return card;
  }
  function paintList(list){
    var grid=byId("textStyleGrid");
    if(!grid) return;
    grid.innerHTML="";
    for(var i=0;i<list.length;i++){ var c=card(list[i],i); if(c) grid.appendChild(c); }
    var empty=byId("textStyleEmpty");
    if(empty){ empty.hidden=list.length>0; empty.textContent=list.length?"":"No web presets available."; }
    try{ var apiObj=api(); if(apiObj && typeof apiObj.applyFilter==="function") apiObj.applyFilter(); }catch(ignore){}
  }
  function bundledFallback(){
    return new Promise(function(resolve,reject){
      try{
        var xhr=new XMLHttpRequest();
        xhr.open("GET","presets/web-style-testing/web-presets.json",true);
        xhr.onload=function(){
          if(xhr.status===0 || (xhr.status>=200 && xhr.status<300)){
            try{
              var data=JSON.parse(xhr.responseText||"{}");
              var list=(data&&Array.isArray(data.presets))?data.presets:[];
              resolve(list.filter(function(p){return p&&p.id&&p.gradient&&p.gradient.colors&&p.gradient.colors.length===4;}));
            }catch(e){reject(e);}
          }else reject(new Error("Bundled web preset JSON could not be read."));
        };
        xhr.onerror=function(){reject(new Error("Bundled web preset JSON could not be read."));};
        xhr.send(null);
      }catch(e){reject(e);}
    });
  }
  function load(){
    var grid=byId("textStyleGrid");
    if(!grid)return;
    var empty=byId("textStyleEmpty");
    if(empty){empty.hidden=false;empty.textContent="Loading web presets\u2026";}
    /* The bundled JSON is the only source that carries the 4-colour gradient,
       so it is always the source of truth for rendering. Applying still goes
       through the host by preset id. */
    bundledFallback().then(paintList).catch(function(e){
      if(empty){empty.hidden=false;empty.textContent=(e&&e.message)||"Could not load web presets.";}
    });
  }
  window.GhostBoot.push(function(){setTimeout(load,80);});
  window.GhostWebStyleTesting={reload:load};
})();
