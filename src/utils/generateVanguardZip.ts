import JSZip from 'jszip';
import {
  VANGUARD_AGENT_PY,
  VANGUARD_CONFIG_TEMPLATE,
  VANGUARD_INSTALL_SH,
  VANGUARD_README,
} from './vanguardFiles';

interface VanguardZipOptions {
  userId: string;
  apiEndpoint: string;
  secretKey: string;
  deviceName?: string;
  deviceLocation?: string;
}

export async function generateVanguardZip(options: VanguardZipOptions): Promise<Blob> {
  const {
    userId,
    apiEndpoint,
    secretKey,
    deviceName = 'Vanguard-Agent',
    deviceLocation = 'Default Location',
  } = options;

  const zip = new JSZip();

  // Add the Python agent script
  zip.file('vanguard_agent.py', VANGUARD_AGENT_PY);

  // Generate customized config.yaml
  const configYaml = VANGUARD_CONFIG_TEMPLATE
    .replace('{{USER_ID}}', userId)
    .replace('{{API_ENDPOINT}}', apiEndpoint)
    .replace('{{SECRET_KEY}}', secretKey)
    .replace('{{DEVICE_NAME}}', deviceName)
    .replace('{{DEVICE_LOCATION}}', deviceLocation);

  zip.file('config.yaml', configYaml);

  // Add the install script
  zip.file('install.sh', VANGUARD_INSTALL_SH);

  // Add the README
  zip.file('README.md', VANGUARD_README);

  // Generate the ZIP blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
