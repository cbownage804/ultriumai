import { useState, useCallback } from 'react';

export interface SeedConfig {
  tableName: string;
  rowCount: number;
  columns: { name: string; type: string; generator: string }[];
}

export interface SeedResult {
  tableName: string;
  sql: string;
  json: Record<string, any>[];
  rowCount: number;
}

const GENERATORS: Record<string, () => any> = {
  'uuid': () => crypto.randomUUID(),
  'name': () => ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Eva Martinez', 'Frank Lee', 'Grace Kim', 'Henry Chen', 'Ivy Wang', 'Jack Davis'][Math.floor(Math.random() * 10)],
  'email': () => `${['alice', 'bob', 'carol', 'david', 'eva', 'frank'][Math.floor(Math.random() * 6)]}${Math.floor(Math.random() * 999)}@${['gmail.com', 'yahoo.com', 'outlook.com'][Math.floor(Math.random() * 3)]}`,
  'phone': () => `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
  'address': () => `${Math.floor(100 + Math.random() * 9900)} ${['Main', 'Oak', 'Pine', 'Maple', 'Cedar'][Math.floor(Math.random() * 5)]} ${['St', 'Ave', 'Blvd', 'Dr'][Math.floor(Math.random() * 4)]}`,
  'city': () => ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'San Francisco', 'Seattle', 'Denver', 'Austin', 'Miami'][Math.floor(Math.random() * 10)],
  'state': () => ['CA', 'TX', 'NY', 'FL', 'IL', 'WA', 'CO', 'AZ', 'GA', 'MA'][Math.floor(Math.random() * 10)],
  'zip': () => String(10000 + Math.floor(Math.random() * 89999)),
  'integer': () => Math.floor(Math.random() * 1000),
  'price': () => Number((Math.random() * 500 + 5).toFixed(2)),
  'boolean': () => Math.random() > 0.5,
  'date': () => new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
  'timestamp': () => new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
  'text': () => ['Lorem ipsum dolor sit amet', 'Consectetur adipiscing elit', 'Sed do eiusmod tempor', 'Ut enim ad minim veniam', 'Duis aute irure dolor'][Math.floor(Math.random() * 5)],
  'url': () => `https://${['example', 'test', 'demo', 'sample'][Math.floor(Math.random() * 4)]}.com/${Math.random().toString(36).slice(2, 8)}`,
  'color': () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
  'status': () => ['active', 'inactive', 'pending', 'archived'][Math.floor(Math.random() * 4)],
  'role': () => ['admin', 'editor', 'viewer', 'moderator'][Math.floor(Math.random() * 4)],
  'now': () => new Date().toISOString(),
};

export function useSeedDataGenerator() {
  const [configs, setConfigs] = useState<SeedConfig[]>([]);
  const [results, setResults] = useState<SeedResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addConfig = useCallback((config: SeedConfig) => {
    setConfigs(prev => [...prev, config]);
  }, []);

  const removeConfig = useCallback((tableName: string) => {
    setConfigs(prev => prev.filter(c => c.tableName !== tableName));
  }, []);

  const generateSeedData = useCallback((config: SeedConfig): SeedResult => {
    const rows: Record<string, any>[] = [];
    for (let i = 0; i < config.rowCount; i++) {
      const row: Record<string, any> = {};
      for (const col of config.columns) {
        const gen = GENERATORS[col.generator] || GENERATORS['text'];
        row[col.name] = gen();
      }
      rows.push(row);
    }

    const columns = config.columns.map(c => c.name).join(', ');
    const values = rows.map(r => {
      const vals = config.columns.map(c => {
        const v = r[c.name];
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        return String(v);
      });
      return `(${vals.join(', ')})`;
    }).join(',\n');

    const sql = `INSERT INTO ${config.tableName} (${columns})\nVALUES\n${values};`;
    return { tableName: config.tableName, sql, json: rows, rowCount: rows.length };
  }, []);

  const generateAll = useCallback(() => {
    setIsGenerating(true);
    const allResults = configs.map(generateSeedData);
    setResults(allResults);
    setIsGenerating(false);
    return allResults;
  }, [configs, generateSeedData]);

  return {
    configs, results, isGenerating,
    addConfig, removeConfig, generateSeedData, generateAll,
    availableGenerators: Object.keys(GENERATORS),
  };
}
