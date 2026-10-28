export interface InstallGuide {
  os: string;
  steps: string[];
}

const BACK = 'Revenez sur sandy : la vérification se relance toute seule.';

// Short, OS-specific steps to install sbx by hand: sandy never runs an installer itself.
// File names come from the docker/sbx-releases assets (checked on v0.50.0).
export function installGuide(platform: string): InstallGuide {
  switch (platform) {
    case 'darwin':
      return {
        os: 'macOS',
        steps: ['Téléchargez DockerSandboxes-darwin.dmg sur la page des versions.', 'Ouvrez-le et installez sbx.', BACK],
      };
    case 'win32':
      return {
        os: 'Windows',
        steps: ['Installez sbx depuis la page des versions (ou avec WinGet).', BACK],
      };
    default:
      return {
        os: 'Linux',
        steps: [
          'Téléchargez le paquet de votre distribution sur la page des versions (.deb pour Ubuntu, .rpm pour Rocky Linux, ou l’archive .tar.gz).',
          'Installez-le avec le gestionnaire de paquets de votre distribution.',
          BACK,
        ],
      };
  }
}
