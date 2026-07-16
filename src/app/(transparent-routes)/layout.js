import Navbar from '@/components/layout/Navbar';

export default function TransparentRoutesLayout({ children }) {
  return (
    <>
      <Navbar variant="transparent" />
      {children}
    </>
  );
}
