import { useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'email' | 'uuid' | 'url' | 'array' | 'object';

export interface SchemaField {
  name: string;
  type: FieldType;
  required: boolean;
  description?: string;
  example?: string;
  children?: SchemaField[]; // for object/array
}

export interface APIEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  name: string;
  description: string;
  tags: string[];
  requestBody?: SchemaField[];
  responseSchema: SchemaField[];
  queryParams?: SchemaField[];
  pathParams?: string[];
  statusCode: number;
  mockDelay: number; // ms
  authRequired: boolean;
  rateLimit?: number; // requests per minute
  createdAt: number;
}

export interface MockRequest {
  id: string;
  endpointId: string;
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: any;
  timestamp: number;
}

export interface MockResponse {
  id: string;
  requestId: string;
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  latency: number;
  timestamp: number;
}

export interface RequestLog {
  request: MockRequest;
  response: MockResponse;
}

// ─── Mock Data Generator ─────────────────────────────────────

const MOCK_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah'];
const MOCK_DOMAINS = ['example.com', 'test.io', 'demo.dev', 'sample.org'];
const MOCK_WORDS = ['innovative', 'dynamic', 'premium', 'advanced', 'smart', 'digital', 'cloud', 'next-gen'];

function generateMockValue(field: SchemaField): any {
  switch (field.type) {
    case 'string':
      if (field.example) return field.example;
      if (field.name.toLowerCase().includes('name')) return MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
      if (field.name.toLowerCase().includes('title')) return `${MOCK_WORDS[Math.floor(Math.random() * MOCK_WORDS.length)]} ${field.name}`;
      if (field.name.toLowerCase().includes('description')) return `A ${MOCK_WORDS[Math.floor(Math.random() * MOCK_WORDS.length)]} description for this item.`;
      if (field.name.toLowerCase().includes('status')) return ['active', 'pending', 'completed'][Math.floor(Math.random() * 3)];
      return `sample_${field.name}_${Math.random().toString(36).slice(2, 6)}`;
    case 'number':
      return Math.floor(Math.random() * 1000);
    case 'boolean':
      return Math.random() > 0.5;
    case 'date':
      return new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)).toISOString();
    case 'email':
      return `${MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)].toLowerCase()}@${MOCK_DOMAINS[Math.floor(Math.random() * MOCK_DOMAINS.length)]}`;
    case 'uuid':
      return crypto.randomUUID();
    case 'url':
      return `https://${MOCK_DOMAINS[Math.floor(Math.random() * MOCK_DOMAINS.length)]}/${Math.random().toString(36).slice(2, 8)}`;
    case 'array':
      if (field.children?.length) {
        return Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () =>
          field.children!.length === 1 ? generateMockValue(field.children![0]) : generateMockObject(field.children!)
        );
      }
      return [];
    case 'object':
      return field.children ? generateMockObject(field.children) : {};
    default:
      return null;
  }
}

function generateMockObject(fields: SchemaField[]): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const field of fields) {
    obj[field.name] = generateMockValue(field);
  }
  return obj;
}

function generateMockResponse(endpoint: APIEndpoint, count: number = 1): any {
  if (endpoint.method === 'GET' && endpoint.path.endsWith('s')) {
    // Collection endpoint — return array
    return {
      data: Array.from({ length: count }, () => generateMockObject(endpoint.responseSchema)),
      total: count + Math.floor(Math.random() * 50),
      page: 1,
      pageSize: count,
    };
  }
  return generateMockObject(endpoint.responseSchema);
}

// ─── Default Templates ───────────────────────────────────────

