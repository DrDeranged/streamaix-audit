import type { AgentPersonality, AgentMetadata } from '../types/agents';

// Realistic first names
const firstNames = [
  'Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery',
  'Jamie', 'Quinn', 'Reese', 'Skyler', 'Phoenix', 'Dakota', 'River', 'Sage',
  'Blake', 'Cameron', 'Drew', 'Ellis', 'Finley', 'Gray', 'Harper', 'Hayden',
  'Jules', 'Kai', 'Logan', 'Micah', 'Noah', 'Parker', 'Rowan', 'Ryan',
  'Sawyer', 'Spencer', 'Tyler', 'Val', 'Winter', 'Zion', 'Luna', 'Maya',
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Evelyn', 'Henry', 'Abigail', 'Alexander', 'Emily', 'Michael',
  'Elizabeth', 'Daniel', 'Sofia', 'Matthew', 'Madison', 'Aiden', 'Avery'
];

// Crypto/tech-themed descriptors
const descriptors = [
  'crypto', 'defi', 'nft', 'web3', 'blockchain', 'trader', 'analyst',
  'researcher', 'investor', 'hodler', 'whale', 'degen', 'builder', 'dev',
  'protocol', 'market', 'token', 'chain', 'layer2', 'eth', 'btc', 'alt',
  'dao', 'yield', 'farm', 'stake', 'validator', 'node', 'alpha', 'beta'
];

// Role-based usernames
const roles = [
  'researcher', 'analyst', 'trader', 'investor', 'collector', 'builder',
  'developer', 'strategist', 'specialist', 'expert', 'hunter', 'seeker',
  'curator', 'monitor', 'watcher', 'scout', 'oracle', 'guide', 'sage'
];

// Crypto expertise areas
const expertiseAreas = [
  'DeFi', 'NFTs', 'Layer 2', 'Tokenomics', 'MEV', 'DAOs', 'Stablecoins',
  'Gaming', 'Social', 'Infrastructure', 'Privacy', 'Security', 'Scalability',
  'Interoperability', 'Governance', 'Yield Farming', 'Liquidity Mining',
  'Flash Loans', 'Derivatives', 'Perpetuals', 'Options', 'Lending', 'Borrowing'
];

// Bio templates
const bioTemplates = [
  (expertise: string) => `${expertise} researcher | Building the future of web3`,
  (expertise: string) => `Professional ${expertise.toLowerCase()} analyst | Sharing alpha daily`,
  (expertise: string) => `${expertise} enthusiast | DYOR advocate`,
  (expertise: string) => `Full-time ${expertise.toLowerCase()} trader | Not financial advice`,
  (expertise: string) => `${expertise} specialist | On-chain data nerd`,
  (expertise: string) => `${expertise} expert | Decentralization maximalist`,
  (expertise: string) => `Exploring ${expertise.toLowerCase()} protocols | Long-term investor`,
  (expertise: string) => `${expertise} contributor | Building in public`,
  (expertise: string) => `${expertise} observer | Connecting the dots`,
  (expertise: string) => `${expertise} researcher | Evidence-based investing`,
];

// Timezones for realistic activity patterns
const timezones = [
  'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney', 'America/Chicago',
  'Europe/Paris', 'Asia/Hong_Kong', 'America/Denver', 'Europe/Amsterdam'
];

// Trading styles
const tradingStyles = ['scalper', 'swing', 'position', 'hodl', 'degen', 'conservative', 'balanced'];

// Content focus areas
const contentFocuses = ['technical', 'fundamental', 'narrative', 'onchain', 'sentiment', 'mixed'];

// Risk tolerance levels
type RiskTolerance = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
const riskLevels: RiskTolerance[] = ['very-low', 'low', 'medium', 'high', 'very-high'];

// Activity levels
type ActivityLevel = 'inactive' | 'casual' | 'regular' | 'active' | 'hyperactive';
const activityLevels: ActivityLevel[] = ['casual', 'regular', 'active', 'hyperactive'];

// Skill levels
type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
const skillLevels: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUsername(): string {
  const type = Math.random();
  
  if (type < 0.3) {
    // Type 1: descriptor_name (e.g., crypto_alex)
    return `${randomChoice(descriptors)}_${randomChoice(firstNames).toLowerCase()}`;
  } else if (type < 0.6) {
    // Type 2: name_role (e.g., alex_trader)
    return `${randomChoice(firstNames).toLowerCase()}_${randomChoice(roles)}`;
  } else if (type < 0.8) {
    // Type 3: descriptor_role (e.g., defi_analyst)
    return `${randomChoice(descriptors)}_${randomChoice(roles)}`;
  } else {
    // Type 4: name + number (e.g., alex_crypto_21)
    return `${randomChoice(firstNames).toLowerCase()}_${randomChoice(descriptors)}_${randomInt(1, 99)}`;
  }
}

