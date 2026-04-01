export const Colors = {
  background: '#07111F',
  surface: '#0D1C2E',
  surfaceElevated: '#112240',
  border: '#1E3A5F',
  borderSubtle: '#142A45',

  accent: '#5DE4C7',
  accentDim: '#3BB89F',
  accentGlow: 'rgba(93, 228, 199, 0.15)',

  textPrimary: '#F0F6FF',
  textSecondary: '#8CA3C7',
  textMuted: '#4A6288',

  success: '#4ADE80',
  successBg: 'rgba(74, 222, 128, 0.1)',
  warning: '#FCD34D',
  warningBg: 'rgba(252, 211, 77, 0.1)',
  error: '#F87171',
  errorBg: 'rgba(248, 113, 113, 0.1)',
  processing: '#60A5FA',
  processingBg: 'rgba(96, 165, 250, 0.1)',

  tabBar: '#091929',
  tabBarBorder: '#1A3050',
  tabBarActive: '#5DE4C7',
  tabBarInactive: '#4A6288',

  // Category tag colors
  apparel: '#A78BFA',
  apparelBg: 'rgba(167, 139, 250, 0.12)',
  accessories: '#F472B6',
  accessoriesBg: 'rgba(244, 114, 182, 0.12)',
  beauty: '#FB923C',
  beautyBg: 'rgba(251, 146, 60, 0.12)',
  homeGoods: '#34D399',
  homeGoodsBg: 'rgba(52, 211, 153, 0.12)',
  tech: '#60A5FA',
  techBg: 'rgba(96, 165, 250, 0.12)',
  other: '#8CA3C7',
  otherBg: 'rgba(140, 163, 199, 0.12)',
};

export const CategoryMeta: Record<string, { color: string; bg: string; emoji: string }> = {
  apparel:     { color: Colors.apparel,    bg: Colors.apparelBg,    emoji: '👕' },
  accessories: { color: Colors.accessories,bg: Colors.accessoriesBg,emoji: '👜' },
  beauty:      { color: Colors.beauty,     bg: Colors.beautyBg,     emoji: '💄' },
  'home goods':{ color: Colors.homeGoods,  bg: Colors.homeGoodsBg,  emoji: '🏠' },
  tech:        { color: Colors.tech,       bg: Colors.techBg,       emoji: '📱' },
  other:       { color: Colors.other,      bg: Colors.otherBg,      emoji: '🔖' },
};

export const getCategoryMeta = (category: string) =>
  CategoryMeta[category.toLowerCase()] ?? CategoryMeta['other'];
