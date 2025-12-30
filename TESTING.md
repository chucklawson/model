# Testing Guide

This project uses **Vitest** for unit testing and **React Testing Library** for component testing.

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Writing Tests

### File Naming Convention

- Test files should be named `*.test.ts` or `*.test.tsx`
- Place test files next to the code they test
- Example: `MortgageCalculation.ts` → `MortgageCalculation.test.ts`

### Test Structure

Use the **Arrange-Act-Assert** pattern:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('MyModule', () => {
  describe('myFunction', () => {
    it('should do something specific', () => {
      // Arrange - Set up test data
      const input = 'test';

      // Act - Execute the function
      const result = myFunction(input);

      // Assert - Verify the result
      expect(result).toBe('expected output');
    });
  });
});
```

## Test Templates

### 1. Testing Utility Functions

```typescript
import { describe, it, expect } from 'vitest';
import { yourUtilityFunction } from './yourModule';

describe('YourModule', () => {
  describe('yourUtilityFunction', () => {
    it('should handle normal input', () => {
      const result = yourUtilityFunction(validInput);
      expect(result).toBe(expectedOutput);
    });

    it('should handle edge cases', () => {
      const result = yourUtilityFunction(edgeCase);
      expect(result).toBe(expectedEdgeCaseOutput);
    });

    it('should handle invalid input gracefully', () => {
      expect(() => yourUtilityFunction(invalidInput)).toThrow();
    });
  });
});
```

### 2. Testing React Components

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render with initial props', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<MyComponent onClick={handleClick} />);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should update when props change', () => {
    const { rerender } = render(<MyComponent value={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();

    rerender(<MyComponent value={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
```

### 3. Testing Custom Hooks

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should fetch data on mount', async () => {
    const { result } = renderHook(() => useMyHook());

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });
  });
});
```

### 4. Testing with Mocks

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myModuleWithDependency } from './myModule';

// Mock external dependencies
vi.mock('./externalModule', () => ({
  externalFunction: vi.fn(() => 'mocked result'),
}));

describe('MyModule with mocks', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should call external function', () => {
    const { externalFunction } = await import('./externalModule');

    myModuleWithDependency();

    expect(externalFunction).toHaveBeenCalledTimes(1);
  });
});
```

## Common Testing Patterns

### Testing Calculations

```typescript
describe('calculation function', () => {
  it('should calculate correctly with typical values', () => {
    const result = calculate(100, 0.05, 10);
    expect(result).toBeCloseTo(162.89, 2); // Allow for floating point
  });

  it('should handle zero values', () => {
    const result = calculate(100, 0, 10);
    expect(result).toBe(100);
  });

  it('should handle negative values appropriately', () => {
    const result = calculate(100, -0.05, 10);
    expect(result).toBeLessThan(100);
  });
});
```

### Testing Forms

```typescript
describe('Form component', () => {
  it('should validate input', async () => {
    const user = userEvent.setup();
    render(<MyForm />);

    const input = screen.getByLabelText('Email');
    await user.type(input, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  it('should submit valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<MyForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});
```

### Testing Async Operations

```typescript
describe('async operations', () => {
  it('should handle loading state', async () => {
    render(<AsyncComponent />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it('should handle errors', async () => {
    // Mock an API error
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));

    render(<AsyncComponent />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

## Best Practices

1. **One assertion per test** (when possible) - Makes failures easier to debug
2. **Use descriptive test names** - Test name should describe what's being tested
3. **Test behavior, not implementation** - Focus on what the code does, not how
4. **Avoid testing third-party code** - Only test your own logic
5. **Keep tests simple** - Complex tests are hard to maintain
6. **Use setup/teardown** - Use `beforeEach`/`afterEach` for common setup
7. **Mock external dependencies** - Tests should be isolated and fast
8. **Test edge cases** - Zero, negative, null, undefined, empty arrays, etc.

## What to Test

✅ **Do Test:**
- Calculation logic
- Data transformations
- User interactions
- Error handling
- Edge cases
- Business logic

❌ **Don't Test:**
- Third-party libraries
- Browser APIs (unless you're adding custom logic)
- Simple getters/setters
- CSS styling (use visual regression tools instead)

## Coverage Goals

- **New Code**: 80%+ coverage
- **Critical Paths** (calculations, data processing): 90%+ coverage
- **UI Components**: 60%+ coverage (focus on logic, not layout)

## Debugging Tests

```bash
# Run a specific test file
npm test MortgageCalculation.test.ts

# Run tests matching a pattern
npm test -- --grep="mortgage"

# Run with debugging
npm test -- --inspect-brk
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployments

Failed tests will block merges and deployments.

## Need Help?

- Check existing tests for examples
- Read the [Vitest documentation](https://vitest.dev/)
- Read the [React Testing Library documentation](https://testing-library.com/react)
- Ask the team!
