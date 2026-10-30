(function () {
  'use strict';
  function q(id) { return document.getElementById(id); }
  function make(label, icon, fn) {
    var b=document.createElement('button'); b.type='button'; b.className='gm-item'; b.setAttribute('role','menuitem');
    b.innerHTML=icon+'<span>'+label+'</span>'; b.addEventListener('click',function(){ fn(); }); return b;
  }
  var icons={
    wand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l9-9"/><path d="M14.5 4.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z"/></svg>',
    inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 14.5v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5"/><path d="M12 3.8v10.4M12 14.2L8.4 10.6M12 14.2l3.6-3.6"/></svg>',
    share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 15.5v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.5"/><path d="M12 3.8v10.4M12 3.8L8.4 7.4M12 3.8l3.6 3.6"/></svg>',
    folder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.6 8.4V6.6A1.6 1.6 0 0 1 5.2 5h3.9L11 6.9h6.9a1.6 1.6 0 0 1 1.6 1.6v9.3a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6V8.4z"/></svg>',
    lockOn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.8" y="10.4" width="14.4" height="9" rx="2.2"/><path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 7.2 0v2.6"/></svg>',
    lockOff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.8" y="10.4" width="14.4" height="9" rx="2.2"/><path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 6.9-1.1"/></svg>',
    cloud:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7.2 18.2a3.9 3.9 0 0 1-.2-7.8 5.4 5.4 0 0 1 10.4-1.4 3.7 3.7 0 0 1-.4 9.2H7.2z"/></svg>'
  };
  function init(){
    var header=q('perfectColorHeaderActions'), menu=q('perfectColorActionsMenu'), dots=q('perfectColorActions');
    if(!header||!menu||!dots||header.dataset.ready==='1') return;
    header.dataset.ready='1';
    var imp=q('ffxImportButton'), folder=q('ffxFolderButton'), cloud=q('cloudStyleRefresh');
    function ui(){ return window.GhostFfxStyleUI || {}; }
    function close(){ menu.hidden=true; dots.setAttribute('aria-expanded','false'); }
    function proxy(label,icon,target,direct){ if(!target && !direct) return; menu.appendChild(make(label,icon,function(){ close(); if(typeof direct==='function') direct(); else if(target) target.click(); })); }
    proxy('Create preset',icons.wand,null,function(){ if(typeof ui().create==='function') ui().create(); });
    proxy('Import preset',icons.inbox,imp,function(){ if(typeof ui().importPreset==='function') ui().importPreset(); else if(imp) imp.click(); });
    menu.appendChild(make('Export preset',icons.share,function(){ close(); if(typeof ui().exportPack==='function') ui().exportPack(); else if(typeof window.GhostStylePresetsExport==='function') window.GhostStylePresetsExport(); }));
    proxy('Preset folder',icons.folder,folder,function(){ if(typeof ui().revealFolder==='function') ui().revealFolder(); else if(folder) folder.click(); });
    proxy('Cloud presets',icons.cloud,cloud);
    dots.addEventListener('click',function(e){e.stopPropagation(); menu.hidden=!menu.hidden; dots.setAttribute('aria-expanded',menu.hidden?'false':'true');});
    document.addEventListener('click',function(e){if(!header.contains(e.target)){menu.hidden=true;dots.setAttribute('aria-expanded','false');}});
    var fav=q('tkBookmarkFilter'), favBtn=q('perfectColorFavorite');
    if(fav&&favBtn){
      function sync(){var on=fav.getAttribute('aria-pressed')==='true';favBtn.setAttribute('aria-pressed',on?'true':'false');favBtn.classList.toggle('is-on',on);}
      favBtn.addEventListener('click',function(){fav.click();}); sync();
      if(window.MutationObserver) new MutationObserver(sync).observe(fav,{attributes:true,attributeFilter:['aria-pressed','class']});
    }
    /* Ramp lock — replaces the old filter button. Default = locked. */
    var lock=q('perfectColorLock');
    if(lock){
      var LK='ghost.text.rampLock';
      function state(){
        var st=null;
        try{ st=JSON.parse(localStorage.getItem(LK)||'null'); }catch(e){ st=null; }
        if(!st||typeof st!=='object') st={};
        if(typeof st.gradient!=='boolean') st.gradient=true;
        if(typeof st.four!=='boolean') st.four=true;
        return st;
      }
      function save(st){ try{ localStorage.setItem(LK,JSON.stringify(st)); }catch(e){} }
      function paintLock(){ var st=state(); lock.classList.toggle('is-on', !!(st.gradient||st.four)); }
      function callHost(on,key){
        function done(res){ try{ res=typeof res==='string'?JSON.parse(res):res; }catch(e){res=null;} if(res&&res.ok===false&&window.console) console.warn(res.error); }
        var api=window.GhostWebStyleAPI||window.GhostToolkitAPI||{};
        if(typeof api.call==='function'){ try{ var task=api.call('toolkitFfxSetGradientLock',[!!on,String(key)]);if(task&&task.then)task.then(done); }catch(e){} }
        else if(window.__adobe_cep__&&window.CSInterface){ try{new window.CSInterface().evalScript('GhostHost.toolkitFfxSetGradientLock('+(on?'true':'false')+',"'+String(key)+'")',done);}catch(e2){} }
      }
      function closePop(){
        var pop=document.getElementById('perfectColorLockMenu');
        if(pop&&pop.parentNode) pop.parentNode.removeChild(pop);
        lock.setAttribute('aria-expanded','false');
      }
      function row(label,key){
        var b=document.createElement('button'); b.type='button';
        b.setAttribute('role','menuitemcheckbox');
        function paint(){
          var on=!!state()[key];
          b.className='gm-item'+(on?' is-on':'');
          b.setAttribute('aria-checked',on?'true':'false');
          b.innerHTML=(on?icons.lockOn:icons.lockOff)+'<span>'+label+' — '+(on?'Locked':'Unlocked')+'</span>';
        }
        paint();
        b.addEventListener('click',function(e){
          e.stopPropagation();
          var cur=state(); cur[key]=!cur[key]; save(cur);
          callHost(!!cur[key],key);
          paint(); paintLock();
        });
        return b;
      }
      function place(pop){
        var r=lock.getBoundingClientRect();
        pop.style.position='fixed';
        pop.style.zIndex='99999';
        pop.style.margin='0';
        pop.style.visibility='hidden';
        pop.style.left='0px'; pop.style.top='0px';
        var w=pop.offsetWidth||200, h=pop.offsetHeight||80;
        var left=Math.min(Math.max(8,r.right-w), Math.max(8,window.innerWidth-w-8));
        var top=r.bottom+6;
        if(top+h>window.innerHeight-8) top=Math.max(8,r.top-h-6);
        pop.style.left=left+'px';
        pop.style.top=top+'px';
        pop.style.visibility='visible';
      }
      lock.addEventListener('click',function(e){
        e.stopPropagation();
        if(document.getElementById('perfectColorLockMenu')){ closePop(); return; }
        var pop=document.createElement('div');
        pop.id='perfectColorLockMenu'; pop.className='gm-pop gp2-style-pop is-open';
        pop.setAttribute('role','menu'); pop.hidden=false;
        pop.appendChild(row('Gradient Ramp','gradient'));
        pop.appendChild(row('Four Color Ramp','four'));
        document.body.appendChild(pop);
        place(pop);
        lock.setAttribute('aria-expanded','true');
      });
      document.addEventListener('click',function(e){
        var pop=document.getElementById('perfectColorLockMenu');
        if(pop && !pop.contains(e.target) && e.target!==lock && !lock.contains(e.target)) closePop();
      });
      window.addEventListener('resize',closePop);
      window.addEventListener('scroll',closePop,true);
      paintLock();
    }
  }

  /* Animation section: drop both autoplay toggles, push star + 3-dot right */
  function animHeader(){
    var panel=document.getElementById('tab-anim');
    if(!panel) return;
    ['animFfxPlayBtn','animWebPlayBtn'].forEach(function(id){
      var b=document.getElementById(id);
      if(b&&b.parentNode) b.parentNode.removeChild(b);
    });
    var bar=panel.querySelector('.tk-panel-toolbar.tk-toolbar-inhead');
    if(bar){
      var head=bar.parentNode&&bar.parentNode.classList&&bar.parentNode.classList.contains('tk-ts-sechead')?bar.parentNode:panel.querySelector('.tk-ts-sechead');
      if(head){
        bar.classList.add('gp2-anim-toolbar-right');
        if(!head.querySelector('.gp2-rule')){
          var rule=document.createElement('span'); rule.className='gp2-rule';
          head.insertBefore(rule,bar);
        }
        head.appendChild(bar);
      }
    }
  }

  /* Favourite star on every style card (Perfect Color + themes) */
  var BM='ghost.toolkit.bookmarks';
  function bmMap(){ try{ return JSON.parse(localStorage.getItem(BM)||'{}')||{}; }catch(e){ return {}; } }
  function bmSet(map){ try{ localStorage.setItem(BM,JSON.stringify(map)); }catch(e){} }
  var STAR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L12 16.5l-4.71 2.47.9-5.24-3.8-3.7 5.26-.77L12 4.5z"/></svg>';
  function starify(card,key){
    if(!card||card.querySelector('.tk-bm-star')) return;
    var b=document.createElement('button');
    b.type='button'; b.className='tk-bm-star';
    b.title='Favourite'; b.setAttribute('aria-label','Favourite');
    b.innerHTML=STAR;
    function paint(){
      var on=!!bmMap()[key];
      b.classList.toggle('is-on',on);
      card.classList.toggle('is-bookmarked',on);
      card.setAttribute('data-bookmarked',on?'1':'0');
    }
    paint();
    b.addEventListener('click',function(e){
      e.preventDefault(); e.stopPropagation();
      var map=bmMap();
      if(map[key]) delete map[key]; else map[key]=1;
      bmSet(map); paint();
      var cnt=document.getElementById('tkBookmarkCount');
      if(cnt) cnt.textContent=String(Object.keys(bmMap()).length);
    });
    card.appendChild(b);
  }
  function starifyGrids(){
    var grids=['ffxStyleGrid','textStyleGrid','themeGrid','colorGrid'];
    for(var i=0;i<grids.length;i++){
      var g=document.getElementById(grids[i]);
      if(!g) continue;
      var cards=g.querySelectorAll('.tk-card');
      for(var j=0;j<cards.length;j++){
        var c=cards[j];
        if(c.classList.contains('tk-web-bangla-ramp-card')) continue;
        starify(c,'style|'+(c.getAttribute('data-search')||c.title||(grids[i]+':'+j)));
      }
    }
  }
  function watchGrids(){
    if(!window.MutationObserver) return;
    var obs=new MutationObserver(function(){ starifyGrids(); });
    ['ffxStyleGrid','themeGrid','colorGrid'].forEach(function(id){
      var g=document.getElementById(id);
      if(g) obs.observe(g,{childList:true});
    });
  }
  function extras(){ animHeader(); starifyGrids(); watchGrids(); }
  window.GhostBoot.push(function(){setTimeout(extras,500);setTimeout(extras,1500);setTimeout(extras,2800);});
  window.GhostBoot.push(function(){setTimeout(init,350);setTimeout(init,1000);});
})();
