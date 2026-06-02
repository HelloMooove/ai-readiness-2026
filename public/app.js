/* =============================================================
   2026 AI Readiness Diagnostic — form logic, scoring, Airtable
   ============================================================= */

// The backend serverless function handles the actual Airtable submission
const SUBMIT_URL = '/api/submit';
const DRAFT_URL = '/api/draft';
const FORM_SLUG = 'ai-readiness-2026';
const SESSION_STORAGE_KEY = 'mooove.ai-readiness-2026.session';

/* ---------- Draft / partial-submission capture ----------
   A stable session id (per browser tab via sessionStorage) is sent with
   every draft + final submission so the admin can see partial answers.
   Failures are intentionally silent — admin storage must never affect the
   public form UX. */

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    if (!window.__mooove_sess) {
      window.__mooove_sess = 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    }
    return window.__mooove_sess;
  }
}

let __draftTimer = null;
let __draftSubmitted = false;

function scheduleDraftSave() {
  if (__draftSubmitted) return;
  if (__draftTimer) clearTimeout(__draftTimer);
  __draftTimer = setTimeout(saveDraftNow, 800);
}

function buildDraftPayload() {
  return {
    session_id: getSessionId(),
    form_slug: FORM_SLUG,
    answers: state.answers,
    email: (state.contact && state.contact.email) || null,
    first_name: (state.contact && state.contact.firstName) || null,
    last_name: (state.contact && state.contact.lastName) || null,
    phone: (state.contact && state.contact.phone) || null,
    last_question_id: state.currentId || null,
    question_count: Object.keys(state.answers).length,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    referrer: typeof document !== 'undefined' ? document.referrer : null,
  };
}

async function saveDraftNow() {
  __draftTimer = null;
  if (__draftSubmitted) return;
  try {
    await fetch(DRAFT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildDraftPayload()),
      keepalive: true,
    });
  } catch {
    // Silent — partial-capture failures never surface to the user
  }
}

const PHASES = {
  1: 'Relationship with AI',
  2: 'AI Today',
  3: 'AI Tomorrow',
  4: 'Contact Details',
};

/* ---------- Internationalisation ----------
   The form is bilingual EN/FR. ALL stored data (answers, scores, tier,
   Airtable column values, Supabase) stays in English so dashboards and
   admin views are language-stable. Only the display layer translates.

   t(src) returns the French translation when state.lang === 'fr' and one
   exists; otherwise falls through to the English source string. This lets
   us add translations incrementally without breaking the form. */

const LANG_STORAGE_KEY = 'mooove.ai-readiness-2026.lang';

function getStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') return stored;
  } catch {}
  return 'en';
}

function setLang(lang) {
  state.lang = (lang === 'fr') ? 'fr' : 'en';
  try { localStorage.setItem(LANG_STORAGE_KEY, state.lang); } catch {}
}

function t(src) {
  if (src == null || src === '') return src;
  if (state.lang !== 'fr') return src;
  const key = String(src);
  return Object.prototype.hasOwnProperty.call(FR, key) ? FR[key] : src;
}

