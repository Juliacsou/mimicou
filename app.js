const APP_SETTINGS_KEY='mimicou-app-settings-v1';
const DEFAULT_APP_SETTINGS={sound:true,volume:80,countdown:true,vibration:true,reducedMotion:false};
const TEAM_PALETTE=['#198cff','#ff3d55','#20cf5d','#ffc928','#7c3cff','#ff4fb3','#ff851b','#20cdf0'];
const DEFAULT_TEAMS=[
  {name:'Time Azul',color:'#198cff'},
  {name:'Time Vermelho',color:'#ff3d55'},
  {name:'Time Verde',color:'#20cf5d'},
  {name:'Time Amarelo',color:'#ffc928'},
  {name:'Time Roxo',color:'#7c3cff'},
  {name:'Time Rosa',color:'#ff4fb3'}
];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const tabOrder=['game','categories'];

function loadAppSettings(){
  try{return {...DEFAULT_APP_SETTINGS,...JSON.parse(localStorage.getItem(APP_SETTINGS_KEY)||'{}')}}
  catch{return {...DEFAULT_APP_SETTINGS}}
}
function freshSetup(){return {teams:1,rounds:3,skips:2,seconds:30,teamData:DEFAULT_TEAMS.map(x=>({...x})),categories:GAME_CATEGORIES.map(c=>c.id),activeTab:'game',categoryPage:0,editingTeam:null,teamModalOpen:false}}
const state={settings:loadAppSettings(),setup:freshSetup(),game:null,timer:null,transitionTimer:null,audio:{context:null,enabled:true,bank:{}},phase:'home',noSkipConfirm:null};
state.audio.enabled=state.settings.sound;

