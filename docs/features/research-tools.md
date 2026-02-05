# Research Tools

Stay informed about your investments and the broader market with the Research page's comprehensive news and financial data tools.

## Overview

The Research page provides four powerful research tools in an easy-to-use card-based layout:

1. **Stock-Specific News** - Search news articles for a specific ticker and date range
2. **General Stock News** - Browse the latest stock market news articles
3. **General Market News** - Get broader market news and updates
4. **Treasury Yields** - Compare treasury yield curves across different time periods

**Navigation:** Click **News** in the top navigation bar to access the Research page.

**Requirement:** A configured Financial Modeling Prep API key is required. See the [API Setup Guide](../guides/api-setup.md).

## Page Layout

The Research page displays four color-coded cards in a responsive grid:

| Card | Color Theme | Description |
|------|-------------|-------------|
| Stock-Specific News | Blue | Search by ticker and date range |
| General Stock News | Green | Set article count, fetch latest stock news |
| General Market News | Amber/Orange | Set article count, fetch latest market news |
| Treasury Yields | Purple/Pink | Compare yield curves across maturities |

Below the cards, fetched articles are displayed in an interactive notebook-style viewer.

---

## Stock-Specific News

Search for news articles about a specific company within a date range.

### How to Use

1. Click the **"Search Stock News"** button on the blue card
2. The Stock-Specific News modal opens with these options:

#### Selecting a Ticker

You have two ways to specify a stock:

- **Manual Entry:** Type a ticker symbol directly (e.g., AAPL). The field auto-converts to uppercase.
- **Portfolio Dropdown:** Select from tickers already in your portfolio.

Selecting one method automatically clears the other to avoid conflicts.

#### Setting a Date Range

- **Start Date:** Choose the beginning of your search range
- **End Date:** Choose the end of your search range
- **Today's News Button:** Click to instantly set both dates to today. If a ticker is already selected, this also triggers the search automatically.

#### Fetching Results

- Click **"Fetch News"** to retrieve articles
- The modal closes automatically and articles appear in the notebook viewer below the cards

### Validation

- At least one ticker must be selected (either manual or dropdown)
- Both date fields are required
- Start date must be on or before the end date
- Invalid fields are highlighted with a red border and error message

---

## General Stock News

Browse the latest stock market news articles without filtering by a specific ticker.

### How to Use

1. On the green **General Stock News** card, adjust the **number of articles** (1-20, default 15)
2. Click **"Get Stock News"**
3. Articles load and display in the notebook viewer below

### Options

- **Number of Articles:** Use the number input to set how many articles to fetch (minimum 1, maximum 20)

---

## General Market News

Get broader market news covering sectors, economic updates, and market-moving events.

### How to Use

1. On the amber/orange **General Market News** card, adjust the **number of articles** (1-20, default 15)
2. Click **"Get Latest News"**
3. Articles load and display in the notebook viewer below

### Options

- **Number of Articles:** Use the number input to set how many articles to fetch (minimum 1, maximum 20)

---

## Treasury Yields

Compare treasury yield curves across different maturities and time periods. This tool helps you understand the interest rate environment and how yields have changed over time.

### How to Use

1. Click **"View Treasury Yields"** on the purple/pink card
2. The Treasury Yields Comparison modal opens

#### Selecting Maturities

Choose up to **5 maturities** to compare on one chart:

| Available Maturities |
|---------------------|
| 1 Month, 3 Month, 6 Month |
| 1 Year, 2 Year, 3 Year |
| 5 Year, 7 Year, 10 Year |
| 20 Year, 30 Year |

- **Default:** 10-Year Treasury is pre-selected
- **Maximum:** 5 maturities can be displayed at once
- An info message appears when the maximum is reached; additional checkboxes are disabled

#### Selecting a Time Period

Use the **quick-select buttons** to choose a lookback period:

| Button | Period |
|--------|--------|
| 1M | Last 1 month |
| 3M | Last 3 months (default) |
| 6M | Last 6 months |
| 1Y | Last 1 year |
| 2Y | Last 2 years |
| 5Y | Last 5 years |
| 10Y | Last 10 years |
| ALL | Maximum available data |