// French translation table. Keys are the English source strings — this
// keeps the rest of the code in English and makes missing translations
// fall through gracefully (English shows instead of a broken UI).
const FR = {
  /* --- Intro --- */
  '2026 · Mauritius': '2026 · Maurice',
  'The <em>AI Readiness</em> Diagnostic': 'Diagnostic de <em>Maturité IA</em>',
  'A short, executive-level questionnaire that maps where your organization stands on AI today — and what it would take to thrive in 2026.':
    'Un court questionnaire pour dirigeants qui révèle où votre organisation se situe face à l’IA aujourd’hui, et ce qu’il faudrait pour exceller en 2026.',
  'Start the diagnostic': 'Démarrer le diagnostic',
  '4 phases': '4 phases',
  '≈ 4 minutes': '≈ 4 minutes',
  'Instant score': 'Score instantané',

  /* --- UI chrome --- */
  'Back': 'Retour',
  'Next': 'Suivant',
  'Continue': 'Continuer',
  'Sending…': 'Envoi…',
  'Back to previous question': 'Retour à la question précédente',
  'Select all that apply': 'Sélectionnez tout ce qui s’applique',
  'Select up to 3': 'Sélectionnez jusqu’à 3',
  'Select up to 2': 'Sélectionnez jusqu’à 2',

  /* --- Phase labels --- */
  'Relationship with AI': 'Votre relation avec l’IA',
  'AI Today': 'L’IA aujourd’hui',
  'AI Tomorrow': 'L’IA demain',
  'Contact Details': 'Vos coordonnées',

  /* --- Email capture (first step) --- */
  "Let's start with your email.": 'Commençons par votre e-mail.',
  "We'll save your progress and send your AI Readiness score here when you finish.":
    'Nous enregistrons votre progression et vous enverrons votre score AI Readiness ici une fois terminé.',

  /* --- Contact form --- */
  'Almost done.': 'Presque terminé.',
  'Just a few details so we can save your result and show you your AI Readiness score.':
    'Juste quelques informations pour enregistrer votre résultat et vous envoyer votre score AI Readiness.',
  'First Name': 'Prénom',
  'Last Name': 'Nom',
  'Email Address': 'Adresse e-mail',
  'Phone Number (optional)': 'Numéro de téléphone (optionnel)',
  'See my score': 'Voir mon score',
  'We could not save your result just yet. Please try again — your answers are safe.':
    'Nous n’avons pas pu enregistrer votre résultat pour l’instant. Réessayez — vos réponses sont en sécurité.',

  /* --- Thank-you screen --- */
  'Thank you!': 'Merci !',
  'Check your email for your AI Maturity Score.':
    'Consultez votre boîte e-mail pour découvrir votre score de maturité IA.',

  /* --- Q3 group titles --- */
  'Productivity & personal efficiency': 'Productivité et efficacité personnelle',
  'Strategic & analytical work': 'Travail stratégique et analytique',
  'Technical & AI development': 'Développement technique et IA',
  'Automation & operational transformation': 'Automatisation et transformation opérationnelle',
  'Organizational AI adoption': 'Adoption de l’IA à l’échelle de l’organisation',

  /* --- Question texts --- */
  'Are you AI literate?': 'Êtes-vous à l’aise avec l’IA ?',
  'How often do you use AI?': 'À quelle fréquence utilisez-vous l’IA ?',
  'What do you use AI for?': 'Pour quoi utilisez-vous l’IA ?',
  'What conversational AI tools do you use?': 'Quels outils d’IA conversationnelle utilisez-vous ?',
  'What is the size of your company?': 'Quelle est la taille de votre entreprise ?',
  'What is your current job title?': 'Quel est votre poste actuel ?',
  'What are your current business challenges?': 'Quels sont vos défis business actuels ?',
  'Have you considered AI as a solution to solve these problems?':
    'Avez-vous envisagé l’IA comme solution à ces problèmes ?',
  'How did you proceed?': 'Comment avez-vous procédé ?',
  "What's preventing you from doing so?": 'Qu’est-ce qui vous en empêche ?',
  'How do you track or measure your business KPIs?':
    'Comment suivez-vous ou mesurez-vous vos KPIs business ?',
  'In which industry is your organization active?': 'Dans quelle industrie votre organisation opère-t-elle ?',
  'What are your top 3 business priorities today?': 'Quelles sont vos 3 priorités business actuelles ?',
  'What decisions are currently difficult to make in your organization?':
    'Quelles décisions sont actuellement difficiles à prendre dans votre organisation ?',
  'Do you plan to train your teams on AI usage in 2026?':
    'Prévoyez-vous de former vos équipes à l’utilisation de l’IA en 2026 ?',
  'Which AI capabilities would you like your teams to develop?': 'Quelles compétences IA souhaitez-vous que vos équipes développent ?',
  'Why not?': 'Pourquoi pas ?',
  'What do you expect from a high-quality AI training experience?':
    'Qu’attendez-vous d’une expérience de formation IA de qualité ?',

  /* --- Option values: Q1 / Q8 / Q15 (yes/no) --- */
  'Yes': 'Oui',
  'No': 'Non',

  /* --- Q2: frequency --- */
  'Always': 'Quotidiennement',
  'Sometimes': 'Parfois',
  'Rarely': 'Rarement',
  'Never': 'Jamais',

  /* --- Q3: AI use cases --- */
  'Writing emails and documents': 'Rédiger des e-mails et documents',
  'Summarizing meetings or files': 'Résumer des réunions ou des fichiers',
  'Researching information faster': 'Rechercher des informations plus rapidement',
  'Creating presentations or content': 'Créer des présentations ou du contenu',
  'Generating images or designs': 'Générer des images ou des designs',
  'Experimenting with AI personally': 'Expérimenter l’IA personnellement',
  'Brainstorming ideas and strategy': 'Brainstormer des idées et de la stratégie',
  'Analyzing data and reports': 'Analyser des données et des rapports',
  'Supporting business decisions': 'Soutenir les décisions business',
  'Improving customer support': 'Améliorer le support client',
  'Writing code or formulas': 'Écrire du code ou des formules',
  'Building AI-powered applications': 'Construire des applications propulsées par l’IA',
  'Automating repetitive tasks': 'Automatiser les tâches répétitives',
  'Creating AI workflows or agents': 'Créer des workflows ou agents IA',
  'Connecting tools and systems': 'Connecter des outils et systèmes',
  'Using AI across my organization': 'L’IA est utilisée dans mon entreprise',
  "I don't use AI for work yet": 'Je n’utilise pas encore l’IA au travail',

  /* --- Q4: conversational AI tools (mostly proper nouns; kept as-is) --- */
  'Custom or Internal AI Company Bot': 'Bot IA interne ou personnalisé',
  'Other': 'Autre',
  'None': 'Aucun',

  /* --- Q5: company size --- */
  '1–10 employees': '1–10 employés',
  '11–50 employees': '11–50 employés',
  '51–250 employees': '51–250 employés',
  '251+ employees': '251+ employés',

  /* --- Q6: job titles --- */
  'CEO / Founder': 'PDG / Fondateur',
  'CIO / CTO / Head of IT': 'CIO / CTO / Responsable IT',
  'CHRO / Head of HR': 'CHRO / Responsable RH',
  'CFO / Head of Finance': 'CFO / Responsable Finance',
  'COO / Head of Operations': 'COO / Responsable des Opérations',
  'Director / Head of (other function)': 'Directeur / Responsable (autre fonction)',
  'HR Manager / L&D': 'Manager RH / L&D',
  'Operational Manager': 'Manager opérationnel',

  /* --- Q7: business challenges --- */
  'Finding and keeping the right staff': 'Trouver et fidéliser les bonnes personnes',
  'Too much time spent on manual "copy-paste" work':
    'Trop de temps passé sur du travail manuel répétitif',
  "We don't have clear, daily reports on our performance":
    'Nous n’avons pas de rapports clairs et quotidiens sur nos performances',
  'Our sales pipeline is messy and hard to track': 'Notre pipeline commercial est désordonné et difficile à suivre',
  "Teams don't talk or work well together": 'Les équipes ne communiquent pas et collaborent mal',
  'Rising costs are eating our profit margins': 'La hausse des coûts ronge nos marges',
  'It takes too long to get new employees started': 'L’intégration des nouveaux employés prend trop de temps',
  'We are moving too slow compared to competitors': 'Nous avançons trop lentement face à nos concurrents',
  'Finding the right files or info takes too much time':
    'Retrouver les bons fichiers ou informations prend trop de temps',

  /* --- Q9: how proceeded --- */
  'Hiring a consultant': 'Engager un consultant',
  'Train your teams': 'Former vos équipes',
  'Investigate the topic': 'Se renseigner sur le sujet',

  /* --- Q10: what's preventing --- */
  'Business readiness': 'Maturité business insuffisante',
  'Budgeting in current financial year': 'Budget dans l’exercice financier en cours',
  'Lack of guidance': 'Manque d’accompagnement',

  /* --- Q11: KPI tracking --- */
  'Excel spreadsheets': 'Feuilles de calcul Excel',
  'Business Intelligence via tools (ERP-based systems)':
    'Business Intelligence via outils (systèmes ERP)',
  'Fully automated reports with live dashboards':
    'Rapports entièrement automatisés avec tableaux de bord en direct',

  /* --- Q12: industry --- */
  'Technology & Software': 'Technologie & Logiciels',
  'Banking & Financial Services': 'Banque & Services financiers',
  'Retail & E-commerce': 'Commerce de détail & E-commerce',
  'Manufacturing': 'Industrie manufacturière',
  'Healthcare & Life Sciences': 'Santé & Sciences de la vie',
  'Education': 'Éducation',
  'Professional Services (Consulting, Legal, etc.)': 'Services professionnels (Conseil, Juridique, etc.)',
  'Real Estate & Construction': 'Immobilier & Construction',
  'Hospitality & Tourism': 'Hôtellerie & Tourisme',
  'Energy & Utilities': 'Énergie & Services publics',

  /* --- Q13: business priorities --- */
  'Profitability & Cost Optimization': 'Rentabilité & Optimisation des coûts',
  'Operational Efficiency & Automation': 'Efficacité opérationnelle & Automatisation',
  'Digital Transformation & AI Integration': 'Transformation digitale & Intégration de l’IA',
  'Talent Acquisition & Retention': 'Acquisition & Rétention des talents',
  'Customer Experience & Loyalty': 'Expérience client & Fidélisation',
  'Market Expansion & Scaling': 'Expansion & Croissance',
  'Sustainability & ESG Strategy': 'Durabilité & Stratégie ESG',

  /* --- Q14: difficult decisions --- */
  'Budgeting & Financial Forecasting': 'Budgétisation & Prévisions financières',
  'Strategic Expansion & Market Entry': 'Expansion stratégique & Entrée sur de nouveaux marchés',
  'Pricing & Competitive Strategy': 'Stratégie de prix & Concurrence',
  'Talent Acquisition & Hiring': 'Recrutement & Acquisition de talents',
  'Resource & Workforce Allocation': 'Allocation des ressources & du personnel',

  /* --- Q16: training themes --- */
  'AI Foundations: Getting the whole team comfortable with the basics.':
    'Fondamentaux de l’IA : mettre toute l’équipe à l’aise avec les bases.',
  'Prompt Engineering: Learning how to "talk" to AI to get perfect results.':
    'Prompt Engineering : apprendre à « parler » à l’IA pour obtenir des résultats parfaits.',
  'Automating Repetitive Tasks: Cutting out "copy-paste" work.':
    'Automatiser les tâches répétitives : éliminer le travail de copier-coller.',
  'AI for Sales & Growth: Using AI to find leads and close deals faster.':
    'IA pour les ventes & la croissance : utiliser l’IA pour trouver des prospects et conclure plus vite.',
  'Smart Data & Reporting: Turning messy spreadsheets into clear daily dashboards.':
    'Données & reporting intelligents : transformer des tableurs désordonnés en tableaux de bord clairs.',
  'AI in HR & Recruitment: Speeding up hiring and making onboarding easier.':
    'IA en RH & Recrutement : accélérer l’embauche et faciliter l’intégration.',
  'Financial AI & Admin: Saving time on invoices, bills, and paperwork.':
    'IA financière & administration : gagner du temps sur les factures et la paperasse.',
  'AI Safety & Policy: Ensuring your team uses AI securely and legally.':
    'Sécurité & gouvernance IA : garantir un usage de l’IA sûr et conforme.',
  'AI for Content & Marketing: Creating high-quality posts and emails in seconds.':
    'IA pour le contenu & le marketing : créer des publications et e-mails de qualité en quelques secondes.',
  'Advanced Workflow Design: Building custom "AI employees" for specific departments.':
    'Conception de workflows avancés : créer des « employés IA » sur mesure par département.',

  /* --- Q18: must-haves of a good training --- */
  'Hands-on practice: Actually building and using tools during the session.':
    'Pratique concrète : construire et utiliser des outils en séance.',
  'Real-world examples: Seeing case studies from my specific industry.':
    'Exemples concrets : études de cas dans mon secteur.',
  'Data Security & Privacy: Clear rules on how to keep company secrets safe.':
    'Sécurité & confidentialité des données : règles claires pour protéger les secrets de l’entreprise.',
  'ROI & Business Proof: Training that shows exactly how it saves money.':
    'ROI & preuve business : une formation qui montre exactement les économies réalisées.',
  'Ready-to-use "Prompts": A library of commands my team can use immediately.':
    'Prompts prêts à l’emploi : une bibliothèque de commandes utilisables immédiatement.',
  'No-code automation: Learning how to connect apps (like n8n) without IT.':
    'Automatisation no-code : apprendre à connecter des applications (comme n8n) sans IT.',
  'Human-AI Culture: Helping staff overcome the fear of being replaced.':
    'Culture humain-IA : aider les équipes à surmonter la peur d’être remplacées.',
  'Latest 2026 tools: Access to the newest models, not old technology.':
    'Derniers outils 2026 : accès aux modèles les plus récents.',
  'Post-training support: A roadmap or community to help us after the session.':
    'Suivi post-formation : feuille de route ou communauté pour nous accompagner.',
  'Executive alignment: Ensuring the boss and the team are on the same page.':
    'Alignement de la direction : assurer que dirigeants et équipes parlent le même langage.',
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
    id: 'q16', phase: 3, text: 'Which AI capabilities would you like your teams to develop?', type: 'multi',
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
    id: 'q18', phase: 3, text: 'What do you expect from a high-quality AI training experience?', type: 'multi',
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
  answers: {},            // qId -> value or array (ALWAYS the English option value)
  contact: { firstName: '', lastName: '', email: '', phone: '' },
  totalScore: 0,
  submitting: false,
  lang: 'en',             // 'en' | 'fr' — initialised from localStorage on boot
};

