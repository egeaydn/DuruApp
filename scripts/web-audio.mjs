import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { setDefaultResultOrder } from 'node:dns';

setDefaultResultOrder('ipv4first');
process.env.EXPO_OFFLINE = '1';
process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --dns-result-order=ipv4first`.trim();
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = '127.0.0.1';
const cli = path.resolve('node_modules/expo/bin/cli');
console.log('Anlatıcı 1 web dinleme testi: http://127.0.0.1:8084');
process.argv = [process.execPath, cli, 'start', '--web', '--dev-client', '--scheme', 'duru', '--localhost', '--port', '8084', '--max-workers', '2'];
await import(pathToFileURL(cli).href);
