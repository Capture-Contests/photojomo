/**
 * Per-route search metadata.
 *
 * Titles are written "Page — Brand" so the distinguishing words come first:
 * a search result truncates around 60 characters, and the brand is the part
 * you can afford to lose. Descriptions are kept near 155 characters for the
 * same reason, and each one is drawn from that page's own copy rather than
 * restated from the brand boilerplate — duplicated descriptions get
 * discarded and rewritten by Google.
 *
 * Keys are the routed path with no leading slash; '' is the homepage.
 * Every path in app.routes.ts should appear here.
 */
export interface RouteMeta {
  title: string;
  description: string;
}

export const DEFAULT_META: RouteMeta = {
  title: 'Capture Contests — A Global Platform for Authentic Visual Storytelling',
  description:
    'A global platform connecting creators, communities, cultures and destinations through photography, film and authentic visual storytelling.',
};

export const ROUTE_META: Record<string, RouteMeta> = {
  '': {
    title: 'Capture Contests — Authentic Visual Storytelling Worldwide',
    description:
      'Every place has a story. Capture Contests connects creators, communities, cultures and destinations through photography, digital video, film and travel.',
  },
  'the-experience': {
    title: 'The Experience — Go Beyond the Destination | Capture Contests',
    description:
      'Discover cultures, enter contests, travel and connect with communities. See how creators experience places through authentic visual storytelling.',
  },
  'partner-with-us': {
    title: 'Partner With Us — Create Stories | Capture Contests',
    description:
      'We collaborate with destinations, hospitality brands, sponsors, cultural institutions and media partners on visual storytelling that reaches the world.',
  },
  'partner-inquiry': {
    title: 'Start a Partnership Conversation | Capture Contests',
    description:
      'Tell us about your organization and what you would like to explore — destination collaborations, hospitality partnerships, sponsorship or media.',
  },
  'creator-guidelines': {
    title: 'Creator Guidelines — Standards & Submissions | Capture Contests',
    description:
      'The global standards we hold for every creator: participation requirements, submission specifications, content ownership and ethical storytelling.',
  },
  'capture-caribbean': {
    title: 'Capture Caribbean — A Visual Exploration of the Caribbean World',
    description:
      'The Caribbean region’s premier visual storytelling platform — a region shaped by migration, memory, music, resistance and extraordinary natural beauty.',
  },
  'capture-africa': {
    title: 'Capture Africa — Discover Africa’s Many Stories',
    description:
      'A continent of cultural depth, ancient civilizations, creative energy and modern transformation, revealed through local stories and perspectives.',
  },
  'capture-barbados': {
    title: 'Capture Barbados — Craft, Coast & Character',
    description:
      'A visual celebration of Barbados — its craft, coastline and character, told by creators through photography, digital video and film.',
  },
  'capture-ghana': {
    title: 'Capture Ghana — Discover Ghana’s Heritage Coast',
    description:
      'A gateway to West African history and contemporary creativity, where memory, heritage, community and renewal shape the national story.',
  },
  'capture-guyana': {
    title: 'Capture Guyana — Beauty, Culture & Spirit',
    description:
      'A visual celebration of Guyana’s rainforest, rivers and cultural life, told through the creators and communities who know it best.',
  },
  'capture-jamaica': {
    title: 'Capture Jamaica — Rhythm, Resilience & Radiance',
    description:
      'A cultural force defined by music, movement, language and landscape — Jamaica seen through authentic visual storytelling.',
  },
  'capture-nigeria': {
    title: 'Capture Nigeria — Discover Nigeria Through Visual Storytelling',
    description:
      'A destination storytelling initiative bringing together creators, communities and cultural partners to celebrate Nigeria’s diversity and global influence.',
  },
  'capture-saint-lucia': {
    title: 'Capture Saint Lucia — Photo & Video Contest',
    description:
      'Honoring a 31-year legacy and celebrating the spirit of Saint Lucia, captured through your lens. An international photo and video contest.',
  },
};
