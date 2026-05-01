// ═══════════════════════════════════════════════════
// APL Nexus — Data Store (LocalStorage-backed)
// ═══════════════════════════════════════════════════

const STORAGE_KEY = 'apl_nexus_data';

const SAMPLE_APLS = [
  {
    id: 'apl-001',
    name: 'Annual Tech Innovation Summit 2025',
    date: '2025-11-15',
    endDate: '2025-11-17',
    location: 'Grand Convention Center, Mumbai',
    type: 'Conference',
    duration: '3 days',
    targetAudience: 'Tech Professionals & Students',
    expectedParticipants: 500,
    actualParticipants: 478,
    budgetPlanned: 850000,
    budgetActual: 792000,
    objectives: 'Showcase emerging technologies, foster networking, inspire innovation in AI/ML domain.',
    outcomes: 'Successfully demonstrated 15 tech prototypes. 3 collaboration MOUs signed. 92% satisfaction rate.',
    successRating: 9,
    activities: '• Keynote sessions by industry leaders\n• Hands-on workshops on AI, Cloud, IoT\n• Hackathon with 45 teams\n• Networking dinner\n• Startup pitch competition',
    resourceUtilization: 'All 5 conference halls utilized. 12 speakers, 8 workshop facilitators. AV equipment from 2 vendors.',
    timelineAdherence: 'On schedule with minor 15-min delays on Day 2 due to keynote overrun.',
    demographics: 'Professionals: 55%, Students: 35%, Faculty: 10%. Age 20-45. 60% male, 40% female.',
    engagementLevel: 'High',
    feedbackScore: 4.6,
    whatWorked: '• Hackathon was the highlight — excellent engagement\n• Networking dinner facilitated genuine connections\n• Live polling during sessions kept audience engaged',
    whatDidntWork: '• Registration queue was slow on Day 1\n• Some workshops were overcrowded\n• WiFi issues in Hall B',
    unexpectedInsights: 'Student teams outperformed professionals in hackathon. Sustainability-themed sessions drew largest crowds.',
    immediateOutcomes: '3 MOUs signed, 12 internship offers, Innovation Awards given to top 5 projects.',
    followUpActions: 'Follow up with MOU partners by Dec 15. Share presentation recordings. Plan quarterly mini-meetups.',
    longTermValue: 'Established brand as premier tech event in the region. Built community of 450+ engaged professionals.',
    recommendations: '• Increase venue capacity by 20% next year\n• Add dedicated networking breaks\n• Implement pre-registration to avoid queues\n• Ensure redundant WiFi setup',
    tags: ['technology', 'conference', 'innovation', 'hackathon', 'networking'],
    status: 'completed',
    createdAt: '2025-11-20T10:00:00Z',
    updatedAt: '2025-12-01T14:30:00Z'
  },
  {
    id: 'apl-002',
    name: 'Youth Leadership Development Camp',
    date: '2025-09-05',
    endDate: '2025-09-08',
    location: 'Himalayan Adventure Resort, Manali',
    type: 'Workshop',
    duration: '4 days',
    targetAudience: 'College students aged 18-24',
    expectedParticipants: 120,
    actualParticipants: 108,
    budgetPlanned: 450000,
    budgetActual: 485000,
    objectives: 'Build leadership skills, teamwork, and resilience through outdoor challenges and structured learning.',
    outcomes: 'All participants completed leadership assessment. 85% showed measurable improvement in leadership scores.',
    successRating: 8,
    activities: '• Team-building outdoor challenges\n• Leadership theory sessions\n• Guest talks by young entrepreneurs\n• Campfire reflection circles\n• Individual development plan creation',
    resourceUtilization: '3 trainers, 2 outdoor instructors, 1 counselor. Equipment rental for adventure activities.',
    timelineAdherence: 'Day 2 outdoor activity postponed by 2 hours due to rain. Adjusted schedule worked well.',
    demographics: '100% college students. 52% female, 48% male. From 15 different colleges.',
    engagementLevel: 'Very High',
    feedbackScore: 4.8,
    whatWorked: '• Outdoor challenges created strong bonding\n• Small group reflection sessions were deeply valued\n• Peer mentoring pairs exceeded expectations',
    whatDidntWork: '• Some theory sessions felt too classroom-like\n• Food quality inconsistent\n• Transportation to venue was delayed',
    unexpectedInsights: 'Quieter participants emerged as strongest leaders in outdoor challenges. Group journaling was spontaneously adopted.',
    immediateOutcomes: 'All 108 participants created personal development plans. 15 peer mentoring pairs established.',
    followUpActions: 'Monthly virtual check-ins for 6 months. Alumni network creation. Peer mentoring follow-up.',
    longTermValue: 'Created pipeline of student leaders. 5 participants later organized their own campus events.',
    recommendations: '• Make all sessions experiential, minimize lecture format\n• Book transport in advance\n• Add follow-up bootcamp at 3-month mark\n• Include more diverse activity options',
    tags: ['youth', 'leadership', 'outdoor', 'workshop', 'development'],
    status: 'completed',
    createdAt: '2025-09-12T08:00:00Z',
    updatedAt: '2025-10-01T12:00:00Z'
  },
  {
    id: 'apl-003',
    name: 'Community Health Awareness Drive',
    date: '2026-01-20',
    endDate: '2026-01-20',
    location: 'Municipal Community Hall, Pune',
    type: 'Outreach',
    duration: '1 day',
    targetAudience: 'Local community members, all ages',
    expectedParticipants: 300,
    actualParticipants: 342,
    budgetPlanned: 120000,
    budgetActual: 105000,
    objectives: 'Raise awareness about preventive healthcare, provide free health screenings, and connect community with resources.',
    outcomes: 'Screened 280 individuals. Identified 45 requiring follow-up. Distributed 500+ health kits.',
    successRating: 9,
    activities: '• Free health screenings (BP, blood sugar, BMI)\n• Doctor consultations\n• Nutrition awareness booths\n• Children health education corner\n• Distribution of health kits',
    resourceUtilization: '8 doctors volunteered, 15 nursing students assisted, 3 ambulances on standby. Partnership with 2 pharmacies.',
    timelineAdherence: 'Perfectly on schedule. Extra session added at 4 PM due to high demand.',
    demographics: 'Ages 5-80. 60% female. Mix of socioeconomic backgrounds. 30% first-time health screening.',
    engagementLevel: 'High',
    feedbackScore: 4.7,
    whatWorked: '• Free screening was the primary draw\n• Children corner kept families longer\n• Local language communication was effective\n• Partnership with pharmacies for discounted medicines',
    whatDidntWork: '• Parking was insufficient\n• Waiting time exceeded 45 mins at peak\n• Some signage was unclear',
    unexpectedInsights: 'Mental health booth (added last minute) was the second most visited. Many came specifically for dental screening.',
    immediateOutcomes: '280 screenings, 45 referrals, 500 health kits distributed, 3 emergency cases identified and referred.',
    followUpActions: 'Follow up with 45 referred individuals. Plan dental camp based on demand. Monthly health newsletters.',
    longTermValue: 'Established trust with local community. Created health awareness baseline data for the area.',
    recommendations: '• Add dental screening next time\n• Expand mental health offerings\n• Use token system to manage wait times\n• Arrange shuttle service from nearby areas',
    tags: ['health', 'community', 'outreach', 'screening', 'awareness'],
    status: 'completed',
    createdAt: '2026-01-25T09:00:00Z',
    updatedAt: '2026-02-05T16:00:00Z'
  },
  {
    id: 'apl-004',
    name: 'Digital Skills Bootcamp for Educators',
    date: '2026-03-10',
    endDate: '2026-03-14',
    location: 'Online (Zoom + LMS)',
    type: 'Training',
    duration: '5 days',
    targetAudience: 'School and college educators',
    expectedParticipants: 200,
    actualParticipants: 187,
    budgetPlanned: 180000,
    budgetActual: 145000,
    objectives: 'Upskill educators in digital teaching tools, online assessment methods, and content creation.',
    outcomes: '187 educators certified. Average post-test score improvement of 40%. 12 digital content projects created.',
    successRating: 8,
    activities: '• Daily live sessions (3 hours)\n• Hands-on tool practice\n• Peer teaching demonstrations\n• Group project: Create digital lesson\n• Certification assessment',
    resourceUtilization: '5 expert trainers, 2 tech support staff. LMS platform subscription. Recording equipment.',
    timelineAdherence: 'Day 3 extended by 30 minutes for extra Q&A. Otherwise on track.',
    demographics: '70% school teachers, 30% college faculty. 65% female. Age range 28-55. Urban and rural mix.',
    engagementLevel: 'Medium-High',
    feedbackScore: 4.3,
    whatWorked: '• Breakout rooms for practice sessions\n• Recorded sessions for async access\n• Peer teaching demo was highly motivating\n• Certificate incentivized completion',
    whatDidntWork: '• Some participants had poor internet\n• Advanced learners felt pace was slow\n• Group project coordination was challenging online',
    unexpectedInsights: 'Rural teachers were more enthusiastic and engaged. Canva was the most requested tool to learn.',
    immediateOutcomes: '187 certifications issued. 12 sample digital lessons created. WhatsApp community of 200 educators formed.',
    followUpActions: 'Share resource library. Plan advanced bootcamp. Monthly tip-sharing sessions.',
    longTermValue: 'Created a network of digitally skilled educators who can train others. Multiplier effect expected.',
    recommendations: '• Offer tiered tracks (beginner/advanced)\n• Provide internet stipend for rural participants\n• Add more tool-specific deep dives\n• Schedule sessions avoiding exam periods',
    tags: ['education', 'digital', 'training', 'online', 'bootcamp'],
    status: 'completed',
    createdAt: '2026-03-18T10:00:00Z',
    updatedAt: '2026-03-25T11:00:00Z'
  },
  {
    id: 'apl-005',
    name: 'Green Earth Environmental Rally',
    date: '2026-04-22',
    endDate: '2026-04-22',
    location: 'City Park to Town Hall, Bangalore',
    type: 'Campaign',
    duration: '1 day',
    targetAudience: 'General public, environmentalists, students',
    expectedParticipants: 1000,
    actualParticipants: 1250,
    budgetPlanned: 200000,
    budgetActual: 225000,
    objectives: 'Raise environmental awareness, promote green pledges, and advocate for city-wide recycling policy.',
    outcomes: '1250 participants marched. 800 green pledges signed. Coverage in 5 media outlets. Petition with 2000 signatures submitted.',
    successRating: 10,
    activities: '• Rally march (5 km route)\n• Street performances on climate change\n• Pledge signing booth\n• Tree planting ceremony\n• Public address by environmental leaders',
    resourceUtilization: '50 volunteers, police coordination, 3 sound trucks, printing for banners/placards. Media coordination team.',
    timelineAdherence: 'Started 20 minutes late due to crowd management. Ended on time.',
    demographics: 'All ages. Students 45%, Working professionals 30%, Others 25%. Very diverse participation.',
    engagementLevel: 'Very High',
    feedbackScore: 4.9,
    whatWorked: '• Social media campaign built massive pre-event buzz\n• Street performances were crowd favorites\n• Celebrity environmentalist appearance boosted turnout\n• Tree planting was symbolic and photogenic',
    whatDidntWork: '• Route was slightly too long for elderly participants\n• Water stations were insufficient\n• Post-event cleanup took longer than planned',
    unexpectedInsights: 'Corporate employees formed largest single group. Many brought families making it a community event.',
    immediateOutcomes: '5 media features, 2000 signature petition, 800 pledges, 50 trees planted.',
    followUpActions: 'Submit petition to municipal council. Monthly clean-up drives. Social media campaign continuation.',
    longTermValue: 'Positioned organization as key environmental advocate. Built coalition of 15 partner organizations.',
    recommendations: '• Shorten route or add rest stops\n• Triple water station capacity\n• Plan post-event cleanup crew in advance\n• Leverage media coverage for ongoing campaign',
    tags: ['environment', 'campaign', 'rally', 'community', 'awareness'],
    status: 'completed',
    createdAt: '2026-04-25T09:00:00Z',
    updatedAt: '2026-04-28T15:00:00Z'
  }
];

