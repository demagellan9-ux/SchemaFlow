// TODO: Implement login form using React Hook Form + zod
// Auth flow: Supabase Auth → JWT → stored in cookie via @supabase/ssr
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Sign in to SchemaFlow</h1>
        <p className="text-sm text-muted-foreground">
          {/* TODO: Replace with LoginForm component */}
          Login form placeholder
        </p>
      </div>
    </div>
  );
}
