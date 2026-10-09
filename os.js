import {createDisconnectedSource} from './data-model/adapter.js';
import {renderReviewModule} from './review.js?v=review-2026-10-03';

const base=new URL(document.body.dataset.root,location.href);
const moduleKey=document.body.dataset.module;
const app=document.querySelector('#app');
const h=(tag,attrs={},...children)=>{
  const e=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(v===null||v===undefined||v===false) continue;
    if(k==='class') e.className=v;
    else e.setAttribute(k,v);
  }
  for(const c of children.flat(Infinity)){
    if(c===null||c===undefined) continue;
    e.append(c instanceof Node?c:document.createTextNode(String(c)));
  }
  return e;
};
const link=(text,path,attrs={})=>h('a',{href:new URL(path,base).href,...attrs},text);
const pill=(text,type='pending')=>h('span',{class:'pill '+type},text);
const card=(title,desc,...body)=>h('section',{class:'card'},
  h('div',{class:'card-head'},h('div',{},h('h2',{},title),desc?h('p',{class:'muted small'},desc):null)),
  ...body
);
const note=(title,text,kind='')=>h('div',{class:'notice '+kind},h('strong',{},title),h('p',{class:'small'},text));
const ul=(items)=>h('ul',{class:'bullet-list'},items.map(x=>h('li',{},x)));
const table=(headers,rows)=>h('div',{class:'table-wrap'},h('table',{},
  h('thead',{},h('tr',{},headers.map(x=>h('th',{scope:'col'},x)))),
  h('tbody',{},rows)
));
const cells=(xs)=>h('tr',{},xs.map(x=>h('td',{},x)));
const getJson=async path=>{
  const response=await fetch(new URL(path,base),{cache:'no-store'});
  if(!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
  return response.json();
};
const protoCell=(value)=>h('span',{class:'prototype-value'},value);
const statusCell=(value)=>[protoCell(value),h('small',{class:'prototype-label'},'FICTIONAL SAMPLE')];

try{
  const [cfg,dict,events,prototype,seed,research]=await Promise.all([
    getJson('data-model/console.json'),
    getJson('data-model/dictionary.json'),
    getJson('data-model/events.json'),
    getJson('data-model/shareholder-prototype.json'),
    getJson('data-model/review-seed.json'),
    getJson('data-model/research-model.json')
  ]);
  const current=cfg.modules.find(x=>x.key===moduleKey);
  if(!current) throw new Error('Unknown workspace module');

  // Real operational source stays deliberately disconnected. Prototype data is a separate public planning layer.
  const source=createDisconnectedSource();
  await source.readModule(moduleKey);

  const displayVersion='review-2026-10-03';

  const sidebar=h('aside',{class:'sidebar',id:'navigation'},link(h('span',{class:'brand-mark'},'PP'),'',{class:'brand'}));
  sidebar.firstChild.append(h('span',{},h('strong',{},'Paila Studio OS'),h('small',{},'SHAREHOLDER REVIEW')));
  const nav=h('nav',{'aria-label':'Workspace'},link([h('span',{class:'nav-dot'}),'Paila Workspace · all links'],'workspace/',{class:'nav-link'}),link([h('span',{class:'nav-dot'}),'Start here / How to use'],'guide/',{class:'nav-link'}),h('p',{class:'nav-label'},'Daily workspace'));
  for(const m of cfg.modules){
    if(m.key==='sales') nav.append(h('p',{class:'nav-label'},'Growth & client journey'));
    if(m.key==='classes') nav.append(h('p',{class:'nav-label'},'Service & membership'));
    if(m.key==='staff') nav.append(h('p',{class:'nav-label'},'People & operations'));
    if(m.key==='management') nav.append(h('p',{class:'nav-label'},'Management & improvement'));
    if(m.key==='sops') nav.append(h('p',{class:'nav-label'},'Procedures & systems'));
    if(m.key==='system'){
      nav.append(link([h('span',{class:'nav-dot'}),'Studio Layout'],'studio/',{class:'nav-link'}));
      nav.append(link([h('span',{class:'nav-dot'}),'Benchmark model'],'benchmark/',{class:'nav-link'}));
    }
    nav.append(link([h('span',{class:'nav-dot'}),m.title],m.path,{class:'nav-link'+(m.key===moduleKey?' active':''),...(m.key===moduleKey?{'aria-current':'page'}:{})}));
  }
  sidebar.append(nav,h('div',{class:'sidebar-footer'},h('strong',{},displayVersion),h('p',{},'Pre-release review · approved release v0.6.0')));

  const toggle=h('button',{class:'nav-toggle','aria-controls':'navigation','aria-expanded':'false'},'Menu');
  toggle.addEventListener('click',()=>{
    const open=sidebar.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
  });

  const topbar=h('header',{class:'topbar'},
    toggle,
    h('span',{class:'topbar-context'},'Paila Pilates / ',h('strong',{},current.title)),
    h('div',{class:'topbar-links'},
      pill('FICTIONAL / PROTOTYPE / NOT APPROVED','prototype'),
      link('Workspace','workspace/'),
      link('How to use','guide/'),
      link('Benchmark','benchmark/'),
      link('Handbook','sop/'),
      h('a',{href:'https://pailapilates09-sys.github.io/Customer/',target:'_blank',rel:'noopener noreferrer'},'Customer Portal')
    )
  );

  const main=h('main',{id:'main'},
    h('div',{class:'page-head'},
      h('div',{},h('div',{class:'eyebrow'},'Owner / shareholder review'),h('h1',{},current.title),h('p',{class:'lede'},current.description)),
      pill('PRE-RELEASE / REVIEW','prototype')
    )
  );

  main.append(note(
    'PRE-RELEASE / SHAREHOLDER REVIEW',
    seed.disclaimer,
    'prototype-notice'
  ));

  if(moduleKey==='today') main.append(card('New here? Start with one useful loop','A short guide explains what to click first, then offers deeper walkthroughs.',h('div',{class:'module-links'},link('1-page quick start','guide/'),link('3-page walkthrough','guide/3-pages/'),link('7-page daily / weekly guide','guide/7-pages/'),link('15-page reference','guide/15-pages/'))));

  const benchmarkStrip=()=>h('div',{class:'benchmark-strip'},
    h('div',{},h('span',{class:'eyebrow'},'Selected operating model'),h('strong',{},prototype.selection.primary_operating_system+' backbone')),
    h('div',{},h('span',{class:'eyebrow'},'Kathmandu adaptation'),h('strong',{},prototype.selection.local_market_base)),
    h('div',{},h('span',{class:'eyebrow'},'Decision state'),h('strong',{},'Concrete draft for shareholder review'))
  );

  const entityLinks=names=>h('div',{class:'module-links'},names.map(n=>link(n,'data-model/?entity='+encodeURIComponent(n))));
  const sourceList=(subset=cfg.sources)=>h('ul',{class:'list'},subset.map(s=>h('li',{},
    h('div',{class:'list-title'},h('strong',{},s.name),pill(s.status,s.status.includes('available')?'':'neutral')),
    h('p',{class:'small muted'},s.need)
  )));

  const workflow=(key)=>{
    const steps=cfg.workflows[key];
    const list=h('div',{class:'stages',role:'tablist','aria-label':'Workflow stages','aria-orientation':'vertical'});
    const detail=h('div',{class:'stage-detail',role:'tabpanel',id:'stage-panel',tabindex:'0'});
    const buttons=[];
    const set=i=>{
      buttons.forEach((b,j)=>{
        b.classList.toggle('selected',j===i);
        b.setAttribute('aria-selected',String(j===i));
        b.tabIndex=j===i?0:-1;
      });
      const [name,why,event]=steps[i];
      detail.setAttribute('aria-labelledby','stage-'+i);
      detail.replaceChildren(
        h('div',{class:'eyebrow'},'Proposed stage '+(i+1)),
        h('h3',{},name),
        h('p',{},why),
        h('div',{class:'event-label'},h('span',{class:'muted small'},'Future event contract'),h('div',{class:'code'},event)),
        pill('PROTOTYPE — REVIEW','prototype'),
        h('p',{class:'definition-note'},'The workflow is concrete enough to review, but no real customer transition or notification is being executed from this public site.')
      );
    };
    steps.forEach(([name],i)=>{
      const b=h('button',{role:'tab',id:'stage-'+i,'aria-controls':'stage-panel'},
        h('span',{class:'stage-number'},String(i+1).padStart(2,'0')),name
      );
      b.addEventListener('click',()=>set(i));
      b.addEventListener('keydown',e=>{
        if(['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(e.key)){
          e.preventDefault();
          const j=e.key==='Home'?0:e.key==='End'?steps.length-1:(i+(['ArrowDown','ArrowRight'].includes(e.key)?1:-1)+steps.length)%steps.length;
          set(j);buttons[j].focus();
        }
      });
      buttons.push(b);list.append(b);
    });
    set(0);
    return h('div',{class:'workflow'},list,detail);
  };

  const prototypeRows=(key,headers)=>{
    const rows=prototype.views[key]||[];
    return table(headers,rows.map(row=>cells(row.map(v=>statusCell(v)))));
  };

  const policyTable=()=>table(
    ['Draft policy','Prototype value','Benchmark rationale','State'],
    prototype.draft_policies.map(r=>cells([r[0],protoCell(r[1]),r[2],pill(r[3],'prototype')]))
  );

  if(renderReviewModule({moduleKey,main,h,link,pill,card,note,ul,table,cells,seed,research,cfg})){
    // Working review modules share one fictional event projection.
  }else if(moduleKey==='today'){
    main.append(benchmarkStrip());

    const metrics=h('div',{class:'grid four section'},prototype.today.metrics.map(m=>h('section',{class:'card prototype-card'},
      h('div',{class:'metric-label'},m.label),
      h('div',{class:'metric-state'},m.value),
      h('div',{class:'metric-note'},m.note),
      pill('FICTIONAL SAMPLE','prototype')
    )));
    main.append(metrics);

    const attention=h('ul',{class:'list'},prototype.today.attention.map(a=>h('li',{},
      h('div',{class:'list-title'},h('strong',{},a.title),pill('PROPOSED ACTION','prototype')),
      h('p',{class:'small muted'},a.detail)
    )));

    main.append(h('div',{class:'grid two section'},
      card('What needs attention','Fictional examples show how the owner workspace would surface exceptions.',attention),
      card('What happened today','Sample event feed — anonymous and entirely fictional.',
        table(['Time','Event','Evidence / source'],prototype.today.events.map(r=>cells([r[0],protoCell(r[1]),statusCell(r[2])])))
      )
    ));

    main.append(h('div',{class:'grid two section'},
      card('Draft operating model','The prototype deliberately combines the strongest documented patterns rather than copying one studio wholesale.',
        h('p',{},h('strong',{},'Primary backbone: '),prototype.selection.primary_operating_system),
        h('p',{},h('strong',{},'Local market base: '),prototype.selection.local_market_base),
        h('p',{class:'small muted'},prototype.selection.reason),
        link('See the six-source benchmark model','benchmark/',{class:'button'})
      ),
      card('Prototype policy pack','These values exist so shareholders can say “keep / change / reject.”',
        ul(prototype.draft_policies.slice(0,5).map(x=>x[0]+': '+x[1])),
        link('Review memberships & passes','memberships/',{class:'button'})
      )
    ));

    main.append(h('div',{class:'section'},card('Real source readiness','The demonstrator is populated, but the real system remains disconnected. Prototype data never substitutes for provider-authoritative records.',sourceList(),link('View integration requirements','system/',{class:'button'}))));

  }else if(cfg.views[moduleKey]){
    const view=cfg.views[moduleKey];
    main.append(benchmarkStrip());
    main.append(card('Prototype operating view','Concrete fictional rows replace blank placeholders for shareholder evaluation. Every value below is sample data.',prototypeRows(moduleKey,view.columns)));
    main.append(h('div',{class:'section'},card(moduleKey==='customers'?'Proposed customer lifecycle':'Proposed operating workflow','Select a stage to inspect the working draft.',workflow(moduleKey))));
    main.append(h('div',{class:'grid two section'},
      card('Exceptions this model should catch','These are framework conditions to test against the fictional rows.',ul(view.exceptions)),
      card('Shareholder decisions still required','The prototype proposes a baseline; shareholders can approve or change these authority decisions.',ul(view.decisions))
    ));

    if(moduleKey==='classes'){
      main.append(h('div',{class:'section'},card('Draft scheduling rules','Kathmandu-fit proposal based on small-class local practice plus standardized international operations.',policyTable())));
    }
    if(moduleKey==='memberships'){
      main.append(h('div',{class:'section'},card('Illustrative Paila plan ladder','Discussion pricing only. Class-frequency structure follows benchmark patterns; NPR values are fictional and must be approved.',
        table(['Prototype plan','Illustrative price','Term','Purpose','State'],prototype.packages.map(p=>cells([p.name,protoCell(p.price),p.term,p.purpose,pill(p.status,'prototype')])))
      )));
    }
    if(moduleKey==='staff'){
      main.append(h('div',{class:'section'},card('Instructor readiness proposal','KX-style supervised development translated into a Paila discussion draft.',
        ul([
          'Verify the teaching credential before independent scheduling.',
          'Use supervised teaching before solo classes; prototype allows up to 20 shadow hours where needed.',
          'Track availability, substitution and continuing-development due dates.',
          'Keep performance decisions human-reviewed; do not create public instructor rankings.'
        ])
      )));
    }
    if(moduleKey==='operations'){
      main.append(h('div',{class:'grid two section'},
        card('Draft operating controls','Concrete values for shareholder review.',policyTable()),
        card('Studio Layout','The approved 2D/3D spatial preview is preserved and can orient zones, but safety decisions remain separate human-controlled records.',
          link('Open 2D / 3D Studio Layout','studio/',{class:'button'})
        )
      ));
    }
    if(moduleKey==='retention'){
      main.append(h('div',{class:'section'},card('Retention model','Strong & Lean community/program continuity plus Club Pilates participation discipline and Reform Body local community cues.',
        ul(['Recognise milestones from completed visits, not bookings.','Review inactivity with context before outreach.','Require communication consent.','Assign a human owner for complaints and service recovery.'])
      )));
    }
    main.append(h('div',{class:'section'},card('Supporting data contracts','These definitions remain the future private-system contract; the fictional prototype does not become source authority.',entityLinks(view.entities))));

  }else if(moduleKey==='reports'){
    const periods=Object.keys(cfg.reports);
    const tabs=h('div',{class:'tabs',role:'tablist','aria-label':'Review cadence'});
    const panel=h('section',{role:'tabpanel',id:'report-panel',tabindex:'0'});
    const bs=[];
    const set=async period=>{
      await source.readReport(period);
      bs.forEach(b=>{b.setAttribute('aria-selected',String(b.textContent===period));b.tabIndex=b.textContent===period?0:-1;});
      const sample=prototype.reports[period]||{};
      panel.setAttribute('aria-labelledby','period-'+period);
      panel.replaceChildren(
        card(period+' management review','Framework definitions plus fictional shareholder-review values.',
          table(['Review item','Definition / denominator','Prototype value','Real source state'],cfg.reports[period].map(r=>cells([
            r.metric,r.definition,statusCell(sample[r.metric]||'Prototype value to be defined'),pill('REAL SOURCE NOT CONNECTED','neutral')
          ])))
        ),
        h('div',{class:'grid two section'},
          card('How shareholders can use this','The values are deliberately concrete so the owner can test whether the report is useful.',ul(['Keep, change or remove metrics.','Approve definitions and denominators.','Assign accountable review owners.','Replace prototype values with real provider data only after integration.'])),
          card('Decision log example','Fictional management actions.',
            table(['Decision','Owner','Due','State'],[
              cells(['Review 18:15 capacity pressure','Studio manager','Friday',pill('PROTOTYPE','prototype')]),
              cells(['Approve 8-class plan baseline','Shareholders','Next review',pill('DECISION NEEDED','pending')]),
              cells(['Confirm waitlist cutoff','Owner','Next review',pill('DECISION NEEDED','pending')])
            ])
          )
        )
      );
    };
    periods.forEach((p,i)=>{
      const b=h('button',{role:'tab',id:'period-'+p,'aria-controls':'report-panel'},p);
      b.addEventListener('click',()=>set(p));
      b.addEventListener('keydown',e=>{
        if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
          e.preventDefault();
          const j=(i+(e.key==='ArrowRight'?1:-1)+periods.length)%periods.length;
          set(periods[j]);bs[j].focus();
        }
      });
      bs.push(b);tabs.append(b);
    });
    main.append(benchmarkStrip(),tabs,panel);
    await set(periods.includes(new URLSearchParams(location.search).get('period'))?new URLSearchParams(location.search).get('period'):'Daily');
    main.append(h('div',{class:'section'},card('Reporting boundary','Prototype numbers demonstrate the interface; production reports must obey these rules.',ul([
      'Use Asia/Kathmandu for studio reporting boundaries and retain explicit-offset timestamps.',
      'Deduplicate by event_id and source transaction reference; corrections append auditable events.',
      'Keep confirmed payments, refunds and recognised revenue distinct.',
      'Missing real coverage means unavailable, not zero.',
      'Private customer, staff and incident detail belongs behind role-based access.'
    ]))));

  }else if(moduleKey==='sops'){
    main.append(benchmarkStrip(),h('div',{class:'module-links'},link('Open existing SOP handbook','sop/'),link('Benchmark model','benchmark/'),link('Public catalogue','sop/catalog.json')));
    const search=h('input',{type:'search',placeholder:'Search code, title or topic',id:'sop-search'});
    const filter=h('select',{id:'sop-filter'},['All statuses','Draft','Planned'].map(x=>h('option',{value:x},x)));
    const count=h('span',{class:'small muted','aria-live':'polite'});
    const body=h('div',{});
    const render=()=>{
      const q=search.value.toLowerCase();
      const rows=cfg.sops.filter(x=>(filter.value==='All statuses'||x.status===filter.value)&&[x.code,x.title,x.category,x.reference||''].join(' ').toLowerCase().includes(q));
      count.textContent=rows.length+' register entries';
      body.replaceChildren(table(['Code / operating area','Coverage','Status','Owner / approval','Reference'],rows.length?rows.map(s=>cells([
        [h('span',{class:'code'},s.code),h('div',{},s.title)],
        s.scope,
        pill(s.status),
        [s.owner,h('small',{},'Approval not supplied')],
        s.href?link(s.reference||'Existing procedure',s.href):h('span',{class:'muted'},'Procedure not yet written')
      ])):[h('tr',{},h('td',{colspan:'5',class:'empty-cell'},'No matching entries'))]));
    };
    main.append(note('SOP register remains governed','The website prototype proposes policies, but it does not silently convert Draft/Planned SOPs into approved procedures.','prototype-notice'));
    main.append(h('div',{class:'toolbar'},h('label',{for:'sop-search'},'Find procedure',search),h('label',{for:'sop-filter'},'Status',filter),count),card('Master operating register','Use the benchmark prototype to decide what each procedure should say; approval state remains explicit.',body));
    search.addEventListener('input',render);filter.addEventListener('change',render);render();

  }else if(moduleKey==='automations'){
    const categories=['All categories','Automatable now','Automatable after data exists','Human review required','Must remain human-controlled'];
    const select=h('select',{id:'automation-filter'},categories.map(c=>h('option',{value:c},c)));
    const body=h('div',{});
    const render=()=>body.replaceChildren(table(['Candidate','Category','Trigger / dependency','Review gate','State'],cfg.automations.filter(a=>select.value==='All categories'||a.category===select.value).map(a=>cells([a.name,a.category,[h('span',{class:'code'},a.trigger),h('small',{},a.requires)],a.review,pill(a.status,'neutral')]))));
    main.append(benchmarkStrip(),note('Prototype proposes workflows; automations are still inactive','Fictional records let shareholders inspect the intended workflow, but no real messages, payments, staffing or safety actions execute from this public site.','prototype-notice'),h('div',{class:'toolbar'},h('label',{for:'automation-filter'},'Category',select)),card('Workflow candidate register','Activation still requires real data, consent, policies and review gates.',body));
    select.addEventListener('change',render);render();

  }else if(moduleKey==='system'){
    main.append(benchmarkStrip());
    main.append(h('div',{class:'grid two'},cfg.sources.map(s=>card(s.name,'',h('div',{class:'source-line'},pill(s.status,s.status.includes('available')?'':'neutral')),h('p',{class:'small'},s.need),entityLinks(s.entities)))));
    main.append(h('div',{class:'grid two section'},
      card('Real integration boundary','The prototype is intentionally populated, while production infrastructure is still not implemented.',ul(['Approved private datastore and source owners are required.','Server-side authentication and role-based authorisation must protect records and endpoints.','Secrets stay on the server.','Staff, payment, feedback and incident detail remains restricted.','Consent, retention, audit and deletion requirements apply in the private system.'])),
      card('Prototype vs production','Do not confuse the two layers.',ul(['Prototype = public fictional planning data.','Production = private provider-authoritative records.','Prototype prices/policies can be changed freely by shareholders.','Production values require approved source ownership and provider readback.']))
    ));
    main.append(h('div',{class:'section'},card('Six-source benchmark stack','Current public sources checked for this shareholder model.',
      prototype.benchmarks.map(b=>h('details',{},
        h('summary',{},b.name+' · '+b.role),
        h('p',{},h('strong',{},'Observed: '),b.observed),
        h('p',{},h('strong',{},'Applied to Paila prototype: '),b.applied),
        h('a',{href:b.url,target:'_blank',rel:'noopener noreferrer'},'Open public source')
      ))
    )));

  }else if(moduleKey==='model'){
    const picker=h('select',{id:'entity-select'},dict.entities.map(e=>h('option',{value:e.entity},e.entity)));
    const body=h('div',{});
    const render=()=>{
      const entity=dict.entities.find(x=>x.entity===picker.value);
      body.replaceChildren(card(entity.entity,entity.authority,
        link('Open JSON schema','data-model/'+entity.schema,{class:'button'}),
        h('div',{class:'section'},table(['Field','Type','Requirement','Privacy / sensitivity','Authority'],entity.fields.map(f=>cells([
          h('span',{class:'code'},f.name),f.type,f.requirement,[f.privacy,h('small',{},f.sensitive?'Sensitive reference / field':'Publish only if separately approved')],f.authority
        ]))))
      ));
    };
    main.append(note('Review seed and production contracts are separate','The synthetic review engine uses a small demonstration schema. This dictionary and its event envelope remain future private-system contracts; fictional seed rows are not production records.','prototype-notice'),h('div',{class:'toolbar'},h('label',{for:'entity-select'},'Entity',picker),link('Download review seed','data-model/review-seed.json',{class:'button'})),body);
    const initial=new URLSearchParams(location.search).get('entity');
    if(dict.entities.some(e=>e.entity===initial)) picker.value=initial;
    picker.addEventListener('change',()=>{render();const u=new URL(location.href);u.searchParams.set('entity',picker.value);history.replaceState(null,'',u);});
    render();
    main.append(h('div',{class:'section',id:'events'},card('Event contract','Shared production envelope; no real event instances are published here.',
      h('p',{class:'small muted'},'event_id · event_type · timestamp · location_id · source_system · actor_reference · schema_version · status.'),
      h('div',{class:'module-links'},link('Event envelope schema','data-model/event.schema.json'),link('Event type registry','data-model/events.json')),
      h('div',{class:'section'},table(['Event family','Required entity references','Storage'],events.types.map(e=>cells([h('span',{class:'code'},e.type),e.required_references.join(', ')||'Envelope location / actor',e.storage]))))
    )));
  }

  main.append(h('footer',{class:'footer'},
    h('span',{},'Paila Studio OS · '+displayVersion+' · approved release v0.6.0'),
    link('Version / rollback','version.json'),
    link('Benchmark model','benchmark/'),
    link('Architecture','https://github.com/pailapilates09-sys/Operator/blob/main/docs/studio-os.md'),
    h('span',{},'FICTIONAL / PROTOTYPE / NOT APPROVED · private backend disconnected')
  ));

  app.replaceChildren(h('div',{class:'shell'},sidebar,h('div',{class:'workspace'},topbar,main)));
}catch(error){
  console.error(error);
  app.replaceChildren(h('main',{id:'main',class:'error'},
    h('h1',{},'Workspace unavailable'),
    h('p',{},'The management definitions or prototype dataset could not be loaded. No real operational data is shown.'),
    link('Open SOP handbook','sop/',{class:'button'}),
    link('Open Studio Layout','studio/',{class:'button'}),
    link('Open public data dictionary','data-model/dictionary.json',{class:'button'})
  ));
}
