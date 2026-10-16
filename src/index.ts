import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { buildBanner } from "./utils.js"

const PORT = Number(process.env["PORT"] ?? 3001)

serve({ fetch: createApp().fetch, port: PORT }, (info) => {
  console.log(buildBanner(info.port))
})
