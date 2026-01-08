# Abilene Gov Website Scraper

A simple scraper that extracts case information from the Abilene public website using Steel and Playwright.

## How to run

Just run:
```bash
npm run dev
```

## What happens

The code has detailed comments explaining what's happening at each step, so feel free to take a look inside to see what's going on.

When running it, you'll get a browser session URL that you can click to watch the scraper work in real-time if need be. Otherwise, you can just follow along with the console logs in your terminal, and they'll tell exactly what's happening.

The final output (the case updates) shows up in a nicely formatted way at the end, so it's easy to spot.

The cleanup is automatic, since the `finally` block takes care of closing the browser and releasing the Steel session.
