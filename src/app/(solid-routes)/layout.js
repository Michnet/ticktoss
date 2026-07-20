import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function SolidRoutesLayout({ children }) {
  return (
    <>
      <Navbar variant="solid" />
      {children}
      <Footer />
    </>
  );
}
