/* =============================================================
   2026 AI Readiness Diagnostic — form logic, scoring, Airtable
   ============================================================= */

// The backend serverless function handles the actual Airtable submission
const SUBMIT_URL = '/api/submit';

const PHASES = {
  1: 'Relationship with AI',
  2: 'AI Today',
  3: 'AI Tomorrow',
  4: 'Contact Details',
};

/* ---------- Question definitions ---------- */
/*
  Each question:
    id, phase, text, type ('single' | 'multi' | 'text'),
    options: [{ value, score }],
    maxSelect (multi only, optional),
    airtableField,
    next(answer, state) -> next id | 'contact'
*/

const QUESTIONS = [
  {
    id: 'q1', phase: 1, text: 'Are you AI literate?', type: 'single',
    airtableField: 'Q1 - Are you AI literate?',
    options: [
      { value: 'Yes', score: 10 },
      { value: 'No', score: 0 },
    ],
    next: () => 'q2',
  },
  {
    id: 'q2', phase: 1, text: 'How often do you use AI?', type: 'single',
    airtableField: 'Q2 - How often do you use AI?',
    options: [
      { value: 'Always', score: 10 },
      { value: 'Sometimes', score: 7 },
      { value: 'Rarely', score: 3 },
      { value: 'Never', score: 0 },
    ],
    next: () => 'q3',
  },
  {
    id: 'q3', phase: 1, text: 'What do you use AI for?', type: 'multi',
    airtableField: 'Q3 - What do you use AI for?',
    hint: 'Select all that apply',
    columns: 2,
    groups: [
      {
        title: 'Productivity & personal efficiency',
        options: [
          { value: 'Writing emails and documents', score: 2 },
          { value: 'Summarizing meetings or files', score: 3 },
          { value: 'Researching information faster', score: 4 },
          { value: 'Creating presentations or content', score: 3 },
          { value: 'Generating images or designs', score: 4 },
          { value: 'Experimenting with AI personally', score: 2 },
        ],
      },
      {
        title: 'Strategic & analytical work',
        options: [
          { value: 'Brainstorming ideas and strategy', score: 5 },
          { value: 'Analyzing data and reports', score: 10 },
          { value: 'Supporting business decisions', score: 10 },
          { value: 'Improving customer support', score: 8 },
        ],
      },
      {
        title: 'Technical & AI development',
        options: [
          { value: 'Writing code or formulas', score: 10 },
          { value: 'Building AI-powered applications', score: 18 },
        ],
      },
      {
        title: 'Automation & operational transformation',
        options: [
          { value: 'Automating repetitive tasks', score: 12 },
          { value: 'Creating AI workflows or agents', score: 15 },
          { value: 'Connecting tools and systems', score: 14 },
        ],
      },
      {
        title: 'Organizational AI adoption',
        options: [
          { value: 'Using AI across my organization', score: 20 },
          { value: "I don't use AI for work yet", score: 0 },
        ],
      },
    ],
    get options() { return this.groups.flatMap(g => g.options); },
    next: () => 'q4',
  },
  {
    id: 'q4', phase: 1, text: 'What conversational AI tools do you use?', type: 'multi',
    airtableField: 'Q4 - What conversational AI do you use?',
    hint: 'Select all that apply',
    options: [
      { value: 'ChatGPT', score: 5 },
      { value: 'Microsoft Copilot', score: 5 },
      { value: 'Google Gemini', score: 5 },
      { value: 'Claude', score: 10 },
      { value: 'Perplexity AI', score: 10 },
      { value: 'Poe', score: 8 },
      { value: 'Jasper', score: 8 },
      { value: 'Custom or Internal AI Company Bot', score: 20 },
      { value: 'Other', score: 5 },
      { value: 'None', score: 0 },
    ],
    next: () => 'q5',
  },
  {
    id: 'q5', phase: 1, text: 'What is the size of your company?', type: 'single',
    airtableField: 'Q5 - Company Size',
    options: [
      { value: '1–10 employees', score: 0 },
      { value: '11–50 employees', score: 0 },
      { value: '51–250 employees', score: 0 },
      { value: '251+ employees', score: 0 },
    ],
    next: () => 'q6',
  },
  {
    id: 'q6', phase: 1, text: 'What is your current job title?', type: 'single',
    airtableField: 'Q6 - Current Job Title',
    options: [
      { value: 'CEO / Founder', score: 0 },
      { value: 'CIO / CTO / Head of IT', score: 0 },
      { value: 'CHRO / Head of HR', score: 0 },
      { value: 'CFO / Head of Finance', score: 0 },
      { value: 'COO / Head of Operations', score: 0 },
      { value: 'Director / Head of (other function)', score: 0 },
      { value: 'HR Manager / L&D', score: 0 },
      { value: 'Operational Manager', score: 0 },
      { value: 'Other', score: 0 },
    ],
    next: () => 'q7',
  },

  {
    id: 'q7', phase: 2, text: 'What are your current business challenges?', type: 'multi',
    airtableField: 'Q7 - Current Business Challenges',
    hint: 'Select all that apply',
    options: [
      { value: 'Finding and keeping the right staff', score: 0 },
      { value: 'Too much time spent on manual "copy-paste" work', score: -5 },
      { value: "We don't have clear, daily reports on our performance", score: -5 },
      { value: 'Our sales pipeline is messy and hard to track', score: -5 },
      { value: "Teams don't talk or work well together", score: 0 },
      { value: 'Rising costs are eating our profit margins', score: 0 },
      { value: 'It takes too long to get new employees started', score: 0 },
      { value: 'We are moving too slow compared to competitors', score: -3 },
      { value: 'Finding the right files or info takes too much time', score: -3 },
      { value: 'Other', score: 0 },
    ],
    next: () => 'q8',
  },
  {
    id: 'q8', phase: 2, text: 'Have you considered AI as a solution to solve these problems?', type: 'single',
    airtableField: 'Q8 - Considered AI as a Solution?',
    options: [
      { value: 'Yes', score: 10 },
      { value: 'No', score: 0 },
    ],
    next: (ans) => (ans === 'Yes' ? 'q9' : 'q10'),
  },
  {
    id: 'q9', phase: 2, text: 'How did you proceed?', type: 'single',
    airtableField: 'Q9 - How did you proceed with AI?',
    options: [
      { value: 'Hiring a consultant', score: 10 },
      { value: 'Train your teams', score: 5 },
      { value: 'Investigate the topic', score: 0 },
    ],
    next: () => 'q11',
  },
  {
    id: 'q10', phase: 2, text: "What's preventing you from doing so?", type: 'single',
    airtableField: 'Q10 - What prevents AI adoption?',
    options: [
      { value: 'Business readiness', score: -10 },
      { value: 'Budgeting in current financial year', score: -5 },
      { value: 'Lack of guidance', score: 0 },
    ],
    next: () => 'q11',
  },
  {
    id: 'q11', phase: 2, text: 'How do you track or measure your business KPIs?', type: 'single',
    airtableField: 'Q11 - How do you track business KPI?',
    options: [
      { value: 'Excel spreadsheets', score: 0 },
      { value: 'Business Intelligence via tools (ERP-based systems)', score: 5 },
      { value: 'Fully automated reports with live dashboards', score: 10 },
    ],
    next: () => 'q12',
  },
  {
    id: 'q12', phase: 2, text: 'In which industry is your organization active?', type: 'single',
    airtableField: 'Q12 - Industry',
    options: [
      { value: 'Technology & Software', score: 0 },
      { value: 'Banking & Financial Services', score: 0 },
      { value: 'Retail & E-commerce', score: 0 },
      { value: 'Manufacturing', score: 0 },
      { value: 'Healthcare & Life Sciences', score: 0 },
      { value: 'Education', score: 0 },
      { value: 'Professional Services (Consulting, Legal, etc.)', score: 0 },
      { value: 'Real Estate & Construction', score: 0 },
      { value: 'Hospitality & Tourism', score: 0 },
      { value: 'Energy & Utilities', score: 0 },
      { value: 'Other', score: 0 },
    ],
    next: () => 'q13',
  },
  {
    id: 'q13', phase: 2, text: 'What are your top 3 business priorities today?', type: 'multi',
    airtableField: 'Q13 - Top 3 Business Priorities',
    hint: 'Select up to 3',
    maxSelect: 3,
    options: [
      { value: 'Profitability & Cost Optimization', score: 0 },
      { value: 'Operational Efficiency & Automation', score: 0 },
      { value: 'Digital Transformation & AI Integration', score: 0 },
      { value: 'Talent Acquisition & Retention', score: 0 },
      { value: 'Customer Experience & Loyalty', score: 0 },
      { value: 'Market Expansion & Scaling', score: 0 },
      { value: 'Sustainability & ESG Strategy', score: 0 },
    ],
    next: () => 'q14',
  },

  {
    id: 'q14', phase: 3, text: 'What decisions are currently difficult to make in your organization?', type: 'multi',
    airtableField: 'Q14 - Difficult Decisions in Organization',
    hint: 'Select all that apply',
    options: [
      { value: 'Budgeting & Financial Forecasting', score: -2 },
      { value: 'Strategic Expansion & Market Entry', score: -2 },
      { value: 'Pricing & Competitive Strategy', score: -2 },
      { value: 'Talent Acquisition & Hiring', score: -2 },
      { value: 'Resource & Workforce Allocation', score: -2 },
    ],
    next: () => 'q15',
  },
  {
    id: 'q15', phase: 3, text: 'Do you plan to train your teams on AI usage in 2026?', type: 'single',
    airtableField: 'Q15 - Plan to train teams on AI in 2026?',
    options: [
      { value: 'Yes', score: 5 },
      { value: 'No', score: -5 },
    ],
    next: (ans) => (ans === 'Yes' ? 'q16' : 'q17'),
  },
  {
    id: 'q16', phase: 3, text: 'What training themes do you want to cover?', type: 'multi',
    airtableField: 'Q16 - AI Training Themes to Cover',
    hint: 'Select all that apply',
    options: [
      { value: 'AI Foundations: Getting the whole team comfortable with the basics.', score: 0 },
      { value: 'Prompt Engineering: Learning how to "talk" to AI to get perfect results.', score: 0 },
      { value: 'Automating Repetitive Tasks: Cutting out "copy-paste" work.', score: 0 },
      { value: 'AI for Sales & Growth: Using AI to find leads and close deals faster.', score: 0 },
      { value: 'Smart Data & Reporting: Turning messy spreadsheets into clear daily dashboards.', score: 0 },
      { value: 'AI in HR & Recruitment: Speeding up hiring and making onboarding easier.', score: 0 },
      { value: 'Financial AI & Admin: Saving time on invoices, bills, and paperwork.', score: 0 },
      { value: 'AI Safety & Policy: Ensuring your team uses AI securely and legally.', score: 0 },
      { value: 'AI for Content & Marketing: Creating high-quality posts and emails in seconds.', score: 0 },
      { value: 'Advanced Workflow Design: Building custom "AI employees" for specific departments.', score: 0 },
    ],
    next: () => 'q18',
  },
  {
    id: 'q17', phase: 3, text: 'Why not?', type: 'text',
    airtableField: 'Q17 - Why not training teams on AI?',
    placeholder: 'Share what is holding your organization back from team AI training in 2026…',
    next: () => 'q18',
  },
  {
    id: 'q18', phase: 3, text: 'What are the must-haves of a solid AI training in 2026?', type: 'multi',
    airtableField: 'Q18 - Must-Haves of a Solid AI Training in 2026',
    hint: 'Select up to 2',
    maxSelect: 2,
    options: [
      { value: 'Hands-on practice: Actually building and using tools during the session.', score: 0 },
      { value: 'Real-world examples: Seeing case studies from my specific industry.', score: 0 },
      { value: 'Data Security & Privacy: Clear rules on how to keep company secrets safe.', score: 0 },
      { value: 'ROI & Business Proof: Training that shows exactly how it saves money.', score: 0 },
      { value: 'Ready-to-use "Prompts": A library of commands my team can use immediately.', score: 0 },
      { value: 'No-code automation: Learning how to connect apps (like n8n) without IT.', score: 0 },
      { value: 'Human-AI Culture: Helping staff overcome the fear of being replaced.', score: 0 },
      { value: 'Latest 2026 tools: Access to the newest models, not old technology.', score: 0 },
      { value: 'Post-training support: A roadmap or community to help us after the session.', score: 0 },
      { value: 'Executive alignment: Ensuring the boss and the team are on the same page.', score: 0 },
    ],
    next: () => 'contact',
  },
];