// Hydrate language preference from localStorage as soon as state exists.
state.lang = getStoredLang();

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
  scheduleDraftSave();
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
  else if (nextId === 'email') renderEmail();
  else if (nextId === 'contact') renderContact();
  else if (nextId === 'thanks') renderThanks();
  else renderQuestion(nextId);
}

/* ---------- Intro screen ---------- */

function renderIntro() {
  const langToggle = el('div', { class: 'lang-toggle', role: 'group', 'aria-label': 'Language' }, [
    el('button', {
      type: 'button',
      class: 'lang-btn' + (state.lang === 'en' ? ' active' : ''),
      'aria-pressed': state.lang === 'en' ? 'true' : 'false',
      onclick: () => { if (state.lang !== 'en') { setLang('en'); renderIntro(); } },
    }, 'English'),
    el('button', {
      type: 'button',
      class: 'lang-btn' + (state.lang === 'fr' ? ' active' : ''),
      'aria-pressed': state.lang === 'fr' ? 'true' : 'false',
      onclick: () => { if (state.lang !== 'fr') { setLang('fr'); renderIntro(); } },
    }, 'Français'),
  ]);

  const card = el('div', { class: 'card intro-card stagger' }, [
    el('span', { class: 'intro-eyebrow' }, t('2026 · Mauritius')),
    el('h1', { class: 'intro-title', html: t('The <em>AI Readiness</em> Diagnostic') }),
    el('p', { class: 'intro-sub' },
      t('A short, executive-level questionnaire that maps where your organization stands on AI today — and what it would take to thrive in 2026.')),
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn-primary',
        type: 'button',
        onclick: (e) => { pulseBtn(e.currentTarget); setTimeout(() => transitionTo('email'), 180); },
      }, [t('Start the diagnostic'), arrowSVG()])
    ]),
    el('div', { class: 'intro-meta' }, [
      el('span', {}, t('4 phases')),
      el('span', { class: 'dot-sep' }, '·'),
      el('span', {}, t('≈ 4 minutes')),
      el('span', { class: 'dot-sep' }, '·'),
      el('span', {}, t('Instant score')),
    ]),
    langToggle,
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
    el('h2', { class: 'q-text' }, t(q.text)),
    q.hint ? el('p', { class: 'q-hint' }, `(${t(q.hint)})`) : el('div', { style: 'height:8px' }),
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
      ? el('button', { class: 'back-btn', type: 'button', onclick: goBack, 'aria-label': t('Back to previous question') }, [backArrowSVG(), t('Back')])
      : null,
    el('span', { class: 'phase-badge' }, `Phase ${phase} — ${t(PHASES[phase])}`),
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
        scheduleDraftSave();
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
      'data-value': opt.value,
      style: `animation-delay:${idx * 60}ms`,
      onclick: () => onOptionClick(q, opt.value),
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOptionClick(q, opt.value); }
      },
    }, [
      el('span', { class: 'dot', 'aria-hidden': 'true' }),
      // Display uses translation; storage / scoring still uses opt.value (English)
      el('span', { class: 'label' }, t(opt.value)),
      checkSVG(),
    ]);
  };

  const groupClass = q.columns === 2 ? ' cols-2' : '';

  if (Array.isArray(q.groups)) {
    const wrap = el('div', { class: 'option-groups', role: q.type === 'multi' ? 'group' : 'radiogroup' });
    let globalIdx = 0;
    q.groups.forEach(group => {
      wrap.appendChild(el('div', { class: 'option-group-title' }, t(group.title)));
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
  const wrap = app.querySelector('.options-wrap');
  if (!wrap) return;
  const ans = state.answers[q.id];
  const isSel = (val) => q.type === 'multi'
    ? Array.isArray(ans) && ans.includes(val)
    : ans === val;
  wrap.querySelectorAll('.option').forEach(btn => {
    const val = btn.getAttribute('data-value');
    if (val == null) return;
    const sel = isSel(val);
    btn.classList.toggle('selected', sel);
    btn.setAttribute('aria-checked', sel ? 'true' : 'false');
  });
}

function buildNextRow(q) {
  // Single-choice questions auto-advance on selection — no Next button needed
  if (q.type === 'single') return null;

  const isContactNext = q.next() === 'contact' || (q.id === 'q18');
  const label = t(isContactNext ? 'Continue' : 'Next');
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

/* ---------- Email capture (first step) ----------
   Collected up-front so partial / dropped-off submissions still carry an
   email we can follow up on. The remaining contact details (name, phone)
   are gathered on the contact screen at the end. This screen is deliberately
   NOT one of the numbered QUESTIONS — Q1 stays "Are you AI literate?" and the
   question numbering is unaffected. */

function renderEmail() {
  const c = state.contact;

  const input = el('input', {
    class: 'input',
    type: 'email',
    value: c.email || '',
    autocomplete: 'email',
    placeholder: '',
    oninput: (e) => {
      state.contact.email = e.target.value;
      const btn = document.getElementById('email-continue-btn');
      if (btn) {
        if (isValidEmail(state.contact.email)) btn.removeAttribute('disabled');
        else btn.setAttribute('disabled', '');
      }
      e.target.classList.remove('invalid');
      scheduleDraftSave();
    },
  });
  input.dataset.key = 'email';

  const card = el('div', { class: 'card stagger' }, [
    el('h2', { class: 'q-text' }, t("Let's start with your email.")),
    el('p', { class: 'intro-msg' },
      t("We'll save your progress and send your AI Readiness score here when you finish.")),

    el('div', { class: 'input-grid' }, [
      el('div', { class: 'field full' }, [
        el('label', {}, t('Email Address') + ' *'),
        input,
      ]),
    ]),

    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn-primary',
        type: 'button',
        id: 'email-continue-btn',
        disabled: !isValidEmail(c.email || ''),
        onclick: (e) => {
          if (!isValidEmail(state.contact.email || '')) { input.classList.add('invalid'); return; }
          pulseBtn(e.currentTarget);
          // Flush the email now so a drop-off right after this step is still captured.
          saveDraftNow();
          state.history.push('email');
          setTimeout(() => transitionTo('q1'), 200);
        },
      }, [t('Continue'), arrowSVG()]),
    ]),
  ]);

  renderScreen(card);
}

