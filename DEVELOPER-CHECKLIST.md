# Developer Checklist

## Purpose

This checklist ensures code quality and prevents common bugs. Use it for all new features, bug fixes, and refactoring.

---

## 📋 General Development Checklist

### Before Starting Work

- [ ] Pull latest changes from main branch
- [ ] Create a feature branch with descriptive name
- [ ] Review existing code patterns in the codebase
- [ ] Check if similar functionality already exists

### During Development

- [ ] Write code following existing patterns
- [ ] Add TypeScript types (no `any` unless absolutely necessary)
- [ ] Handle errors appropriately
- [ ] Add logging for debugging (use `console.log` sparingly)
- [ ] Test locally before committing

### Before Committing

- [ ] Run `npm run lint` - All linting errors fixed
- [ ] Run `npm run test:unit` - All unit tests passing
- [ ] Run `npm run test:lambda` - All Lambda tests passing (if applicable)
- [ ] Run `npm run test:coverage` - Coverage thresholds met
- [ ] Review your changes with `git diff`
- [ ] Write clear, descriptive commit message

---

## 🔧 Feature-Specific Checklists

### Adding a New Lambda Function

**CRITICAL: All Lambda functions MUST have unit tests**

- [ ] Create handler function in `amplify/functions/{name}/handler.ts`
- [ ] Create corresponding test file `handler.test.ts` in same directory
- [ ] Test all success paths
- [ ] Test all error scenarios
- [ ] Test input validation
- [ ] **Check for DynamoDB reserved keywords** (see list below)
- [ ] Add environment variables to Amplify configuration
- [ ] Document expected inputs and outputs
- [ ] Add to `test:lambda` script if new directory

#### DynamoDB Reserved Keywords to Watch For

Always use `ExpressionAttributeNames` when querying these fields:

```typescript
// ❌ WRONG - Will fail if 'owner' is in your schema
FilterExpression: 'owner = :owner'

// ✅ CORRECT - Escape reserved keywords
FilterExpression: '#owner = :owner',
ExpressionAttributeNames: {
  '#owner': 'owner'
}
```

Common reserved keywords:
- `owner`, `data`, `status`, `name`, `type`, `value`
- `date`, `time`, `timestamp`, `user`, `role`
- Full list: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ReservedWords.html

### Adding AWS Amplify Integration

**CRITICAL: Never call `generateClient()` at module load time**

- [ ] Use lazy initialization pattern for all AWS clients
- [ ] Ensure `Amplify.configure()` is called before client creation
- [ ] Add integration tests to verify initialization order
- [ ] Test in browser environment (not just unit tests)

#### Correct Pattern:

```typescript
// ❌ WRONG - Called at module load time
const client = generateClient<Schema>();

// ✅ CORRECT - Lazy initialization
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }
  return client;
}

// Use it
export async function myFunction() {
  const client = getClient(); // Called only when needed
  // ...
}
```

### Adding a New API Integration

- [ ] Create client function in `src/utils/` directory
- [ ] Add error handling for network failures
- [ ] Add error handling for invalid responses
- [ ] Test with mocked responses (unit tests)
- [ ] Test with real API (integration tests)
- [ ] Add timeout handling
- [ ] Document rate limits and usage quotas
- [ ] Add retry logic if appropriate

### Modifying DynamoDB Schema

- [ ] Update schema in `amplify/data/resource.ts`
- [ ] Check for reserved keywords in field names
- [ ] Update TypeScript types in `src/types/`
- [ ] Create migration plan for existing data
- [ ] Test Lambda queries with new schema
- [ ] Update all affected Lambda functions
- [ ] Update all affected test files

### Adding a New React Component

- [ ] Create component in appropriate `src/Components/` or `src/Pages/` directory
- [ ] Add TypeScript props interface
- [ ] Create test file with `.test.tsx` extension
- [ ] Test rendering
- [ ] Test user interactions (if applicable)
- [ ] Test error states
- [ ] Check accessibility (ARIA labels, keyboard navigation)
- [ ] Test responsive design

---

## 🧪 Testing Requirements

### Test Coverage Requirements

All new code must meet these thresholds:

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 65%
- **Statements**: 70%

Run `npm run test:coverage` to verify.

### Required Test Types

