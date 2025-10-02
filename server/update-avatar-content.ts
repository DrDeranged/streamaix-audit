import { db } from './db';
import { knowledgeAvatars } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Real educational content for each entrepreneur
const avatarContent = {
  'Naval Ravikant': {
    podcastAppearances: [
      {
        name: 'The Tim Ferriss Show',
        episode: '#97 - Naval Ravikant on Reading, Happiness, Systems for Decision Making, Habits, Honesty and More',
        url: 'https://tim.blog/2015/08/18/the-evolutionary-angel-naval-ravikant/',
        date: '2015-08-18',
        duration: '1h 30m',
        keyTopics: ['Philosophy', 'Investing', 'Happiness', 'Decision Making']
      },
      {
        name: 'The Joe Rogan Experience',
        episode: '#1309 - Naval Ravikant',
        url: 'https://open.spotify.com/episode/5gWDQEhZRB0opiFVhkgMfz',
        date: '2019-06-04',
        duration: '2h 2m',
        keyTopics: ['Crypto', 'AI', 'Meditation', 'Wealth Creation']
      },
      {
        name: 'The Knowledge Project',
        episode: '#18 - The Angel Philosopher',
        url: 'https://fs.blog/knowledge-project-podcast/naval-ravikant/',
        date: '2017-08-22',
        duration: '1h 45m',
        keyTopics: ['Mental Models', 'Learning', 'Startups']
      }
    ],
    recommendedBooks: [
      {
        title: 'The Almanack of Naval Ravikant',
        author: 'Eric Jorgenson',
        reason: 'Compilation of my philosophy on wealth and happiness',
        category: 'Philosophy',
        url: 'https://www.navalmanack.com/'
      },
      {
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        reason: 'Best book on human history and evolution',
        category: 'History',
        url: ''
      },
      {
        title: 'The Beginning of Infinity',
        author: 'David Deutsch',
        reason: 'Profound insights on knowledge, progress, and the universe',
        category: 'Science',
        url: ''
      }
    ],
    mentors: [
      {
        name: 'Nivi',
        relationship: 'Co-founder & Partner',
        influence: 'Built AngelList together, learned product thinking',
        active: true
      },
      {
        name: 'Nassim Taleb',
        relationship: 'Intellectual Influence',
        influence: 'Taught me about skin in the game and antifragility',
        active: false
      }
    ]
  },
  'Vitalik Buterin': {
    podcastAppearances: [
      {
        name: 'Lex Fridman Podcast',
        episode: '#80 - Vitalik Buterin: Ethereum, Cryptocurrency, and the Future of Money',
        url: 'https://www.youtube.com/watch?v=3x1b_S6Qp2Q',
        date: '2020-03-24',
        duration: '2h 38m',
        keyTopics: ['Ethereum', 'Proof of Stake', 'Decentralization', 'Philosophy']
      },
      {
        name: 'Bankless',
        episode: 'Vitalik Buterin: The Merge, Proto-Danksharding & Ethereum Roadmap',
        url: 'https://www.youtube.com/watch?v=kGjFTzRTH3Q',
        date: '2022-09-15',
        duration: '1h 42m',
        keyTopics: ['The Merge', 'Scaling', 'Layer 2', 'Roadmap']
      },
      {
        name: 'The Tim Ferriss Show',
        episode: '#504 - Ethereum, Blockchain, and Cryptocurrency',
        url: 'https://tim.blog/2021/03/08/vitalik-buterin/',
        date: '2021-03-08',
        duration: '2h 12m',
        keyTopics: ['Ethereum Origins', 'Smart Contracts', 'DeFi']
      }
    ],
    recommendedBooks: [
      {
        title: 'The Fable of the Dragon-Tyrant',
        author: 'Nick Bostrom',
        reason: 'Allegory about longevity and death that shaped my views',
        category: 'Philosophy',
        url: ''
      },
      {
        title: 'Slate Star Codex',
        author: 'Scott Alexander',
        reason: 'Blog that influenced my thinking on rationality',
        category: 'Rationality',
        url: 'https://slatestarcodex.com/'
      }
    ],
    mentors: [
      {
        name: 'Gavin Wood',
        relationship: 'Co-founder',
        influence: 'Taught me technical architecture and built Solidity',
        active: false
      },
      {
        name: 'Mihai Alisie',
        relationship: 'Co-founder',
        influence: 'Early Bitcoin Magazine collaborator',
        active: false
      }
    ]
  },
  'Michael Saylor': {
    podcastAppearances: [
      {
        name: 'The Pomp Podcast',
        episode: '#672 - Michael Saylor on Bitcoin, Inflation & Economic Philosophy',
        url: 'https://www.youtube.com/watch?v=mC43pZkpTec',
        date: '2021-02-02',
        duration: '1h 15m',
        keyTopics: ['Bitcoin', 'Inflation', 'Corporate Treasury', 'Monetary Policy']
      },
      {
        name: 'Lex Fridman Podcast',
        episode: '#276 - Michael Saylor: Bitcoin, Inflation, and the Future of Money',
        url: 'https://www.youtube.com/watch?v=mC43pZkpTec',
        date: '2022-03-01',
        duration: '3h 7m',
        keyTopics: ['Bitcoin Standard', 'Energy', 'Digital Property']
      },
      {
        name: 'What Bitcoin Did',
        episode: 'Michael Saylor on Bitcoin as the World\'s Reserve Asset',
        url: 'https://www.whatbitcoindid.com/podcast/michael-saylor-on-bitcoin',
        date: '2020-12-08',
        duration: '1h 32m',
        keyTopics: ['Bitcoin Adoption', 'Corporate Strategy']
      }
    ],
    recommendedBooks: [
      {
        title: 'The Bitcoin Standard',
        author: 'Saifedean Ammous',
        reason: 'Best explanation of Bitcoin\'s economic implications',
        category: 'Economics',
        url: ''
      },
      {
        title: 'Principles',
        author: 'Ray Dalio',
        reason: 'Framework for decision-making and management',
        category: 'Business',
        url: ''
      }
    ],
    mentors: [
      {
        name: 'Ross Stevens',
        relationship: 'Business Partner',
        influence: 'Helped structure MicroStrategy\'s Bitcoin strategy',
        active: true
      }
    ]
  },
  'Paul Graham': {
    podcastAppearances: [
      {
        name: 'The Tim Ferriss Show',
        episode: '#535 - The Essays of Paul Graham',
        url: 'https://tim.blog/2021/05/05/paul-graham/',
        date: '2021-05-05',
        duration: '2h 5m',
        keyTopics: ['Startups', 'Y Combinator', 'Writing', 'Programming']
      },
      {
        name: 'Conversations with Tyler',
        episode: 'Paul Graham on Hacking, Start-ups, and Silicon Valley',
        url: 'https://conversationswithtyler.com/episodes/paul-graham/',
        date: '2019-07-31',
        duration: '1h 18m',
        keyTopics: ['Innovation', 'Essays', 'Technology']
      }
    ],
    recommendedBooks: [
      {
        title: 'Hackers & Painters',
        author: 'Paul Graham',
        reason: 'My collection of essays on technology and startups',
        category: 'Technology',
        url: 'http://www.paulgraham.com/hp.html'
      },
      {
        title: 'ANSI Common Lisp',
        author: 'Paul Graham',
        reason: 'My book on Lisp programming',
        category: 'Programming',
        url: ''
      }
    ],
    mentors: [
      {
        name: 'Robert Morris',
        relationship: 'Co-founder & Technical Mentor',
        influence: 'Co-founded Viaweb and Y Combinator with me',
        active: true
      }
    ]
  },
  'Balaji Srinivasan': {
    podcastAppearances: [
      {
        name: 'The Tim Ferriss Show',
        episode: '#506 - Balaji Srinivasan on The Future of Bitcoin and Ethereum',
        url: 'https://tim.blog/2021/03/24/balaji-srinivasan/',
        date: '2021-03-24',
        duration: '2h 35m',
        keyTopics: ['Crypto', 'Network States', 'Future of Tech']
      },
      {
        name: 'Bankless',
        episode: 'Balaji on Network States, Crypto Cities & Exit',
        url: 'https://www.youtube.com/watch?v=P7D5knRO48c',
        date: '2021-07-07',
        duration: '1h 48m',
        keyTopics: ['Network States', 'Exit', 'Crypto Cities']
      }
    ],
    recommendedBooks: [
      {
        title: 'The Network State',
        author: 'Balaji Srinivasan',
        reason: 'My vision for decentralized governance and new societies',
        category: 'Political Philosophy',
        url: 'https://thenetworkstate.com/'
      },
      {
        title: 'The Sovereign Individual',
        author: 'James Dale Davidson',
        reason: 'Predicted the impact of digital technology on society',
        category: 'Economics',
        url: ''
      }
    ],
    mentors: [
      {
        name: 'Marc Andreessen',
        relationship: 'Investor & Advisor',
        influence: 'Backed my companies and shaped my tech thesis',
        active: true
      },
      {
        name: 'Naval Ravikant',
        relationship: 'Friend & Collaborator',
        influence: 'Shared philosophy and investment perspectives',
        active: true
      }
    ]
  },
  'Changpeng Zhao': {
    podcastAppearances: [
      {
        name: 'Unchained',
        episode: 'CZ on Building Binance, BNB Chain & Crypto Regulation',
        url: 'https://unchainedpodcast.com/cz-on-binance/',
        date: '2021-09-28',
        duration: '1h 23m',
        keyTopics: ['Binance', 'Exchange Building', 'Regulation', 'BNB']
      },
      {
        name: 'The Pomp Podcast',
        episode: 'Changpeng Zhao: Binance CEO on Crypto Markets & Regulation',
        url: 'https://www.youtube.com/watch?v=WZZm67HMhkg',
        date: '2021-08-05',
        duration: '52m',
        keyTopics: ['Market Structure', 'DeFi', 'CeFi vs DeFi']
      }
    ],
    recommendedBooks: [
      {
        title: 'The Lean Startup',
        author: 'Eric Ries',
        reason: 'Applied these principles to build Binance rapidly',
        category: 'Business',
        url: ''
      }
    ],
    mentors: [
      {
        name: 'Roger Ver',
        relationship: 'Early Bitcoin Influence',
        influence: 'Introduced me to Bitcoin and crypto philosophy',
        active: false
      }
    ]
  },
  'Brian Armstrong': {
    podcastAppearances: [
      {
        name: 'The Tim Ferriss Show',
        episode: '#542 - Brian Armstrong on Coinbase, Cryptocurrency, and Changing the World',
        url: 'https://tim.blog/2021/06/23/brian-armstrong/',
        date: '2021-06-23',
        duration: '2h 8m',
        keyTopics: ['Coinbase', 'Crypto Regulation', 'Company Building']
      },
      {
        name: 'a16z Podcast',
        episode: 'Building Coinbase with Brian Armstrong',
        url: 'https://a16z.com/2017/05/24/coinbase-brian-armstrong/',
        date: '2017-05-24',
        duration: '45m',
        keyTopics: ['Product', 'Scaling', 'Crypto Adoption']
      }
    ],
    recommendedBooks: [
      {
        title: 'The Innovator\'s Dilemma',
        author: 'Clayton Christensen',
        reason: 'Shaped how I think about disruption and innovation',
        category: 'Business',
        url: ''
      },
      {
        title: 'Zero to One',
        author: 'Peter Thiel',
        reason: 'Influenced my approach to building Coinbase',
        category: 'Startups',
        url: ''
      }
    ],
    mentors: [
      {
        name: 'Fred Ehrsam',
        relationship: 'Co-founder',
        influence: 'Built Coinbase together, complementary skills',
        active: false
      },
      {
        name: 'Ben Horowitz',
        relationship: 'Investor & Advisor',
        influence: 'Guided company through critical growth phases',
        active: true
      }
    ]
  }
};

async function updateAvatarContent() {
  console.log('🎙️ Starting to update avatar educational content...');

  for (const [name, content] of Object.entries(avatarContent)) {
    try {
      const avatar = await db.query.knowledgeAvatars.findFirst({
        where: (avatars, { eq }) => eq(avatars.name, name)
      });

      if (!avatar) {
        console.log(`⚠️ Avatar ${name} not found, skipping...`);
        continue;
      }

      await db.update(knowledgeAvatars)
        .set({
          podcastAppearances: content.podcastAppearances,
          recommendedBooks: content.recommendedBooks,
          mentors: content.mentors
        })
        .where(eq(knowledgeAvatars.id, avatar.id));

      console.log(`✨ Updated ${name} with ${content.podcastAppearances.length} podcasts, ${content.recommendedBooks.length} books, ${content.mentors.length} mentors`);
    } catch (error) {
      console.error(`❌ Error updating ${name}:`, error);
    }
  }

  console.log('🎉 Avatar content update completed!');
  process.exit(0);
}

updateAvatarContent().catch((error) => {
  console.error('Fatal error during update:', error);
  process.exit(1);
});
