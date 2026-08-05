import path from "node:path";
import { fileURLToPath } from "node:url";

import startServerModule from "next/dist/server/lib/start-server.js";

const { startServer } = startServerModule;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

process.env.TURBOPACK = "1";
process.env.__NEXT_DEV_SERVER = "1";

const port = Number(process.env.PORT || "3000");
const hostname = process.env.NEXT_HOST || "localhost";

startServer({
  dir: path.resolve(scriptDirectory, ".."),
  isDev: true,
  hostname,
  port,
  allowRetry: true,
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
