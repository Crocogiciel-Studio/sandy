export interface InstallGuide {
  os: string;
  steps: string[];
}

const DETAILS = 'Les prérequis et les autres méthodes sont sur la page d’instructions de Docker.';
const BACK = 'Revenez sur sandy : la vérification se relance toute seule.';

// Short, OS-specific steps to install sbx by hand: sandy never runs an installer itself.
// Commands follow https://docs.docker.com/ai/sandboxes/install/ (read 2026-10-28); sbx moves fast, so
// anything beyond the one-line install is left to that page.
export function installGuide(platform: string): InstallGuide {
  switch (platform) {
    case 'darwin':
      return {
        os: 'macOS',
        steps: ['Sur un Mac Apple silicon (macOS 14 ou plus récent), avec Homebrew : brew trust docker/tap puis brew install docker/tap/sbx', DETAILS, BACK],
      };
    case 'win32':
      return {
        os: 'Windows',
        steps: ['Sous Windows 11, dans un terminal : winget install -h Docker.sbx', DETAILS, BACK],
      };
    default:
      return {
        os: 'Linux',
        steps: ['Sur Ubuntu 24.04 ou plus récent, suivez la procédure « sbx seul » de la page d’instructions de Docker (dépôt Docker puis apt install docker-sbx).', 'KVM doit être activé et votre utilisateur dans le groupe kvm.', BACK],
      };
  }
}
