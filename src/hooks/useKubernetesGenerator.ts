import { useState, useCallback } from 'react';

export interface K8sConfig {
  appName: string;
  namespace: string;
  replicas: number;
  image: string;
  containerPort: number;
  servicePort: number;
  serviceType: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  cpuRequest: string;
  cpuLimit: string;
  memoryRequest: string;
  memoryLimit: string;
  healthPath: string;
  ingressEnabled: boolean;
  ingressHost: string;
  tlsEnabled: boolean;
  envVars: { key: string; value: string }[];
  hpaEnabled: boolean;
  hpaMinReplicas: number;
  hpaMaxReplicas: number;
  hpaTargetCPU: number;
}

export function useKubernetesGenerator() {
  const [config, setConfig] = useState<K8sConfig>({
    appName: 'my-app',
    namespace: 'default',
    replicas: 2,
    image: 'my-app:latest',
    containerPort: 3000,
    servicePort: 80,
    serviceType: 'ClusterIP',
    cpuRequest: '100m',
    cpuLimit: '500m',
    memoryRequest: '128Mi',
    memoryLimit: '512Mi',
    healthPath: '/health',
    ingressEnabled: true,
    ingressHost: 'app.example.com',
    tlsEnabled: true,
    envVars: [],
    hpaEnabled: false,
    hpaMinReplicas: 2,
    hpaMaxReplicas: 10,
    hpaTargetCPU: 70,
  });

  const addEnvVar = useCallback((key: string, value: string) => {
    setConfig(prev => ({ ...prev, envVars: [...prev.envVars, { key, value }] }));
  }, []);

  const removeEnvVar = useCallback((key: string) => {
    setConfig(prev => ({ ...prev, envVars: prev.envVars.filter(e => e.key !== key) }));
  }, []);

  const generateDeployment = useCallback((): string => {
    const c = config;
    const envBlock = c.envVars.length > 0 ? `        env:\n${c.envVars.map(e => `        - name: ${e.key}\n          value: "${e.value}"`).join('\n')}` : '';
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${c.appName}
  namespace: ${c.namespace}
  labels:
    app: ${c.appName}
spec:
  replicas: ${c.replicas}
  selector:
    matchLabels:
      app: ${c.appName}
  template:
    metadata:
      labels:
        app: ${c.appName}
    spec:
      containers:
      - name: ${c.appName}
        image: ${c.image}
        ports:
        - containerPort: ${c.containerPort}
${envBlock}
        resources:
          requests:
            cpu: "${c.cpuRequest}"
            memory: "${c.memoryRequest}"
          limits:
            cpu: "${c.cpuLimit}"
            memory: "${c.memoryLimit}"
        livenessProbe:
          httpGet:
            path: ${c.healthPath}
            port: ${c.containerPort}
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: ${c.healthPath}
            port: ${c.containerPort}
          initialDelaySeconds: 5
          periodSeconds: 10`;
  }, [config]);

  const generateService = useCallback((): string => {
    const c = config;
    return `apiVersion: v1
kind: Service
metadata:
  name: ${c.appName}-svc
  namespace: ${c.namespace}
spec:
  type: ${c.serviceType}
  selector:
    app: ${c.appName}
  ports:
  - port: ${c.servicePort}
    targetPort: ${c.containerPort}
    protocol: TCP`;
  }, [config]);

  const generateIngress = useCallback((): string => {
    const c = config;
    if (!c.ingressEnabled) return '# Ingress disabled';
    const tls = c.tlsEnabled ? `  tls:\n  - hosts:\n    - ${c.ingressHost}\n    secretName: ${c.appName}-tls` : '';
    return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${c.appName}-ingress
  namespace: ${c.namespace}
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
${tls}
  rules:
  - host: ${c.ingressHost}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${c.appName}-svc
            port:
              number: ${c.servicePort}`;
  }, [config]);

  const generateHPA = useCallback((): string => {
    const c = config;
    if (!c.hpaEnabled) return '# HPA disabled';
    return `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${c.appName}-hpa
  namespace: ${c.namespace}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${c.appName}
  minReplicas: ${c.hpaMinReplicas}
  maxReplicas: ${c.hpaMaxReplicas}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: ${c.hpaTargetCPU}`;
  }, [config]);

  const generateAll = useCallback((): string => {
    return [generateDeployment(), '---', generateService(), '---', generateIngress(), ...(config.hpaEnabled ? ['---', generateHPA()] : [])].join('\n');
  }, [generateDeployment, generateService, generateIngress, generateHPA, config.hpaEnabled]);

  return { config, setConfig, addEnvVar, removeEnvVar, generateDeployment, generateService, generateIngress, generateHPA, generateAll };
}
