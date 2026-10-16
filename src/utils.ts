const LOGO = String.raw`
              .=#%@@@%*:                :+%@@@@#+.
             :%@@@@@@@@@*.            .+@@@@@@@@@@=
            .@@@@@@@@@@@@%:          .#@@@@@@@@@@@@+.
            .@@@@@@@@@@@@@@-        :%@@@@@@@@@@@@@@#.
             +@@@@@@@@@@@@@@=      -@@@@@@@@@@@@@@@@@%.
              =@@@@@@@@@@@@@@+    =@@@@@@@@@@@@@@@@@@@@:
               -@@@@@@@@@@@@@@*. +@@@@@@@@@@@@@@@@@@@@@@-
                :%@@@@@@@@@@@@@%*@@@@@@@@@@@@@@@@@@@@@@@@+
                 .#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*.
                  .*@@@@@@@@@@@@@@@@@@@@@@@@#@@@@@@@@@@@@@@#.
    .:::.           =@@@@@@@@@@@@@@@@@@@@@@*.:%@@@@@@@@@@@@@%:
 .=#@@@@@%+.         =@@@@@@@@@@@@@@@@@@@@+   .#@@@@@@@@@@@@@@-
:@@@@@@@@@@@-         -@@@@@@@@@@@@@@@@@@=     .*@@@@@@@@@@@@@@-
#@@@@@@@@@@@%          :%@@@@@@@@@@@@@@@-        +@@@@@@@@@@@@@%
*@@@@@@@@@@@%           .#@@@@@@@@@@@@%:          -@@@@@@@@@@@@#
.%@@@@@@@@@@:            .*@@@@@@@@@@#.            :%@@@@@@@@@%:
 .-*%@@@%#=.               :+%@@@@%*-               .=*%@@@%#=.
`

type Endpoint = readonly [method: string, path: string, description: string]

const ENDPOINTS: readonly Endpoint[] = [
  ["GET", "/api/birthdays/today", "festeggiati di oggi"],
  ["GET", "/api/employees", "ricerca, filtri, ordinamento, paginazione"],
  ["POST", "/api/employees", "crea dipendente"],
  ["PATCH", "/api/employees/:id", "modifica dati (anche active)"],
  ["DELETE", "/api/employees/:id", "elimina dipendente"],
  ["GET", "/api/offices", "sedi (per filtri e form)"],
  ["GET", "/api/teams", "team (per filtri e form)"],
  ["POST", "/api/newsletter/send", "trigger invio giornaliero"],
  ["GET", "/api/newsletter/sends", "storico invii"],
  ["GET", "/api/newsletter/sends/:id", "dettaglio di un invio"],
  ["POST", "/api/__reset", "ripristina i dati iniziali"],
]

const METHOD_COLORS: Record<string, (s: string) => string> = {
  GET: green,
  POST: yellow,
  PATCH: blue,
  DELETE: red,
}

function colorsEnabled(): boolean {
  return process.stdout.isTTY === true && process.env["NO_COLOR"] === undefined
}

function ansi(code: string): (s: string) => string {
  return (s) => (colorsEnabled() ? `\x1b[${code}m${s}\x1b[0m` : s)
}

function green(s: string): string {
  return ansi("32")(s)
}
function yellow(s: string): string {
  return ansi("33")(s)
}
function blue(s: string): string {
  return ansi("34")(s)
}
function red(s: string): string {
  return ansi("31")(s)
}
function bold(s: string): string {
  return ansi("1")(s)
}
function dim(s: string): string {
  return ansi("2")(s)
}

export function buildBanner(port: number): string {
  const base = `http://localhost:${port}`
  const lines: string[] = [LOGO, "", dim("  " + "─".repeat(66)), ""]

  lines.push("  " + bold("Aidia"))
  lines.push("  " + "Mock API — Newsletter Compleanni")
  lines.push("")
  lines.push("  " + "Base URL:".padEnd(10) + bold(base))
  lines.push("")
  lines.push(dim("  " + "─".repeat(66)))
  lines.push("  " + bold("ENDPOINT"))
  lines.push("")

  for (const [method, path, description] of ENDPOINTS) {
    const coloredMethod = (METHOD_COLORS[method] ?? ((s: string) => s))(method.padEnd(6))
    lines.push(`  ${coloredMethod}  ${path.padEnd(26)} ${dim(description)}`.trimEnd())
  }
  lines.push("")
  return lines.join("\n")
}