const QMAP = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));

/* ---------- State ---------- */

const state = {
  currentId: 'intro',
  history: [],            // stack of previous ids (excluding current)
  answers: {},            // qId -> value or array
  contact: { firstName: '', lastName: '', email: '', phone: '' },
  totalScore: 0,
  submitting: false,
};

/* ---------- Score helpers ---------- */

function scoreForAnswer(q, answer) {
  if (!q || !q.options) return 0;
  if (q.type === 'single') {
    const opt = q.options.find(o => o.value === answer);
    return opt ? opt.score : 0;
  }
  if (q.type === 'multi' && Array.isArray(answer)) {
    return answer.reduce((s, v) => {
      const opt = q.options.find(o => o.value === v);
      return s + (opt ? opt.score : 0);
    }, 0);
  }
  return 0;
}

function setAnswer(qId, newValue) {
  const q = QMAP[qId];
  const prev = state.answers[qId];
  const prevScore = scoreForAnswer(q, prev);
  const nextScore = scoreForAnswer(q, newValue);
  state.totalScore += (nextScore - prevScore);
  state.answers[qId] = newValue;
}

function clearAnswer(qId) {
  const q = QMAP[qId];
  if (state.answers[qId] !== undefined) {
    state.totalScore -= scoreForAnswer(q, state.answers[qId]);
    delete state.answers[qId];
  }
}

