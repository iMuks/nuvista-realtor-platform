import { Outlet } from 'react-router-dom';
import Header from '../../components/public/Header';
import Footer from '../../components/public/Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
