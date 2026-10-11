p='/home/user/game-test/.claude/worktrees/agent-a778367005d9110f1/scripts/heroShots.mjs'
s=open(p).read()
old_start=s.index("  const label = (d) => escapeHtml(basename(resolve(d)) || d);")
old_end=s.index("  await renderSheet(html, files, join(afterDir, 'compare-sheet.png'), 1600);\n}")+len("  await renderSheet(html, files, join(afterDir, 'compare-sheet.png'), 1600);\n}")
new='''  const label = (d) => escapeHtml(basename(resolve(d)) || d);
  // 1 行に 2 視点（各視点は 左 = before / 右 = after）
  const html = `<!doctype html><meta charset="utf-8"><style>${SHEET_CSS}
    .pairs { grid-template-columns: 1fr 1fr; row-gap: 20px; column-gap: 28px; }</style>
    <h1>各視点の 左: before（${label(beforeDir)}） / 右: after（${label(afterDir)}）</h1>
    <div class="grid pairs">${rows.join('')}</div>`;
  await renderSheet(html, files, join(afterDir, 'compare-sheet.png'), 2560);
}'''
s=s[:old_start]+new+s[old_end:]
s=s.replace("  .head { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; color: #aaa; margin-bottom: 4px; }\n","")
s=s.replace('<div class="grid" style="grid-template-columns: 1fr 1fr">','<div class="grid" style="grid-template-columns: 1fr 1fr; gap: 4px">')
open(p,'w').write(s)
