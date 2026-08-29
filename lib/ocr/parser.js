export function parseNutrition(data) {
  const words = data?.words || [];
  if (words.length === 0) return emptyResult();

  const rows = [];
  const tolerance = 12;
  words.forEach((w) => {
    const yCenter = (w.bbox.y0 + w.bbox.y1) / 2;
    let row = rows.find((r) => Math.abs(r.y - yCenter) < tolerance);
    if (!row) { row = { y: yCenter, words: [] }; rows.push(row); }
    row.words.push(w);
  });
  rows.sort((a, b) => a.y - b.y);
  rows.forEach((r) => r.words.sort((a, b) => a.bbox.x0 - b.bbox.x0));

  let targetX = null;
  outer: for (const row of rows) {
    const oneWord = row.words.find((w) => /100\s*g/i.test(w.text));
    if (oneWord) { targetX = (oneWord.bbox.x0 + oneWord.bbox.x1) / 2; break; }
    for (let i = 0; i < row.words.length - 1; i++) {
      if (/^100$/.test(row.words[i].text) && /^g$/i.test(row.words[i + 1].text)) {
        targetX = (row.words[i].bbox.x0 + row.words[i + 1].bbox.x1) / 2;
        break outer;
      }
    }
  }

  function bestNumberInRow(row) {
    const numberWords = row.words.filter((w) => /^\d+(\.\d+)?%?$/.test(w.text.replace(/,/g, ".")));
    if (numberWords.length === 0) return null;
    const clean = (t) => parseFloat(t.replace(/,/g, ".").replace("%", ""));
    const nonPercent = numberWords.filter((w) => !w.text.includes("%"));
    const pool = nonPercent.length ? nonPercent : numberWords;

    if (targetX != null) {
      const closest = pool.reduce((best, w) => {
        const x = (w.bbox.x0 + w.bbox.x1) / 2;
        const bestX = (best.bbox.x0 + best.bbox.x1) / 2;
        return Math.abs(x - targetX) < Math.abs(bestX - targetX) ? w : best;
      });
      return clean(closest.text);
    }
    return clean(pool[pool.length - 1].text);
  }

  function findValue(keywordRegex) {
    const row = rows.find((r) => keywordRegex.test(r.words.map((w) => w.text).join(" ")));
    return row ? bestNumberInRow(row) : null;
  }

  return {
    energy_kcal: findValue(/energy|calories?/i),
    total_fat_g: findValue(/total\s*fat/i),
    sat_fat_g: findValue(/saturated\s*fat/i),
    trans_fat_g: findValue(/trans\s*fat/i),
    sodium_mg: findValue(/sodium/i),
    carbohydrate_g: findValue(/carbohydrate/i),
    fiber_g: findValue(/fib(er|re)/i),
    sugar_g: findValue(/sugars?/i),
    protein_g: findValue(/protein/i),
  };
}

function emptyResult() {
  return {
    energy_kcal: null, total_fat_g: null, sat_fat_g: null, trans_fat_g: null,
    sodium_mg: null, carbohydrate_g: null, fiber_g: null, sugar_g: null, protein_g: null,
  };
}