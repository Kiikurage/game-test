REMOTE="$1"; OUT="$2"; DEST="$3"; WORK="$4"
for attempt in 1 2; do
  rm -rf "$WORK" && mkdir -p "$WORK" && cd "$WORK"
  git init -q
  if git fetch -q --depth=1 "$REMOTE" refs/heads/verify-results 2> /dev/null; then
    git checkout -q -B verify-results FETCH_HEAD
  else
    git checkout -q --orphan verify-results
  fi
  mkdir -p "$DEST" && cp -R "$OUT"/. "$DEST"/
  git add -A -- "$DEST"
  git -c user.name=x -c user.email=x@x commit -q -m "m $DEST"
  if git push -q "$REMOTE" HEAD:refs/heads/verify-results; then echo pushed; exit 0; fi
done
exit 1