/* ---------- Contact screen ---------- */

function renderContact() {
  const c = state.contact;
  const card = el('div', { class: 'card stagger' }, [
    buildProgressBar(),
    cardHeader(4, true),
    el('h2', { class: 'q-text' }, t('Almost done.')),
    el('p', { class: 'intro-msg' }, t('Just a few details so we can save your result and show you your AI Readiness score.')),

    el('div', { class: 'input-grid' }, [
      field(t('First Name'), 'firstName', 'text', c.firstName, true),
      field(t('Last Name'), 'lastName', 'text', c.lastName, true),
      field(t('Phone Number (optional)'), 'phone', 'tel', c.phone, false, 'full'),
    ]),

    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn-primary',
        type: 'button',
        id: 'submit-btn',
        disabled: !contactValid(),
        onclick: (e) => submitForm(e.currentTarget),
      // Label is deliberately neutral — we don't reveal the score on this screen.
      // The user receives the score by email after submission.
      }, [t('Next'), arrowSVG()]),
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
      scheduleDraftSave();
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
      if ((k === 'firstName' || k === 'lastName') && !(state.contact[k] || '').trim()) inp.classList.add('invalid');
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
  btn.appendChild(document.createTextNode(t('Sending…')));

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
    __draftSubmitted = true;
    if (__draftTimer) { clearTimeout(__draftTimer); __draftTimer = null; }
    // Meta Pixel — form completion conversion
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
    transitionTo('thanks', { checkPhase: false });
  } catch (err) {
    state.submitting = false;
    console.error(err);
    btn.removeAttribute('disabled');
    btn.innerHTML = '';
    btn.appendChild(document.createTextNode(t('Next')));
    btn.appendChild(arrowSVG());

    const friendly = t('We could not save your result just yet. Please try again — your answers are safe.');
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

  // _meta is stripped server-side before Airtable; used only to mirror the
  // submission to Supabase for the admin section.
  let tierLabel = null;
  try { tierLabel = tierForScore(Math.round(state.totalScore)).label; } catch {}

  const _meta = {
    session_id: getSessionId(),
    form_slug: FORM_SLUG,
    answers: state.answers,
    tier: tierLabel,
    last_question_id: state.currentId || null,
    question_count: Object.keys(state.answers).length,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    referrer: typeof document !== 'undefined' ? document.referrer : null,
    lang: state.lang || 'en',
  };

  return { fields, typecast: true, _meta };
}

