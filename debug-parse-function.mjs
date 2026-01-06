// Test the parseTransaction function directly

function parseTransaction(text) {
  console.log(`\n=== Parsing: "${text}" ===`);

  // Normalize whitespace - join into single line
  const normalized = text.trim().replace(/\s+/g, ' ');
  console.log(`Normalized: "${normalized}"`);

  // Pattern to match two dates at the start
  const datePattern = /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+)$/;
  const dateMatch = normalized.match(datePattern);

  if (!dateMatch) {
    console.log('❌ No date match found');
    return null;
  }

  const settlementDate = dateMatch[1];
  const tradeDate = dateMatch[2];
  const remainder = dateMatch[3];

  console.log(`✓ Dates: ${settlementDate}, ${tradeDate}`);
  console.log(`Remainder: "${remainder}"`);

  // Split remainder by multiple spaces to identify columns
  const parts = remainder.split(/\s{2,}/);
  console.log(`Parts (${parts.length}):`, parts);

  if (parts.length < 3) {
    console.log(`❌ Not enough parts (need at least 3, got ${parts.length})`);
    return null;
  }

  let i = 0;
  let symbol = '';
  let investmentName = '';
  let transactionType = '';
  let accountType = '';
  let shares = '';
  let price = '';
  let commission = '';
  let amount = '';

  // Symbol (or —)
  if (parts[i] === '—' || /^[A-Z]{1,10}$/i.test(parts[i])) {
    symbol = parts[i++];
    console.log(`Symbol: ${symbol}`);
  }

  // Investment name - everything until we hit a transaction type keyword
  const transactionTypes = ['Buy', 'Sell', 'Dividend', 'Reinvestment', 'Interest',
    'Funds', 'Withdrawal', 'Transfer', 'Sweep', 'Corp', 'Withholding', 'Fee'];

  let nameEnd = i;
  for (let j = i; j < parts.length; j++) {
    const matchesType = transactionTypes.some(type => parts[j].startsWith(type));
    if (matchesType) {
      nameEnd = j;
      break;
    }
  }

  if (nameEnd > i) {
    investmentName = parts.slice(i, nameEnd).join(' ');
    i = nameEnd;
    console.log(`Investment name: ${investmentName}`);
  }

  // Transaction type
  if (i < parts.length) {
    transactionType = parts[i++];
    // Multi-word transaction types
    if (transactionType === 'Funds' && i < parts.length && parts[i] === 'Received') {
      transactionType += ' ' + parts[i++];
    } else if (transactionType === 'Transfer' && i < parts.length && parts[i].startsWith('(')) {
      transactionType += ' ' + parts[i++];
    } else if (transactionType === 'Sweep' && i < parts.length) {
      transactionType += ' ' + parts[i++];
    } else if (transactionType === 'Corp' && i < parts.length) {
      transactionType += ' ' + parts[i++];
      if (i < parts.length && parts[i].startsWith('(')) {
        transactionType += ' ' + parts[i++];
      }
    }
    console.log(`Transaction type: ${transactionType}`);
  }

  // Account type
  if (i < parts.length && (parts[i] === 'CASH' || parts[i] === 'MARGIN')) {
    accountType = parts[i++];
    console.log(`Account type: ${accountType}`);
  }

  // Shares
  if (i < parts.length && (parts[i] === '—' || /^-?\d+\.?\d*$/.test(parts[i]))) {
    shares = parts[i++];
    console.log(`Shares: ${shares}`);
  }

  // Price
  if (i < parts.length && (parts[i] === '—' || /^\$?\d+\.?\d*$/.test(parts[i].replace(/,/g, '')))) {
    price = parts[i++];
    console.log(`Price: ${price}`);
  }

  // Commission
  if (i < parts.length && (parts[i] === '—' || parts[i] === 'Free' || /^\$?\d+\.?\d*$/.test(parts[i].replace(/,/g, '')))) {
    commission = parts[i++];
    console.log(`Commission: ${commission}`);
  }

  // Amount (remaining)
  if (i < parts.length) {
    amount = parts.slice(i).join(' ');
    console.log(`Amount: ${amount}`);
  }

  if (!transactionType) {
    console.log('❌ No transaction type found');
    return null;
  }

  console.log('✓ Transaction parsed successfully');
  return {
    settlementDate,
    tradeDate,
    symbol: symbol || '—',
    investmentName: investmentName || '',
    transactionType,
    accountType: accountType || 'CASH',
    shares: shares || '—',
    price: price || '—',
    commission: commission || '—',
    amount: amount || '—',
  };
}

// Test with sample transactions from the PDF
const testCases = [
  '11/25/2025 11/24/2025 QQQ INVESCO QQQ ETF Buy CASH 3.0000 $595.330 0 Free -$1,785.9900',
  '12/31/2025 12/31/2025 QQQ INVESCO QQQ ETF Reinvestment CASH 0.0090 $619.424 1 — -$5.5600',
  '12/31/2025 12/31/2025 QQQ INVESCO QQQ ETF Dividend CASH — — — $5.5600',
  '11/4/2025 11/4/2025 — To: JPMORGAN CHASE BANK, N.A. Funds Received CASH — — — $3,500.0000',
];

for (const test of testCases) {
  const result = parseTransaction(test);
  if (result) {
    console.log('\nResult:', JSON.stringify(result, null, 2));
  }
}
