import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = new URL('./output/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:3000';

const results = [];
function step(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

// PLAYWRIGHT_CHROMIUM lets CI point at a pre-installed browser; otherwise
// Playwright uses whichever Chromium it downloaded itself.
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 620 } });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });

// Read planner store state from the page.
const state = () => page.evaluate(() => window.__weblite?.getState?.() ?? null);

/* 1-3: landing → studio */
await page.goto(BASE, { waitUntil: 'networkidle' });
step('1. Landing page loads', await page.locator('h1').first().isVisible());
await page.screenshot({ path: `${OUT}01-landing.png` });

await page.getByRole('link', { name: /Design Your Space/i }).first().click();
await page.waitForURL('**/studio');
await page.waitForTimeout(3500);
step('3. Weblite Design Studio opens', page.url().includes('/studio'));

/* 4-5: create a 4 x 5 m room */
const hasSetup = await page.getByText('Create your space.').isVisible().catch(() => false);
step('4a. Room setup shown', hasSetup);

if (hasSetup) {
  const nums = page.locator('input[type="number"]');
  await nums.nth(0).fill('4000');
  await nums.nth(1).fill('5000');
  await nums.nth(2).fill('2800');
  await page.getByRole('button', { name: /Create Room/i }).click();
  await page.waitForTimeout(2500);
}
let s = await state();
step('4. Room is 4000 x 5000', s?.project.room.width === 4000 && s?.project.room.length === 5000,
  s ? `${s.project.room.width}x${s.project.room.length}` : 'no state');
await page.screenshot({ path: `${OUT}02-room.png` });

/* 6-8: add an 80cm cabinet from the Cabinets group */
await page.getByRole('button', { name: 'Cabinets', exact: true }).click();
await page.waitForTimeout(400);
await page.getByTitle(/WEB-CAB-080/).click();
await page.waitForTimeout(900);
s = await state();
step('7-8. 80cm cabinet placed', s?.project.objects.length === 1 && s.project.objects[0].productId === 'WEB-CAB-080',
  `${s?.project.objects.length} object(s)`);

/* 9-10: it snapped to a wall */
const first = s.project.objects[0];
const snappedToWall =
  Math.abs(Math.abs(first.position.z) - (5000 / 2 - 300)) < 5 ||
  Math.abs(Math.abs(first.position.x) - (4000 / 2 - 300)) < 5;
step('10. Cabinet snapped flush to a wall', snappedToWall,
  `pos x=${first.position.x} z=${first.position.z} rot=${first.rotationY}`);

/* 11-12: add a second cabinet, expect it beside the first */
await page.getByTitle(/WEB-CAB-060/).click();
await page.waitForTimeout(900);
s = await state();
step('11. Second cabinet added', s.project.objects.length === 2);
const [a, b] = s.project.objects;
const gap = Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z);
const expected = (a.dimensions.width + b.dimensions.width) / 2;
step('12. Cabinets sit side by side', Math.abs(gap - expected) < 20,
  `centre distance ${gap.toFixed(0)}mm, expected ${expected}mm`);

/* 13-14: apply Dark Walnut to the selected cabinet */
await page.getByTitle('Dark Walnut').first().click();
await page.waitForTimeout(600);
s = await state();
const sel = s.project.objects.find((o) => o.id === s.selectedId);
step('14. Finish changed to walnut', sel?.materials.front === 'mat-walnut-dark', sel?.materials.front);

/* 15: kitchen island */
await page.getByRole('button', { name: 'Islands', exact: true }).click();
await page.waitForTimeout(400);
await page.getByTitle(/WEB-ISL-180/).click();
await page.waitForTimeout(900);
s = await state();
step('15. Island added', s.project.objects.some((o) => o.productId === 'WEB-ISL-180'));

/* worktop generation */
const runs = await page.evaluate(() => window.__webliteWorktops?.() ?? null);
step('16b. Continuous worktop generated', Array.isArray(runs) && runs.length > 0,
  runs ? `${runs.length} run(s), ${runs.map((r) => Math.round(r.length)).join('/')}mm` : 'none');

/* 16-17: 2D plan */
await page.getByRole('button', { name: '2D Plan' }).click();
await page.waitForTimeout(2000);
s = await state();
step('16-17. 2D Plan mode active', s.viewMode === 'plan');
await page.screenshot({ path: `${OUT}03-plan.png` });

