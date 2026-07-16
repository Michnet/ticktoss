import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Create Account',
  description: 'Join TickToss to book exclusive, time-limited deals.',
};

export default function RegisterPage() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <AuthForm defaultMode="register" />
    </div>
  );
}
