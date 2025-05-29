# Vissim Sitemap Test

This project is an automation test script using Playwright and TypeScript that:

- Fetches the sitemap index from https://www.vissim.no/sitemap.xml
- Parses all URLs from the sitemap(s)
- Visits each URL to check if the page loads without HTTP errors (400 or 500)

## How to run

1. Install dependencies:

```bash
npm install
