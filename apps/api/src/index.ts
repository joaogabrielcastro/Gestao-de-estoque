import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();
const host = process.env.HOST ?? "0.0.0.0";
app.listen(env.PORT, host, () => {
  console.log(`API em http://${host}:${env.PORT}/api`);
});
