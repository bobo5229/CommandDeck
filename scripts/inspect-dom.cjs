const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9226',
  '--user-data-dir=C:\\Users\\BoBo\\AppData\\Local\\Temp\\edge_cdp_test2',
  '--window-size=420,860',
  'http://localhost:1420/'
]);

function getRect(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
}

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9226/json');
    const tabs = await res.json();
    const tab = tabs.find(t => t.url && t.url.includes('1420'));
    if (!tab) {
      console.log('No 1420 tab found');
      edge.kill();
      return;
    }
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const getR = (el) => {
              if (!el) return null;
              const r = el.getBoundingClientRect();
              return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
            };
            const actions = document.querySelector('.deck-header-actions');
            const btns = Array.from(actions ? actions.querySelectorAll('button') : []);
            const container = document.querySelector('.deck-app-container');
            const scrollArea = document.querySelector('.deck-scroll-area');
            const nowCards = Array.from(document.querySelectorAll('.deck-now-card'));
            return {
              windowInnerWidth: window.innerWidth,
              windowInnerHeight: window.innerHeight,
              containerRect: getR(container),
              scrollAreaRect: getR(scrollArea),
              btnCount: btns.length,
              btnRects: btns.map(b => ({
                title: b.getAttribute('title'),
                rect: getR(b)
              })),
              nowCards: nowCards.map(c => ({
                title: c.querySelector('.deck-now-task-title')?.textContent,
                isExpanded: c.classList.contains('is-expanded'),
                rect: getR(c)
              }))
            };
          })()`,
          returnByValue: true
        }
      }));
    });
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.id === 1) {
        console.log('DOM METRICS:', JSON.stringify(msg.result.result.value, null, 2));
        ws.close();
        edge.kill();
        process.exit(0);
      }
    });
  } catch (e) {
    console.error('Error:', e);
    edge.kill();
    process.exit(1);
  }
}, 2500);