| Code Type | Unit Tests | Integration Tests | E2E Tests |
|-----------|------------|-------------------|-----------|
| Lambda Functions | ✅ Required | ⚠️ Recommended | Optional |
| AWS Integrations | ✅ Required | ✅ Required | ⚠️ Recommended |
| React Components | ✅ Required | Optional | Optional |
| Utility Functions | ✅ Required | Optional | Optional |
| API Clients | ✅ Required | ✅ Required | ⚠️ Recommended |

### Test File Naming

- Unit tests: `{filename}.test.ts` or `{filename}.test.tsx`
- Integration tests: `{filename}.integration.test.ts`
- E2E tests: `{filename}.e2e.test.ts`

### Writing Good Tests

- [ ] Test describes WHAT is being tested (not implementation)
- [ ] Test names are descriptive and complete sentences
- [ ] Tests are independent (don't rely on order)
- [ ] Mock external dependencies appropriately
- [ ] Don't over-mock (causes false confidence)
- [ ] Test error cases, not just happy path
- [ ] Use meaningful assertions

#### Example:

```typescript
// ❌ BAD - Vague, tests implementation
it('works', async () => {
  const result = await myFunction();
  expect(result).toBeTruthy();
});

// ✅ GOOD - Specific, tests behavior
it('should return active API key when user has configured one', async () => {
  const apiKey = await getUserFmpApiKey();
  expect(apiKey).toBeDefined();
  expect(apiKey?.isActive).toBe(true);
});
```

---

## 🚨 Common Bugs to Avoid

### Bug #1: Amplify Not Configured

**What happened**: `generateClient()` called before `Amplify.configure()`

**How to prevent**:
- [ ] Always use lazy initialization for AWS clients
- [ ] Add integration test for initialization order
- [ ] Never call `generateClient()` at module top level

**Test it**: `npm run test:integration`

### Bug #2: DynamoDB Reserved Keywords

**What happened**: Used `owner` in FilterExpression without escaping

**How to prevent**:
- [ ] Check all field names against reserved keyword list
- [ ] Always use `ExpressionAttributeNames` for ALL fields in queries
- [ ] Add Lambda tests that verify query structure
- [ ] Test with real DynamoDB (integration tests)

**Test it**: `npm run test:lambda`

### Bug #3: Type Safety Violations

**What happened**: Used `any` instead of proper types

**How to prevent**:
- [ ] Use `unknown` instead of `any` when type is truly unknown
- [ ] Add proper type annotations to function parameters
- [ ] Enable strict TypeScript settings
- [ ] Fix all ESLint warnings

**Test it**: `npm run lint && npx tsc -b --noEmit`

---

## 📦 Pre-Commit Checklist

The pre-commit hook will automatically run these checks, but verify manually:

```bash
# Linting
npm run lint

# Unit tests
npm run test:unit

# Lambda tests
npm run test:lambda

# All together (what pre-commit hook runs)
npm run precommit
```

If any check fails, **fix it before committing**.

---

## 🚀 Pre-Pull Request Checklist

Before creating a PR:

- [ ] All commits have clear, descriptive messages
- [ ] Code follows existing patterns and conventions
- [ ] All tests passing: `npm run test:ci`
- [ ] Coverage thresholds met: `npm run test:coverage`
- [ ] No console.log statements (unless intentional)
- [ ] No commented-out code
- [ ] Updated documentation if needed
- [ ] Tested in browser (not just unit tests)
- [ ] Reviewed your own code changes

### Pull Request Description Should Include:

1. **What** changed
2. **Why** it changed
3. **How** to test it
4. Screenshots (if UI changes)
5. Related issue numbers

---

## 🔍 Code Review Checklist

When reviewing PRs:

- [ ] Code follows existing patterns
- [ ] Tests cover new functionality
- [ ] Tests would catch the bugs this fixes
- [ ] No security vulnerabilities introduced
- [ ] Error handling is appropriate
- [ ] TypeScript types are correct
- [ ] Documentation is updated
- [ ] No unnecessary dependencies added

---

## 📚 Additional Resources

- [Test Coverage Analysis](./TEST-COVERAGE-ANALYSIS.md) - Why tests matter
- [DynamoDB Reserved Words](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ReservedWords.html)
- [Amplify Documentation](https://docs.amplify.aws/)
- [Vitest Documentation](https://vitest.dev/)

---

## 🆘 Getting Help

If you're unsure about any of these items:

1. Check existing code for patterns
2. Review similar PRs in git history
3. Ask the team in standup or Slack
4. Write the test anyway (helps clarify requirements)

---

**Remember**: These checks exist to prevent bugs, not to slow you down. They save time by catching issues early.
