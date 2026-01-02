import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Portfolio: a
    .model({
      name: a.string().required(),
      description: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  Ticker: a
    .model({
      symbol: a.string().required(),
      companyName: a.string(),
      baseYield: a.float(),
      expectedFiveYearGrowth: a.float(),
    })
    .authorization((allow) => [allow.owner()]),

  TickerLot: a
    .model({
      ticker: a.string().required(),
      shares: a.float().required(),
      costPerShare: a.float().required(),
      purchaseDate: a.date().required(),
      portfolios: a.string().array().required(),
      calculateAccumulatedProfitLoss: a.boolean(),
      isDividend: a.boolean(),
      baseYield: a.float(),
      notes: a.string(),
      totalCost: a.float(),
    })
    .authorization((allow) => [allow.owner()]),

  FmpApiKey: a
    .model({
      apiKey: a.string().required(),
      isActive: a.boolean().default(true),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  // Vanguard Transaction Import Models
  Transaction: a
    .model({
      accountNumber: a.string().required(),
      tradeDate: a.date().required(),
      settlementDate: a.date(),
      transactionType: a.string().required(),
      transactionDescription: a.string(),
      investmentName: a.string(),
      symbol: a.string().required(),
      shares: a.float().required(),
      sharePrice: a.float(),
      principalAmount: a.float(),
      commissionsAndFees: a.float().default(0),
      netAmount: a.float(),
      accruedInterest: a.float(),
      accountType: a.string(),
      importBatchId: a.string().required(),
      importDate: a.datetime().required(),
      sourceFile: a.string(),
      isMatched: a.boolean().default(false),
      matchedTransactionId: a.string(),
      rawData: a.string(),
    })
    .authorization((allow) => [allow.owner()])
    .secondaryIndexes((index) => [
      index('symbol'),
      index('importBatchId'),
      index('accountNumber')
    ]),

  CompletedTransaction: a
    .model({
      symbol: a.string().required(),
      buyTransactionId: a.string().required(),
      buyDate: a.date().required(),
      buyShares: a.float().required(),
      buyPrice: a.float().required(),
      buyFees: a.float().default(0),
      buyTotalCost: a.float().required(),
      sellTransactionId: a.string().required(),
      sellDate: a.date().required(),
      sellShares: a.float().required(),
      sellPrice: a.float().required(),
      sellFees: a.float().default(0),
      sellTotalProceeds: a.float().required(),
      realizedGainLoss: a.float().required(),
      realizedGainLossPercent: a.float(),
      holdingPeriodDays: a.integer().required(),
      isLongTerm: a.boolean().required(),
      taxYear: a.integer().required(),
      matchingMethod: a.string().required(),
      accountNumber: a.string(),
      completedDate: a.datetime().required(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.owner()])
    .secondaryIndexes((index) => [
      index('symbol'),
      index('taxYear'),
      index('accountNumber')
    ]),

  ImportHistory: a
    .model({
      batchId: a.string().required(),
      importDate: a.datetime().required(),
      sourceFileName: a.string().required(),
      fileHash: a.string().required(),
      totalTransactions: a.integer().required(),
      holdingsImported: a.integer(),
      transactionsImported: a.integer(),
      duplicatesSkipped: a.integer(),
      errorsEncountered: a.integer(),
      status: a.string().required(),
      errorMessage: a.string(),
      matchingMethodUsed: a.string(),
      importedBy: a.string(),
    })
    .authorization((allow) => [allow.owner()])
    .secondaryIndexes((index) => [
      index('fileHash'),
      index('importDate')
    ]),

  LotMatchingConfig: a
    .model({
      defaultMethod: a.string().required(),
      symbolOverrides: a.string(),
      preferLongTermGains: a.boolean().default(true),
      taxLossHarvestingEnabled: a.boolean().default(false),
      trackWashSales: a.boolean().default(true),
      washSalePeriodDays: a.integer().default(30),
    })
    .authorization((allow) => [allow.owner()]),

  DividendTransaction: a
    .model({
      transactionId: a.string().required(),
      symbol: a.string().required(),
      payDate: a.date().required(),
      exDividendDate: a.date(),
      dividendPerShare: a.float().required(),
      totalDividend: a.float().required(),
      shares: a.float().required(),
      isReinvested: a.boolean().default(false),
      reinvestmentTransactionId: a.string(),
      isQualified: a.boolean(),
      taxYear: a.integer().required(),
      accountNumber: a.string(),
    })
    .authorization((allow) => [allow.owner()])
    .secondaryIndexes((index) => [
      index('symbol'),
      index('taxYear')
    ]),
});


export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