You can also enter **custom start and end dates** manually. Setting custom dates automatically switches to "custom" mode.

#### Viewing Results

3. Click **"Fetch Treasury Yields"**
4. An interactive line chart appears showing yield trends over time

### Chart Details

The yield comparison chart displays:

- **One line per maturity** in a distinct color (blue, green, amber, red, purple)
- **X-Axis:** Dates (angled for readability)
- **Y-Axis:** Yield percentage (%), auto-scaled
- **Grid:** Dashed reference lines
- **Tooltip:** Hover over the chart to see exact yield values at any date
- **Latest Values Header:** Above the chart, displays the most recent yield for each selected maturity

### Interpreting Treasury Yields

- **Normal Yield Curve:** Longer maturities have higher yields (e.g., 30Y > 10Y > 2Y)
- **Inverted Yield Curve:** Shorter maturities have higher yields than longer ones, often seen as a recession indicator
- **Flat Curve:** Similar yields across maturities, suggesting economic uncertainty
- **Rising Yields:** Often indicate expectations of economic growth or inflation
- **Falling Yields:** Often indicate expectations of economic slowdown or flight to safety

---

## Article Viewer (Notebook Display)

All news articles from the Stock News, General Stock News, and General Market News tools are displayed in an interactive notebook-style viewer.

### Layout

The article viewer mimics a spiral notebook with:
- A spiral binding along the left edge
- Lined paper effect across the page
- A page curl effect in the bottom-right corner

### Article Content

Each article displays:
- **Title** - The article headline
- **Metadata Row** - Published date, source site, and stock symbol (if applicable), separated by bullet points
- **Image** - Article image (if available), displayed at full width
- **Article Text** - The full article body with justified text alignment
- **External Link** - A "Read full article" link that opens the original source in a new tab

### Navigation

- **Previous/Next Buttons** - Navigate between articles using the buttons at the bottom
- **Keyboard Shortcuts** - Use the **Left** and **Right arrow keys** to navigate between articles
- **Page Counter** - Shows "Article X of Y" between the navigation buttons

### States

- **Loading:** Shows a spinner with "Fetching news articles..." message
- **No Results:** Displays "No articles found" with a suggestion to adjust your date range or ticker
- **Error:** Displays the error message in a styled card

---

## Tips and Best Practices

### Research Workflow

1. **Morning Check:** Use General Market News to catch up on overnight developments
2. **Stock Research:** Before buying, search for stock-specific news to check for recent events
3. **Rate Environment:** Monitor Treasury Yields weekly to understand the interest rate landscape
4. **Portfolio Review:** Search news for your largest holdings regularly

### Getting the Most from News

- Use **stock-specific news** before making buy/sell decisions
- Check **multiple date ranges** to see both recent news and longer-term coverage
- Compare **treasury yields** across maturities to understand the yield curve shape
- Use the **"Today's News"** quick button for a fast daily check on a specific stock

### API Usage Considerations

- Each news fetch counts toward your daily API limit
- Fetching 20 articles uses 1 API request (not 20)
- Treasury yield fetches also count as API requests
- Consider limiting fetches to stay within the free tier's 250 daily requests

---

## Troubleshooting

### No Articles Found

- Verify your API key is configured in Settings
- Check that the ticker symbol is correct
- Try expanding your date range
- Some smaller companies may have limited news coverage

### Treasury Yields Not Loading

- Verify API key configuration
- Check that at least one maturity is selected
- Ensure the date range is valid (start date before end date)
- Try a shorter time period if the request seems to hang

### Articles Won't Load

- Check your internet connection
- Verify you haven't exceeded your daily API request limit
- Refresh the page and try again

---

## Related Documentation

- [Portfolio Management](portfolio-management.md) - Track your positions
- [Key Metrics](key-metrics.md) - Analyze company fundamentals
- [Calculators](calculators.md) - Evaluate investment opportunities
- [API Setup Guide](../guides/api-setup.md) - Configure your API key