function getAudioContext(){
  if(!state.audio.enabled)return null;
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return null;
  if(!state.audio.context)state.audio.context=new C();
  if(state.audio.context.state==='suspended')state.audio.context.resume().catch(()=>{});
  return state.audio.context;
}
function tone({frequency=440,duration=.09,volume=.08,type='sine',delay=0}){
  const c=getAudioContext();if(!c)return;
  const s=c.currentTime+delay,o=c.createOscillator(),g=c.createGain(),scaled=volume*(state.settings.volume/100);
  o.type=type;o.frequency.setValueAtTime(frequency,s);g.gain.setValueAtTime(.0001,s);
  g.gain.exponentialRampToValueAtTime(Math.max(.0001,scaled),s+.008);g.gain.exponentialRampToValueAtTime(.0001,s+duration);
  o.connect(g);g.connect(c.destination);o.start(s);o.stop(s+duration+.02);
}
const SOUND_FILES={countdown:'countdown.mp3',correct:'correct.mp3',skip:'skip.mp3',timeup:'timeup.mp3',gameover:'gameover.mp3',turnStart:'turn-start-whistle.mp3',turnEnd:'turn-end.mp3',roundEnd:'round-end.mp3'};
function preloadSounds(){
  Object.entries(SOUND_FILES).forEach(([key,file])=>{const a=new Audio(`assets/audio/${file}`);a.preload='auto';state.audio.bank[key]=a});
}
function playToneFallback(k){
  if(k==='countdown')tone({frequency:880,duration:.075,volume:.055,type:'square'});
  if(k==='correct'){tone({frequency:660,duration:.09,volume:.07});tone({frequency:990,duration:.13,volume:.075,delay:.08})}
  if(k==='skip'){tone({frequency:340,duration:.08,volume:.06,type:'triangle'});tone({frequency:250,duration:.12,volume:.06,type:'triangle',delay:.07})}
  if(k==='timeup'||k==='turnEnd'){tone({frequency:220,duration:.18,volume:.085,type:'sawtooth'});tone({frequency:165,duration:.24,volume:.08,type:'sawtooth',delay:.15})}
  if(k==='turnStart'){tone({frequency:3050,duration:.42,volume:.06,type:'sine'});tone({frequency:3280,duration:.42,volume:.035,type:'sine'});}
  if(k==='roundEnd'){tone({frequency:523.25,duration:.11,volume:.065});tone({frequency:659.25,duration:.11,volume:.065,delay:.12});tone({frequency:783.99,duration:.22,volume:.075,delay:.24})}
  if(k==='gameover'){tone({frequency:523.25,duration:.11,volume:.065});tone({frequency:659.25,duration:.11,volume:.065,delay:.11});tone({frequency:783.99,duration:.22,volume:.075,delay:.22})}
}
function playSound(k){
  if(!state.settings.sound)return;
  const base=state.audio.bank[k];
  if(!base){playToneFallback(k);return}
  const a=base.cloneNode();a.volume=Math.max(0,Math.min(1,state.settings.volume/100));
  const promise=a.play();if(promise?.catch)promise.catch(()=>playToneFallback(k));
}
function unlockAudio(){getAudioContext()}
preloadSounds();
function escapeHtml(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function clearTransition(){if(state.transitionTimer)clearTimeout(state.transitionTimer);state.transitionTimer=null}
function clearGameTimer(){if(state.timer)clearInterval(state.timer);state.timer=null;if(state.game){state.game.timerDeadline=null;state.game.lastAnnouncedSecond=null}}
function showScreen(id,phase=id.replace('-screen','')){$$('.screen').forEach(s=>s.classList.remove('active'));$('#'+id).classList.add('active');state.phase=phase}
function categoryPageSize(){return GAME_CATEGORIES.length}

/* Setup */
function renderSetupValues(){
  $('#teams-value').textContent=state.setup.teams;$('#rounds-value').textContent=state.setup.rounds;$('#skips-value').textContent=state.setup.skips;$('#seconds-value').textContent=`${state.setup.seconds}s`;
  renderTeamsEditor();renderCategories();renderSetupTabs();
}
function renderSetupTabs(){
  $$('.setup-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.setup.activeTab));
  $$('.setup-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===state.setup.activeTab));
  const i=tabOrder.indexOf(state.setup.activeTab);
  $('#setup-back').classList.toggle('hidden',i===0);$('#setup-next').classList.toggle('hidden',i===tabOrder.length-1);
  const startButton=$('#start-game');if(startButton)startButton.classList.toggle('hidden',i!==tabOrder.length-1);
  const resetButton=$('#reset-setup');if(resetButton)resetButton.classList.toggle('hidden',i===1);
  const step=$('#config-step-current');if(step)step.textContent=String(i+1);
  const title=$('#config-screen-title');if(title)title.textContent=i===0?'CONFIGURAR PARTIDA':'ESCOLHA AS CATEGORIAS';
}
function setSetupTab(tab){
  state.setup.activeTab=tab;
  if(tab==='categories')state.setup.categoryPage=Math.min(state.setup.categoryPage,Math.max(0,Math.ceil(GAME_CATEGORIES.length/categoryPageSize())-1));
  $('#setup-error').classList.add('hidden');renderSetupTabs();renderCategories();
}
function renderTeamsEditor(){
  const editor=$('#teams-editor');
  if(!editor)return;
  editor.dataset.count=String(state.setup.teams);
  const visibleTeams=state.setup.teamData.slice(0,state.setup.teams);
  editor.innerHTML=visibleTeams.map((t,i)=>`<div class="team-edit-row game-team-card setup-team-row ${state.setup.editingTeam===i&&state.setup.teamModalOpen?'is-editing':''}" style="--team-color:${t.color}"><div class="team-card-main"><div class="team-row-info"><span class="team-main-orb" style="background:${t.color}"></span><span class="team-name-label">${escapeHtml(t.name)}</span></div><button type="button" class="team-edit-button" data-team-edit="${i}" aria-label="Editar nome e cor do time ${i+1}" title="Editar nome e cor"><span>✎</span></button></div></div>`).join('')+`<button id="add-team-button" class="add-team-button" type="button" ${state.setup.teams>=6?'disabled':''}><span class="add-team-plus">+</span><span>ADICIONAR TIME</span></button>`;
  $$('[data-team-edit]').forEach(btn=>btn.addEventListener('click',e=>openTeamModal(+e.currentTarget.dataset.teamEdit)));
  const addBtn=$('#add-team-button');
  if(addBtn)addBtn.addEventListener('click',()=>{
    if(state.setup.teams>=6)return;
    state.setup.teams++;
    const idx=state.setup.teams-1;
    const fallback=DEFAULT_TEAMS[idx]||{name:`Time ${idx+1}`,color:TEAM_PALETTE[idx%TEAM_PALETTE.length]};
    state.setup.teamData[idx]={name:fallback.name,color:fallback.color};
    renderSetupValues();
    openTeamModal(idx,true);
  });
}
function openTeamModal(index,isNew=false){
  state.setup.editingTeam=index;
  state.setup.teamModalOpen=true;
  const modal=$('#team-modal');
  if(!modal)return;
  modal.classList.remove('hidden');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  const team=state.setup.teamData[index];
  $('#team-modal-title').textContent=isNew?'Novo time':'Editar time';
  const input=$('#team-name-input-modal');
  input.value=team.name;
  renderTeamModalColors();
  renderTeamPreview();
  setTimeout(()=>{input.focus();input.select();},0);
  renderTeamsEditor();
}
function closeTeamModal(){
  state.setup.teamModalOpen=false;
  state.setup.editingTeam=null;
  const modal=$('#team-modal');
  if(modal){modal.classList.remove('show');modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');}
  renderTeamsEditor();
}
function renderTeamModalColors(){
  const wrap=$('#team-modal-colors');
  if(!wrap||state.setup.editingTeam===null)return;
  const team=state.setup.teamData[state.setup.editingTeam];
  wrap.innerHTML=TEAM_PALETTE.map(c=>`<button type="button" class="team-modal-swatch ${team.color===c?'selected':''}" data-modal-color="${c}" style="background:${c}" aria-label="Selecionar cor ${c}"></button>`).join('');
  $$('[data-modal-color]').forEach(btn=>btn.addEventListener('click',e=>{
    state.setup.teamData[state.setup.editingTeam].color=e.currentTarget.dataset.modalColor;
    renderTeamModalColors();
    renderTeamPreview();
    renderTeamsEditor();
  }));
}
function renderTeamPreview(){
  if(state.setup.editingTeam===null)return;
  const team=state.setup.teamData[state.setup.editingTeam];
  const input=$('#team-name-input-modal');
  $('#team-preview-name').textContent=(input?.value.trim()||team.name||'Novo time');
  $('#team-preview-orb').style.background=team.color;
  $('#team-preview-card').style.setProperty('--team-preview-color',team.color);
}
function saveTeamModal(){
  if(state.setup.editingTeam===null)return;
  const input=$('#team-name-input-modal');
  const clean=input.value.trim();
  if(!clean){input.focus();return}
  state.setup.teamData[state.setup.editingTeam].name=clean;
  closeTeamModal();
  renderSetupValues();
}

function renderCategories(){
  const grid=$('#categories-grid');
  if(!grid)return;
  const previousScroll=grid.scrollTop||0;
  const items=GAME_CATEGORIES;
  const colors=[['#16d86b','#079b49'],['#8d42ff','#5922ca'],['#ff4d57','#d92742'],['#22b7ff','#137bdd'],['#ffb525','#e67d08'],['#f43ca0','#c91f79'],['#31d780','#129758'],['#8750ff','#6030cc'],['#ff6a39','#d9402b'],['#20c5df','#108aa7']];
  grid.innerHTML=items.map((c,i)=>{const pair=colors[i%colors.length];return `<label class="category-option" style="--cat-a:${pair[0]};--cat-b:${pair[1]}" data-category-card><input type="checkbox" value="${c.id}" ${state.setup.categories.includes(c.id)?'checked':''}><span class="category-label"><img class="category-icon-img" src="assets/categories/${c.id}.png" alt=""><strong>${escapeHtml(c.name)}</strong></span></label>`}).join('');
  $$('#categories-grid input').forEach(x=>x.addEventListener('change',e=>{if(e.target.checked){if(!state.setup.categories.includes(e.target.value))state.setup.categories.push(e.target.value)}else state.setup.categories=state.setup.categories.filter(id=>id!==e.target.value);updateCategoryMeta()}));
  const label=$('#categories-page-label'); if(label) label.textContent='Tudo em uma página';
  const prev=$('#categories-prev'); const next=$('#categories-next');
  if(prev) prev.disabled=true; if(next) next.disabled=true;
  updateCategoryMeta();
  requestAnimationFrame(()=>{grid.scrollTop=previousScroll;});
}
function changeCategoryPage(direction){return}
function setupCategorySwipe(){return}

function updateCategoryMeta(){const count=$('#selected-category-count');if(count)count.textContent=`${state.setup.categories.length} de ${GAME_CATEGORIES.length} selecionadas`;const toggle=$('#toggle-categories');if(toggle)toggle.textContent=state.setup.categories.length===GAME_CATEGORIES.length?'Limpar seleção':'Selecionar todas'}
function handleStepper(type,dir){const limits={teams:[1,6,1],rounds:[1,10,1],skips:[0,10,1],seconds:[10,90,5]},[min,max,step]=limits[type];state.setup[type]=Math.max(min,Math.min(max,state.setup[type]+dir*step));if(type==='teams'&&state.setup.editingTeam>=state.setup.teams)state.setup.editingTeam=null;renderSetupValues()}
function validateTeamsOnly(){const teams=state.setup.teamData.slice(0,state.setup.teams);if(teams.some(t=>!t.name.trim()))return'Todos os times precisam ter um nome.';return''}
function validateSetup(){
  const teamError=validateTeamsOnly();if(teamError)return teamError;
  if(!state.setup.categories.length)return'Escolha pelo menos uma categoria.';
  const n=GAME_CATEGORIES.filter(c=>state.setup.categories.includes(c.id)).reduce((s,c)=>s+c.words.length,0);
  if(n<10)return'Selecione categorias com pelo menos 10 palavras.';
  return'';
}
function buildDeck(){const a=[];GAME_CATEGORIES.filter(c=>state.setup.categories.includes(c.id)).forEach(c=>c.words.forEach(word=>a.push({word,categoryId:c.id,category:c.name,emoji:c.emoji})));return shuffle(a)}
function shuffle(a){const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]]}return c}

/* Game lifecycle */
function startGame(){
  unlockAudio();clearGameTimer();clearTransition();
  const err=validateSetup();if(err){$('#setup-error').textContent=err;$('#setup-error').classList.remove('hidden');return}
  $('#setup-error').classList.add('hidden');
  state.game={round:1,teamIndex:0,teams:state.setup.teamData.slice(0,state.setup.teams).map(t=>({name:t.name.trim(),color:t.color,total:0,rounds:Array(state.setup.rounds).fill(0)})),deck:buildDeck(),used:[],skipsLeft:state.setup.skips,turnPoints:0,timeLeft:state.setup.seconds,currentWord:null,actionLocked:false,timerDeadline:null,lastAnnouncedSecond:null};
  showTurnScreen();
}
function currentTeam(){return state.game.teams[state.game.teamIndex]}
function showTurnScreen(){
  clearGameTimer();clearTransition();
  const t=currentTeam(),turnLayout=$('#turn-screen .turn-layout');
  if(turnLayout)turnLayout.style.setProperty('--current-team-color',t.color);
  $('#turn-round').textContent=state.game.round;$('#turn-round-total').textContent=state.setup.rounds;$('#turn-team-name').textContent=t.name;$('#turn-team-dot').style.background=t.color;$('#turn-time').textContent=`${state.setup.seconds}s`;$('#turn-skips').textContent=state.setup.skips;renderMiniScoreboard();showScreen('turn-screen','turn-ready');
}
function renderMiniScoreboard(){$('#turn-scoreboard').innerHTML=state.game.teams.map((t,i)=>`<div class="mini-score ${i===state.game.teamIndex?'current':''}"><span class="small-dot" style="background:${t.color}"></span><span class="mini-score-name">${escapeHtml(t.name)}</span><span class="mini-score-total">${t.total}</span></div>`).join('')}
function beginTurn(){
  if(!state.game||state.phase!=='turn-ready')return;
  unlockAudio();playSound('turnStart');state.game.skipsLeft=state.setup.skips;state.game.turnPoints=0;state.game.actionLocked=false;prepareNextWord();updatePlayScreen();showScreen('play-screen','playing');startGameTimer();
}
function getNextWord(){
  if(!state.game.deck.length){state.game.deck=shuffle(state.game.used);state.game.used=[];toast('Baralho reiniciado e embaralhado.')}
  const n=state.game.deck.pop();state.game.used.push(n);return n;
}
function prepareNextWord(){state.game.currentWord=getNextWord();state.game.timeLeft=state.setup.seconds;state.game.lastAnnouncedSecond=null;state.game.timerDeadline=null;updateTimerUI()}
function updatePlayScreen(){
  if(!state.game?.currentWord)return;
  const t=currentTeam(),i=state.game.currentWord;
  $('#play-team-name').textContent=t.name;$('#play-team-dot').style.background=t.color;$('#play-accent').style.background=t.color;$('#play-round').textContent=state.game.round;$('#play-round-total').textContent=state.setup.rounds;$('#word-category').textContent=i.category.toUpperCase();const categoryIcon=$('#word-category-icon');if(categoryIcon){categoryIcon.src=`assets/categories/${i.categoryId}.png`;categoryIcon.alt=i.category;}$('#current-word').textContent=i.word;$('#turn-points').textContent=state.game.turnPoints;const teamTotal=$('#play-team-total');if(teamTotal)teamTotal.textContent=t.total;$('#skips-left').textContent=state.game.skipsLeft;$('#skip-label').textContent=`(${state.game.skipsLeft})`;$('#skip-word').disabled=state.game.actionLocked;$('#skip-word').classList.toggle('no-skips',state.game.skipsLeft<=0);$('#correct-word').disabled=state.game.actionLocked;updateTimerUI();
}
function updateTimerUI(){
  const l=state.game?.timeLeft??state.setup.seconds,p=Math.max(0,Math.min(1,l/state.setup.seconds)),ring=$('#timer-ring');
  $('#timer-value').textContent=Math.max(0,l);ring.style.setProperty('--progress',p);ring.classList.toggle('warning',l<=5&&l>3);ring.classList.toggle('critical',l<=3);ring.classList.toggle('finished',l<=0);
}
function startGameTimer(durationMs=state.setup.seconds*1000){
  clearGameTimer();if(!state.game||state.phase!=='playing')return;
  state.game.timerDeadline=performance.now()+Math.max(0,durationMs);state.game.lastAnnouncedSecond=null;
  const tick=()=>{
    if(!state.game||state.phase!=='playing'||!state.game.timerDeadline)return;
    const remaining=Math.max(0,Math.ceil((state.game.timerDeadline-performance.now())/1000));
    if(remaining!==state.game.timeLeft){state.game.timeLeft=remaining;updateTimerUI();if(state.settings.countdown&&remaining>0&&remaining<=5&&remaining!==state.game.lastAnnouncedSecond){state.game.lastAnnouncedSecond=remaining;playSound('countdown')}}
    if(remaining<=0)handleTimeExpired();
  };
  tick();state.timer=setInterval(tick,100);
}
function animateWordFeedback(type){const card=$('.word-card');card.classList.remove('feedback-correct','feedback-skip');void card.offsetWidth;card.classList.add(type==='correct'?'feedback-correct':'feedback-skip')}
function vibrate(pattern){if(state.settings.vibration&&navigator.vibrate)navigator.vibrate(pattern)}
function queueNextWord(delay=180){
  clearTransition();state.transitionTimer=setTimeout(()=>{if(!state.game||state.phase!=='playing')return;prepareNextWord();state.game.actionLocked=false;updatePlayScreen();startGameTimer();$('.word-card').classList.remove('feedback-correct','feedback-skip')},delay);
}
function handleCorrect(){
  if(!state.game||state.phase!=='playing'||state.game.actionLocked)return;
  state.game.actionLocked=true;clearGameTimer();unlockAudio();playSound('correct');vibrate(45);animateWordFeedback('correct');state.game.turnPoints++;const t=currentTeam();t.total++;t.rounds[state.game.round-1]++;updatePlayScreen();queueNextWord();
}
function handleSkip(){
  if(!state.game||state.phase!=='playing'||state.game.actionLocked)return;
  if(state.game.skipsLeft<=0){openNoSkipConfirm();return}
  state.game.actionLocked=true;clearGameTimer();unlockAudio();playSound('skip');vibrate([25,20,25]);animateWordFeedback('skip');state.game.skipsLeft--;updatePlayScreen();queueNextWord();
}
function openNoSkipConfirm(){
  if(state.noSkipConfirm||!state.game?.timerDeadline)return;
  const remainingMs=Math.max(0,state.game.timerDeadline-performance.now());
  state.noSkipConfirm={remainingMs};clearGameTimer();
  $('#no-skip-modal').classList.add('show');$('#no-skip-cancel').focus();
}
function closeNoSkipConfirm(resume=true){
  if(!state.noSkipConfirm)return;
  const remainingMs=state.noSkipConfirm.remainingMs;state.noSkipConfirm=null;$('#no-skip-modal').classList.remove('show');
  if(resume&&state.game&&state.phase==='playing'){state.game.actionLocked=false;startGameTimer(remainingMs)}
}
function confirmEndTurnNoSkip(){
  if(!state.noSkipConfirm)return;
  state.noSkipConfirm=null;$('#no-skip-modal').classList.remove('show');state.game.actionLocked=true;vibrate([70,35,70]);endTurn();
}
function handleTimeExpired(){
  if(!state.game||state.phase!=='playing'||state.game.actionLocked)return;
  state.game.actionLocked=true;clearGameTimer();state.game.timeLeft=0;updateTimerUI();
  if(state.game.skipsLeft>0){playSound('skip');vibrate([35,25,35]);animateWordFeedback('skip');state.game.skipsLeft--;updatePlayScreen();toast('Tempo! Um pulo foi usado automaticamente.');queueNextWord(320)}
  else{playSound('timeup');vibrate([80,40,100]);state.transitionTimer=setTimeout(endTurn,420)}
}
function endTurn(){
  clearGameTimer();clearTransition();if(!state.game)return;
  playSound('turnEnd');
  const t=currentTeam();
  $('#turn-result-team').textContent=t.name;
  $('#turn-result-team').style.color=t.color;
  $('#turn-result-screen').style.setProperty('--result-team-color',t.color);
  $('#turn-result-points').textContent=state.game.turnPoints;
  $('#turn-result-total').textContent=t.total;
  $('#turn-result-round').textContent=state.game.round;
  const lastTeam=state.game.teamIndex===state.game.teams.length-1;
  $('#turn-result-next').textContent=lastTeam?'Ver placar da rodada →':'Próximo time →';
  showScreen('turn-result-screen','turn-result');
}
function advanceAfterTurn(){
  // Mantem o mesmo fluxo da ultima versao funcional: esta acao so e valida
  // enquanto a tela de fim da vez esta ativa.
  if(!state.game||state.phase!=='turn-result')return;
  if(state.game.teamIndex<state.game.teams.length-1){
    state.game.teamIndex++;
    showTurnScreen();
    return;
  }
  showRoundSummary();
}
function showRoundSummary(){
  if(!state.game)return;
  clearGameTimer();
  clearTransition();

  // Monta e exibe a tela antes de qualquer efeito sonoro. Dessa forma,
  // uma restricao de autoplay/audio do navegador nunca bloqueia a navegacao.
  $('#summary-round').textContent=state.game.round;
  $('#round-scoreboard').innerHTML=buildScoreboard(state.game.round-1,true);
  $('#next-round').textContent=state.game.round>=state.setup.rounds?'Ver resultado final →':'Próxima rodada →';
  showScreen('round-screen','round-summary');

  try{playSound('roundEnd')}catch{}
}
function buildScoreboard(r,gain=false){
  const sorted=[...state.game.teams].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'pt-BR'));
  return sorted.map((t,i)=>`<div class="score-row rank-${i+1}" style="--team-color:${t.color}"><div class="score-rank"><span>${i+1}º</span></div><div class="score-team"><span class="score-color" style="background:${t.color}"></span><strong>${escapeHtml(t.name)}</strong></div><div class="total-score"><span>TOTAL</span><strong>${t.total}</strong></div>${gain?`<div class="round-gain">+${t.rounds[r]} nesta rodada</div>`:''}</div>`).join('');
}
function proceedAfterRound(){
  if(!state.game||state.phase!=='round-summary')return;
  if(state.game.round>=state.setup.rounds){showFinal();return}
  state.game.round++;
  state.game.teamIndex=0;
  showTurnScreen();
}
function showFinal(){
  if(!state.game)return;
  clearGameTimer();
  clearTransition();
  playSound('gameover');
  const m=Math.max(...state.game.teams.map(t=>t.total)),w=state.game.teams.filter(t=>t.total===m);
  const finalScreen=$('#final-screen');
  const titleEl=$('#winner-title');
  const copyEl=$('#winner-copy');
  titleEl.innerHTML='';
  if(w.length===1){
    finalScreen.style.setProperty('--winner-color',w[0].color);
    finalScreen.style.setProperty('--winner-color-soft',w[0].color+'cc');
    const kicker=document.createElement('span');kicker.className='winner-line kicker';kicker.textContent='Time';
    const team=document.createElement('span');team.className='winner-line team-name';team.textContent=w[0].name;
    const end=document.createElement('span');end.className='winner-line end';end.textContent='venceu!';
    titleEl.append(kicker,team,end);
    copyEl.textContent=`${m} ${m===1?'ponto':'pontos'} no total.`;
  }else{
    finalScreen.style.setProperty('--winner-color','#ffd54a');
    finalScreen.style.setProperty('--winner-color-soft','#ffd54acc');
    const l1=document.createElement('span');l1.className='winner-line kicker';l1.textContent='Deu';
    const l2=document.createElement('span');l2.className='winner-line team-name';l2.textContent='empate!';
    titleEl.append(l1,l2);
    copyEl.textContent=`${w.map(x=>x.name).join(', ').replace(/, ([^,]*)$/,' e $1')} terminaram com ${m} pontos.`;
  }
  $('#final-scoreboard').innerHTML=buildScoreboard(state.game.round-1,false);showScreen('final-screen','final');
}
function resetToSetup(){closeNoSkipConfirm(false);clearGameTimer();clearTransition();state.game=null;state.setup.activeTab='game';renderSetupValues();showScreen('setup-screen','setup')}
function goHome(){closeNoSkipConfirm(false);clearGameTimer();clearTransition();state.game=null;showScreen('home-screen','home')}
function openSetup(){closeNoSkipConfirm(false);clearGameTimer();clearTransition();state.game=null;state.setup.activeTab='game';renderSetupValues();showScreen('setup-screen','setup')}

