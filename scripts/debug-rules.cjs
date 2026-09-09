(async () => {
  const tabsRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await tabsRes.json();
  const tab = tabs.find(t => t.title === 'CommandDeck' || t.url.includes('1420'));
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  function send(msg) {
    return new Promise(res => {
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === msg.id) {
          ws.removeEventListener('message', handler);
          res(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify(msg));
    });
  }

  // open task menu
  await send({ id: 1, method: 'Runtime.evaluate', params: { expression: 'document.querySelector(".deck-now-card .deck-menu-trigger").click()' } });
  await new Promise(r => setTimeout(r, 150));

  const rulesRes = await send({
    id: 2,
    method: 'Runtime.evaluate',
    params: {
      expression: `(() => {
        const el = document.querySelector('.deck-menu-item--destructive');
        if (!el) return 'not found';
        const sheets = Array.from(document.styleSheets);
        const matching = [];
        for (const sheet of sheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.selectorText && el.matches(rule.selectorText)) {
                matching.push({ selector: rule.selectorText, cssText: rule.cssText });
              }
            }
          } catch (e) {}
        }
        return {
          computedColor: window.getComputedStyle(el).color,
          matchingRules: matching
        };
      })()`,
      returnByValue: true
    }
  });

  console.log('MATCHING RULES:', JSON.stringify(rulesRes.result.value, null, 2));
  ws.close();
  process.exit(0);
})();
