import { connect, type Socket } from 'node:net';
import { createLineDecoder, encodeMessage } from '../../../contracts/framing';
import { PROTOCOL_VERSION, type ClientMessage, type HostMessage } from '../../../contracts/pty-messages';
import { readToken, type HostPaths } from '../../../pty-host/paths';

const HELLO_REPLY_TIMEOUT_MS = 3000;

export interface HostConnection {
  // Protocol version the host speaks: a different one must not be driven, only stopped.
  hostProtocol: number;
  send(message: ClientMessage): void;
  onMessage(listener: (message: HostMessage) => void): void;
  onClose(listener: () => void): void;
  close(): void;
}

// One attempt: resolves `undefined` when no host answers or refuses the token.
export function openConnection(paths: HostPaths): Promise<HostConnection | undefined> {
  const token = readToken(paths);
  if (token === undefined) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const socket: Socket = connect(paths.socket);
    socket.setEncoding('utf8');
    const messageListeners: Array<(message: HostMessage) => void> = [];
    const closeListeners: Array<() => void> = [];
    let settled = false;
    const settle = (connection: HostConnection | undefined): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!connection) socket.destroy();
      resolve(connection);
    };
    const timer = setTimeout(() => settle(undefined), HELLO_REPLY_TIMEOUT_MS);
    const decode = createLineDecoder((raw) => {
      const message = raw as HostMessage;
      if (!settled) {
        if (message.type === 'hello-ok') {
          settle({
            hostProtocol: message.protocol,
            send: (outgoing) => void (socket.writable && socket.write(encodeMessage(outgoing))),
            onMessage: (listener) => void messageListeners.push(listener),
            onClose: (listener) => void closeListeners.push(listener),
            close: () => socket.end(),
          });
        } else settle(undefined);
        return;
      }
      messageListeners.forEach((listener) => listener(message));
    });
    socket.on('data', decode);
    socket.on('error', () => settle(undefined));
    socket.on('close', () => {
      settle(undefined);
      closeListeners.forEach((listener) => listener());
    });
    socket.on('connect', () => socket.write(encodeMessage({ type: 'hello', token, protocol: PROTOCOL_VERSION } satisfies ClientMessage)));
  });
}
