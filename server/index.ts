import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createJsonStore } from "./store/jsonStore.js";

// vite.config.ts proxies /api to this port.
const PORT = Number(process.env.PORT ?? 3001);
const DATA_FILE = process.env.DATA_FILE ?? fileURLToPath(new URL("./data/save.json", import.meta.url));

createApp(createJsonStore(DATA_FILE)).listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT} (data: ${DATA_FILE})`);
});