const ENDPOINT_TEMPLATES: Omit<APIEndpoint, 'id' | 'createdAt'>[] = [
  {
    method: 'GET',
    path: '/api/users',
    name: 'List Users',
    description: 'Retrieve a paginated list of users',
    tags: ['users'],
    responseSchema: [
      { name: 'id', type: 'uuid', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'role', type: 'string', required: true, example: 'admin' },
      { name: 'created_at', type: 'date', required: true },
      { name: 'is_active', type: 'boolean', required: true },
    ],
    queryParams: [
      { name: 'page', type: 'number', required: false, description: 'Page number' },
      { name: 'limit', type: 'number', required: false, description: 'Items per page' },
      { name: 'search', type: 'string', required: false, description: 'Search by name or email' },
    ],
    statusCode: 200,
    mockDelay: 200,
    authRequired: true,
  },
  {
    method: 'POST',
    path: '/api/users',
    name: 'Create User',
    description: 'Create a new user account',
    tags: ['users'],
    requestBody: [
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'role', type: 'string', required: false, example: 'user' },
    ],
    responseSchema: [
      { name: 'id', type: 'uuid', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'role', type: 'string', required: true },
      { name: 'created_at', type: 'date', required: true },
    ],
    statusCode: 201,
    mockDelay: 300,
    authRequired: true,
  },
  {
    method: 'GET',
    path: '/api/users/:id',
    name: 'Get User',
    description: 'Retrieve a single user by ID',
    tags: ['users'],
    pathParams: ['id'],
    responseSchema: [
      { name: 'id', type: 'uuid', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'role', type: 'string', required: true },
      { name: 'profile', type: 'object', required: false, children: [
        { name: 'avatar_url', type: 'url', required: false },
        { name: 'bio', type: 'string', required: false },
      ]},
      { name: 'created_at', type: 'date', required: true },
    ],
    statusCode: 200,
    mockDelay: 150,
    authRequired: true,
  },
  {
    method: 'DELETE',
    path: '/api/users/:id',
    name: 'Delete User',
    description: 'Delete a user account',
    tags: ['users'],
    pathParams: ['id'],
    responseSchema: [
      { name: 'success', type: 'boolean', required: true },
      { name: 'message', type: 'string', required: true, example: 'User deleted successfully' },
    ],
    statusCode: 200,
    mockDelay: 250,
    authRequired: true,
  },
  {
    method: 'GET',
    path: '/api/products',
    name: 'List Products',
    description: 'Retrieve a list of products',
    tags: ['products'],
    responseSchema: [
      { name: 'id', type: 'uuid', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'price', type: 'number', required: true },
      { name: 'description', type: 'string', required: false },
      { name: 'in_stock', type: 'boolean', required: true },
      { name: 'image_url', type: 'url', required: false },
      { name: 'created_at', type: 'date', required: true },
    ],
    queryParams: [
      { name: 'category', type: 'string', required: false },
      { name: 'min_price', type: 'number', required: false },
      { name: 'max_price', type: 'number', required: false },
    ],
    statusCode: 200,
    mockDelay: 200,
    authRequired: false,
  },
];

// ─── Hook ────────────────────────────────────────────────────

