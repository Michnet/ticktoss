import Navbar from '@/components/layout/Navbar';

export default function SolidRoutesLayout({ children }) {
  return (
    <>
      <Navbar variant="solid" />
      {children}
    </>
  );
}
