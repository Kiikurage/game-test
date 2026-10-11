#!/bin/sh
# Agent liveness: last activity and whether interrupted. Usage: agents.sh id1 id2 ...
D=/tmp/claude-0/-home-user-game-test/31f8f843-5216-5ee9-851d-3ca43c4a860a/tasks
now=$(date -u +%s)
for id in "$@"; do f=$D/$id.output
  ts=$(tail -c 3000 $f | grep -o '"timestamp":"[^"]*"' | tail -1 | cut -d'"' -f4)
  age=$(( now - $(date -u -d "$ts" +%s) ))
  intr=$(tail -c 1500 $f | grep -c 'interrupted\|stopped by the user')
  echo "$id age=${age}s interrupted=$intr"
done
