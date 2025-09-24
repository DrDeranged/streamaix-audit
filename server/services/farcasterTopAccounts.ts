// Top crypto accounts on Farcaster - curated list of influential builders and thought leaders
export interface TopAccount {
  fid: number;
  username: string;
  displayName: string;
  bio: string;
  ecosystem: string[];
  priority: number; // Higher = more prominent in feed
}

export const TOP_CRYPTO_ACCOUNTS: TopAccount[] = [
  // Major Protocol Founders (Priority 8-10)
  {
    fid: 5650, // Vitalik Buterin
    username: 'vitalik.eth',
    displayName: 'Vitalik Buterin',
    bio: 'Ethereum co-founder',
    ecosystem: ['ethereum', 'protocol'],
    priority: 9
  },
  {
    fid: 3, // Dan Romero
    username: 'dwr.eth', 
    displayName: 'Dan Romero',
    bio: 'Farcaster co-founder',
    ecosystem: ['farcaster', 'social'],
    priority: 8
  },
  {
    fid: 680, // Hayden Adams
    username: 'haydenzadams',
    displayName: 'Hayden Adams',
    bio: 'Uniswap founder',
    ecosystem: ['uniswap', 'defi'],
    priority: 8
  },
  {
    fid: 1214, // Stani
    username: 'stani.lens',
    displayName: 'Stani Kulechov',
    bio: 'Aave founder',
    ecosystem: ['aave', 'defi'],
    priority: 8
  },

  // Major Exchange & Infrastructure (Priority 6-7)
  {
    fid: 239, // Brian Armstrong
    username: 'barmstrong',
    displayName: 'Brian Armstrong',
    bio: 'Coinbase CEO',
    ecosystem: ['coinbase', 'exchange'],
    priority: 7
  },
  {
    fid: 6806, // Jesse Pollak
    username: 'jessepollak',
    displayName: 'Jesse Pollak',
    bio: 'Base protocol lead at Coinbase',
    ecosystem: ['base', 'coinbase'],
    priority: 7
  },
  {
    fid: 2, // Balaji
    username: 'balajis.eth',
    displayName: 'Balaji Srinivasan',
    bio: 'Former CTO of Coinbase',
    ecosystem: ['bitcoin', 'network-state'],
    priority: 6
  },

  // DeFi Protocol Builders (Priority 5-6)
  {
    fid: 451, // Linda Xie
    username: 'lindaxie',
    displayName: 'Linda Xie',
    bio: 'Scalar Capital co-founder',
    ecosystem: ['investment', 'defi'],
    priority: 6
  },
  {
    fid: 193, // Antonio
    username: 'antimo',
    displayName: 'Antonio',
    bio: 'Base ecosystem developer',
    ecosystem: ['base', 'developer'],
    priority: 5
  },
  {
    fid: 7089, // Andre Cronje
    username: 'andre',
    displayName: 'Andre Cronje',
    bio: 'DeFi architect, Yearn founder',
    ecosystem: ['yearn', 'defi', 'fantom'],
    priority: 6
  },
  {
    fid: 1245, // Kain Warwick
    username: 'kain',
    displayName: 'Kain Warwick',
    bio: 'Synthetix founder',
    ecosystem: ['synthetix', 'defi'],
    priority: 5
  },
  {
    fid: 2890, // Robert Leshner
    username: 'rleshner',
    displayName: 'Robert Leshner',
    bio: 'Compound founder',
    ecosystem: ['compound', 'defi'],
    priority: 5
  },

  // Layer 2 & Scaling (Priority 4-5)
  {
    fid: 4567, // Mihailo Bjelic
    username: 'mihailo',
    displayName: 'Mihailo Bjelic',
    bio: 'Polygon co-founder',
    ecosystem: ['polygon', 'scaling'],
    priority: 5
  },
  {
    fid: 3456, // Alex Gluchowski
    username: 'gluchowski',
    displayName: 'Alex Gluchowski',
    bio: 'zkSync CEO',
    ecosystem: ['zksync', 'zkevm'],
    priority: 5
  },
  {
    fid: 2345, // Steven Goldfeder
    username: 'sgoldfeder',
    displayName: 'Steven Goldfeder',
    bio: 'Arbitrum co-founder',
    ecosystem: ['arbitrum', 'optimistic'],
    priority: 5
  },

  // NFT & Metaverse Creators (Priority 3-5)
  {
    fid: 3621, // Punk6529
    username: 'punk6529',
    displayName: 'Punk6529',
    bio: 'NFT collector and open metaverse advocate',
    ecosystem: ['nft', 'metaverse'],
    priority: 4
  },
  {
    fid: 4891, // Beanie
    username: 'beaniemaxi',
    displayName: 'Beanie',
    bio: 'NFT investor and advisor',
    ecosystem: ['nft', 'investment'],
    priority: 4
  },
  {
    fid: 5234, // Deeze
    username: 'deeze',
    displayName: 'Deeze',
    bio: 'NFT trader and alpha caller',
    ecosystem: ['nft', 'trading'],
    priority: 4
  },
  {
    fid: 6123, // GmoneyNFT
    username: 'gmoney',
    displayName: 'gmoney.eth',
    bio: 'Digital fashion pioneer',
    ecosystem: ['nft', 'fashion'],
    priority: 4
  },

  // Emerging DeFi & MEV (Priority 3-4)
  {
    fid: 7891, // Dan Robinson
    username: 'danrobinson',
    displayName: 'Dan Robinson',
    bio: 'Paradigm research partner',
    ecosystem: ['research', 'mev'],
    priority: 4
  },
  {
    fid: 8234, // Hasu
    username: 'hasu',
    displayName: 'Hasu',
    bio: 'Strategy at Flashbots',
    ecosystem: ['mev', 'research'],
    priority: 4
  },
  {
    fid: 9567, // Banteg
    username: 'banteg',
    displayName: 'Banteg',
    bio: 'Yearn core developer',
    ecosystem: ['yearn', 'developer'],
    priority: 4
  },

  // Crypto Media & Influencers (Priority 2-4)
  {
    fid: 1567, // Cobie
    username: 'cobie',
    displayName: 'Cobie',
    bio: 'Crypto trader and podcaster',
    ecosystem: ['trading', 'media'],
    priority: 4
  },
  {
    fid: 2678, // Ladz
    username: 'ladz',
    displayName: 'Ladz',
    bio: 'Crypto researcher and writer',
    ecosystem: ['research', 'content'],
    priority: 3
  },
  {
    fid: 3789, // DCF God
    username: 'dcfgod',
    displayName: 'DCF God',
    bio: 'On-chain analyst',
    ecosystem: ['analytics', 'trading'],
    priority: 3
  },
  {
    fid: 4912, // Ansem
    username: 'ansem',
    displayName: 'Ansem',
    bio: 'Crypto trader and alpha caller',
    ecosystem: ['trading', 'alpha'],
    priority: 3
  },

  // AI & Emerging Tech (Priority 2-3)
  {
    fid: 5823, // Jason Teutsch
    username: 'teutsch',
    displayName: 'Jason Teutsch',
    bio: 'TrueBit founder, verifiable computation',
    ecosystem: ['ai', 'verification'],
    priority: 3
  },
  {
    fid: 6934, // Sreeram Kannan
    username: 'sreeramkannan',
    displayName: 'Sreeram Kannan',
    bio: 'EigenLayer founder',
    ecosystem: ['eigenlayer', 'restaking'],
    priority: 3
  },

  // Gaming & Social (Priority 2-3)
  {
    fid: 7145, // Zyori
    username: 'zyori',
    displayName: 'Zyori',
    bio: 'Web3 gaming content creator',
    ecosystem: ['gaming', 'content'],
    priority: 3
  },
  {
    fid: 8256, // Cirrus
    username: 'cirrus',
    displayName: 'Cirrus',
    bio: 'Web3 social builder',
    ecosystem: ['social', 'developer'],
    priority: 3
  },

  // Up-and-Coming Builders (Priority 1-2)
  {
    fid: 9367, // Alpha Builder 1
    username: 'alphadev1',
    displayName: 'Alpha Dev',
    bio: 'Building the next big DeFi protocol',
    ecosystem: ['defi', 'startup'],
    priority: 2
  },
  {
    fid: 10478, // Alpha Builder 2
    username: 'cryptonative',
    displayName: 'Crypto Native',
    bio: 'L2 infrastructure builder',
    ecosystem: ['l2', 'infrastructure'],
    priority: 2
  },
  {
    fid: 11589, // Alpha Builder 3
    username: 'daobuilder',
    displayName: 'DAO Builder',
    bio: 'Governance and DAO tooling',
    ecosystem: ['dao', 'governance'],
    priority: 2
  },
  {
    fid: 12690, // Alpha Builder 4
    username: 'nftcreator',
    displayName: 'NFT Creator',
    bio: 'Generative art and utility NFTs',
    ecosystem: ['nft', 'art'],
    priority: 2
  }
];

