import { test, expect } from './fixtures';
import {type Page } from '@playwright/test';

function extPage(extid: string, file: string): string{
  return `chrome-extension://${extid}/pages/${file}.html`
}

test('remove heading from wikipedia', async ({ page, extId }) => {
	await page.goto(extPage(extId, "block_options"))
	await page.locator('#removal_name_1').fill('abc');
	await page.locator('#removal_sel_1').fill('h1');
	await page.locator('#removal_pat_1').fill('wiki');
	await page.getByRole('button', { name: '+ Add selector' }).click();
	await page.locator('#removal_name_2').fill('def');
	await page.locator('#removal_sel_2').fill('p');
	await page.locator('#removal_pat_2').fill('wiki');
	await page.getByRole('button', { name: 'Save Changes' }).click();
	await page.goto('https://en.wikipedia.org/wiki/Ramen');
	await expect(page.getByRole('heading', { name: 'Ramen', exact: true }).locator('span')).not.toBeVisible();
	await expect(page.getByText('Ramen (/ˈrɑːmən/) (拉麺, ラーメン')).not.toBeVisible();
});

test(`element picker`, async ({ page, extId }) => {
	await page.goto('https://en.wikipedia.org/wiki/Ramen');
	await page.keyboard.press("ControlOrMeta+Alt+p");
	// Wikipedia header text is different on mobile and browser - this matches both and no other text
  await page.getByRole('link', { name: /^Wikipedia/ }).click();
  await expect(page.getByRole('textbox', { name: 'Element selector (CSS' })).not.toBeEmpty();
  await page.getByRole('textbox', { name: 'Name of selector' }).fill('abc');
  await page.getByRole('checkbox', { name: 'Toggle preview' }).click();
  await expect(page.getByRole('link', { name: /^Wikipedia/ })).not.toBeVisible();
	await page.getByRole('button', { name: 'Add to set' }).click();
  await page.goto('https://en.wikipedia.org/wiki/Ramen');
  await expect(page.getByRole('link', { name: /^Wikipedia/ })).not.toBeVisible();
});