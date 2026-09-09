const fs = require('fs');

const taskMenuScreenshot = 'C:\\Users\\BoBo\\.gemini\\antigravity\\brain\\9a62a55e-b28b-4713-a802-d08bb7df0600\\tauri_task_menu_open.png';
const progressMenuScreenshot = 'C:\\Users\\BoBo\\.gemini\\antigravity\\brain\\9a62a55e-b28b-4713-a802-d08bb7df0600\\tauri_progress_menu_open.png';

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

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const tabsRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await tabsRes.json();
  const tab = tabs.find(t => t.title === 'CommandDeck' || t.url.includes('1420'));
  if (!tab) {
    console.error('No CommandDeck tab found in Tauri process');
    process.exit(1);
  }

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

  await send(ws, 1, 'Page.enable');
  await send(ws, 2, 'Runtime.enable');

  // Check state
  const stateRes = await send(ws, 3, 'Runtime.evaluate', {
    expression: `(() => {
      const cardHeader = document.querySelector('.deck-now-card-header');
      if (cardHeader && !document.querySelector('.deck-now-card.is-expanded')) {
        cardHeader.click();
      }
      return {
        nowCards: document.querySelectorAll('.deck-now-card').length,
        taskMenuTrigger: !!document.querySelector('.deck-now-card .deck-menu-trigger')
      };
    })()`,
    returnByValue: true
  });
  console.log('EXPANDED CARD:', JSON.stringify(stateRes.result.value));
  await wait(200);

  // 1. Open TaskMenu
  await send(ws, 4, 'Runtime.evaluate', {
    expression: `(() => {
      const trigger = document.querySelector('.deck-now-card .deck-menu-trigger');
      if (trigger) trigger.click();
    })()`
  });
  await wait(200);

  const taskMenuDetails = await send(ws, 5, 'Runtime.evaluate', {
    expression: `(() => {
      const trigger = document.querySelector('.deck-now-card .deck-menu-trigger');
      const menu = document.querySelector('.deck-now-card .deck-menu');
      if (!menu) return { error: 'Task menu not open' };
      const cs = window.getComputedStyle(menu);
      const items = Array.from(menu.querySelectorAll('.deck-menu-item')).map(it => ({
        text: it.textContent.trim(),
        color: window.getComputedStyle(it).color,
        height: Math.round(it.getBoundingClientRect().height),
        isDestructive: it.classList.contains('deck-menu-item--destructive')
      }));
      return {
        triggerOpen: trigger.classList.contains('is-open'),
        triggerExpanded: trigger.getAttribute('aria-expanded'),
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
  console.log('TASK MENU DETAILS:', JSON.stringify(taskMenuDetails.result.value, null, 2));

  // Screenshot 1
  const shot1 = await send(ws, 6, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(taskMenuScreenshot, Buffer.from(shot1.data, 'base64'));
  console.log('Saved TaskMenu screenshot to', taskMenuScreenshot);

  // Close TaskMenu via Escape
  await send(ws, 7, 'Runtime.evaluate', {
    expression: `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));`
  });
  await wait(200);

  const closedTaskMenu = await send(ws, 8, 'Runtime.evaluate', {
    expression: `!document.querySelector('.deck-now-card .deck-menu')`,
    returnByValue: true
  });
  console.log('TASK MENU CLOSED BY ESCAPE:', closedTaskMenu.result.value);

  // 2. Test ProgressItem menu
  // First check if a checklist item exists, if not create one for testing
  await send(ws, 9, 'Runtime.evaluate', {
    expression: `(() => {
      let item = document.querySelector('.deck-checklist-item');
      if (!item) {
        // click add item
        const addBtn = document.querySelector('.deck-add-progress-btn');
        if (addBtn) {
          addBtn.click();
          const input = document.querySelector('.deck-progress-input');
          if (input) {
            input.value = '测试进度事项';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            const confirmBtn = document.querySelector('.deck-inline-confirm-btn');
            if (confirmBtn) confirmBtn.click();
          }
        }
      }
    })()`
  });
  await wait(500);

  // Open ProgressItem menu
  await send(ws, 10, 'Runtime.evaluate', {
    expression: `(() => {
      const itemBtn = document.querySelector('.deck-item-menu-btn');
      if (itemBtn) itemBtn.click();
    })()`
  });
  await wait(200);

  const progMenuDetails = await send(ws, 11, 'Runtime.evaluate', {
    expression: `(() => {
      const itemBtn = document.querySelector('.deck-item-menu-btn');
      if (!itemBtn) return { error: 'No item btn found' };
      const menu = itemBtn.parentElement.querySelector('.deck-menu');
      const parentLi = itemBtn.closest('.deck-checklist-item');
      if (!menu) return { error: 'Progress menu not open' };
      const cs = window.getComputedStyle(menu);
      const items = Array.from(menu.querySelectorAll('.deck-menu-item')).map(it => ({
        text: it.textContent.trim(),
        color: window.getComputedStyle(it).color,
        height: Math.round(it.getBoundingClientRect().height),
        isDestructive: it.classList.contains('deck-menu-item--destructive')
      }));
      return {
        triggerOpen: itemBtn.classList.contains('is-open'),
        triggerExpanded: itemBtn.getAttribute('aria-expanded'),
        parentLiBg: window.getComputedStyle(parentLi).backgroundColor,
        menuRect: {
          x: Math.round(menu.getBoundingClientRect().x),
          y: Math.round(menu.getBoundingClientRect().y),
          width: Math.round(menu.getBoundingClientRect().width),
          height: Math.round(menu.getBoundingClientRect().height)
        },
        menuBg: cs.backgroundColor,
        menuBorder: cs.borderColor,
        menuBoxShadow: cs.boxShadow,
        items
      };
    })()`,
    returnByValue: true
  });
  console.log('PROGRESS MENU DETAILS:', JSON.stringify(progMenuDetails.result.value, null, 2));

  // Screenshot 2
  const shot2 = await send(ws, 12, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(progressMenuScreenshot, Buffer.from(shot2.data, 'base64'));
  console.log('Saved ProgressMenu screenshot to', progressMenuScreenshot);

  // Close Progress menu via Escape
  await send(ws, 13, 'Runtime.evaluate', {
    expression: `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));`
  });
  await wait(200);

  const closedProgMenu = await send(ws, 14, 'Runtime.evaluate', {
    expression: `!document.querySelector('.deck-checklist-item .deck-menu')`,
    returnByValue: true
  });
  console.log('PROGRESS MENU CLOSED BY ESCAPE:', closedProgMenu.result.value);

  ws.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Error in run:', err);
  process.exit(1);
});
