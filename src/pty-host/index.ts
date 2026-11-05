import { hostPaths } from './paths';
import { startHostServer } from './server';

// Started detached by the app (see host-launcher): serves the sessions over a socket until it holds none.
const hostDir = process.env['SANDY_PTY_HOST_DIR'];
if (hostDir) {
  void startHostServer({ paths: hostPaths(hostDir), onClosed: () => process.exit(0) }).then((server) => {
    if (!server) process.exit(0);
  });
}
