import { test, expect } from './fixtures';
import {type Page } from '@playwright/test'

function extPage(extid: string, file: string): string{
  return `chrome-extension://${extid}/pages/${file}.html`
}

const startOf2000 = new Date(2000,1,1,0,0,0);
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

test('popup page', async ({ page, extId }) => {
  await page.goto(extPage(extId, "popup"))
  await expect(page.locator('h1')).toHaveText('BlockUSM');
});

test('block fields write and read', async ({ page, extId }) => {
  await page.goto(extPage(extId, "block_options"))
  // Make and save new settings
  await page.getByRole('textbox', { name: 'Patterns to block:' }).fill('reddit.com');
  await page.getByRole('textbox', { name: 'Blocking exemptions:' }).fill('reddit.com/maps');
  await page.getByRole('textbox', { name: 'Times to disable block set:' }).fill('0000-0901');
  await page.getByRole('textbox', { name: 'Time limit in minutes:' }).fill('1');
  await page.getByRole('checkbox', { name: 'Wednesday' }).check();
  await page.getByRole('checkbox', { name: 'Allow temporary override' }).check();
  await page.getByRole('button', { name: 'Save Changes' }).click();
  // Page 2
  await page.getByRole('button', { name: '+ Add block set' }).click();
  await page.getByLabel('Set to edit').selectOption('Block set 2');
  await page.getByRole('textbox', { name: 'Patterns to block:' }).fill('google.com');
  await page.getByRole('textbox', { name: 'Blocking exemptions:' }).fill('google.com/images');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  // Refresh and check saved options are back
  await page.goto(extPage(extId, "block_options"))
  await expect(page.getByRole('textbox', { name: 'Patterns to block:' })).toHaveValue('reddit.com');
  await expect(page.getByRole('textbox', { name: 'Blocking exemptions:' })).toHaveValue('reddit.com/maps');
  await expect(page.getByRole('textbox', { name: 'Times to disable block set:' })).toHaveValue('0000-0901');
  await expect(page.getByRole('textbox', { name: 'Time limit in minutes:' })).toHaveValue('1');
  await expect(page.getByRole('checkbox', { name: 'Wednesday' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Allow temporary override' })).toBeChecked();

  await page.getByLabel('Set to edit').selectOption('Block set 2');
  await expect(page.getByRole('textbox', { name: 'Patterns to block:' })).toHaveValue('google.com');
  await expect(page.getByRole('textbox', { name: 'Blocking exemptions:' })).toHaveValue('google.com/images');
  await expect(page.getByRole('textbox', { name: 'Times to disable block set:' })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'Time limit in minutes:' })).toHaveValue('0');
  await expect(page.getByRole('checkbox', { name: 'Wednesday' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Allow temporary override' })).not.toBeChecked();

  // Remove and check we're on set 1
  await page.getByRole('button', { name: '- Remove block set' }).click();
  await expect(page.getByLabel('Set to edit')).toHaveValue('Block set 1');
});

test('blocking and exemptions work', async ({ page, extId }) => {
  await page.goto(extPage(extId, "block_options"));
  await page.getByRole('textbox', { name: 'Patterns to block:' }).fill('google.com\nbing.com');
  await page.getByRole('textbox', { name: 'Blocking exemptions:' }).fill('google.com/images\nbing.com/news');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await page.getByRole('button', { name: '+ Add block set' }).click();
  await page.getByLabel('Set to edit').selectOption('Block set 2');
  await page.getByRole('textbox', { name: 'Patterns to block:' }).fill('reddit.com');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await page.goto('https://www.google.com');
  await expect(page.locator('body')).toContainText('This page has been blocked by BlockUSM');
  await page.goto('https://www.bing.com');
  await expect(page.locator('body')).toContainText('This page has been blocked by BlockUSM');
  await page.goto('https://www.reddit.com');
  await expect(page.locator('body')).toContainText('This page has been blocked by BlockUSM');
  await page.goto('https://www.google.com/images/');
  await expect(page.locator('body')).not.toContainText('This page has been blocked by BlockUSM');
  await page.goto('https://www.bing.com/news');
  await expect(page.locator('body')).not.toContainText('This page has been blocked by BlockUSM');
});

test('Unblocking on day works', async ({ page, extId }) => {
  await page.goto(extPage(extId, "block_options"));
  await page.getByRole('textbox', { name: 'Patterns to block:' }).fill('google.com');
  await page.getByRole('checkbox', { name: 'Sunday' }).check();
  await page.getByRole('checkbox', { name: 'Monday' }).check();
  await page.getByRole('checkbox', { name: 'Tuesday' }).check();
  await page.getByRole('checkbox', { name: 'Wednesday' }).check();
  await page.getByRole('checkbox', { name: 'Thursday' }).check();
  await page.getByRole('checkbox', { name: 'Friday' }).check();
  await page.getByRole('checkbox', { name: 'Saturday' }).check();
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await page.goto('https://www.google.com');
  await expect(page.locator('body')).not.toContainText('This page has been blocked by BlockUSM');
});

test('Unblocking on times works', async ({ page, extId }) => {
  await page.goto(extPage(extId, "block_options"));
  await page.getByRole('textbox', { name: 'Patterns to block:' }).fill('google.com');
  await page.getByRole('textbox', { name: 'Times to disable block set:' }).fill('0000-2400');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await page.goto('https://www.google.com');
  await expect(page.locator('body')).not.toContainText('This page has been blocked by BlockUSM');
});

test('Unblocking on limit works @slow', async ({ page, extId }) => {
  test.setTimeout(120 * 1000)
  await page.goto(extPage(extId, "block_options"));
  await page.getByRole('textbox', { name: 'Patterns to block:' }).fill('google.com');
  await page.getByRole('textbox', { name: 'Time limit in minutes:' }).fill('1');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await page.goto('https://www.google.com');
  await expect(page.locator('body')).not.toContainText('This page has been blocked by BlockUSM');
  await sleep(100 * 1000)
  await page.goto('https://www.google.com');
  await expect(page.locator('body')).toContainText('This page has been blocked by BlockUSM');
});

test('Override', async ({ page, extId }) => {
  await page.goto(extPage(extId, "block_options"));
  await page.getByRole('textbox', { name: 'Patterns to block:' }).fill('google.com');
  await page.getByRole('checkbox', { name: 'Allow temporary override' }).check();
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.goto(extPage(extId, "override"));
  await page.getByRole('textbox').fill('1');
  await page.getByRole('button', { name: 'Override' }).click();
  await page.goto('https://www.google.com/');
  await expect(page.locator('body')).not.toContainText('This page has been blocked by BlockUSM');
  await page.clock.setFixedTime(startOf2000);
  await page.goto(extPage(extId, "override"));
  await page.getByRole('textbox').fill('1');
  await page.getByRole('button', { name: 'Override' }).click();
  await page.goto('https://www.google.com/');
  await expect(page.locator('body')).toContainText('This page has been blocked by BlockUSM');
});