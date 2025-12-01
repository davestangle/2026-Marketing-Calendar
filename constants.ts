
import { MonthData } from './types';

const currentYear = 2026;

// Helper to create empty launch
const emptyLaunch = () => ({
  title: '',
  logo: '',
  objective: '',
  budget: '',
  performanceSpend: '',
  brandSpend: '',
  resources: [],
  image: ''
});

export const INITIAL_DATA: MonthData[] = [
  // FY26 - Q4 (Jan, Feb, Mar)
  {
    id: 'jan-2026',
    name: 'January',
    quarter: 'FY26 - Q4',
    year: currentYear,
    productLaunch: emptyLaunch(),
    campaigns: [{ id: 'c1', name: 'New Year Kickoff' }],
    comments: []
  },
  {
    id: 'feb-2026',
    name: 'February',
    quarter: 'FY26 - Q4',
    year: currentYear,
    productLaunch: emptyLaunch(),
    campaigns: [],
    comments: []
  },
  {
    id: 'mar-2026',
    name: 'March',
    quarter: 'FY26 - Q4',
    year: currentYear,
    productLaunch: {
      title: 'Guy Fieri / Flavortown',
      logo: '', // User can upload
      objective: 'Launch partnership with high-heat influencer mailers.',
      budget: '$120k',
      performanceSpend: '$85,000',
      brandSpend: '$35,000',
      resources: [
        { id: 'r1', label: 'Partnership Deck', url: '#' },
        { id: 'r2', label: 'Asset Folder', url: '#' }
      ],
      image: 'https://picsum.photos/800/600?random=2'
    },
    campaigns: [],
    comments: []
  },
  // FY27 - Q1 (Apr, May, Jun)
  {
    id: 'apr-2026',
    name: 'April',
    quarter: 'FY27 - Q1',
    year: currentYear,
    productLaunch: emptyLaunch(),
    campaigns: [],
    comments: []
  },
  {
    id: 'may-2026',
    name: 'May',
    quarter: 'FY27 - Q1',
    year: currentYear,
    productLaunch: {
      title: 'Mandalorian & Grogu',
      logo: '',
      objective: 'Capitalize on season release with exclusive line.',
      budget: '$200k',
      performanceSpend: '$120,000',
      brandSpend: '$80,000',
      resources: [],
      image: 'https://picsum.photos/800/600?random=4'
    },
    campaigns: [],
    comments: []
  },
  {
    id: 'jun-2026',
    name: 'June',
    quarter: 'FY27 - Q1',
    year: currentYear,
    productLaunch: {
      title: 'Licksters',
      logo: '',
      objective: 'Summer treat campaign focusing on cooling products.',
      budget: '$85k',
      performanceSpend: '$60,000',
      brandSpend: '$25,000',
      resources: [],
      image: 'https://picsum.photos/800/600?random=12'
    },
    campaigns: [],
    comments: []
  },
  // FY27 - Q2 (Jul, Aug, Sep)
  {
    id: 'jul-2026',
    name: 'July',
    quarter: 'FY27 - Q2',
    year: currentYear,
    productLaunch: emptyLaunch(),
    campaigns: [],
    comments: []
  },
  {
    id: 'aug-2026',
    name: 'August',
    quarter: 'FY27 - Q2',
    year: currentYear,
    productLaunch: emptyLaunch(),
    campaigns: [],
    comments: []
  },
  {
    id: 'sep-2026',
    name: 'September',
    quarter: 'FY27 - Q2',
    year: currentYear,
    productLaunch: {
      title: 'Liquid Death',
      logo: '',
      objective: 'Disrupt category with hydration collaboration.',
      budget: '$150k',
      performanceSpend: '$100,000',
      brandSpend: '$50,000',
      resources: [],
      image: 'https://picsum.photos/800/600?random=6'
    },
    campaigns: [],
    comments: []
  },
  // FY27 - Q3 (Oct, Nov, Dec)
  {
    id: 'oct-2026',
    name: 'October',
    quarter: 'FY27 - Q3',
    year: currentYear,
    productLaunch: {
      title: 'Crocs 2.0',
      logo: '',
      objective: 'Follow up success of v1 with new styles.',
      budget: '$180k',
      performanceSpend: '$110,000',
      brandSpend: '$70,000',
      resources: [],
      image: 'https://picsum.photos/800/600?random=7'
    },
    campaigns: [],
    comments: []
  },
  {
    id: 'nov-2026',
    name: 'November',
    quarter: 'FY27 - Q3',
    year: currentYear,
    productLaunch: {
      title: 'Girl Scouts',
      logo: '',
      objective: 'Cookie season partnership launch.',
      budget: '$110k',
      performanceSpend: '$70,000',
      brandSpend: '$40,000',
      resources: [],
      image: 'https://picsum.photos/800/600?random=9'
    },
    campaigns: [],
    comments: []
  },
  {
    id: 'dec-2026',
    name: 'December',
    quarter: 'FY27 - Q3',
    year: currentYear,
    productLaunch: emptyLaunch(),
    campaigns: [],
    comments: []
  },
];
