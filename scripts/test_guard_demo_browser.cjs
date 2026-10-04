const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.CONTRAST_BASE_URL || 'http://127.0.0.1:8765';
const mobile = process.env.CONTRAST_VIEWPORT === 'mobile';
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext({viewport: mobile ? {width:390,height:844} : {width:1440,height:1000}, acceptDownloads:true});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/guard/demo/');
    await page.waitForSelector('#guard-output:not([hidden])');
    // Repeated transitions detect stale findings, planning, revision, and download state.
    for (const id of ['pass','warning','fail','pass','fail','warning']) {
      await page.selectOption('#guard-scenario', id);
      assert.equal(await page.locator('#architecture-result').textContent(), id.toUpperCase());
      const json = JSON.parse(await page.locator('#sample-json').textContent());
      assert.equal(json.sample.id,id);
      const displayed = await page.locator('#sample-report').textContent();
      assert(displayed.includes(json.sample.scan.revision.sha));
      const pending = page.waitForEvent('download');
      await page.click('#download-report');
      const download = await pending;
      assert.equal(download.suggestedFilename(), `iaap-guard-synthetic-${id}-report.txt`);
      assert.equal(await fs.readFile(await download.path(),'utf8'), displayed);
      const okrDisplayed = await page.locator('#sample-okr-report').textContent();
      assert(okrDisplayed.includes(json.sample.scan.revision.sha));
      assert(okrDisplayed.includes('SYNTHETIC OKR IMPROVEMENT REPORT'));
      if (id === 'pass') assert(okrDisplayed.includes('No candidate remediation work'));
      else for (const text of ['Objective O1', 'Key result KR1', 'Epic EP1', 'Feature F1', 'Candidate story US1', 'Candidate task T2']) assert(okrDisplayed.includes(text));
      const okrPending = page.waitForEvent('download');
      await page.getByRole('button', {name:'Download OKR report (.txt)',exact:true}).click();
      const okrDownload = await okrPending;
      assert.equal(okrDownload.suggestedFilename(), `iaap-guard-synthetic-${id}-okr-report.txt`);
      assert.equal(await fs.readFile(await okrDownload.path(),'utf8'), okrDisplayed);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
    }
    await page.locator('#guard-scenario').focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#guard-scenario').inputValue(), 'warning');
    await page.locator('main details summary').click();
    assert(await page.locator('#sample-json').isVisible());
    // A missing or malformed response must never display a passing assessment.
    for (const response of [{status:503,body:'unavailable'}, {status:200,contentType:'application/json',body:'{"synthetic":true,"cases":[]}'}]) {
      await page.route('**/assets/guard-demo-reports.json', route => route.fulfill(response));
      await page.reload();
      await page.waitForFunction(() => document.querySelector('#demo-status').textContent.includes('unavailable'));
      assert(await page.locator('#guard-output').isHidden());
      assert(await page.locator('#guard-scenario').isDisabled());
      assert(await page.locator('#download-report').isDisabled());
      assert(await page.locator('#download-okr-report').isDisabled());
      await page.unroute('**/assets/guard-demo-reports.json');
    }
    assert.deepEqual(errors, []);
    const nojs = await browser.newContext({javaScriptEnabled:false});
    const fallback = await nojs.newPage();
    await fallback.goto(base + '/guard/demo/');
    assert(await fallback.locator('noscript').isVisible());
    assert(await fallback.locator('#guard-output').isHidden());
    console.log('Guard browser states, downloads, keyboard, overflow, and fail-closed loading: PASS');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