/* ---------- Visible step ordering (for progress) ---------- */

function buildVisiblePath() {
  // Walk the question graph using current answers (defaulting on the dominant branch when unknown).
  const path = [];
  let id = 'q1';
  const guard = new Set();
  while (id && !guard.has(id)) {
    guard.add(id);
    path.push(id);
    const q = QMAP[id];
    if (!q) break;
    const ans = state.answers[id];
    let nextId;
    try { nextId = q.next(ans, state); } catch { nextId = null; }
    if (nextId === 'contact') { path.push('contact'); break; }
    id = nextId;
  }
  return path;
}

function progressPercent() {
  if (state.currentId === 'intro') return 0;
  if (state.currentId === 'thanks') return 100;
  const path = buildVisiblePath();
  const totalSteps = path.length; // questions + contact
  const idx = path.indexOf(state.currentId);
  if (idx < 0) return 0;
  // step "complete" once user moves past it — use idx/total for visited fraction
  return Math.min(100, Math.round(((idx + 1) / (totalSteps + 1)) * 100));
}

function setProgress() {
  const pct = progressPercent();
  const fill = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = pct + '%';
}

function buildProgressBar() {
  return el('div', { class: 'progress-inline' }, [
    el('div', { class: 'progress-track' }, [
      el('div', { class: 'progress-fill', id: 'progress-fill' }, [
        el('div', { class: 'progress-shimmer' }),
      ]),
    ]),
    el('span', { class: 'progress-label', id: 'progress-label' }, '0%'),
  ]);
}

