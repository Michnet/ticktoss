import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to TickToss to manage your bookings and deals.',
};

export default function LoginPage() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <AuthForm defaultMode="login" />
    </div>
  );
}
