/**
 * Generates Lovable-style project names: adjective-noun-hex
 * Examples: "vibrant-meadow-a3f", "cosmic-river-7b2", "silent-peak-e91"
 */

const adjectives = [
  'amber', 'azure', 'bold', 'bright', 'calm', 'clever', 'cosmic', 'crystal',
  'daring', 'dawn', 'deep', 'eager', 'ember', 'epic', 'fancy', 'fierce',
  'gentle', 'golden', 'grand', 'happy', 'ivory', 'jade', 'keen', 'kind',
  'lively', 'lucky', 'lunar', 'magic', 'merry', 'mighty', 'misty', 'noble',
  'olive', 'opal', 'pearl', 'plush', 'proud', 'quiet', 'rapid', 'royal',
  'rustic', 'sage', 'serene', 'sharp', 'silent', 'sleek', 'snowy', 'solar',
  'spark', 'stellar', 'subtle', 'sunny', 'swift', 'tidal', 'ultra', 'vast',
  'velvet', 'vibrant', 'vivid', 'warm', 'wild', 'witty', 'zen',
];

const nouns = [
  'arch', 'atlas', 'bay', 'bloom', 'bolt', 'breeze', 'brook', 'canyon',
  'cedar', 'cliff', 'cloud', 'comet', 'coral', 'cove', 'creek', 'crest',
  'dawn', 'delta', 'dune', 'echo', 'ember', 'fern', 'fjord', 'flame',
  'flare', 'forest', 'frost', 'glade', 'grove', 'harbor', 'haven', 'hawk',
  'hill', 'isle', 'lake', 'leaf', 'luna', 'maple', 'marsh', 'meadow',
  'mesa', 'moon', 'moss', 'nest', 'north', 'oak', 'ocean', 'orbit',
  'panda', 'path', 'peak', 'pine', 'pond', 'pulse', 'rain', 'reef',
  'ridge', 'river', 'sage', 'shore', 'sky', 'spark', 'spring', 'star',
  'stone', 'storm', 'sun', 'tide', 'trail', 'vale', 'wave', 'wind',
  'wolf', 'wood', 'zen',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateProjectName(): string {
  const adj = pick(adjectives);
  const noun = pick(nouns);
  const hex = Math.floor(Math.random() * 0xfff).toString(16).padStart(3, '0');
  return `${adj}-${noun}-${hex}`;
}