/* App settings */
function saveAppSettings(){localStorage.setItem(APP_SETTINGS_KEY,JSON.stringify(state.settings));state.audio.enabled=state.settings.sound;document.body.classList.toggle('reduced-motion',state.settings.reducedMotion)}
function renderAppSettings(){state.audio.enabled=state.settings.sound;$('#setting-sound').checked=state.settings.sound;$('#setting-volume').value=state.settings.volume;$('#setting-volume-label').textContent=`${state.settings.volume}%`;$('#setting-countdown').checked=state.settings.countdown;$('#setting-vibration').checked=state.settings.vibration;$('#setting-reduced-motion').checked=state.settings.reducedMotion;document.body.classList.toggle('reduced-motion',state.settings.reducedMotion)}
function openAppSettings(){renderAppSettings();showScreen('settings-screen','settings')}
function resetSetupDefaults(){state.setup=freshSetup();renderSetupValues()}
let toastTimer;function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1800)}

/* Event wiring */
$('#home-play').addEventListener('click',openSetup);const homeSettingsButton=$('#home-settings');if(homeSettingsButton)homeSettingsButton.addEventListener('click',openAppSettings);$('#home-settings-icon').addEventListener('click',openAppSettings);$('#settings-back').addEventListener('click',goHome);$('#setup-home').addEventListener('click',()=>{if(state.setup.activeTab==='categories')setSetupTab('game');else goHome()});
$('#setting-sound').addEventListener('change',e=>{state.settings.sound=e.target.checked;saveAppSettings()});$('#setting-volume').addEventListener('input',e=>{state.settings.volume=+e.target.value;$('#setting-volume-label').textContent=`${state.settings.volume}%`;saveAppSettings()});$('#setting-countdown').addEventListener('change',e=>{state.settings.countdown=e.target.checked;saveAppSettings()});$('#setting-vibration').addEventListener('change',e=>{state.settings.vibration=e.target.checked;saveAppSettings()});$('#setting-reduced-motion').addEventListener('change',e=>{state.settings.reducedMotion=e.target.checked;saveAppSettings()});$('#test-sound').addEventListener('click',()=>{unlockAudio();playSound('correct')});
$$('[data-step]').forEach(b=>b.addEventListener('click',()=>handleStepper(b.dataset.step,+b.dataset.dir)));$$('.setup-tab').forEach(b=>b.addEventListener('click',()=>setSetupTab(b.dataset.tab)));
$('#setup-back').addEventListener('click',()=>setSetupTab(tabOrder[Math.max(0,tabOrder.indexOf(state.setup.activeTab)-1)]));
$('#setup-next').addEventListener('click',()=>{const err=validateTeamsOnly();if(err){$('#setup-error').textContent=err;$('#setup-error').classList.remove('hidden');return}setSetupTab('categories')});
$('#categories-prev').addEventListener('click',()=>changeCategoryPage(-1));$('#categories-next').addEventListener('click',()=>changeCategoryPage(1));
$('#toggle-categories').addEventListener('click',()=>{state.setup.categories=state.setup.categories.length===GAME_CATEGORIES.length?[]:GAME_CATEGORIES.map(c=>c.id);renderCategories()});
$('#reset-setup').addEventListener('click',resetSetupDefaults);$('#start-game').addEventListener('click',startGame);$('#begin-turn').addEventListener('click',beginTurn);$('#correct-word').addEventListener('click',handleCorrect);$('#skip-word').addEventListener('click',handleSkip);$('#no-skip-cancel').addEventListener('click',()=>closeNoSkipConfirm(true));$('#no-skip-confirm').addEventListener('click',confirmEndTurnNoSkip);$('#turn-result-next').addEventListener('click',advanceAfterTurn);$('#next-round').addEventListener('click',proceedAfterRound);$('#play-again').addEventListener('click',startGame);$('#new-game').addEventListener('click',resetToSetup);$$('[data-action="quit"]').forEach(b=>b.addEventListener('click',goHome));
$('#team-name-input-modal').addEventListener('input',renderTeamPreview);$('#team-modal-save').addEventListener('click',saveTeamModal);$('#team-modal-cancel').addEventListener('click',closeTeamModal);$('#team-modal-close').addEventListener('click',closeTeamModal);$$('[data-team-modal-close]').forEach(x=>x.addEventListener('click',closeTeamModal));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.setup.teamModalOpen)closeTeamModal();if(e.key==='Enter'&&state.setup.teamModalOpen&&document.activeElement?.id==='team-name-input-modal')saveTeamModal()});window.addEventListener('resize',()=>{if(state.setup.activeTab==='categories')renderCategories()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.phase==='playing'&&state.game?.timerDeadline){const remaining=Math.max(0,Math.ceil((state.game.timerDeadline-performance.now())/1000));state.game.timeLeft=remaining;updateTimerUI();if(remaining<=0)handleTimeExpired()}});

renderAppSettings();renderSetupValues();showScreen('home-screen','home');