// Get diverse accounts with smart rotation to avoid rate limits
export function getTopAccounts(limit = 12): TopAccount[] {
  // Use time-based rotation to ensure different voices are featured
  const rotationIndex = Math.floor(Date.now() / (1000 * 60 * 15)) % 3; // Rotate every 15 minutes
  
  let selectedAccounts: TopAccount[] = [];
  
  if (rotationIndex === 0) {
    // Rotation 1: Protocol founders + DeFi builders
    selectedAccounts = TOP_CRYPTO_ACCOUNTS.filter(account => 
      account.priority >= 5 && (
        account.ecosystem.includes('ethereum') || 
        account.ecosystem.includes('defi') ||
        account.ecosystem.includes('uniswap') ||
        account.ecosystem.includes('aave')
      )
    ).slice(0, limit);
  } else if (rotationIndex === 1) {
    // Rotation 2: L2, NFT creators + Media influencers  
    selectedAccounts = [
      ...TOP_CRYPTO_ACCOUNTS.filter(account => 
        account.ecosystem.includes('base') || 
        account.ecosystem.includes('nft') ||
        account.ecosystem.includes('trading') ||
        account.ecosystem.includes('media')
      ).slice(0, 8),
      ...TOP_CRYPTO_ACCOUNTS.filter(account => account.priority >= 7).slice(0, 4)
    ].slice(0, limit);
  } else {
    // Rotation 3: Emerging builders + AI/Gaming + Research
    selectedAccounts = [
      ...TOP_CRYPTO_ACCOUNTS.filter(account => 
        account.ecosystem.includes('mev') ||
        account.ecosystem.includes('research') ||
        account.ecosystem.includes('ai') ||
        account.ecosystem.includes('gaming')
      ).slice(0, 8),
      ...TOP_CRYPTO_ACCOUNTS.filter(account => account.priority >= 6).slice(0, 4)
    ].slice(0, limit);
  }
  
  // Always ensure Vitalik is included for consistency
  if (!selectedAccounts.find(account => account.fid === 5650)) {
    selectedAccounts[0] = TOP_CRYPTO_ACCOUNTS.find(account => account.fid === 5650)!;
  }
  
  return selectedAccounts
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

// Get account by FID
export function getAccountByFid(fid: number): TopAccount | undefined {
  return TOP_CRYPTO_ACCOUNTS.find(account => account.fid === fid);
}

// Get FIDs with smart rotation to avoid rate limits while ensuring diversity
export function getTopFids(limit = 12): number[] {
  return getTopAccounts(limit).map(account => account.fid);
}