/* ---------- Phase flash ---------- */

let lastPhase = 0;
function maybeFlashPhase(phase) {
  if (!phase || phase === lastPhase) return Promise.resolve();
  lastPhase = phase;
  const el = document.getElementById('phase-flash');
  const eyebrow = el.querySelector('.phase-flash-eyebrow');
  const title = el.querySelector('.phase-flash-title');
  eyebrow.textContent = `Phase ${phase}`;
  title.textContent = PHASES[phase] || '';
  el.classList.add('active');
  return new Promise(res => {
    setTimeout(() => {
      el.classList.remove('active');
      setTimeout(res, 380);
    }, 900);
  });
}

/* ---------- Rendering ---------- */

const app = document.getElementById('app');

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v === false || v == null) continue;
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function checkSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'check');
  svg.innerHTML = '<path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
  return svg;
}

function renderScreen(content) {
  app.innerHTML = '';
  const screen = el('div', { class: 'q-screen enter' }, content);
  app.appendChild(screen);
  setProgress();
}

async function transitionTo(nextId, opts = {}) {
  cancelAutoAdvance();
  const current = app.querySelector('.q-screen');
  if (current) {
    current.classList.remove('enter');
    current.classList.add('exit');
    await new Promise(r => setTimeout(r, 280));
  }
  // Bring the banner back into view for the next screen
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { window.scrollTo(0, 0); }

  state.currentId = nextId;

  // Phase flash if we're moving into a new phase (question screens only)
  const q = QMAP[nextId];
  if (q && opts.checkPhase !== false) {
    await maybeFlashPhase(q.phase);
  } else if (nextId === 'contact' && opts.checkPhase !== false) {
    await maybeFlashPhase(4);
  }

  if (nextId === 'intro') renderIntro();
  else if (nextId === 'contact') renderContact();
  else if (nextId === 'thanks') renderThanks();
  else renderQuestion(nextId);
}

/* ---------- Intro screen ---------- */

function renderIntro() {
  const card = el('div', { class: 'card intro-card stagger' }, [
    el('span', { class: 'intro-eyebrow' }, '2026 · Mauritius'),
    el('h1', { class: 'intro-title', html: 'The <em>AI Readiness</em> Diagnostic' }),
    el('p', { class: 'intro-sub' },
      'A short, executive-level questionnaire that maps where your organization stands on AI today — and what it would take to thrive in 2026.'),
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn-primary',
        type: 'button',
        onclick: (e) => { pulseBtn(e.currentTarget); setTimeout(() => transitionTo('q1'), 180); },
      }, ['Start the diagnostic', arrowSVG()])
    ]),
    el('div', { class: 'intro-meta' }, [
      el('span', {}, '4 phases'),
      el('span', { class: 'dot-sep' }, '·'),
      el('span', {}, '≈ 4 minutes'),
      el('span', { class: 'dot-sep' }, '·'),
      el('span', {}, 'Instant score'),
    ]),
  ]);

  renderScreen(card);
}

function arrowSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.innerHTML = '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
  return svg;
}

/* ---------- Question screen ---------- */

function renderQuestion(id) {
  const q = QMAP[id];
  if (!q) return;
  const indexInVisible = buildVisiblePath().indexOf(id);
  const number = (indexInVisible >= 0 ? indexInVisible + 1 : 1).toString().padStart(2, '0');

  const card = el('div', { class: 'card stagger' }, [
    buildProgressBar(),
    cardHeader(q.phase, state.history.length > 0),
    el('div', { class: 'q-number' }, number),
    el('h2', { class: 'q-text' }, q.text),
    q.hint ? el('p', { class: 'q-hint' }, `(${q.hint})`) : el('div', { style: 'height:8px' }),
    buildAnswerArea(q),
    buildNextRow(q),
  ]);

  renderScreen(card);
}

function backArrowSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.innerHTML = '<path d="M19 12H5M11 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
  return svg;
}

function cardHeader(phase, hasBack) {
  return el('div', { class: 'card-header' }, [
    hasBack
      ? el('button', { class: 'back-btn', type: 'button', onclick: goBack, 'aria-label': 'Back to previous question' }, [backArrowSVG(), 'Back'])
      : null,
    el('span', { class: 'phase-badge' }, `Phase ${phase} — ${PHASES[phase]}`),
  ]);
}

function buildAnswerArea(q) {
  if (q.type === 'text') {
    const ta = el('textarea', {
      class: 'textarea',
      placeholder: q.placeholder || '',
      'aria-label': q.text,
      oninput: (e) => {
        state.answers[q.id] = e.target.value;
        updateNextEnabled(q);
      },
    });
    if (state.answers[q.id]) ta.value = state.answers[q.id];
    return el('div', { class: 'textarea-wrap' }, ta);
  }

  const selected = q.type === 'multi'
    ? (Array.isArray(state.answers[q.id]) ? state.answers[q.id] : [])
    : (state.answers[q.id] || null);

  const makeOptionBtn = (opt, idx) => {
    const isSelected = q.type === 'multi'
      ? selected.includes(opt.value)
      : selected === opt.value;
    return el('button', {
      class: 'option' + (isSelected ? ' selected' : ''),
      type: 'button',
      role: q.type === 'multi' ? 'checkbox' : 'radio',
      'aria-checked': isSelected ? 'true' : 'false',
      style: `animation-delay:${idx * 60}ms`,
      onclick: () => onOptionClick(q, opt.value),
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOptionClick(q, opt.value); }
      },
    }, [
      el('span', { class: 'dot', 'aria-hidden': 'true' }),
      el('span', { class: 'label' }, opt.value),
      checkSVG(),
    ]);
  };

  const groupClass = q.columns === 2 ? ' cols-2' : '';

  if (Array.isArray(q.groups)) {
    const wrap = el('div', { class: 'option-groups', role: q.type === 'multi' ? 'group' : 'radiogroup' });
    let globalIdx = 0;
    q.groups.forEach(group => {
      wrap.appendChild(el('div', { class: 'option-group-title' }, group.title));
      const grid = el('div', { class: 'options' + groupClass });
      group.options.forEach(opt => grid.appendChild(makeOptionBtn(opt, globalIdx++)));
      wrap.appendChild(grid);
    });
    return el('div', { class: 'options-wrap' }, wrap);
  }

  const list = el('div', { class: 'options' + groupClass, role: q.type === 'multi' ? 'group' : 'radiogroup' });
  q.options.forEach((opt, idx) => list.appendChild(makeOptionBtn(opt, idx)));
  return el('div', { class: 'options-wrap' }, list);
}

let autoAdvanceTimer = null;

