---
name: analyzed-use_cases
description: Use case diagram and actor-goal inventory for the logbook PWA.
type: analysis
commit-hash: d363d07ab70bdbae818bada7838fe13166f4ef08
---

# Use Cases

- [Actors](#actors)
- [Use Case Diagram](#use-case-diagram)
- [Primary Flows](#primary-flows)

## Actors

Single human actor (**Worker** — the person logging their own time) plus two system actors: **Browser platform** (SW/PWA/IndexedDB) and **Other tab** (same user, second window). No admin, no server. (Factual)

## Use Case Diagram

Mermaid has no native use-case notation; rendered as a flowchart (ellipse = use case):

```mermaid
flowchart LR
    W((Worker))
    T((Other tab))
    P((Browser platform))

    subgraph Main screen
      UC1([Record a log entry - free text or shortcut 1-9])
      UC2([Edit today's log in textarea])
      UC3([Switch target day - date picker with roll-over])
      UC4([View formatted summary in new window])
      UC5([Export log as HTML/MD/plaintext file])
      UC6([Delete active day's log])
      UC7([Read help / changelog])
      UC8([Install as PWA])
    end

    subgraph Config screen
      UC9([Set rounding unit])
      UC10([Register shortcuts 1-9])
      UC11([Set date roll-over time])
    end

    W --> UC1 & UC2 & UC3 & UC4 & UC5 & UC6 & UC7 & UC8
    W --> UC9 & UC10 & UC11

    UC1 -. include: append timestamp .-> UC2
    UC4 -. include: parse + rounding .-> UC9
    UC5 -. include: parse + rounding .-> UC9

    UC2 -. sync via BroadcastChannel .-> T
    UC9 & UC10 & UC11 -. sync .-> T
    UC8 -. beforeinstallprompt .-> P
    P -. offline serving via Workbox SW .-> W
```

## Primary Flows

| Use case | Trigger | Outcome |
| --- | --- | --- |
| Record entry | Digit key 1–9 / shortcut button / free-text + Enter | `YYYY-MM-DD HH:MMTag` line appended, buffered, flushed to IndexedDB |
| View summary | Menu → "formatted log" | New window with per-category time table (`^` categories excluded from actual-time sum) |
| Export | Menu → download | Standalone HTML file with HTML/plaintext/Markdown sections + copy buttons |
| Day switch | Date input change | Buffer flushed, textarea reloaded with the chosen logical day |
| Delete | Menu → confirm modal | Active day's lines removed from canonical log |

d363d07ab70bdbae818bada7838fe13166f4ef08
