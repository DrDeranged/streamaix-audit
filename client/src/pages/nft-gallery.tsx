import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Navigation } from '@/components/ui/navigation';
import { useContracts } from '@/hooks/useContracts';
import { useWeb3 } from '@/hooks/useWeb3';
import { useAuth } from '@/hooks/useAuth';
import { 
  Image, 
  ExternalLink, 
  Share, 
  Download,
  Eye,
  Zap,
  Globe,
  Calendar,
  Hash,
  Copy,
  Award,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    summary?: string;
    keyInsights?: string[];
    chapters?: Array<{title: string, content: string, timestamp: string}>;
    metadata?: any;
  };
}

export default function NFTGallery() {
  const { isAuthenticated } = useAuth();
  const { wallet, isConnected, formatAddress } = useWeb3();
  const { userNFTs, isLoading, mintSummaryNFT } = useContracts();
  
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isMinting, setIsMinting] = useState(false);

  // Mock additional NFT data for demonstration
  const [featuredNFTs] = useState([
    {
      tokenId: 'demo_1',
      name: 'Web3 Revolution Explained',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=web3revolution&backgroundColor=6366f1,8b5cf6,a855f7&scale=80',
      creator: '0x742d35Cc...C2D7',
      price: '2.5 ETH',
      rarity: 'Epic',
      views: 1247,
      platform: 'YouTube',
    },
    {
      tokenId: 'demo_2',
      name: 'DeFi Protocols Deep Dive',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=defiprotocols&backgroundColor=8b5cf6,a855f7,ec4899&scale=80',
      creator: '0x891b23C...F8E2',
      price: '1.8 ETH',
      rarity: 'Rare',
      views: 892,
      platform: 'Podcast',
    },
    {
      tokenId: 'demo_3',
      name: 'NFT Market Analysis 2024',
      image: 'https://api.dicebear.com/7.x/shapes/svg?seed=nftmarket2024&backgroundColor=a855f7,ec4899,f97316&scale=80',
      creator: '0x234c89D...A7B4',
      price: '3.2 ETH',
      rarity: 'Legendary',
      views: 2156,
      platform: 'Twitter',
    },
  ]);

  const handleMintDemo = async () => {
    setIsMinting(true);
    try {
      const demoSummary = {
        title: 'Demo AI Summary NFT',
        content: 'This is a demonstration of our AI-powered summary minting system. In a real scenario, this would contain a comprehensive analysis of video or audio content.',
        originalUrl: 'https://example.com/demo-content',
        keyInsights: [
          'AI-generated summaries provide instant value',
          'NFTs enable content ownership and monetization',
          'Decentralized storage ensures permanence',
        ],
        chapters: [
          { title: 'Introduction', content: 'Overview of the topic', timestamp: '00:00' },
          { title: 'Main Content', content: 'Core discussion points', timestamp: '05:30' },
          { title: 'Conclusion', content: 'Key takeaways', timestamp: '12:45' },
        ],
        metadata: {
          processingTime: '45 seconds',
          accuracy: 94,
          language: 'English',
        },
      };

      await mintSummaryNFT(demoSummary);
    } catch (error) {
      console.error('Demo minting failed:', error);
    } finally {
      setIsMinting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30';
      case 'Epic': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Rare': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'Common': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <Navigation />
        <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
            <CardContent className="p-8 text-center">
              <Image className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
              <p className="text-gray-300 mb-6">Please sign in to view and manage your NFT collection.</p>
              <Button className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">NFT Gallery</h1>
              <p className="text-gray-400">Your AI-generated summary NFTs and marketplace</p>
            </div>
            <Button
              onClick={handleMintDemo}
              disabled={isMinting || !isConnected}
              className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600"
            >
              {isMinting ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Minting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mint Demo NFT
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">Your NFTs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{userNFTs.length}</p>
                  <p className="text-gray-400 text-sm">Owned</p>
                </div>
                <Award className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">Total Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
                  <p className="text-green-400 text-sm">+15 today</p>
                </div>
                <Image className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">Floor Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">0.15 ETH</p>
                  <p className="text-blue-400 text-sm">~$387</p>
                </div>
                <Globe className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">Volume (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">45.8 ETH</p>
                  <p className="text-yellow-400 text-sm">142 sales</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Your NFTs Section */}
        {userNFTs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Collection</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userNFTs.map((nft, index) => (
                <motion.div
                  key={nft.tokenId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg group hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-t-lg flex items-center justify-center">
                        {nft.metadata?.image ? (
                          <img
                            src={nft.metadata.image}
                            alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        ) : (
                          <Image className="h-16 w-16 text-gray-900 dark:text-white/50" />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-gray-900 dark:text-white font-semibold truncate">
                            {nft.metadata?.name || `Summary NFT #${nft.tokenId}`}
                          </h3>
                          <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                            #{nft.tokenId}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {nft.metadata?.description || 'AI-generated content summary'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(nft.ipfsHash)}
                              className="h-8 w-8 p-0 hover:bg-white/10"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${nft.ipfsHash}`, '_blank')}
                              className="h-8 w-8 p-0 hover:bg-white/10"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-purple-600 to-blue-600"
                                onClick={() => setSelectedNFT(nft)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-white/20 text-gray-900 dark:text-white max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  {nft.metadata?.name || `NFT #${nft.tokenId}`}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {nft.metadata?.image && (
                                  <img
                                    src={nft.metadata.image}
                                    alt={nft.metadata.name}
                                    className="w-full h-64 object-cover rounded-lg"
                                  />
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-gray-400 text-sm">Token ID</p>
                                    <p className="text-gray-900 dark:text-white">{nft.tokenId}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 text-sm">Storage</p>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">IPFS</Badge>
                                      <Badge variant="outline" className="text-xs">Arweave</Badge>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm mb-2">Description</p>
                                  <p className="text-gray-900 dark:text-white">{nft.metadata?.description}</p>
                                </div>
                                {nft.metadata?.attributes && (
                                  <div>
                                    <p className="text-gray-400 text-sm mb-2">Attributes</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {nft.metadata.attributes.map((attr: any, i: number) => (
                                        <div key={i} className="p-2 bg-white/5 rounded">
                                          <p className="text-gray-400 text-xs">{attr.trait_type}</p>
                                          <p className="text-gray-900 dark:text-white text-sm">{attr.value}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Featured NFTs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Featured Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredNFTs.map((nft, index) => (
              <motion.div
                key={nft.tokenId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="bg-white/10 border-white/20 backdrop-blur-lg group hover:bg-white/15 transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-t-lg">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-900 dark:text-white font-semibold truncate">{nft.name}</h3>
                        <Badge className={getRarityColor(nft.rarity)}>
                          {nft.rarity}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-400 text-sm">
                          by {formatAddress(nft.creator)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {nft.platform}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-purple-400 font-semibold">{nft.price}</p>
                          <p className="text-gray-400 text-xs flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {nft.views} views
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-white/20 text-gray-900 dark:text-white hover:bg-white/10"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-green-600 to-blue-600"
                        >
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Empty State */}
        {userNFTs.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center py-12"
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg max-w-md mx-auto">
              <CardContent className="p-8">
                <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No NFTs Yet</h3>
                <p className="text-gray-400 mb-6">
                  Create your first AI-generated summary NFT by processing content through our platform.
                </p>
                <Button
                  onClick={handleMintDemo}
                  disabled={isMinting || !isConnected}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mint Your First NFT
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}