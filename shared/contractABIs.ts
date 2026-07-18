export const STREAM_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function totalSupply() view returns (uint256)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function MINTER_ROLE() view returns (bytes32)",
  "function RESOLVER_ROLE() view returns (bytes32)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const BOUNTY_BOARD_ABI = [
  "function createBounty(uint256 reward, uint256 deadline) returns (uint256)",
  "function claimBounty(uint256 bountyId)",
  "function completeBounty(uint256 bountyId)",
  "function addTip(uint256 bountyId, uint256 amount)",
  "function getBounty(uint256 bountyId) view returns (tuple(address creator, uint256 reward, uint256 tipPool, uint256 deadline, address claimer, bool completed, bool cancelled))",
  "function getUserBounties(address user) view returns (uint256[])",
  "event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 reward, uint256 deadline)",
  "event BountyClaimed(uint256 indexed bountyId, address indexed claimer)",
  "event BountyCompleted(uint256 indexed bountyId, address indexed claimer, uint256 totalReward)",
  "event TipAdded(uint256 indexed bountyId, address indexed tipper, uint256 amount)"
];

export const SUMMARY_NFT_ABI = [
  "function mintSummaryNFT(address to, string memory ipfsHash, string memory arweaveId) returns (uint256)",
  "function getSummaryData(uint256 tokenId) view returns (tuple(string ipfsHash, string arweaveId, uint256 timestamp))",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function MINTER_ROLE() view returns (bytes32)",
  "event SummaryMinted(uint256 indexed tokenId, address indexed owner, string ipfsHash, string arweaveId)"
];

export const STAKING_ABI = [
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function claimRewards()",
  "function getStakedAmount(address user) view returns (uint256)",
  "function getPendingRewards(address user) view returns (uint256)",
  "function getTotalStaked() view returns (uint256)",
  "function REWARD_RATE() view returns (uint256)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 amount)"
];
