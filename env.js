import dotenv from 'dotenv';
dotenv.config();

// Side-effect-free (no app.listen) so any module can import ENV without booting the server -
// index.js itself also imports from here, rather than defining ENV inline as it used to. That
// previously made every other module's `import { ENV } from '../index.js'` a circular import back
// into the entrypoint; harmless as long as ENV is only read inside function bodies (not at a
// module's own top level), but real enough to have caused an actual deadlock (Node exit code 13,
// "unsettled top-level await") once already when index.js briefly used dynamic imports.
export const ENV = process.env;
