# User Registration Form

A complete user registration system built with Next.js, TypeScript, PostgreSQL, and comprehensive testing suite.

## 🚀 Features

- **Complete Registration Form** with all required fields (First Name, Last Name, Email, Password)
- **Client-side Validation** with real-time feedback
- **Email Validation** - Only Gmail addresses accepted
- **Password Complexity** - Enforces secure password requirements
- **Form States** - Idle, Warning, Failure, and Success states
- **PostgreSQL Integration** - Secure data storage with bcrypt password hashing
- **Comprehensive Testing** - 36 unit tests covering all functionality
- **Responsive Design** - Mobile-friendly interface

## 📋 Requirements Met

✅ **Technology Stack**: React + TypeScript + Next.js  
✅ **No Component Libraries**: All components built from scratch  
✅ **Client-side Validation**: All validations implemented  
✅ **Required Fields**: First Name, Last Name, Email, Password  
✅ **Gmail Only**: Email validation restricts to @gmail.com  
✅ **Email Uniqueness**: test@gmail.com validation fails as required  
✅ **Password Complexity**: 8-30 chars, lowercase, uppercase, number, special char  
✅ **Form States**: Idle, Warning, Failure, Success with proper UI feedback  
✅ **Unit Tests**: Comprehensive test suite with 36 tests  
✅ **Extra Credit**: Node.js API + PostgreSQL + API tests  

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: CSS (custom, no libraries)
- **Testing**: Vitest + Testing Library
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with pg driver
- **Security**: bcryptjs for password hashing

## 🏗 My Approach to Solving the Problem

### 1. **Form Architecture**
I designed the form with a clear separation of concerns:
- `RegistrationForm.tsx` - Main form logic and state management
- `FormStatus.tsx` - Reusable status message component
- Validation functions isolated for testability

### 2. **Validation Strategy**
- **Client-side first**: Immediate feedback for better UX
- **Comprehensive validation**: All requirements covered with specific error messages
- **Real-time clearing**: Errors clear as user types to reduce friction

### 3. **State Management**
- React useState for form data and errors
- Form state tracking (idle/warning/failure/success)
- Loading states for better user feedback

### 4. **Testing Philosophy**
- **Test-driven approach**: Wrote comprehensive tests for all validations
- **User-centric testing**: Tests simulate real user interactions
- **API testing**: Mock-based testing for all endpoint scenarios

### 5. **Database Design**
- Proper indexing on email field for performance
- Created_at/updated_at timestamps with triggers
- Secure password hashing with bcrypt (12 rounds)

## 🤖 How Much AI Did I Use?

**AI Usage: ~85%**

**What AI helped with:**
- Initial project structure and setup
- Writing comprehensive test suites
- API endpoint implementation
- CSS styling and responsive design
- Database schema and SQL setup
- Form validation logic

**What I did manually:**
- Project planning and architecture decisions
- Requirements analysis and feature breakdown
- Testing strategy and edge case identification
- Code review and optimization
- Documentation structure

## 🎯 Where I Could Do Better

### 1. **Performance Optimizations**
- **Debounced validation**: Could implement debounced validation for better performance
- **Memoization**: Form components could use React.memo for re-render optimization
- **Virtual scrolling**: For large user lists (future feature)

### 2. **Enhanced UX**
- **Progressive validation**: Show validation hints before user submits
- **Password strength indicator**: Visual feedback for password complexity
- **Accessibility improvements**: Better ARIA labels and keyboard navigation

### 3. **Security Enhancements**
- **Rate limiting**: Prevent spam registrations
- **CSRF protection**: Add CSRF tokens
- **Input sanitization**: Additional XSS protection

### 4. **Scalability**
- **Caching layer**: Redis for session management
- **Database optimization**: Connection pooling and query optimization
- **Error monitoring**: Sentry or similar for production error tracking

### 5. **Code Quality**
- **Custom hooks**: Extract form logic into reusable hooks
- **Type safety**: More strict TypeScript configurations
- **Error boundaries**: React error boundaries for better error handling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+

### Installation

1. **Clone and setup**
   ```bash
   cd registration
   npm install
   ```

2. **Database setup**
   ```bash
   # Create database
   createdb registration_db
   
   # Run SQL setup
   psql -d registration_db -f lib/database.sql
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Development**
   ```bash
   # Start development server
   npm run dev
   
   # Run tests
   npm run test
   
   # Run tests once
   npm run test:run
   
   # Build for production
   npm run build
   ```

## 🧪 Testing

The project includes 36 comprehensive tests covering:

- **Form Component Tests (17 tests)**
  - Field rendering and validation
  - User interactions and state changes
  - API integration and error handling

- **Status Component Tests (5 tests)**
  - All form states and their visual feedback

- **API Endpoint Tests (14 tests)**
  - All validation scenarios
  - Database integration
  - Error handling and edge cases

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm run test
```

## 📁 Project Structure

```
registration/
├── app/
│   ├── api/register/route.ts     # Registration API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # App layout
│   └── page.tsx                 # Main page
├── components/
│   ├── RegistrationForm.tsx     # Main form component
│   └── FormStatus.tsx           # Status message component
├── __test__/
│   ├── RegistrationForm.test.tsx
│   ├── FormStatus.test.tsx
│   └── api.test.ts
├── lib/
│   └── database.sql             # Database schema
├── vitest.config.ts             # Test configuration
├── test-setup.ts               # Test environment setup
└── README.md
```

## 🔒 Security Features

- **Password hashing**: bcrypt with 12 salt rounds
- **Input validation**: Server-side validation mirrors client-side
- **SQL injection prevention**: Parameterized queries
- **Email uniqueness**: Database-level constraints

## 📝 API Documentation

### POST /api/register

Register a new user account.

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string", 
  "email": "string (must be @gmail.com)",
  "password": "string (8-30 chars, mixed case, number, special char)"
}
```

**Response (201 Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@gmail.com",
    "createdAt": "2024-10-12T..."
  }
}
```

**Response (400 Validation Error):**
```json
{
  "error": "Error message",
  "field": "fieldName"
}
```

---

*This project was completed as part of the Goldenset UI Intern application process.*
