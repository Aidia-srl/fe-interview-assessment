import { serve } from "@hono/node-server"
import { createApp } from "./app.js"

const PORT = Number(process.env["PORT"] ?? 3001)

serve({ fetch: createApp().fetch, port: PORT }, (info) => {
  console.log(`Mock API newsletter compleanni → http://localhost:${info.port}`)
  console.log("Contratto API: vedi README.md — reset dati: POST /api/__reset")
})
