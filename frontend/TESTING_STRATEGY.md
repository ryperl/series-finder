# React Component Testing Strategy for Series Finder

## Overview

This document outlines a comprehensive testing strategy for the Series
Finder React application, covering all major components, pages, hooks,
and contexts.

## Current Test Status

✅ **API Service** - Complete with 25 passing tests
✅ **AuthContext** - Basic structure created
✅ **useApi Hooks** - Basic structure created
✅ **Header Component** - Basic structure created

## Recommended Testing Priorities

### 1. **Context Providers (High Priority)**

- [x] AuthContext - User authentication state management
- [ ] Any other global state providers

### 2. **Custom Hooks (High Priority)**

- [x] useApi, useMutation, useQuery - API interaction hooks
- [ ] Any form validation hooks
- [ ] Any data transformation hooks

### 3. **Core Components (High Priority)**

#### Header Component

- [x] Basic navigation rendering
- [x] User authentication state display
- [x] Logout functionality
- [ ] Navigation link highlighting for current page

#### SeriesManager Component

- [x] Series list rendering
- [x] Add/Edit/Delete series functionality
- [x] Series filtering (My Series vs Recommendations)
- [x] Like/Unlike functionality
- [x] Form validation
- [x] Loading states
- [x] Error handling

### 4. **Page Components (Medium Priority)**

#### Login Page

```typescript
// Test cases needed:
- Form rendering and validation
- Successful login flow
- Login error handling
- Navigation to register page
- Redirect after successful login
- Form field validation (empty fields, etc.)
```

#### Register Page

```typescript
// Test cases needed:
- Form rendering and validation
- Successful registration flow
- Registration error handling (user exists, etc.)
- Password confirmation validation
- Navigation to login page
- Field validation (email format, required fields)
```

#### Profile Page

```typescript
// Test cases needed:
- User profile display
- Edit profile functionality
- Profile update success/error handling
- Display of user's series
- Non-authenticated user redirect
```

#### Home Page

```typescript
// Test cases needed:
- Welcome message for non-authenticated users
- Series display for authenticated users
- Hero section rendering
- Conditional content based on auth state
```

#### Discover Page

```typescript
// Test cases needed:
- Page header and description
- SeriesManager integration (recommendations)
- Loading states
```

#### Friends Page

```typescript
// Test cases needed:
- Friends list display
- Add friend functionality
- Friend request handling (accept/reject)
- Search/filter friends
- Loading and error states
```

### 5. **Integration Tests (Low Priority)**

- User registration flow (end-to-end)
- Login and series management flow
- Friend management flow
- Series creation and sharing flow

## Testing Utilities Needed

### Mock Data Generators

```typescript
// Already started in src/test/utils.tsx
export const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date()
}

export const mockSeries = {
  id: '1',
  userId: '1',
  title: 'Breaking Bad',
  description: 'A high school teacher turned drug dealer',
  genre: ['Drama', 'Crime'],
  releaseYear: 2008,
  rating: 9,
  status: 'completed' as const,
  isRecommendation: true,
  likes: 10,
  likedBy: ['user1', 'user2'],
  createdAt: new Date(),
  updatedAt: new Date()
}

export const mockFriend = {
  id: '1',
  userId: '1',
  friendId: '2',
  status: 'accepted' as const,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### Custom Render Function

```typescript
// Extend the existing src/test/utils.tsx
const renderWithProviders = (ui: React.ReactElement, 
                           options?: RenderOptions) => {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

export { renderWithProviders as render }
```

## Component-Specific Test Examples

### SeriesManager Component Tests

```typescript
describe('SeriesManager Component', () => {
  it('should display series list correctly')
  it('should show "Add Series" button for authenticated users')
  it('should open modal when "Add Series" is clicked')
  it('should submit new series form successfully')
  it('should handle series creation errors')
  it('should allow editing existing series')
  it('should allow deleting series')
  it('should filter between "My Series" and "Recommendations"')
  it('should handle like/unlike functionality')
  it('should display loading state while fetching series')
  it('should display empty state when no series found')
  it('should handle API errors gracefully')
})
```

### Login Component Tests

```typescript
describe('Login Component', () => {
  it('should render login form correctly')
  it('should validate required fields')
  it('should call login function on form submission')
  it('should display error message on login failure')
  it('should redirect to home page on successful login')
  it('should disable submit button while loading')
  it('should navigate to register page when link is clicked')
  it('should show loading state during login attempt')
})
```

## Test Configuration Recommendations

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### Coverage Targets

- **Functions**: 80%+
- **Lines**: 80%+
- **Branches**: 75%+
- **Statements**: 80%+

### File Organization

```text
src/
├── components/
│   ├── __tests__/
│   │   ├── Header.test.tsx
│   │   ├── SeriesManager.test.tsx
│   │   └── ...
├── pages/
│   ├── __tests__/
│   │   ├── Login.test.tsx
│   │   ├── Register.test.tsx
│   │   ├── Profile.test.tsx
│   │   └── ...
├── hooks/
│   ├── __tests__/
│   │   ├── useApi.test.ts
│   │   └── ...
├── contexts/
│   ├── __tests__/
│   │   ├── AuthContext.test.tsx
│   │   └── ...
└── services/
    ├── __tests__/
    │   ├── apiService.test.ts ✅
    │   └── ...
```

## Implementation Timeline

### Week 1: Core Infrastructure

- [x] AuthContext tests
- [x] useApi hooks tests
- [x] Header component tests
- [x] SeriesManager component tests

### Week 2: Page Components

- [ ] Login page tests
- [ ] Register page tests
- [ ] Profile page tests
- [ ] Home page tests

### Week 3: Advanced Features

- [ ] Friends page tests
- [ ] Discover page tests
- [ ] Integration tests

### Week 4: Polish and Coverage

- [ ] Edge case testing
- [ ] Error boundary tests
- [ ] Performance testing
- [ ] Accessibility testing

## Testing Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how it does it
   - Test user interactions and expected outcomes

2. **Use Descriptive Test Names**
   - Clearly describe what is being tested
   - Include the expected outcome

3. **Follow AAA Pattern**
   - **Arrange**: Set up test data and mocks
   - **Act**: Perform the action being tested
   - **Assert**: Verify the expected outcome

4. **Mock External Dependencies**
   - API calls
   - Router navigation
   - Local storage
   - External libraries

5. **Test Error States**
   - Network errors
   - Validation errors
   - Authorization errors
   - Loading states

6. **Use Data Test IDs**
   - Add `data-testid` attributes for reliable element selection
   - Avoid relying on text content or CSS classes

## Tools and Libraries in Use

- **Testing Framework**: Vitest
- **Testing Library**: React Testing Library
- **User Interactions**: @testing-library/user-event
- **Mocking**: Vi (from Vitest)
- **Coverage**: c8 (built into Vitest)
- **Test Environment**: jsdom

## Conclusion

This testing strategy provides comprehensive coverage for the Series Finder
application. Start with the high-priority items (contexts and hooks) and
gradually work through the component tests. The goal is to build confidence
in the application's reliability and make future refactoring safer.