function cancelAutoAdvance() {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function onOptionClick(q, value) {
  if (q.type === 'single') {
    setAnswer(q.id, value);
    syncOptionSelection(q);
    cancelAutoAdvance();
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null;
      advanceFrom(q);
    }, 360);
    return;
  }

  // Multi-select
  const current = Array.isArray(state.answers[q.id]) ? [...state.answers[q.id]] : [];
  const idx = current.indexOf(value);
  let hitCap = false;

  if (idx >= 0) {
    current.splice(idx, 1);
    // User is editing — cancel any pending auto-advance from a previous cap-hit
    cancelAutoAdvance();
  } else {
    if (q.maxSelect && current.length >= q.maxSelect) {
      // Already at cap — ignore. User must deselect one to swap.
      return;
    }
    current.push(value);
    if (q.maxSelect && current.length === q.maxSelect) hitCap = true;
  }

  setAnswer(q.id, current);
  syncOptionSelection(q);
  updateNextEnabled(q);

  // When the user reaches the cap on a capped multi-select, auto-advance.
  if (hitCap) {
    cancelAutoAdvance();
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null;
      advanceFrom(q);
    }, 420);
  }
}

function syncOptionSelection(q) {
  const list = app.querySelector('.options');
  if (!list) return;
  const ans = state.answers[q.id];
  const isSel = (val) => q.type === 'multi'
    ? Array.isArray(ans) && ans.includes(val)
    : ans === val;
  const buttons = list.querySelectorAll('.option');
  buttons.forEach((btn, i) => {
    const opt = q.options[i];
    if (!opt) return;
    const sel = isSel(opt.value);
    btn.classList.toggle('selected', sel);
    btn.setAttribute('aria-checked', sel ? 'true' : 'false');
  });
}

function buildNextRow(q) {
  // Single-choice questions auto-advance on selection — no Next button needed
  if (q.type === 'single') return null;

  const isContactNext = q.next() === 'contact' || (q.id === 'q18');
  const label = isContactNext ? 'Continue' : 'Next';
  const btn = el('button', {
    class: 'btn-primary',
    type: 'button',
    disabled: !hasAnswer(q),
    onclick: (e) => {
      if (!hasAnswer(q)) return;
      pulseBtn(e.currentTarget);
      setTimeout(advanceFrom, 220, q);
    },
  }, [label, arrowSVG()]);
  return el('div', { class: 'btn-row' }, btn);
}

function hasAnswer(q) {
  const a = state.answers[q.id];
  if (q.type === 'single') return !!a;
  if (q.type === 'multi') return Array.isArray(a) && a.length > 0;
  if (q.type === 'text') return typeof a === 'string' && a.trim().length > 0;
  return false;
}

function updateNextEnabled(q) {
  const btn = app.querySelector('.btn-primary');
  if (!btn) return;
  if (hasAnswer(q)) btn.removeAttribute('disabled');
  else btn.setAttribute('disabled', '');
}

function pulseBtn(node) {
  node.classList.remove('btn-pulse');
  // force reflow so animation restarts
  void node.offsetWidth;
  node.classList.add('btn-pulse');
}

function advanceFrom(q) {
  // Clear answer for the branch we're skipping (so score stays accurate)
  const ans = state.answers[q.id];
  if (q.id === 'q8') {
    if (ans === 'Yes') clearAnswer('q10'); else clearAnswer('q9');
  }
  if (q.id === 'q15') {
    if (ans === 'Yes') clearAnswer('q17'); else clearAnswer('q16');
  }
  state.history.push(q.id);
  const nextId = q.next(ans, state);
  transitionTo(nextId);
}

function goBack() {
  if (state.history.length === 0) return;
  const prev = state.history.pop();
  // Going back to a previous question: keep its answer so user sees current selection
  transitionTo(prev, { checkPhase: false });
}

/* ---------- Contact screen ---------- */

function renderContact() {
  const c = state.contact;
  const card = el('div', { class: 'card stagger' }, [
    buildProgressBar(),
    cardHeader(4, true),
    el('h2', { class: 'q-text' }, 'Almost done.'),
    el('p', { class: 'intro-msg' }, 'Just a few details so we can save your result and show you your AI Readiness score.'),

    el('div', { class: 'input-grid' }, [
      field('First Name', 'firstName', 'text', c.firstName, true),
      field('Last Name', 'lastName', 'text', c.lastName, true),
      field('Email Address', 'email', 'email', c.email, true, 'full'),
      field('Phone Number (optional)', 'phone', 'tel', c.phone, false, 'full'),
    ]),

    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn-primary',
        type: 'button',
        id: 'submit-btn',
        disabled: !contactValid(),
        onclick: (e) => submitForm(e.currentTarget),
      }, ['See my score', arrowSVG()]),
    ]),
    el('div', { id: 'submit-error' }),
  ]);

  renderScreen(card);
}

