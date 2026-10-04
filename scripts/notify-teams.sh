#!/usr/bin/env bash
# Post a short card to the 2iC Teams channel. Used by the smoke workflows when
# a run fails, so a broken route is seen within fifteen minutes rather than
# when someone next looks at email (the 28 Sep 2026 outage ran for eighteen
# hours with nobody told).
#
#   TEAMS_WEBHOOK_URL=... scripts/notify-teams.sh "<title>" "<text>" "<link>"
#
# The webhook is a Teams Workflows flow of the "post to a channel when a
# webhook request is received" kind, which accepts an Adaptive Card. With no
# TEAMS_WEBHOOK_URL set the script says so and exits 0, so a missing secret
# never turns a red run green or a green run red.
set -eu

title=${1:?title}
text=${2:?text}
link=${3:-}

if [ -z "${TEAMS_WEBHOOK_URL:-}" ]; then
  echo "TEAMS_WEBHOOK_URL is not set; not posting to Teams."
  exit 0
fi

payload=$(node -e '
  const [title, text, link] = process.argv.slice(1)
  const body = [
    { type: "TextBlock", size: "Medium", weight: "Bolder", text: title },
    { type: "TextBlock", wrap: true, text },
  ]
  const actions = link ? [{ type: "Action.OpenUrl", title: "Open the run", url: link }] : []
  process.stdout.write(JSON.stringify({
    type: "message",
    attachments: [{
      contentType: "application/vnd.microsoft.card.adaptive",
      content: { type: "AdaptiveCard", version: "1.4", body, actions, $schema: "http://adaptivecards.io/schemas/adaptive-card.json" },
    }],
  }))
' "$title" "$text" "$link")

curl -sS --fail-with-body --max-time 20 -X POST -H 'Content-Type: application/json' --data "$payload" "$TEAMS_WEBHOOK_URL" >/dev/null
echo "Posted to Teams."