class DataStore {
  constructor() {
    this._data = this._load();
    if (this._data.apls.length === 0) {
      this._data.apls = SAMPLE_APLS;
      this._save();
    }
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn('Failed to load data:', e); }
    return { apls: [], version: 1 };
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
  }

  getAllAPLs() { return [...this._data.apls].sort((a, b) => new Date(b.date) - new Date(a.date)); }

  getAPL(id) { return this._data.apls.find(a => a.id === id) || null; }

  createAPL(apl) {
    apl.id = 'apl-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    apl.createdAt = new Date().toISOString();
    apl.updatedAt = apl.createdAt;
    apl.status = apl.status || 'completed';
    apl.tags = apl.tags || [];
    this._data.apls.push(apl);
    this._save();
    return apl;
  }

  updateAPL(id, updates) {
    const idx = this._data.apls.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this._data.apls[idx] = { ...this._data.apls[idx], ...updates, updatedAt: new Date().toISOString() };
    this._save();
    return this._data.apls[idx];
  }

  deleteAPL(id) {
    this._data.apls = this._data.apls.filter(a => a.id !== id);
    this._save();
  }

  searchAPLs(query) {
    const q = query.toLowerCase();
    return this.getAllAPLs().filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.location || '').toLowerCase().includes(q) ||
      (a.type || '').toLowerCase().includes(q) ||
      (a.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (a.objectives || '').toLowerCase().includes(q) ||
      (a.whatWorked || '').toLowerCase().includes(q) ||
      (a.whatDidntWork || '').toLowerCase().includes(q) ||
      (a.recommendations || '').toLowerCase().includes(q)
    );
  }

  filterAPLs(filters) {
    let apls = this.getAllAPLs();
    if (filters.type && filters.type !== 'all') apls = apls.filter(a => a.type === filters.type);
    if (filters.status && filters.status !== 'all') apls = apls.filter(a => a.status === filters.status);
    if (filters.minRating) apls = apls.filter(a => (a.successRating || 0) >= filters.minRating);
    if (filters.tag) apls = apls.filter(a => (a.tags || []).includes(filters.tag));
    return apls;
  }

  getStats() {
    const apls = this._data.apls;
    const totalParticipants = apls.reduce((s, a) => s + (a.actualParticipants || 0), 0);
    const totalBudget = apls.reduce((s, a) => s + (a.budgetActual || 0), 0);
    const avgRating = apls.length ? (apls.reduce((s, a) => s + (a.successRating || 0), 0) / apls.length).toFixed(1) : 0;
    const avgFeedback = apls.length ? (apls.reduce((s, a) => s + (a.feedbackScore || 0), 0) / apls.length).toFixed(1) : 0;
    const types = {};
    apls.forEach(a => { types[a.type] = (types[a.type] || 0) + 1; });
    const tags = {};
    apls.forEach(a => (a.tags || []).forEach(t => { tags[t] = (tags[t] || 0) + 1; }));
    const monthlyData = {};
    apls.forEach(a => {
      const m = a.date.substring(0, 7);
      if (!monthlyData[m]) monthlyData[m] = { count: 0, participants: 0, budget: 0 };
      monthlyData[m].count++;
      monthlyData[m].participants += a.actualParticipants || 0;
      monthlyData[m].budget += a.budgetActual || 0;
    });
    return { total: apls.length, totalParticipants, totalBudget, avgRating, avgFeedback, types, tags, monthlyData };
  }

  getAllTags() {
    const tags = new Set();
    this._data.apls.forEach(a => (a.tags || []).forEach(t => tags.add(t)));
    return [...tags].sort();
  }

  getAllTypes() {
    const types = new Set();
    this._data.apls.forEach(a => { if (a.type) types.add(a.type); });
    return [...types].sort();
  }

  exportData() { return JSON.stringify(this._data, null, 2); }

  importData(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (data.apls && Array.isArray(data.apls)) {
      this._data = data;
      this._save();
      return true;
    }
    throw new Error('Invalid data format');
  }

  getCount() { return this._data.apls.length; }
}

export const store = new DataStore();
