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
  {
    fid: 5650, // Vitalik Buterin
    username: 'vitalik.eth',
    displayName: 'Vitalik Buterin',
    bio: 'Ethereum co-founder',
    ecosystem: ['ethereum', 'protocol'],
    priority: 10
  },
  {
    fid: 3, // Dan Romero
    username: 'dwr.eth', 
    displayName: 'Dan Romero',
    bio: 'Farcaster co-founder',
    ecosystem: ['farcaster', 'social'],
    priority: 9
  },
  {
    fid: 6806, // Jesse Pollak
    username: 'jessepollak',
    displayName: 'Jesse Pollak',
    bio: 'Base protocol lead at Coinbase',
    ecosystem: ['base', 'coinbase'],
    priority: 8
  },
  {
    fid: 2, // Balaji
    username: 'balajis.eth',
    displayName: 'Balaji Srinivasan',
    bio: 'Former CTO of Coinbase',
    ecosystem: ['bitcoin', 'network-state'],
    priority: 8
  },
  {
    fid: 239, // Brian Armstrong
    username: 'barmstrong',
    displayName: 'Brian Armstrong',
    bio: 'Coinbase CEO',
    ecosystem: ['coinbase', 'exchange'],
    priority: 7
  },
  {
    fid: 680, // Hayden Adams
    username: 'haydenzadams',
    displayName: 'Hayden Adams',
    bio: 'Uniswap founder',
    ecosystem: ['uniswap', 'defi'],
    priority: 7
  },
  {
    fid: 193, // Antonio
    username: 'antimo',
    displayName: 'Antonio',
    bio: 'Base ecosystem developer',
    ecosystem: ['base', 'developer'],
    priority: 6
  },
  {
    fid: 451, // Linda Xie
    username: 'lindaxie',
    displayName: 'Linda Xie',
    bio: 'Scalar Capital co-founder',
    ecosystem: ['investment', 'defi'],
    priority: 6
  },
  {
    fid: 3621, // Punk6529
    username: 'punk6529',
    displayName: 'Punk6529',
    bio: 'NFT collector and open metaverse advocate',
    ecosystem: ['nft', 'metaverse'],
    priority: 5
  },
  {
    fid: 1214, // Stani
    username: 'stani.lens',
    displayName: 'Stani Kulechov',
    bio: 'Aave founder',
    ecosystem: ['aave', 'defi'],
    priority: 5
  }
];

// Get top accounts sorted by priority
export function getTopAccounts(limit = 10): TopAccount[] {
  return TOP_CRYPTO_ACCOUNTS
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

// Get account by FID
export function getAccountByFid(fid: number): TopAccount | undefined {
  return TOP_CRYPTO_ACCOUNTS.find(account => account.fid === fid);
}

// Get FIDs for data fetching
export function getTopFids(limit = 10): number[] {
  return getTopAccounts(limit).map(account => account.fid);
}