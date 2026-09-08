const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9232',
  '--user-data-dir=C:\\Users\\BoBo\\AppData\\Local\\Temp\\edge_cdp_resp',
  'http://localhost:1420/'
]);

function send(ws, id, method, params = {}) {
  return new Promise((resolve) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9232/json');
    const tabs = await res.json();
    const tab = tabs.find(t => t.url && t.url.includes('1420'));
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener('open', resolve));

    await send(ws, 1, 'Page.enable');
    await send(ws, 2, 'Runtime.enable');

    // Test 380px
    await send(ws, 3, 'Emulation.setDeviceMetricsOverride', {
      width: 380,
      height: 800,
      deviceScaleFactor: 2.0, // 4K 200% scaling
      mobile: false
    });

    const metrics380 = await send(ws, 4, 'Runtime.evaluate', {
      expression: `(() => {
        const body = document.body;
        const scrollArea = document.querySelector('.deck-scroll-area');
        return {
          windowInnerWidth: window.innerWidth,
          bodyScrollWidth: body.scrollWidth,
          bodyClientWidth: body.clientWidth,
          hasHorizontalScroll: scrollArea.scrollWidth > scrollArea.clientWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('380px (4K 200% DPI):', JSON.stringify(metrics380.result.value));

    // Test 600px
    await send(ws, 5, 'Emulation.setDeviceMetricsOverride', {
      width: 600,
      height: 800,
      deviceScaleFactor: 1.5, // 4K 150% scaling
      mobile: false
    });

    const metrics600 = await send(ws, 6, 'Runtime.evaluate', {
      expression: `(() => {
        const container = document.querySelector('.deck-app-container');
        const r = container.getBoundingClientRect();
        return {
          windowInnerWidth: window.innerWidth,
          containerWidth: Math.round(r.width),
          containerX: Math.round(r.x)
        };
      })()`,
      returnByValue: true
    });
    console.log('600px (4K 150% DPI):', JSON.stringify(metrics600.result.value));

    ws.close();
    edge.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    edge.kill();
    process.exit(1);
  }
}, 2500);
