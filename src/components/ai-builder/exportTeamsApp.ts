import JSZip from 'jszip';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Microsoft Teams App Manifest Generator
 * Generates a sideloadable Teams app package (ZIP) containing:
 * - manifest.json (v1.16 schema)
 * - color.png (192x192 icon)
 * - outline.png (32x32 icon)
 *
 * The exported app works as both a Personal Tab and a Configurable (Channel) Tab,
 * pointing to the project's published URL or a user-supplied URL.
 */

interface TeamsExportOptions {
  projectName: string;
  appUrl: string; // The hosted URL of the built app
  description?: string;
  accentColor?: string;
}

function generateManifest(opts: TeamsExportOptions): string {
  const {
    projectName,
    appUrl,
    description = `${projectName} — built with Ultrium AI Studio`,
    accentColor = '#0078D4',
  } = opts;

  // Deterministic GUID from project name for stable app identity
  const id = crypto.randomUUID();

  const manifest = {
    $schema: 'https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json',
    manifestVersion: '1.16',
    version: '1.0.0',
    id,
    developer: {
      name: 'Ultrium AI Studio',
      websiteUrl: appUrl,
      privacyUrl: `${appUrl}/privacy`,
      termsOfUseUrl: `${appUrl}/terms`,
    },
    name: {
      short: projectName.slice(0, 30),
      full: projectName.slice(0, 100),
    },
    description: {
      short: description.slice(0, 80),
      full: description.slice(0, 4000),
    },
    icons: {
      color: 'color.png',
      outline: 'outline.png',
    },
    accentColor,
    staticTabs: [
      {
        entityId: 'personal-tab',
        name: projectName.slice(0, 30),
        contentUrl: appUrl,
        websiteUrl: appUrl,
        scopes: ['personal'],
      },
    ],
    configurableTabs: [
      {
        configurationUrl: appUrl,
        canUpdateConfiguration: false,
        scopes: ['team', 'groupChat'],
      },
    ],
    permissions: ['identity', 'messageTeamMembers'],
    validDomains: [new URL(appUrl).hostname],
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Generate a simple placeholder icon as a PNG data URL.
 * Creates a colored square with the first letter of the project name.
 */
function generateIconPng(size: number, letter: string, bgColor: string): Blob {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.15);
  ctx.fill();

  // Letter
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.5}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter.toUpperCase(), size / 2, size / 2 + size * 0.03);

  // Convert to blob synchronously via toBlob workaround
  const dataUrl = canvas.toDataURL('image/png');
  const byteStr = atob(dataUrl.split(',')[1]);
  const arr = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
  return new Blob([arr], { type: 'image/png' });
}

export async function exportTeamsApp(
  projectName: string,
  publishedUrl: string,
  accentColor?: string,
): Promise<void> {
  if (!publishedUrl) {
    throw new Error('You must publish the app first to get a hosted URL for Teams.');
  }

  const zip = new JSZip();

  // Manifest
  const manifest = generateManifest({
    projectName,
    appUrl: publishedUrl,
    accentColor,
  });
  zip.file('manifest.json', manifest);

  // Icons
  const letter = projectName.charAt(0) || 'A';
  const color = accentColor || '#0078D4';
  const colorIcon = generateIconPng(192, letter, color);
  const outlineIcon = generateIconPng(32, letter, '#FFFFFF');
  zip.file('color.png', colorIcon);
  zip.file('outline.png', outlineIcon);

  // README
  zip.file('README.md', `# ${projectName} — Teams App

## How to install

1. Open Microsoft Teams
2. Go to **Apps** → **Manage your apps** → **Upload a custom app**
3. Select **Upload a custom app** (or **Upload for your org** if you're an admin)
4. Choose this ZIP file
5. The app will appear as a personal tab and can be added to channels

## Requirements

- The app must be hosted at: ${publishedUrl}
- Your Teams admin may need to allow sideloading of custom apps

## Customization

Edit \`manifest.json\` to change:
- App name, description, and icons
- Accent color
- Valid domains (if you use a custom domain)

Replace \`color.png\` (192×192) and \`outline.png\` (32×32) with your own icons.
`);

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-teams-app.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
