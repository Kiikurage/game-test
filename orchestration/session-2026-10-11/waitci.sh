#!/bin/bash
# usage: waitci.sh <run_id>
while true; do
  s=$(gh api "repos/Kiikurage/game-test/actions/runs/$1" --jq '.status+" "+(.conclusion//"")' 2>/dev/null)
  case "$s" in completed*) echo "$s"; exit 0;; esac
  sleep 60
done