function field(label, key, type, value, required, span) {
  const input = el('input', {
    class: 'input',
    type,
    value: value || '',
    autocomplete: ({
      firstName: 'given-name', lastName: 'family-name', email: 'email', phone: 'tel'
    })[key] || 'off',
    placeholder: '',
    oninput: (e) => {
      state.contact[key] = e.target.value;
      const btn = document.getElementById('submit-btn');
      if (btn) {
        if (contactValid()) btn.removeAttribute('disabled');
        else btn.setAttribute('disabled', '');
      }
      e.target.classList.remove('invalid');
    },
  });
  input.dataset.key = key;
  return el('div', { class: 'field' + (span ? ' ' + span : '') }, [
    el('label', {}, label + (required ? ' *' : '')),
    input,
  ]);
}

function contactValid() {
  const { firstName, lastName, email } = state.contact;
  if (!firstName || !firstName.trim()) return false;
  if (!lastName || !lastName.trim()) return false;
  if (!email || !isValidEmail(email)) return false;
  return true;
}

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/* ---------- Submission ---------- */

async function submitForm(btn) {
  if (state.submitting) return;
  if (!contactValid()) {
    document.querySelectorAll('.input').forEach(inp => {
      const k = inp.dataset.key;
      if (k === 'email' && !isValidEmail(state.contact.email || '')) inp.classList.add('invalid');
      else if ((k === 'firstName' || k === 'lastName') && !(state.contact[k] || '').trim()) inp.classList.add('invalid');
    });
    return;
  }
  state.submitting = true;
  const errBox = document.getElementById('submit-error');
  errBox.innerHTML = '';
  pulseBtn(btn);
  btn.setAttribute('disabled', '');
  btn.innerHTML = '';
  btn.appendChild(el('div', { class: 'btn-spinner', 'aria-hidden': 'true' }));
  btn.appendChild(document.createTextNode('Sending…'));

  const payload = buildAirtablePayload();

  let serverDetail = '';
  try {
    const res = await fetch(SUBMIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = text;
      try {
        const j = JSON.parse(text);
        if (j && j.error) {
          msg = (j.error.type ? j.error.type + ': ' : '') + (j.error.message || JSON.stringify(j.error));
        }
      } catch {}
      serverDetail = `Airtable ${res.status} — ${msg.slice(0, 280)}`;
      throw new Error(serverDetail);
    }
    state.submitting = false;
    transitionTo('thanks', { checkPhase: false });
  } catch (err) {
    state.submitting = false;
    console.error(err);
    btn.removeAttribute('disabled');
    btn.innerHTML = '';
    btn.appendChild(document.createTextNode('See my score'));
    btn.appendChild(arrowSVG());

    const friendly = 'We could not save your result just yet. Please try again — your answers are safe.';
    errBox.appendChild(el('div', { class: 'error-msg' }, [
      el('div', {}, friendly),
      serverDetail ? el('div', { class: 'error-detail' }, serverDetail) : null,
    ]));
  }
}

function joinMulti(val) {
  if (Array.isArray(val)) return val.join(', ');
  return val || '';
}

function buildAirtablePayload() {
  const fields = {
    'Email Address': (state.contact.email || '').trim(),
    'First Name': (state.contact.firstName || '').trim(),
    'Last Name': (state.contact.lastName || '').trim(),
    'Phone Number': (state.contact.phone || '').trim(),
    'AI_Score': Math.round(state.totalScore),
  };

  QUESTIONS.forEach(q => {
    const v = state.answers[q.id];
    if (v === undefined || v === null) return;
    if (q.type === 'multi') {
      const j = joinMulti(v);
      if (j) fields[q.airtableField] = j;
    } else if (q.type === 'text') {
      if (typeof v === 'string' && v.trim()) fields[q.airtableField] = v.trim();
    } else {
      if (v) fields[q.airtableField] = v;
    }
  });

  return { fields, typecast: true };
}

/* ---------- Thank you screen ---------- */

// 2026 framework tier definitions — kept in sync with the MOOOVE dashboard.
const TIERS = [
  {
    key: 'undecided',
    label: 'Undecided',
    icon: '❓',
    range: '-25 – 9',
    profile: 'The Hesitant. No clear stance on AI: negative signals (manual work, blocked budgets, decision overload) outweigh adoption signals.',
    test: (s) => s <= 9,
  },
  {
    key: 'ignition',
    label: 'Ignition',
    icon: '🔥',
    range: '10 – 34',
    profile: 'The Explorer. Awareness is there, AI is in early use, but practice is still ad-hoc and unstructured.',
    test: (s) => s >= 10 && s <= 34,
  },
  {
    key: 'momentum',
    label: 'Momentum',
    icon: '⚙️',
    range: '35 – 54',
    profile: 'The Practical Implementer. Tools are live, training is on the agenda, value is uneven but visible.',
    test: (s) => s >= 35 && s <= 54,
  },
  {
    key: 'mastery',
    label: 'Mastery',
    icon: '🚀',
    range: '55 – 65',
    profile: 'The Strategic Architect. AI is embedded, KPIs are tracked live, training is planned; focus is on governance and edge.',
    test: (s) => s >= 55,
  },
];

