const APP_SETTINGS_KEY='mimicou-app-settings-v1';
const SAVED_TEAMS_KEY='mimicou-saved-teams-v1';
const MATCH_HISTORY_KEY='mimicou-match-history-v1';
const SUPABASE_MIGRATION_KEY='mimicou-supabase-migrated-v1';
const SUPABASE_URL='https://cvaocseqrgjstyakncnt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_YzKP1wT4fhO-e260P7Px8A_1xc3b-Tr';
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
function loadSavedTeams(){
  try{const data=JSON.parse(localStorage.getItem(SAVED_TEAMS_KEY)||'[]');return Array.isArray(data)?data:[]}
  catch{return []}
}
function safeStorageSet(key,value){try{localStorage.setItem(key,value);return true}catch(err){console.warn('Mimicou: armazenamento local indisponível.',err);return false}}
function saveSavedTeams(){safeStorageSet(SAVED_TEAMS_KEY,JSON.stringify(state.savedTeams))}
function loadMatchHistory(){
  try{const data=JSON.parse(localStorage.getItem(MATCH_HISTORY_KEY)||'[]');return Array.isArray(data)?data:[]}
  catch{return []}
}
function saveMatchHistory(){safeStorageSet(MATCH_HISTORY_KEY,JSON.stringify(state.matchHistory))}
function makeTeamId(){return `team-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
function freshSetup(){return {teams:1,rounds:3,skips:2,seconds:30,teamData:DEFAULT_TEAMS.map(x=>({...x,savedId:null,isSaved:false})),categories:GAME_CATEGORIES.map(c=>c.id),activeTab:'game',categoryPage:0,editingTeam:null,teamModalOpen:false,teamModalMode:'guest',teamPickerOpen:false}}
const state={settings:loadAppSettings(),savedTeams:loadSavedTeams(),matchHistory:loadMatchHistory(),setup:freshSetup(),game:null,timer:null,transitionTimer:null,audio:{context:null,enabled:true,bank:{}},phase:'home',noSkipConfirm:null,rankingTab:'history',rankingEditingTeamId:null,rankingTeamDraft:null,pendingDeleteTeamId:null,remoteReady:false,remoteSyncing:false};
state.audio.enabled=state.settings.sound;

function isUuid(value){return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)}
async function sbRequest(path,{method='GET',body=null,prefer=null}={}){
  const headers={apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${SUPABASE_PUBLISHABLE_KEY}`};
  if(body!==null)headers['Content-Type']='application/json';
  if(prefer)headers.Prefer=prefer;
  const response=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{method,headers,body:body===null?undefined:JSON.stringify(body)});
  if(!response.ok){const detail=await response.text().catch(()=>response.statusText);throw new Error(`Supabase ${response.status}: ${detail}`)}
  if(response.status===204)return null;
  const text=await response.text();return text?JSON.parse(text):null;
}
async function fetchAllRemoteWords(){
  const all=[];let offset=0;const pageSize=1000;
  while(true){
    const rows=await sbRequest(`words?select=category_id,word&order=id.asc&offset=${offset}&limit=${pageSize}`);
    if(!Array.isArray(rows)||!rows.length)break;
    all.push(...rows);if(rows.length<pageSize)break;offset+=pageSize;
  }
  return all;
}
async function loadRemoteCategories(){
  const [categories,words]=await Promise.all([
    sbRequest('categories?select=id,name,emoji,sort_order&order=sort_order.asc'),
    fetchAllRemoteWords()
  ]);
  if(!Array.isArray(categories)||!categories.length||!Array.isArray(words)||!words.length)return false;
  const grouped=new Map(categories.map(c=>[c.id,{id:c.id,name:c.name,emoji:c.emoji||'',words:[]} ]));
  words.forEach(w=>{const c=grouped.get(w.category_id);if(c)c.words.push(w.word)});
  const remoteCategories=categories.map(c=>grouped.get(c.id)).filter(c=>c&&c.words.length);
  if(!remoteCategories.length)return false;
  GAME_CATEGORIES=remoteCategories;
  state.setup.categories=GAME_CATEGORIES.map(c=>c.id);
  if(state.phase==='setup'){renderCategories();updateCategoryMeta()}
  return true;
}
function remoteMatchToLocal(m){
  const teams=(m.match_teams||[]).map(t=>({name:t.team_name,color:t.team_color||'#198cff',points:Number(t.score)||0,savedId:t.team_id||null,isSaved:!!t.team_id&&!t.is_guest}));
  const max=teams.length?Math.max(...teams.map(t=>t.points)):Number(m.winner_score)||0;
  const winners=teams.filter(t=>t.points===max).map(t=>({name:t.name,color:t.color,points:t.points,savedId:t.savedId||null}));
  return {id:m.id,playedAt:m.played_at,winnerIds:winners.map(w=>w.savedId).filter(Boolean),winners,teams,rounds:null};
}
async function fetchRemoteTeamsAndHistory(){
  const [teams,matches]=await Promise.all([
    sbRequest('team_ranking?select=id,name,color,wins&order=wins.desc,name.asc'),
    sbRequest('matches?select=id,played_at,is_tie,winner_team_id,winner_name,winner_score,match_teams(team_id,team_name,team_color,score,is_guest)&order=played_at.desc&limit=100')
  ]);
  return {
    teams:(teams||[]).map(t=>({id:t.id,name:t.name,color:t.color,wins:Number(t.wins)||0,createdAt:null})),
    history:(matches||[]).map(remoteMatchToLocal)
  };
}
async function createRemoteTeam(name,color){
  const rows=await sbRequest('teams?select=id,name,color,created_at',{method:'POST',body:{name,color},prefer:'return=representation'});
  return Array.isArray(rows)?rows[0]:rows;
}
async function updateRemoteTeam(id,name,color){return sbRequest(`teams?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:{name,color},prefer:'return=minimal'})}
async function deleteRemoteTeam(id){return sbRequest(`teams?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',prefer:'return=minimal'})}
async function persistRemoteMatch(record){
  const tied=record.winners.length!==1;
  const winner=record.winners[0]||null;
  const winnerId=!tied&&winner&&isUuid(winner.savedId)?winner.savedId:null;
  const rows=await sbRequest('matches?select=id',{method:'POST',body:{played_at:record.playedAt,is_tie:tied,winner_team_id:winnerId,winner_name:tied?record.winners.map(w=>w.name).join(' / '):(winner?.name||null),winner_score:winner?.points??null},prefer:'return=representation'});
  const match=Array.isArray(rows)?rows[0]:rows;if(!match?.id)return;
  const participants=record.teams.map(t=>({match_id:match.id,team_id:isUuid(t.savedId)?t.savedId:null,team_name:t.name,team_color:t.color,score:t.points,is_guest:!isUuid(t.savedId)}));
  await sbRequest('match_teams',{method:'POST',body:participants,prefer:'return=minimal'});
}
async function migrateLocalDataIfNeeded(remote){
  if(localStorage.getItem(SUPABASE_MIGRATION_KEY)==='1')return false;
  if(remote.teams.length||remote.history.length){safeStorageSet(SUPABASE_MIGRATION_KEY,'1');return false}
  const localTeams=loadSavedTeams();const localHistory=loadMatchHistory();
  if(!localTeams.length&&!localHistory.length){safeStorageSet(SUPABASE_MIGRATION_KEY,'1');return false}
  const idMap=new Map();
  for(const team of localTeams){
    try{const created=await createRemoteTeam(team.name,team.color);if(created?.id)idMap.set(team.id,created.id)}catch(err){console.warn('Mimicou: não foi possível migrar um time salvo.',err)}
  }
  for(const match of [...localHistory].reverse()){
    try{
      const migrated={...match,winners:(match.winners||[]).map(w=>({...w,savedId:idMap.get(w.savedId)||null})),teams:(match.teams||[]).map(t=>({...t,savedId:idMap.get(t.savedId)||null,isSaved:!!idMap.get(t.savedId)}))};
      await persistRemoteMatch(migrated);
    }catch(err){console.warn('Mimicou: não foi possível migrar uma partida.',err)}
  }
  safeStorageSet(SUPABASE_MIGRATION_KEY,'1');return true;
}
async function syncTeamsAndHistory({allowMigration=false,render=true}={}){
  if(state.remoteSyncing)return false;state.remoteSyncing=true;
  try{
    let remote=await fetchRemoteTeamsAndHistory();
    if(allowMigration&&await migrateLocalDataIfNeeded(remote))remote=await fetchRemoteTeamsAndHistory();
    state.savedTeams=remote.teams;state.matchHistory=remote.history;
    saveSavedTeams();saveMatchHistory();state.remoteReady=true;
    if(render){if(state.phase==='ranking')renderRanking();if(state.phase==='setup')renderSetupValues()}
    return true;
  }catch(err){console.warn('Mimicou: Supabase indisponível; usando dados locais.',err);return false}
  finally{state.remoteSyncing=false}
}
async function initializeRemoteData(){
  try{await loadRemoteCategories()}catch(err){console.warn('Mimicou: usando words.js como fallback.',err)}
  await syncTeamsAndHistory({allowMigration:true,render:true});
}


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
  if(typeof Audio==='undefined')return;
  Object.entries(SOUND_FILES).forEach(([key,file])=>{
    try{const a=new Audio(`assets/audio/${file}`);a.preload='auto';state.audio.bank[key]=a}catch(err){console.warn(`Mimicou: não foi possível carregar o áudio ${file}.`,err)}
  });
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
  editor.innerHTML=visibleTeams.map((t,i)=>`<div class="team-edit-row game-team-card setup-team-row ${state.setup.editingTeam===i&&state.setup.teamModalOpen?'is-editing':''}" style="--team-color:${t.color}"><div class="team-card-main"><div class="team-row-info"><span class="team-main-orb" style="background:${t.color}"></span><span class="team-name-label">${escapeHtml(t.name)}</span>${t.isSaved?'<span class="saved-team-badge">SALVO</span>':''}</div><div class="team-row-actions"><button type="button" class="team-edit-button" data-team-edit="${i}" aria-label="Editar nome e cor do time ${i+1}" title="Editar nome e cor"><span>✎</span></button><button type="button" class="team-remove-button" data-team-remove="${i}" aria-label="Remover ${escapeHtml(t.name)} da partida" title="Remover da partida" ${state.setup.teams<=1?'disabled':''}><span>×</span></button></div></div></div>`).join('')+`<button id="add-team-button" class="add-team-button" type="button" ${state.setup.teams>=6?'disabled':''}><span class="add-team-plus">+</span><span>ADICIONAR TIME</span></button>`;
  $$('[data-team-edit]').forEach(btn=>btn.addEventListener('click',e=>openTeamModal(+e.currentTarget.dataset.teamEdit,false,state.setup.teamData[+e.currentTarget.dataset.teamEdit].isSaved?'saved':'guest')));
  $$('[data-team-remove]').forEach(btn=>btn.addEventListener('click',e=>removeTeamFromSetup(+e.currentTarget.dataset.teamRemove)));
  const addBtn=$('#add-team-button');
  if(addBtn)addBtn.addEventListener('click',openTeamPicker);
}
function addTeamSlot(team){
  if(state.setup.teams>=6)return null;
  const idx=state.setup.teams;
  state.setup.teams++;
  state.setup.teamData[idx]={...team};
  renderSetupValues();
  return idx;
}
function removeTeamFromSetup(index){
  if(state.setup.teams<=1||index<0||index>=state.setup.teams)return;
  if(state.setup.teamModalOpen&&state.setup.editingTeam===index)closeTeamModal();
  state.setup.teamData.splice(index,1);
  state.setup.teams--;
  if(state.setup.editingTeam!==null&&state.setup.editingTeam>index)state.setup.editingTeam--;
  renderSetupValues();
}
function openTeamPicker(){
  if(state.setup.teams>=6)return;
  state.setup.teamPickerOpen=true;
  renderSavedTeamChoices();
  const modal=$('#team-picker-modal');
  modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');
}
function closeTeamPicker(){
  state.setup.teamPickerOpen=false;
  const modal=$('#team-picker-modal');if(modal){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true')}
}
function renderSavedTeamChoices(){
  const list=$('#saved-team-choices');if(!list)return;
  if(!state.savedTeams.length){list.innerHTML='<div class="saved-team-empty"><strong>Nenhum time salvo ainda</strong><span>Crie um novo time para ele aparecer aqui nas próximas partidas.</span></div>';return}
  list.innerHTML=state.savedTeams.map(t=>`<button class="saved-team-choice" type="button" data-saved-team-id="${t.id}" style="--saved-team-color:${t.color}"><span class="saved-team-choice-orb" style="background:${t.color}"></span><span class="saved-team-choice-name">${escapeHtml(t.name)}</span><span class="saved-team-choice-wins">${t.wins||0} ${(t.wins||0)===1?'vitória':'vitórias'}</span><span class="saved-team-choice-add">+</span></button>`).join('');
  $$('[data-saved-team-id]').forEach(btn=>btn.addEventListener('click',()=>selectSavedTeam(btn.dataset.savedTeamId)));
}
function selectSavedTeam(id){
  const saved=state.savedTeams.find(t=>t.id===id);if(!saved)return;
  addTeamSlot({name:saved.name,color:saved.color,savedId:saved.id,isSaved:true});
  closeTeamPicker();
}
function createSavedTeamFromPicker(){
  closeTeamPicker();
  const idx=addTeamSlot({name:`Time ${state.setup.teams+1}`,color:TEAM_PALETTE[(state.setup.teams-1)%TEAM_PALETTE.length],savedId:null,isSaved:true});
  if(idx!==null)openTeamModal(idx,true,'saved');
}
function createGuestTeamFromPicker(){
  closeTeamPicker();
  const idx=addTeamSlot({name:`Time ${state.setup.teams+1}`,color:TEAM_PALETTE[(state.setup.teams-1)%TEAM_PALETTE.length],savedId:null,isSaved:false});
  if(idx!==null)openTeamModal(idx,true,'guest');
}
function openTeamModal(index,isNew=false,mode='guest'){
  state.rankingEditingTeamId=null;state.rankingTeamDraft=null;
  state.setup.editingTeam=index;
  state.setup.teamModalMode=mode;
  state.setup.teamModalOpen=true;
  const modal=$('#team-modal');
  if(!modal)return;
  modal.classList.remove('hidden');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  const team=state.setup.teamData[index];
  $('#team-modal-title').textContent=isNew?(mode==='saved'?'Criar time salvo':'Time convidado'):(mode==='saved'?'Editar time salvo':'Editar time');
  const eyebrow=$('#team-modal-eyebrow');if(eyebrow)eyebrow.textContent=mode==='saved'?'TIME SALVO':'TIME CONVIDADO';
  const saveBtn=$('#team-modal-save');if(saveBtn)saveBtn.textContent=mode==='saved'?'Salvar time':'Usar time';
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
  state.rankingEditingTeamId=null;
  state.rankingTeamDraft=null;
  const modal=$('#team-modal');
  if(modal){modal.classList.remove('show');modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');}
  renderTeamsEditor();
}
function openRankingTeamEditor(id){
  const saved=state.savedTeams.find(t=>t.id===id);if(!saved)return;
  state.rankingEditingTeamId=id;
  state.rankingTeamDraft={name:saved.name,color:saved.color};
  state.setup.editingTeam=null;
  state.setup.teamModalMode='ranking';
  state.setup.teamModalOpen=true;
  const modal=$('#team-modal');if(!modal)return;
  modal.classList.remove('hidden');modal.classList.add('show');modal.setAttribute('aria-hidden','false');
  $('#team-modal-title').textContent='Editar time salvo';
  const eyebrow=$('#team-modal-eyebrow');if(eyebrow)eyebrow.textContent='TIME SALVO';
  const saveBtn=$('#team-modal-save');if(saveBtn)saveBtn.textContent='Salvar alterações';
  const input=$('#team-name-input-modal');input.value=saved.name;
  renderTeamModalColors();renderTeamPreview();
  setTimeout(()=>{input.focus();input.select();},0);
}
function renderTeamModalColors(){
  const wrap=$('#team-modal-colors');
  const isRanking=state.setup.teamModalMode==='ranking';
  if(!wrap||(!isRanking&&state.setup.editingTeam===null))return;
  const team=isRanking?state.rankingTeamDraft:state.setup.teamData[state.setup.editingTeam];
  if(!team)return;
  wrap.innerHTML=TEAM_PALETTE.map(c=>`<button type="button" class="team-modal-swatch ${team.color===c?'selected':''}" data-modal-color="${c}" style="background:${c}" aria-label="Selecionar cor ${c}"></button>`).join('');
  $$('[data-modal-color]').forEach(btn=>btn.addEventListener('click',e=>{
    if(isRanking)state.rankingTeamDraft.color=e.currentTarget.dataset.modalColor;
    else state.setup.teamData[state.setup.editingTeam].color=e.currentTarget.dataset.modalColor;
    renderTeamModalColors();renderTeamPreview();renderTeamsEditor();
  }));
}
function renderTeamPreview(){
  const isRanking=state.setup.teamModalMode==='ranking';
  if(!isRanking&&state.setup.editingTeam===null)return;
  const team=isRanking?state.rankingTeamDraft:state.setup.teamData[state.setup.editingTeam];if(!team)return;
  const input=$('#team-name-input-modal');
  $('#team-preview-name').textContent=(input?.value.trim()||team.name||'Novo time');
  $('#team-preview-orb').style.background=team.color;
  $('#team-preview-card').style.setProperty('--team-preview-color',team.color);
}
async function saveTeamModal(){
  const isRanking=state.setup.teamModalMode==='ranking';
  if(!isRanking&&state.setup.editingTeam===null)return;
  const input=$('#team-name-input-modal');
  const clean=input.value.trim();
  if(!clean){input.focus();return}
  if(isRanking){
    const saved=state.savedTeams.find(t=>t.id===state.rankingEditingTeamId);if(!saved)return;
    const oldName=saved.name,oldColor=saved.color;
    saved.name=clean;saved.color=state.rankingTeamDraft.color;saveSavedTeams();
    state.setup.teamData.forEach(t=>{if(t.savedId===saved.id){t.name=saved.name;t.color=saved.color}});
    closeTeamModal();renderRanking();
    if(isUuid(saved.id)){
      try{await updateRemoteTeam(saved.id,saved.name,saved.color);await syncTeamsAndHistory({render:true})}
      catch(err){saved.name=oldName;saved.color=oldColor;saveSavedTeams();toast('Não foi possível salvar no banco.');renderRanking();console.warn(err)}
    }
    return;
  }
  const team=state.setup.teamData[state.setup.editingTeam];
  team.name=clean;
  if(state.setup.teamModalMode==='saved'){
    team.isSaved=true;
    let saved=team.savedId?state.savedTeams.find(t=>t.id===team.savedId):null;
    if(saved){
      saved.name=team.name;saved.color=team.color;saveSavedTeams();
      if(isUuid(saved.id)){try{await updateRemoteTeam(saved.id,saved.name,saved.color)}catch(err){console.warn(err);toast('Time salvo localmente; sincronização pendente.')}}
    }else{
      let id=makeTeamId(),createdAt=new Date().toISOString();
      try{const remote=await createRemoteTeam(team.name,team.color);if(remote?.id){id=remote.id;createdAt=remote.created_at||createdAt;state.remoteReady=true}}
      catch(err){console.warn(err);toast('Time salvo neste dispositivo; banco indisponível.');}
      saved={id,name:team.name,color:team.color,wins:0,createdAt};
      state.savedTeams.push(saved);team.savedId=saved.id;saveSavedTeams();
    }
  }
  closeTeamModal();renderSetupValues();
  if(state.remoteReady)void syncTeamsAndHistory({render:false});
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
function handleStepper(type,dir){const limits={teams:[1,6,1],rounds:[1,10,1],skips:[0,10,1],seconds:[10,90,5]},[min,max,step]=limits[type];const previous=state.setup[type];state.setup[type]=Math.max(min,Math.min(max,state.setup[type]+dir*step));if(type==='teams'&&state.setup.teams>previous){for(let i=previous;i<state.setup.teams;i++){const fallback=DEFAULT_TEAMS[i]||{name:`Time ${i+1}`,color:TEAM_PALETTE[i%TEAM_PALETTE.length]};state.setup.teamData[i]={name:fallback.name,color:fallback.color,savedId:null,isSaved:false}}}if(type==='teams'&&state.setup.editingTeam>=state.setup.teams)state.setup.editingTeam=null;renderSetupValues()}
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
  state.game={round:1,teamIndex:0,teams:state.setup.teamData.slice(0,state.setup.teams).map(t=>({name:t.name.trim(),color:t.color,savedId:t.savedId||null,isSaved:!!t.isSaved,total:0,rounds:Array(state.setup.rounds).fill(0)})),deck:buildDeck(),used:[],skipsLeft:state.setup.skips,turnPoints:0,timeLeft:state.setup.seconds,currentWord:null,actionLocked:false,timerDeadline:null,lastAnnouncedSecond:null,historySaved:false,turnWords:[]};
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
  unlockAudio();playSound('turnStart');state.game.skipsLeft=state.setup.skips;state.game.turnPoints=0;state.game.turnWords=[];state.game.actionLocked=false;prepareNextWord();updatePlayScreen();showScreen('play-screen','playing');startGameTimer();
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
  clearTransition();state.transitionTimer=setTimeout(()=>{
    if(!state.game||state.phase!=='playing')return;
    prepareNextWord();
    state.game.actionLocked=true;
    updatePlayScreen();
    startGameTimer();
    $('.word-card').classList.remove('feedback-correct','feedback-skip');
    state.transitionTimer=setTimeout(()=>{
      if(!state.game||state.phase!=='playing')return;
      state.game.actionLocked=false;
      updatePlayScreen();
      state.transitionTimer=null;
    },3000);
  },delay);
}
function handleCorrect(){
  if(!state.game||state.phase!=='playing'||state.game.actionLocked)return;
  state.game.actionLocked=true;clearGameTimer();unlockAudio();playSound('correct');vibrate(45);animateWordFeedback('correct');state.game.turnWords.push({word:state.game.currentWord.word,category:state.game.currentWord.category,status:'correct'});state.game.turnPoints++;const t=currentTeam();t.total++;t.rounds[state.game.round-1]++;updatePlayScreen();queueNextWord();
}
function handleSkip(){
  if(!state.game||state.phase!=='playing'||state.game.actionLocked)return;
  if(state.game.skipsLeft<=0){openNoSkipConfirm();return}
  state.game.actionLocked=true;clearGameTimer();unlockAudio();playSound('skip');vibrate([25,20,25]);animateWordFeedback('skip');state.game.turnWords.push({word:state.game.currentWord.word,category:state.game.currentWord.category,status:'skip'});state.game.skipsLeft--;updatePlayScreen();queueNextWord();
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
  state.noSkipConfirm=null;$('#no-skip-modal').classList.remove('show');state.game.actionLocked=true;state.game.turnWords.push({word:state.game.currentWord.word,category:state.game.currentWord.category,status:'skip'});vibrate([70,35,70]);endTurn();
}
function handleTimeExpired(){
  if(!state.game||state.phase!=='playing'||state.game.actionLocked)return;
  state.game.actionLocked=true;clearGameTimer();state.game.timeLeft=0;updateTimerUI();
  if(state.game.skipsLeft>0){playSound('skip');vibrate([35,25,35]);animateWordFeedback('skip');state.game.turnWords.push({word:state.game.currentWord.word,category:state.game.currentWord.category,status:'skip'});state.game.skipsLeft--;updatePlayScreen();toast('Tempo! Um pulo foi usado automaticamente.');queueNextWord(320)}
  else{state.game.turnWords.push({word:state.game.currentWord.word,category:state.game.currentWord.category,status:'skip'});playSound('timeup');vibrate([80,40,100]);state.transitionTimer=setTimeout(endTurn,420)}
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
  renderTurnWordsSummary();
  showScreen('turn-result-screen','turn-result');
}
function renderTurnWordsSummary(){
  const wrap=$('#turn-words-list');if(!wrap||!state.game)return;
  const words=state.game.turnWords||[];
  const correct=words.filter(x=>x.status==='correct').length,skipped=words.filter(x=>x.status==='skip').length;
  const meta=$('#turn-words-meta');if(meta)meta.textContent=`${correct} ${correct===1?'acerto':'acertos'} · ${skipped} ${skipped===1?'pulo':'pulos'}`;
  if(!words.length){wrap.innerHTML='<div class="turn-words-empty">Nenhuma palavra concluída nesta vez.</div>';return}
  wrap.innerHTML=words.map(x=>`<div class="turn-word-item ${x.status}"><span class="turn-word-status">${x.status==='correct'?'✓':'↷'}</span><div><strong>${escapeHtml(x.word)}</strong><small>${escapeHtml(x.category)}</small></div><b>${x.status==='correct'?'ACERTOU':'PULOU'}</b></div>`).join('');
  wrap.scrollTop=0;
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
function recordFinishedMatch(){
  if(!state.game||state.game.historySaved)return;
  const max=Math.max(...state.game.teams.map(t=>t.total));
  const winners=state.game.teams.filter(t=>t.total===max);
  const record={
    id:`match-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    playedAt:new Date().toISOString(),
    winnerIds:winners.map(t=>t.savedId).filter(Boolean),
    winners:winners.map(t=>({name:t.name,color:t.color,points:t.total,savedId:t.savedId||null})),
    teams:state.game.teams.map(t=>({name:t.name,color:t.color,points:t.total,savedId:t.savedId||null,isSaved:!!t.isSaved})),
    rounds:state.setup.rounds
  };
  state.matchHistory.unshift(record);state.matchHistory=state.matchHistory.slice(0,100);
  if(winners.length===1){const t=winners[0];if(t.savedId){const saved=state.savedTeams.find(x=>x.id===t.savedId);if(saved)saved.wins=(saved.wins||0)+1}}
  saveMatchHistory();saveSavedTeams();state.game.historySaved=true;
  void persistRemoteMatch(record).then(()=>syncTeamsAndHistory({render:state.phase==='ranking'})).catch(err=>{console.warn('Mimicou: partida salva apenas localmente.',err)});
}

function formatMatchDate(iso){
  try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}
  catch{return ''}
}
function openRanking(tab='history'){state.rankingTab=tab;renderRanking();showScreen('ranking-screen','ranking');void syncTeamsAndHistory({render:true})}
function setRankingTab(tab){state.rankingTab=tab;renderRanking()}
function renderRanking(){
  $$('.ranking-tab').forEach(b=>b.classList.toggle('active',b.dataset.rankingTab===state.rankingTab));
  $$('.ranking-panel').forEach(p=>p.classList.toggle('active',p.dataset.rankingPanel===state.rankingTab));
  renderHistory();renderSavedTeamsRanking();
}
function renderHistory(){
  const wrap=$('#match-history-list');if(!wrap)return;
  if(!state.matchHistory.length){wrap.innerHTML='<div class="ranking-empty"><span class="ranking-empty-icon">★</span><strong>Nenhuma partida ainda</strong><p>Quando uma partida terminar, o resultado aparecerá aqui.</p></div>';return}
  wrap.innerHTML=state.matchHistory.map((m,i)=>{
    const tied=m.winners.length>1;
    const winnerText=tied?`Empate: ${m.winners.map(w=>escapeHtml(w.name)).join(' • ')}`:`${escapeHtml(m.winners[0]?.name||'')} venceu`;
    const winnerPoints=m.winners[0]?.points??0;
    const scores=[...m.teams].sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name,'pt-BR')).map(t=>`<span class="history-score-chip"><i style="background:${t.color}"></i>${escapeHtml(t.name)} <b>${t.points}</b></span>`).join('');
    return `<article class="history-card ${i===0?'latest':''}"><div class="history-card-top"><div><span class="history-number">PARTIDA ${state.matchHistory.length-i}</span><strong>${winnerText}</strong></div><time>${formatMatchDate(m.playedAt)}</time></div><div class="history-winner-points"><span>${tied?'MAIOR PONTUAÇÃO':'PONTOS DO VENCEDOR'}</span><b>${winnerPoints}</b></div><div class="history-scores">${scores}</div></article>`
  }).join('');
}
function renderSavedTeamsRanking(){
  const wrap=$('#saved-teams-ranking');if(!wrap)return;
  const sorted=[...state.savedTeams].sort((a,b)=>(b.wins||0)-(a.wins||0)||a.name.localeCompare(b.name,'pt-BR'));
  if(!sorted.length){wrap.innerHTML='<div class="ranking-empty"><span class="ranking-empty-icon">🏆</span><strong>Nenhum time salvo</strong><p>Crie um time salvo na configuração da partida para começar o ranking.</p></div>';return}
  wrap.innerHTML=sorted.map((t,i)=>`<article class="ranking-team-row rank-${i+1}" style="--rank-team-color:${t.color}"><div class="ranking-position">${i+1}<small>º</small></div><span class="ranking-team-orb" style="background:${t.color}"></span><div class="ranking-team-name"><strong>${escapeHtml(t.name)}</strong><span>Time salvo</span></div><div class="ranking-wins"><b>${t.wins||0}</b><span>${(t.wins||0)===1?'VITÓRIA':'VITÓRIAS'}</span></div><div class="ranking-team-actions"><button type="button" data-ranking-edit="${t.id}" aria-label="Editar ${escapeHtml(t.name)}" title="Editar time">✎</button><button type="button" class="danger" data-ranking-delete="${t.id}" aria-label="Excluir ${escapeHtml(t.name)}" title="Excluir time">×</button></div></article>`).join('');
  $$('[data-ranking-edit]').forEach(btn=>btn.addEventListener('click',()=>openRankingTeamEditor(btn.dataset.rankingEdit)));
  $$('[data-ranking-delete]').forEach(btn=>btn.addEventListener('click',()=>openDeleteSavedTeam(btn.dataset.rankingDelete)));
}
function openDeleteSavedTeam(id){
  const team=state.savedTeams.find(t=>t.id===id);if(!team)return;
  state.pendingDeleteTeamId=id;
  const name=$('#delete-team-name');if(name)name.textContent=team.name;
  const modal=$('#delete-team-modal');if(modal)modal.classList.add('show');
}
function closeDeleteSavedTeam(){state.pendingDeleteTeamId=null;const modal=$('#delete-team-modal');if(modal)modal.classList.remove('show')}
async function confirmDeleteSavedTeam(){
  const id=state.pendingDeleteTeamId;if(!id)return;
  const removed=state.savedTeams.find(t=>t.id===id);
  state.savedTeams=state.savedTeams.filter(t=>t.id!==id);saveSavedTeams();
  state.setup.teamData.forEach(t=>{if(t.savedId===id){t.savedId=null;t.isSaved=false}});
  closeDeleteSavedTeam();renderRanking();renderSetupValues();
  if(isUuid(id)){
    try{await deleteRemoteTeam(id);await syncTeamsAndHistory({render:true})}
    catch(err){if(removed)state.savedTeams.push(removed);saveSavedTeams();renderRanking();toast('Não foi possível excluir no banco.');console.warn(err)}
  }
}
function showFinal(){
  if(!state.game)return;
  clearGameTimer();
  clearTransition();
  playSound('gameover');
  recordFinishedMatch();
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
function saveAppSettings(){safeStorageSet(APP_SETTINGS_KEY,JSON.stringify(state.settings));state.audio.enabled=state.settings.sound;document.body.classList.toggle('reduced-motion',state.settings.reducedMotion)}
function renderAppSettings(){state.audio.enabled=state.settings.sound;$('#setting-sound').checked=state.settings.sound;$('#setting-volume').value=state.settings.volume;$('#setting-volume-label').textContent=`${state.settings.volume}%`;$('#setting-countdown').checked=state.settings.countdown;$('#setting-vibration').checked=state.settings.vibration;$('#setting-reduced-motion').checked=state.settings.reducedMotion;document.body.classList.toggle('reduced-motion',state.settings.reducedMotion)}
function openAppSettings(){renderAppSettings();showScreen('settings-screen','settings')}
function resetSetupDefaults(){state.setup=freshSetup();renderSetupValues()}
let toastTimer;function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1800)}

/* Event wiring */
function bind(selector,event,handler){
  const el=$(selector);
  if(!el){console.warn(`Mimicou: elemento opcional não encontrado: ${selector}`);return null}
  el.addEventListener(event,handler);
  return el;
}
function bindAll(selector,event,handler){$$((selector)).forEach(el=>el.addEventListener(event,handler))}
let appInitialized=false;
function initializeApp(){
  if(appInitialized)return;
  appInitialized=true;

  // Navegação principal primeiro: mesmo que um recurso secundário falhe,
  // Jogar / Ranking / Configurações continuam disponíveis.
  bind('#home-play','click',openSetup);
  bind('#home-ranking','click',()=>openRanking('history'));
  bind('#home-settings-icon','click',openAppSettings);
  bind('#ranking-back','click',goHome);
  bindAll('.ranking-tab','click',e=>setRankingTab(e.currentTarget.dataset.rankingTab));
  bind('#delete-team-cancel','click',closeDeleteSavedTeam);
  bind('#delete-team-confirm','click',confirmDeleteSavedTeam);
  bindAll('[data-delete-team-close]','click',closeDeleteSavedTeam);

  // Configuração de times e modais.
  bind('#create-saved-team','click',createSavedTeamFromPicker);
  bind('#create-guest-team','click',createGuestTeamFromPicker);
  bind('#team-picker-close','click',closeTeamPicker);
  bindAll('[data-team-picker-close]','click',closeTeamPicker);
  const homeSettingsButton=$('#home-settings');if(homeSettingsButton)homeSettingsButton.addEventListener('click',openAppSettings);
  bind('#settings-back','click',goHome);
  bind('#setup-home','click',()=>{if(state.setup.activeTab==='categories')setSetupTab('game');else goHome()});

  // Preferências do app.
  bind('#setting-sound','change',e=>{state.settings.sound=e.target.checked;saveAppSettings()});
  bind('#setting-volume','input',e=>{state.settings.volume=+e.target.value;const label=$('#setting-volume-label');if(label)label.textContent=`${state.settings.volume}%`;saveAppSettings()});
  bind('#setting-countdown','change',e=>{state.settings.countdown=e.target.checked;saveAppSettings()});
  bind('#setting-vibration','change',e=>{state.settings.vibration=e.target.checked;saveAppSettings()});
  bind('#setting-reduced-motion','change',e=>{state.settings.reducedMotion=e.target.checked;saveAppSettings()});
  bind('#test-sound','click',()=>{unlockAudio();playSound('correct')});

  // Setup e partida.
  bindAll('[data-step]','click',e=>handleStepper(e.currentTarget.dataset.step,+e.currentTarget.dataset.dir));
  bindAll('.setup-tab','click',e=>setSetupTab(e.currentTarget.dataset.tab));
  bind('#setup-back','click',()=>setSetupTab(tabOrder[Math.max(0,tabOrder.indexOf(state.setup.activeTab)-1)]));
  bind('#setup-next','click',()=>{const err=validateTeamsOnly();if(err){const box=$('#setup-error');if(box){box.textContent=err;box.classList.remove('hidden')}return}setSetupTab('categories')});
  bind('#categories-prev','click',()=>changeCategoryPage(-1));
  bind('#categories-next','click',()=>changeCategoryPage(1));
  bind('#toggle-categories','click',()=>{state.setup.categories=state.setup.categories.length===GAME_CATEGORIES.length?[]:GAME_CATEGORIES.map(c=>c.id);renderCategories()});
  bind('#reset-setup','click',resetSetupDefaults);
  bind('#start-game','click',startGame);
  bind('#begin-turn','click',beginTurn);
  bind('#correct-word','click',handleCorrect);
  bind('#skip-word','click',handleSkip);
  bind('#no-skip-cancel','click',()=>closeNoSkipConfirm(true));
  bind('#no-skip-confirm','click',confirmEndTurnNoSkip);
  bind('#turn-result-next','click',advanceAfterTurn);
  bind('#next-round','click',proceedAfterRound);
  bind('#play-again','click',startGame);
  bind('#new-game','click',resetToSetup);
  bindAll('[data-action="quit"]','click',goHome);

  // Editor de time.
  bind('#team-name-input-modal','input',renderTeamPreview);
  bind('#team-modal-save','click',saveTeamModal);
  bind('#team-modal-cancel','click',closeTeamModal);
  bind('#team-modal-close','click',closeTeamModal);
  bindAll('[data-team-modal-close]','click',closeTeamModal);

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.setup.teamPickerOpen)closeTeamPicker();else if(e.key==='Escape'&&state.setup.teamModalOpen)closeTeamModal();if(e.key==='Enter'&&state.setup.teamModalOpen&&document.activeElement?.id==='team-name-input-modal')saveTeamModal()});
  window.addEventListener('resize',()=>{if(state.setup.activeTab==='categories')renderCategories()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.phase==='playing'&&state.game?.timerDeadline){const remaining=Math.max(0,Math.ceil((state.game.timerDeadline-performance.now())/1000));state.game.timeLeft=remaining;updateTimerUI();if(remaining<=0)handleTimeExpired()}});

  try{preloadSounds()}catch(err){console.warn('Mimicou: áudio inicial indisponível.',err)}
  try{renderAppSettings()}catch(err){console.warn('Mimicou: falha ao carregar preferências.',err)}
  try{renderSetupValues()}catch(err){console.error('Mimicou: falha ao preparar a configuração.',err)}
  showScreen('home-screen','home');
  void initializeRemoteData();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeApp,{once:true});
else initializeApp();
