import { useState, useCallback } from 'react';

type Format = 'json' | 'yaml' | 'env' | 'toml';

function jsonToYaml(obj: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (obj === null) return 'null';
  if (typeof obj === 'string') return obj.includes('\n') ? `|\n${obj.split('\n').map(l => pad + '  ' + l).join('\n')}` : JSON.stringify(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) return obj.map(v => `${pad}- ${jsonToYaml(v, indent + 1).trimStart()}`).join('\n');
  if (typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>)
      .map(([k, v]) => {
        const val = jsonToYaml(v, indent + 1);
        if (typeof v === 'object' && v !== null) return `${pad}${k}:\n${val}`;
        return `${pad}${k}: ${val}`;
      }).join('\n');
  }
  return String(obj);
}

function yamlToJson(yaml: string): unknown {
  const lines = yaml.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
  const result: Record<string, unknown> = {};
  let currentKey = '';
  for (const line of lines) {
    const match = line.match(/^(\s*)([^:]+):\s*(.*)/);
    if (match) {
      const [, , key, value] = match;
      currentKey = key.trim();
      if (value.trim()) {
        let v: unknown = value.trim();
        if (v === 'true') v = true;
        else if (v === 'false') v = false;
        else if (v === 'null') v = null;
        else if (!isNaN(Number(v)) && v !== '') v = Number(v);
        else if (typeof v === 'string' && v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        result[currentKey] = v;
      } else {
        result[currentKey] = {};
      }
    } else if (line.trim().startsWith('- ')) {
      const val = line.trim().slice(2);
      if (!Array.isArray(result[currentKey])) result[currentKey] = [];
      (result[currentKey] as unknown[]).push(val);
    }
  }
  return result;
}

function jsonToEnv(obj: unknown, prefix = ''): string {
  if (typeof obj !== 'object' || obj === null) return '';
  return Object.entries(obj as Record<string, unknown>)
    .map(([k, v]) => {
      const key = prefix ? `${prefix}_${k.toUpperCase()}` : k.toUpperCase();
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) return jsonToEnv(v, key);
      return `${key}=${typeof v === 'string' ? `"${v}"` : v}`;
    }).join('\n');
}

function envToJson(env: string): unknown {
  const result: Record<string, unknown> = {};
  env.split('\n').filter(l => l.trim() && !l.startsWith('#')).forEach(line => {
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) return;
    const key = line.slice(0, eqIdx).trim();
    let val: unknown = line.slice(eqIdx + 1).trim();
    if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (!isNaN(Number(val)) && val !== '') val = Number(val);
    result[key] = val;
  });
  return result;
}

function jsonToToml(obj: unknown, section = ''): string {
  if (typeof obj !== 'object' || obj === null) return '';
  const lines: string[] = [];
  const entries = Object.entries(obj as Record<string, unknown>);
  if (section) lines.push(`[${section}]`);
  for (const [k, v] of entries) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      lines.push(jsonToToml(v, section ? `${section}.${k}` : k));
    } else if (typeof v === 'string') {
      lines.push(`${k} = "${v}"`);
    } else {
      lines.push(`${k} = ${JSON.stringify(v)}`);
    }
  }
  return lines.join('\n');
}

function tomlToJson(toml: string): unknown {
  const result: Record<string, unknown> = {};
  let currentSection = result;
  toml.split('\n').filter(l => l.trim() && !l.startsWith('#')).forEach(line => {
    const sectionMatch = line.match(/^\[([^\]]+)\]/);
    if (sectionMatch) {
      const key = sectionMatch[1];
      result[key] = {};
      currentSection = result[key] as Record<string, unknown>;
      return;
    }
    const kvMatch = line.match(/^([^=]+)=\s*(.*)/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      let val: unknown = kvMatch[2].trim();
      if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      else if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(Number(val)) && val !== '') val = Number(val);
      currentSection[key] = val;
    }
  });
  return result;
}

export function useJsonYamlConverter() {
  const [input, setInput] = useState('{\n  "name": "my-app",\n  "version": "1.0.0",\n  "debug": true,\n  "port": 3000\n}');
  const [inputFormat, setInputFormat] = useState<Format>('json');
  const [outputFormat, setOutputFormat] = useState<Format>('yaml');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const convert = useCallback(() => {
    try {
      setError(null);
      let parsed: unknown;
      switch (inputFormat) {
        case 'json': parsed = JSON.parse(input); break;
        case 'yaml': parsed = yamlToJson(input); break;
        case 'env': parsed = envToJson(input); break;
        case 'toml': parsed = tomlToJson(input); break;
      }
      let result: string;
      switch (outputFormat) {
        case 'json': result = JSON.stringify(parsed, null, 2); break;
        case 'yaml': result = jsonToYaml(parsed); break;
        case 'env': result = jsonToEnv(parsed); break;
        case 'toml': result = jsonToToml(parsed); break;
      }
      setOutput(result);
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, inputFormat, outputFormat]);

  const swap = useCallback(() => {
    setInput(output);
    setInputFormat(outputFormat);
    setOutputFormat(inputFormat);
  }, [output, outputFormat, inputFormat]);

  const formats: Format[] = ['json', 'yaml', 'env', 'toml'];

  return { input, setInput, inputFormat, setInputFormat, outputFormat, setOutputFormat, output, error, convert, swap, formats };
}
