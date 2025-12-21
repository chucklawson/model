# Troubleshooting Guide

Common issues and solutions for Investment Portfolio Manager.

## Overview

This guide covers common problems users encounter and their solutions. For specific feature help, see the feature-specific documentation.

## Common Issues

### Authentication & Account Issues

#### Can't Sign In

**Symptoms:** Login fails, "incorrect username or password" error

**Solutions:**
1. Verify email and password are correct
2. Check caps lock is off
3. Try "Forgot Password" to reset
4. Clear browser cache and cookies
5. Try a different browser

#### Email Verification Not Received

**Symptoms:** No verification email in inbox

**Solutions:**
1. Check spam/junk folder
2. Wait a few minutes (may be delayed)
3. Verify email address is correct
4. Request a new verification code
5. Add sender to safe list

#### Account Locked

**Symptoms:** Can't sign in after multiple attempts

**Solutions:**
1. Wait 30 minutes and try again
2. Use "Forgot Password" to reset
3. Contact support if issue persists

### API and Data Issues

#### No Stock Prices Showing

**Symptoms:** Positions show but no current prices

**Solutions:**
1. **Verify API key is configured**
   - Go to Settings
   - Check if API key is entered
   - See [API Setup Guide](../guides/api-setup.md)

2. **Check if market is open**
   - NYSE hours: 9:30 AM - 4:00 PM ET, Monday-Friday
   - If market is closed, last close price is shown

3. **Refresh the page**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

4. **Check API rate limits**
   - Free tier: 250 requests/day
   - Wait until next day if exceeded

#### "Rate Limit Exceeded" Error

**Symptoms:** Error message about too many requests

**Solutions:**
1. **Wait until tomorrow**
   - Free tier limits reset at midnight EST

2. **Reduce usage**
   - Close extra tabs with the app open
   - Avoid excessive page refreshes

3. **Upgrade API tier**
   - Consider paid FMP plan for more requests
   - See [API Setup Guide](../guides/api-setup.md)

#### "Invalid API Key" Error

**Symptoms:** Error about invalid or missing API key

**Solutions:**
1. Verify API key is correct
   - Check for extra spaces
   - Copy-paste directly from FMP dashboard

2. Log in to FMP to verify key is active

3. Re-enter API key in Settings

4. Generate new API key and update

### CSV Import Issues

#### Import Fails - "Missing Required Columns"

**Symptoms:** CSV import rejected, missing columns error

**Solutions:**
1. Verify CSV has all required columns: `Ticker`, `Date`, `Quantity`, `Cost`, `Portfolio`
2. Check exact spelling and capitalization
3. Ensure header row is first row
4. See [CSV Import Guide](../guides/csv-import.md)

#### Import Fails - "Invalid Date Format"

**Symptoms:** Import fails, date format error

**Solutions:**
1. Verify dates are in M/D/YYYY format
   - Valid: `1/15/2024`, `01/15/2024`
   - Invalid: `2024-01-15`, `Jan 15 2024`

2. In Excel: Format cells as Custom → `M/D/YYYY`

3. Check for invalid dates (13/45/2024, etc.)

4. See [CSV Format Reference](csv-format.md)

#### Some Rows Import, Others Don't

**Symptoms:** Partial import success

**Solutions:**
1. Check error messages for specific row issues
2. Common problems:
   - Negative quantities or costs
   - Zero quantities
   - Empty required fields
   - Invalid ticker symbols

3. Fix problematic rows and re-import

### Portfolio & Position Issues

#### Portfolio Not Showing in Filter

**Symptoms:** Can't find portfolio in dropdown

**Solutions:**
1. Refresh the page
2. Verify portfolio has positions
   - Empty portfolios don't appear
3. Check for typos in portfolio names
4. Remember: Portfolio names are case-sensitive

#### Can't Delete a Position

**Symptoms:** Delete button not working

**Solutions:**
1. Refresh the page and try again
2. Try a different browser
3. Check browser console for errors (F12)
4. Verify you're signed in

#### Values Don't Match Brokerage

**Symptoms:** Position values differ from brokerage

**Possible reasons:**
1. **Price timing**
   - App prices may be delayed
   - Brokerages may use different price sources

2. **Cost basis calculations**
   - App uses simple cost basis
   - Brokerages may adjust for wash sales, etc.

3. **Fees and commissions**
   - App doesn't account for trading fees

**Note:** Use brokerage statements for official records and tax reporting.

### Performance Issues

#### App is Slow or Freezing

**Solutions:**
1. Close other browser tabs
2. Clear browser cache
3. Try a different browser
4. Check internet connection
5. Disable browser extensions
6. Restart browser

#### Page Won't Load

**Solutions:**
1. Check internet connection
2. Refresh the page
3. Clear browser cache and cookies
4. Try incognito/private mode
5. Try a different browser
6. Check if site is down

### Navigation Issues

#### Help Page Not Loading

**Solutions:**
1. Clear browser cache
2. Hard refresh the page
3. Check browser console for errors
4. Try a different browser

#### Links Not Working

**Solutions:**
1. Ensure JavaScript is enabled
2. Disable browser extensions
3. Try a different browser
4. Check browser console for errors

## Error Messages

### "Failed to fetch quote for [TICKER]"

**Cause:** API can't find the ticker or rate limit exceeded

**Solutions:**
1. Verify ticker symbol is correct
2. Check if stock is delisted
3. Verify API key is configured
4. Check rate limits

### "Error saving position"

**Cause:** Database error or connection issue

**Solutions:**
1. Check internet connection
2. Try again in a few moments
3. Verify all fields are filled correctly
4. Refresh page and try again

### "Network error"

**Cause:** Lost connection to server

**Solutions:**
1. Check internet connection
2. Refresh the page
3. Try again
4. Check if AWS services are down

## Browser-Specific Issues

### Chrome

- Clear cache: Settings → Privacy → Clear browsing data
- Disable extensions: More tools → Extensions
- Try incognito mode

### Firefox

- Clear cache: Options → Privacy → Clear Data
- Disable add-ons: Add-ons → Extensions
- Try private mode

### Safari

- Clear cache: Safari → Clear History
- Disable extensions: Preferences → Extensions
- Try private browsing

### Edge

- Clear cache: Settings → Privacy → Clear browsing data
- Disable extensions: Extensions
- Try InPrivate mode

## Still Having Issues?

If problems persist:

1. **Check the documentation**
   - [Quick Start Guide](../getting-started/quick-start-guide.md)
   - [API Setup Guide](../guides/api-setup.md)
   - [CSV Import Guide](../guides/csv-import.md)

2. **Try basic troubleshooting**
   - Refresh the page
   - Clear cache and cookies
   - Try a different browser
   - Check internet connection

3. **Document the issue**
   - What were you trying to do?
   - What happened instead?
   - Any error messages?
   - What browser and version?

4. **Check browser console**
   - Press F12 to open developer tools
   - Check Console tab for errors
   - Take a screenshot if there are errors

## Prevention Tips

### Regular Maintenance

- Export data monthly for backups
- Keep API key updated
- Monitor API usage
- Clear browser cache periodically

### Best Practices

- Use a supported browser (Chrome, Firefox, Safari, Edge)
- Keep browser updated
- Use a stable internet connection
- Don't share API keys

## Related Documentation

- [API Setup Guide](../guides/api-setup.md) - API configuration
- [CSV Import Guide](../guides/csv-import.md) - CSV import help
- [Portfolio Management](../features/portfolio-management.md) - Position management
- [Quick Start Guide](../getting-started/quick-start-guide.md) - Getting started

If you've tried these solutions and still have issues, document the problem with screenshots and error messages for further assistance.