function tierForScore(score) {
  return TIERS.find(t => t.test(score)) || TIERS[0];
}

function renderThanks() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'check-svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.innerHTML = '<path d="M12 24.5l8 8 16-17" />';

  const score = Math.round(state.totalScore);
  const tier = tierForScore(score);

  const scoreBlock = el('div', { class: `score-block tier-${tier.key}` }, [
    el('span', { class: 'score-eyebrow' }, 'Your AI Readiness Score'),
    el('div', { class: 'score-value' }, [
      el('span', { class: 'score-number' }, String(score)),
      el('span', { class: 'score-suffix' }, '/ 65'),
    ]),
    el('div', { class: 'score-tier' }, [
      el('span', { class: 'score-tier-icon', 'aria-hidden': 'true' }, tier.icon),
      el('span', { class: 'score-tier-label' }, tier.label),
    ]),
    el('p', { class: 'score-tier-profile' }, tier.profile),
  ]);

  const tierLegend = el('div', { class: 'tier-legend' }, [
    el('div', { class: 'tier-legend-header' }, [
      el('span', { class: 'tier-legend-title' }, 'Tier legend'),
      el('span', { class: 'tier-legend-sub' }, '4 tiers · 2026 framework'),
    ]),
    el('div', { class: 'tier-list' }, TIERS.map(t => (
      el('div', { class: 'tier-row' + (t.key === tier.key ? ' active' : '') }, [
        el('span', { class: 'tier-icon', 'aria-hidden': 'true' }, t.icon),
        el('div', { class: 'tier-meta' }, [
          el('div', { class: 'tier-meta-top' }, [
            el('span', { class: 'tier-name' }, t.label),
            el('span', { class: 'tier-range' }, t.range),
          ]),
          el('p', { class: 'tier-profile' }, t.profile),
        ]),
      ])
    ))),
  ]);

  const compareCard = el('a', {
    class: 'compare-card',
    href: 'https://gmhr.vercel.app/',
    target: '_blank',
    rel: 'noopener noreferrer',
  }, [
    el('div', { class: 'compare-text' }, [
      el('span', { class: 'compare-eyebrow' }, 'Benchmark'),
      el('span', { class: 'compare-title' }, 'See how you compare to your peers'),
      el('span', { class: 'compare-sub' }, 'Open the live MOOOVE AI Readiness dashboard for Mauritius'),
    ]),
    el('span', { class: 'compare-arrow', 'aria-hidden': 'true' }, [arrowSVG()]),
  ]);

  const card = el('div', { class: 'card thanks-card stagger' }, [
    el('div', { class: 'check-wrap' }, svg),
    el('h2', { class: 'thanks-title' }, 'Thanks — here is your AI Readiness score.'),
    el('p', { class: 'thanks-sub' }, 'See where you land on the 2026 framework, then open the dashboard to see how you compare to your peers.'),
    scoreBlock,
    tierLegend,
    compareCard,
  ]);
  renderScreen(card);
}

/* ---------- Keyboard navigation ---------- */

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const q = QMAP[state.currentId];
  // For text fields and inputs, let default behavior happen
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
    if (e.target.tagName === 'INPUT' && state.currentId === 'contact') {
      e.preventDefault();
      const btn = document.getElementById('submit-btn');
      if (btn && !btn.hasAttribute('disabled')) btn.click();
    }
    return;
  }
  if (!q) return;
  if (hasAnswer(q)) {
    const btn = app.querySelector('.btn-primary');
    if (btn && !btn.hasAttribute('disabled')) btn.click();
  }
});

/* ---------- Boot ---------- */

// Dev preview: append ?preview=<score> to jump straight to the thanks screen
// without going through the form. Example: index.html?preview=42
const previewMatch = /[?&]preview=(-?\d+)/.exec(window.location.search);
if (previewMatch) {
  state.totalScore = parseInt(previewMatch[1], 10);
  state.currentId = 'thanks';
  renderThanks();
} else {
  renderIntro();
  setProgress();
}
