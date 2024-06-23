// types.d.ts
import { IncomingMessage } from 'http';

declare module 'http' {
  interface IncomingMessage {
    params?: { [key: string]: string };
  }
}
