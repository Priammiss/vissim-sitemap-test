import { chromium } from '@playwright/test';
import axios from 'axios';
import * as xml2js from 'xml2js';

const SITEMAP_INDEX_URL = 'https://www.vissim.no/sitemap.xml';

async function fetchUrlsFromSitemap(url: string): Promise<string[]> {
  const response = await axios.get(url);
  const parsed = await xml2js.parseStringPromise(response.data);

  // The sitemap XML may have 'urlset.url' or 'sitemapindex.sitemap'
  if (parsed.urlset) {
    // This sitemap has URLs
    return parsed.urlset.url.map((entry: any) => entry.loc[0]);
  } else if (parsed.sitemapindex) {
    // This sitemap is an index of other sitemaps
    const sitemapUrls = parsed.sitemapindex.sitemap.map((entry: any) => entry.loc[0]);
    let allUrls: string[] = [];
    for (const sitemapUrl of sitemapUrls) {
      const urls = await fetchUrlsFromSitemap(sitemapUrl);
      allUrls = allUrls.concat(urls);
    }
    return allUrls;
  } else {
    return [];
  }
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log(`Fetching URLs from sitemap index: ${SITEMAP_INDEX_URL}`);
    const urls = await fetchUrlsFromSitemap(SITEMAP_INDEX_URL);
    console.log(`🔍 Found ${urls.length} URLs in total.`);

    for (const url of urls) {
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
        const status = res?.status();

        if (!status || status >= 400) {
          console.error(`❌ ${url} failed with status ${status}`);
        } else {
          console.log(`✅ ${url} is OK (status ${status})`);
        }
      } catch (err) {
        console.error(`❌ Error visiting ${url}:`, err);
      }
    }
  } catch (err) {
    console.error('Error while processing sitemap:', err);
  } finally {
    await browser.close();
  }
})();