export function useAPIBuilder() {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [isMockServerRunning, setIsMockServerRunning] = useState(false);

  /** Add an endpoint */
  const addEndpoint = useCallback((endpoint: Omit<APIEndpoint, 'id' | 'createdAt'>) => {
    const newEndpoint: APIEndpoint = {
      ...endpoint,
      id: `ep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    setEndpoints(prev => [...prev, newEndpoint]);
    return newEndpoint;
  }, []);

  /** Update an endpoint */
  const updateEndpoint = useCallback((id: string, updates: Partial<APIEndpoint>) => {
    setEndpoints(prev => prev.map(ep => ep.id === id ? { ...ep, ...updates } : ep));
  }, []);

  /** Remove an endpoint */
  const removeEndpoint = useCallback((id: string) => {
    setEndpoints(prev => prev.filter(ep => ep.id !== id));
  }, []);

  /** Duplicate an endpoint */
  const duplicateEndpoint = useCallback((id: string) => {
    setEndpoints(prev => {
      const source = prev.find(ep => ep.id === id);
      if (!source) return prev;
      const copy: APIEndpoint = {
        ...source,
        id: `ep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: `${source.name} (copy)`,
        createdAt: Date.now(),
      };
      return [...prev, copy];
    });
  }, []);

  /** Load template endpoints */
  const loadTemplates = useCallback((tag?: string) => {
    const templates = tag ? ENDPOINT_TEMPLATES.filter(t => t.tags.includes(tag)) : ENDPOINT_TEMPLATES;
    const newEndpoints = templates.map(t => ({
      ...t,
      id: `ep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    }));
    setEndpoints(prev => [...prev, ...newEndpoints]);
    return newEndpoints;
  }, []);

  /** Simulate a request against an endpoint */
  const simulateRequest = useCallback((
    endpointId: string,
    overrides?: { queryParams?: Record<string, string>; body?: any; headers?: Record<string, string> }
  ): Promise<RequestLog> => {
    return new Promise((resolve) => {
      const endpoint = endpoints.find(ep => ep.id === endpointId);
      if (!endpoint) {
        throw new Error('Endpoint not found');
      }

      const request: MockRequest = {
        id: `req-${Date.now()}`,
        endpointId,
        method: endpoint.method,
        path: endpoint.path,
        headers: {
          'Content-Type': 'application/json',
          ...(endpoint.authRequired ? { 'Authorization': 'Bearer mock_token_xxxx' } : {}),
          ...overrides?.headers,
        },
        queryParams: overrides?.queryParams || {},
        body: overrides?.body || (endpoint.requestBody ? generateMockObject(endpoint.requestBody) : null),
        timestamp: Date.now(),
      };

      // Simulate network delay
      setTimeout(() => {
        const responseBody = generateMockResponse(endpoint, 5);
        const response: MockResponse = {
          id: `res-${Date.now()}`,
          requestId: request.id,
          statusCode: endpoint.statusCode,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': crypto.randomUUID(),
            'X-Response-Time': `${endpoint.mockDelay}ms`,
          },
          body: responseBody,
          latency: endpoint.mockDelay + Math.floor(Math.random() * 50),
          timestamp: Date.now(),
        };

        const log: RequestLog = { request, response };
        setRequestLogs(prev => [log, ...prev].slice(0, 100));
        resolve(log);
      }, endpoint.mockDelay);
    });
  }, [endpoints]);

  /** Toggle mock server */
  const toggleMockServer = useCallback(() => {
    setIsMockServerRunning(prev => !prev);
  }, []);

  /** Export as OpenAPI 3.0 spec */
  const exportOpenAPI = useCallback((): object => {
    const paths: Record<string, any> = {};

    for (const ep of endpoints) {
      const pathKey = ep.path.replace(/:(\w+)/g, '{$1}');
      if (!paths[pathKey]) paths[pathKey] = {};

      const operation: any = {
        summary: ep.name,
        description: ep.description,
        tags: ep.tags,
        responses: {
          [ep.statusCode]: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: schemaFieldsToOpenAPI(ep.responseSchema),
              },
            },
          },
        },
      };

      if (ep.queryParams?.length) {
        operation.parameters = ep.queryParams.map(p => ({
          name: p.name,
          in: 'query',
          required: p.required,
          description: p.description,
          schema: { type: p.type === 'number' ? 'integer' : 'string' },
        }));
      }

      if (ep.pathParams?.length) {
        operation.parameters = [
          ...(operation.parameters || []),
          ...ep.pathParams.map(p => ({
            name: p,
            in: 'path',
            required: true,
            schema: { type: 'string' },
          })),
        ];
      }

      if (ep.requestBody?.length) {
        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: schemaFieldsToOpenAPI(ep.requestBody),
            },
          },
        };
      }

      if (ep.authRequired) {
        operation.security = [{ bearerAuth: [] }];
      }

      paths[pathKey][ep.method.toLowerCase()] = operation;
    }

    return {
      openapi: '3.0.0',
      info: { title: 'API', version: '1.0.0' },
      paths,
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    };
  }, [endpoints]);

  /** Clear request logs */
  const clearLogs = useCallback(() => setRequestLogs([]), []);

  /** Get unique tags */
  const allTags = Array.from(new Set(endpoints.flatMap(ep => ep.tags)));

  return {
    endpoints,
    requestLogs,
    isMockServerRunning,
    allTags,
    addEndpoint,
    updateEndpoint,
    removeEndpoint,
    duplicateEndpoint,
    loadTemplates,
    simulateRequest,
    toggleMockServer,
    exportOpenAPI,
    clearLogs,
  };
}

// ─── Utility ─────────────────────────────────────────────────

function schemaFieldsToOpenAPI(fields: SchemaField[]): object {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const field of fields) {
    let prop: any;
    switch (field.type) {
      case 'string': case 'email': case 'url': case 'date':
        prop = { type: 'string' };
        if (field.type === 'email') prop.format = 'email';
        if (field.type === 'url') prop.format = 'uri';
        if (field.type === 'date') prop.format = 'date-time';
        break;
      case 'number':
        prop = { type: 'number' };
        break;
      case 'boolean':
        prop = { type: 'boolean' };
        break;
      case 'uuid':
        prop = { type: 'string', format: 'uuid' };
        break;
      case 'array':
        prop = { type: 'array', items: field.children?.length ? schemaFieldsToOpenAPI(field.children) : { type: 'string' } };
        break;
      case 'object':
        prop = field.children ? schemaFieldsToOpenAPI(field.children) : { type: 'object' };
        break;
      default:
        prop = { type: 'string' };
    }
    if (field.description) prop.description = field.description;
    if (field.example) prop.example = field.example;
    properties[field.name] = prop;
    if (field.required) required.push(field.name);
  }

  return { type: 'object', properties, ...(required.length ? { required } : {}) };
}