function generateBio(expertise: string[]): string {
  const primaryExpertise = expertise[0];
  const template = randomChoice(bioTemplates);
  return template(primaryExpertise);
}

function generatePersonality(): AgentPersonality {
  const risk = randomChoice(riskLevels);
  const activity = randomChoice(activityLevels);
  const trading = randomChoice(tradingStyles);
  const content = randomChoice(contentFocuses);
  const expertise = [
    randomChoice(expertiseAreas),
    randomChoice(expertiseAreas),
    randomChoice(expertiseAreas)
  ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

  return {
    riskTolerance: risk,
    activityLevel: activity,
    expertise,
    tradingStyle: trading,
    contentFocus: content,
    confidenceBias: Math.random(), // 0-1, affects how confident they are
    fomoProne: Math.random() > 0.5,
    contrarian: Math.random() > 0.7,
    longTermOriented: Math.random() > 0.6,
  };
}

function generateMetadata(personality: AgentPersonality): AgentMetadata {
  const timezone = randomChoice(timezones);
  const skill = randomChoice(skillLevels);
  
  // Sleep schedule based on timezone (8 hours, varies by person)
  const sleepStart = randomInt(22, 2); // 10 PM to 2 AM
  const sleepEnd = (sleepStart + 8) % 24;
  
  // Activity multipliers based on activity level
  const activityMultipliers: Record<ActivityLevel, number> = {
    inactive: 0.1,
    casual: 0.3,
    regular: 0.6,
    active: 0.9,
    hyperactive: 1.5
  };
  
  const activityMultiplier = activityMultipliers[personality.activityLevel];
  
  return {
    timezone,
    sleepSchedule: {
      start: sleepStart,
      end: sleepEnd,
    },
    skillLevel: skill,
    behaviorPatterns: {
      averageSessionLength: randomInt(15, 180), // minutes
      actionsPerSession: Math.floor(randomInt(3, 20) * activityMultiplier),
      preferredTimeSlots: generatePreferredTimeSlots(), // Array of hours [9, 10, 14, 18, 20]
      weekendActivity: Math.random() > 0.5, // More active on weekends?
    },
    createdTimestamp: Date.now(),
  };
}

function generatePreferredTimeSlots(): number[] {
  const slots: number[] = [];
  const numSlots = randomInt(3, 6);
  
  for (let i = 0; i < numSlots; i++) {
    const hour = randomInt(6, 23); // 6 AM to 11 PM
    if (!slots.includes(hour)) {
      slots.push(hour);
    }
  }
  
  return slots.sort((a, b) => a - b);
}

function generateStreamPoints(index: number, total: number): number {
  // Create a power-law distribution (few whales, many casual users)
  const percentile = index / total;
  
  if (percentile < 0.05) {
    // Top 5% - Whales
    return randomInt(50000, 200000);
  } else if (percentile < 0.15) {
    // Next 10% - Power users
    return randomInt(20000, 50000);
  } else if (percentile < 0.40) {
    // Next 25% - Active users
    return randomInt(5000, 20000);
  } else {
    // Bottom 60% - Casual users
    return randomInt(1000, 5000);
  }
}

function generateAvatarUrl(username: string): string {
  // Use DiceBear API for consistent, unique avatars
  const seed = username;
  const styles = ['avataaars', 'bottts', 'personas', 'pixel-art', 'identicon'];
  const style = randomChoice(styles);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export interface AgentPersona {
  username: string;
  bio: string;
  avatar: string;
  personality: AgentPersonality;
  metadata: AgentMetadata;
  streamPoints: number;
  isAiAgent: boolean;
}

export function generateAgentPersonas(count: number): AgentPersona[] {
  const personas: AgentPersona[] = [];
  const usedUsernames = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let username = generateUsername();
    
    // Ensure unique usernames
    while (usedUsernames.has(username)) {
      username = generateUsername();
    }
    usedUsernames.add(username);
    
    const personality = generatePersonality();
    const metadata = generateMetadata(personality);
    const bio = generateBio(personality.expertise);
    const avatar = generateAvatarUrl(username);
    const streamPoints = generateStreamPoints(i, count);
    
    personas.push({
      username,
      bio,
      avatar,
      personality,
      metadata,
      streamPoints,
      isAiAgent: true,
    });
  }
  
  return personas;
}

export function generateSingleAgentPersona(): AgentPersona {
  return generateAgentPersonas(1)[0];
}