/* 18: back to 3D */
await page.getByRole('button', { name: '3D View' }).click();
await page.waitForTimeout(2000);
s = await state();
step('18. Back in 3D', s.viewMode === 'orbit');
await page.screenshot({ path: `${OUT}04-3d.png` });

/* undo / redo */
const before = (await state()).project.objects.length;
await page.evaluate(() => window.__weblite.getState().undo());
await page.waitForTimeout(400);
const afterUndo = (await state()).project.objects.length;
await page.evaluate(() => window.__weblite.getState().redo());
await page.waitForTimeout(400);
const afterRedo = (await state()).project.objects.length;
step('Undo / redo change the design', afterUndo === before - 1 && afterRedo === before,
  `${before} → ${afterUndo} → ${afterRedo}`);

/* 19-20: walkthrough */
await page.getByRole('button', { name: 'Walk Inside' }).click();
await page.waitForTimeout(2200);
s = await state();
step('19. Walkthrough entered', s.viewMode === 'walk');
const eye = await page.evaluate(() => window.__webliteCamera?.() ?? null);
step('20. Camera at human eye height', eye && Math.abs(eye.y - 1.62) < 0.02, eye ? `y=${eye.y.toFixed(2)}m` : 'n/a');
await page.screenshot({ path: `${OUT}05-walk.png` });

/* move forward with W and confirm the camera actually travels */
const posBefore = await page.evaluate(() => window.__webliteCamera());
await page.keyboard.down('KeyW');
await page.waitForTimeout(3000);
await page.keyboard.up('KeyW');
await page.waitForTimeout(300);
const posAfter = await page.evaluate(() => window.__webliteCamera());
const travelled = Math.hypot(posAfter.x - posBefore.x, posAfter.z - posBefore.z);
step('20b. WASD moves the walker', travelled > 0.4, `travelled ${travelled.toFixed(2)}m`);

/* collision: walker stayed inside the room */
const inside = Math.abs(posAfter.x) < 4000 / 2000 && Math.abs(posAfter.z) < 5000 / 2000;
step('20c. Walker stays inside the room', inside, `x=${posAfter.x.toFixed(2)} z=${posAfter.z.toFixed(2)}`);

/* 21: exit */
await page.keyboard.press('Escape');
await page.waitForTimeout(1200);
s = await state();
step('21. Exited walkthrough', s.viewMode === 'orbit');

/* 22-24: save, reload, restore */
const nameBefore = (await state()).project.name;
const countBefore = (await state()).project.objects.length;
await page.getByRole('button', { name: 'Save project' }).click();
await page.waitForTimeout(1200);

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
s = await state();
step('23-24. Project restored after refresh',
  s?.project.objects.length === countBefore && s?.project.name === nameBefore,
  `${s?.project.objects.length}/${countBefore} objects`);

/* 25-27: finish design → quote */
await page.getByRole('button', { name: /Finish Design/i }).click();
await page.waitForTimeout(1200);
const summaryVisible = await page.getByText('Your kitchen').isVisible();
step('25-26. Finish Design summarises the build', summaryVisible);
await page.screenshot({ path: `${OUT}06-finish.png` });

await page.getByRole('button', { name: /Request a Quote/i }).click();
await page.waitForTimeout(800);
step('27a. Quote form opens', await page.getByText('Request a quote').isVisible());

await page.getByLabel(/^Name/).fill('Sherif Elshryf');
await page.getByLabel(/^Phone/).fill('+20 100 000 0000');
await page.getByLabel(/^Email/).fill('sherif@example.com');
await page.getByLabel(/Project location/).fill('New Cairo');
await page.getByRole('button', { name: /Send Enquiry/i }).click();
await page.waitForTimeout(2500);
step('27b. Quote submitted', await page.getByText('Thank you.').isVisible());
await page.screenshot({ path: `${OUT}07-quote.png` });

/* console health */
const realErrors = errors.filter((e) => !/favicon|Download the React DevTools/i.test(e));
step('No console errors', realErrors.length === 0, realErrors.slice(0, 4).join(' | '));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync(`${OUT}results.json`, JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
