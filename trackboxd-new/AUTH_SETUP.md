# Authentication Setup Guide

This guide will help you set up username/password authentication with Supabase Auth in your Trackboxd application.

## Prerequisites

- Supabase project set up
- Environment variables configured
- Database schema ready

## Step 1: Database Migration

Run the SQL migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase-migration.sql
```


This migration will:
- Enable Row Level Security (RLS) on the users table
- Create policies for user data access
- Set up triggers to sync between `auth.users` and `public.users`
- Create helper functions for user management

## Step 2: Environment Variables

Make sure you have these environment variables set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Step 3: Supabase Auth Configuration

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:3000` for development)
3. Add redirect URLs if needed
4. Enable email confirmations if desired

## Step 4: Features

### Authentication Modal

The new `AuthModal` component includes:

**Signup Fields:**
- Email (required)
- Username (required, 3+ characters, alphanumeric + underscore only, stored as 'name' field)
- Password (required, 6+ characters)
- Confirm Password (required)
- Profile Image URL (optional, must be valid image URL)
- Spotify Profile URL (optional, must be valid Spotify URL)

**Login Features:**
- Login with either email or username (username is stored in 'name' field)
- Password visibility toggle
- Form validation and error handling
- Loading states
- Automatic redirect to `/activity` page on successful login

### Database Integration

- Automatic user creation in `public.users` when signing up via Supabase Auth
- Data synchronization between `auth.users` and `public.users`
- Row Level Security policies for data protection
- Username uniqueness enforcement (name field is unique)

### Security Features

- Password hashing handled by Supabase Auth
- Session management via NextAuth
- CSRF protection
- Input validation and sanitization

## Step 5: Testing

1. Start your development server: `npm run dev`
2. Navigate to the landing page
3. Click "Sign Up" to test the registration flow
4. Click "Sign In" to test the login flow
5. Try logging in with both email and username

## Troubleshooting

### Common Issues

1. **"User already exists" error**: Check if the email is already registered
2. **Username taken**: The username (stored in name field) must be unique across all users
3. **Invalid email format**: Ensure proper email validation
4. **Password too short**: Minimum 6 characters required
5. **401 Unauthorized error**: Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
6. **Missing environment variables**: Ensure all required env vars are set

### Database Issues

1. **RLS policies**: Make sure Row Level Security is properly configured
2. **Triggers**: Verify that the sync triggers are working
3. **Permissions**: Check that authenticated users have proper permissions

### NextAuth Issues

1. **Session not persisting**: Check NEXTAUTH_SECRET and NEXTAUTH_URL
2. **Redirect issues**: Verify callback URLs in Supabase settings
3. **CORS errors**: Ensure proper domain configuration

## API Endpoints

The authentication system uses these endpoints:

- `POST /api/auth/signin` - NextAuth signin
- `POST /api/auth/signout` - NextAuth signout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/csrf` - CSRF token

## User Data Flow

1. **Signup**: User fills form → Supabase Auth creates user → Manual insert creates `public.users` record with username in 'name' field → User redirected to `/activity`
2. **Login**: User enters email/username → System finds email by checking both email and name fields → Supabase Auth validates → NextAuth creates session → User redirected to `/activity`
3. **Session**: NextAuth manages session → User data available via `useSession()`

## Customization

### Adding New Fields

To add new fields to the signup form:

1. Update the `FormData` interface in `AuthModal.tsx`
2. Add the field to the form UI
3. Update the validation logic
4. Modify the database schema if needed
5. Update the sync triggers

### Styling

The auth modal uses Tailwind CSS classes. You can customize the appearance by modifying the className props in `AuthModal.tsx`.

### Validation Rules

Modify the `validateForm` function in `AuthModal.tsx` to change validation rules for any field.

## Security Considerations

- All passwords are hashed by Supabase Auth
- User sessions are managed securely by NextAuth
- Database access is protected by RLS policies
- Input validation prevents malicious data
- CSRF protection is enabled

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify environment variables
3. Check Supabase logs
4. Ensure database triggers are working
5. Test with a fresh user account