/* ---------- Thank you screen ---------- */

// 2026 framework tier definitions — MUST stay in sync with /lib/tiers.ts on
// the server side (used by the email + admin insights). Five tiers matching
// the MOOOVE dashboard ranges.
const TIERS = [
  {
    key: 'undecided',
    label: 'Explorer',
    icon: '🧭',
    range: '0 – 19',
    profile: 'The Hesitant. No clear stance on AI: negative signals outweigh adoption signals.',
    test: (s) => s <= 19,
  },
  {
    key: 'ignition',
    label: 'Ignition',
    icon: '🔥',
    range: '20 – 44',
    profile: 'The Explorer. Awareness is there, AI is in early use, but practice is still ad-hoc and unstructured.',
    test: (s) => s >= 20 && s <= 44,
  },
  {
    key: 'momentum',
    label: 'Momentum',
    icon: '⚙️',
    range: '45 – 74',
    profile: 'The Practical Implementer. Tools are live, training is on the agenda, value is uneven but visible.',
    test: (s) => s >= 45 && s <= 74,
  },
  {
    key: 'mastery',
    label: 'Mastery',
    icon: '🚀',
    range: '75 – 104',
    profile: 'The Strategic Architect. AI is embedded, KPIs are tracked live, training is planned; focus is on governance and edge.',
    test: (s) => s >= 75 && s <= 104,
  },
  {
    key: 'ai-native',
    label: 'AI-Native',
    icon: '✨',
    range: '105 – 140',
    profile: 'The AI-Native Operator. AI is woven through the operating model — workflows, decisions, and product.',
    test: (s) => s >= 105,
  },
];

function tierForScore(score) {
  return TIERS.find(t => t.test(score)) || TIERS[0];
}

function renderThanks() {
  // Big checkmark — purely visual, doesn't reveal the score.
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'check-svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.innerHTML = '<path d="M12 24.5l8 8 16-17" />';

  // The score and tier are still computed and submitted to Airtable + Supabase
  // (handled before this screen renders) — we just don't display them to the
  // user. The score reaches them via email instead.
  const card = el('div', { class: 'card thanks-card stagger' }, [
    el('div', { class: 'check-wrap' }, svg),
    el('h2', { class: 'thanks-title' }, t('Thank you!')),
    el('p', { class: 'thanks-sub' }, t('Check your email for your AI Maturity Score.')),
  ]);
  renderScreen(card);
}

/* ---------- Keyboard navigation ---------- */

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const q = QMAP[state.currentId];
  // For text fields and inputs, let default behavior happen
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
    if (e.target.tagName === 'INPUT' && (state.currentId === 'contact' || state.currentId === 'email')) {
      e.preventDefault();
      const btn = document.getElementById(state.currentId === 'email' ? 'email-continue-btn' : 'submit-btn');
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
