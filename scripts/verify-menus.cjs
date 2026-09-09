const { spawn } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const taskMenuScreenshot = 'C:\\Users\\BoBo\\.gemini\\antigravity\\brain\\9a62a55e-b28b-4713-a802-d08bb7df0600\\task_menu_open.png';
const progressMenuScreenshot = 'C:\\Users\\BoBo\\.gemini\\antigravity\\brain\\9a62a55e-b28b-4713-a802-d08bb7df0600\\progress_menu_open.png';

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9235',
  '--user-data-dir=C:\\Users\\BoBo\\AppData\\Local\\Temp\\edge_cdp_menus',
  '--window-size=420,860',
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
    const res = await fetch('http://127.0.0.1:9235/json');
    const tabs = await res.json();
    const tab = tabs.find(t => t.url && t.url.includes('1420'));
    if (!tab) {
      console.error('No tab found');
      edge.kill();
      process.exit(1);
    }

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener('open', resolve));

    const errors = [];
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        errors.push(msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        errors.push(msg.params.exceptionDetails.text);
      }
    });

    await send(ws, 1, 'Page.enable');
    await send(ws, 2, 'Runtime.enable');
    await send(ws, 3, 'Emulation.setDeviceMetricsOverride', {
      width: 416,
      height: 840,
      deviceScaleFactor: 1.5,
      mobile: false
    });

    // 1. Click TaskMenu trigger in the first NOW card
    const clickTaskMenuRes = await send(ws, 4, 'Runtime.evaluate', {
      expression: `(() => {
        const trigger = document.querySelector('.deck-now-card .deck-menu-trigger');
        if (!trigger) return { error: 'No task menu trigger found' };
        trigger.click();
        const menu = document.querySelector('.deck-now-card .deck-menu');
        if (!menu) return { error: 'No task menu opened' };
        const cs = window.getComputedStyle(menu);
        const items = Array.from(menu.querySelectorAll('.deck-menu-item')).map(it => ({
          text: it.textContent.trim(),
          color: window.getComputedStyle(it).color,
          fontSize: window.getComputedStyle(it).fontSize,
          height: it.getBoundingClientRect().height,
          isDestructive: it.classList.contains('deck-menu-item--destructive')
        }));
        return {
          menuRect: {
            x: Math.round(menu.getBoundingClientRect().x),
            y: Math.round(menu.getBoundingClientRect().y),
            width: Math.round(menu.getBoundingClientRect().width),
            height: Math.round(menu.getBoundingClientRect().height)
          },
          menuBg: cs.backgroundColor,
          menuBorder: cs.borderColor,
          menuBoxShadow: cs.boxShadow,
          menuBorderRadius: cs.borderRadius,
          items
        };
      })()`,
      returnByValue: true
    });
    console.log('TASK MENU DETAILS:', JSON.stringify(clickTaskMenuRes.result.value, null, 2));

    // Capture screenshot of open TaskMenu
    const shot1 = await send(ws, 5, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(taskMenuScreenshot, Buffer.from(shot1.data, 'base64'));
    console.log('Saved TaskMenu screenshot to', taskMenuScreenshot);

    // Press Escape to close TaskMenu
    await send(ws, 6, 'Runtime.evaluate', {
      expression: `(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        return {
          menuStillExists: !!document.querySelector('.deck-now-card .deck-menu')
        };
      })()`,
      returnByValue: true
    });

    // 2. Open ProgressItem menu
    const clickProgressMenuRes = await send(ws, 7, 'Runtime.evaluate', {
      expression: `(() => {
        const itemBtn = document.querySelector('.deck-item-menu-btn');
        if (!itemBtn) return { error: 'No item menu btn found' };
        itemBtn.click();
        const menu = itemBtn.parentElement.querySelector('.deck-menu');
        const parentLi = itemBtn.closest('.deck-checklist-item');
        const items = Array.from(menu.querySelectorAll('.deck-menu-item')).map(it => ({
          text: it.textContent.trim(),
          color: window.getComputedStyle(it).color,
          isDestructive: it.classList.contains('deck-menu-item--destructive')
        }));
        return {
          hasMenu: !!menu,
          triggerOpenClass: itemBtn.classList.contains('is-open'),
          triggerAriaExpanded: itemBtn.getAttribute('aria-expanded'),
          parentLiBg: window.getComputedStyle(parentLi).backgroundColor,
          items
        };
      })()`,
      returnByValue: true
    });
    console.log('PROGRESS MENU DETAILS:', JSON.stringify(clickProgressMenuRes.result.value, null, 2));

    // Capture screenshot of open ProgressItem menu
    const shot2 = await send(ws, 8, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(progressMenuScreenshot, Buffer.from(shot2.data, 'base64'));
    console.log('Saved ProgressMenu screenshot to', progressMenuScreenshot);

    console.log('CONSOLE ERRORS COUNT:', errors.length);
    if (errors.length > 0) {
      console.log('CONSOLE ERRORS:', errors);
    }

    ws.close();
    edge.kill();
    process.exit(0);
  } catch (err) {
    console.error('Verification error:', err);
    edge.kill();
    process.exit(1);
  }
}, 2000);
