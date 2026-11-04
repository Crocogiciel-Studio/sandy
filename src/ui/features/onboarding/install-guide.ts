// One instruction, with the command to run when there is one.
export interface InstallStep {
  text: string;
  command?: string;
}

export interface InstallGuide {
  os: string;
  steps: InstallStep[];
}

const DETAILS: InstallStep = { text: 'Prerequisites and other methods are on Docker’s install page.' };
const BACK: InstallStep = { text: 'Come back to sandy: the check reruns by itself.' };

// Short, OS-specific steps to install sbx by hand: sandy never runs an installer itself.
// Commands follow https://docs.docker.com/ai/sandboxes/install/ (read 2026-10-28); sbx moves fast, so
// anything beyond the one-line install is left to that page.
export function installGuide(platform: string): InstallGuide {
  switch (platform) {
    case 'darwin':
      return {
        os: 'macOS',
        steps: [
          {
            text: 'With Homebrew, on an Apple silicon Mac (macOS 14 or newer):',
            command: 'brew trust docker/tap\nbrew install docker/tap/sbx',
          },
          DETAILS,
          BACK,
        ],
      };
    case 'win32':
      return {
        os: 'Windows',
        steps: [{ text: 'On Windows 11, in a terminal:', command: 'winget install -h Docker.sbx' }, DETAILS, BACK],
      };
    default:
      return {
        os: 'Linux',
        steps: [
          { text: 'On Ubuntu 24.04 or newer, follow the “sbx only” procedure on Docker’s install page (Docker repository, then apt install docker-sbx).' },
          { text: 'KVM must be enabled and your user in the kvm group.', command: 'sudo usermod -aG kvm $USER' },
          BACK,
        ],
      };
  }
}
