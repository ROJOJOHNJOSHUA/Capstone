import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Footer from '../components/footer/Footer';
import Navbar from '../components/navbar/Navbar';
import LoginModal from '../components/forms/LoginModal';

const QUICK_ACTIONS = [
  { label: 'Reservations', detail: 'Book parish services online.', icon: 'calendar' },
  { label: 'Appointments', detail: 'Schedule with the parish office.', icon: 'appointment' },
  { label: 'Digital Records', detail: 'Access your sacramental records.', icon: 'records' },
  { label: 'Notifications', detail: 'Get important parish updates.', icon: 'bell' },
];

function QuickActionIcon({ type }) {
  const paths = {
    calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 9h16M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01" /></>,
    appointment: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 9h16M8 14l2 2 5-5" /></>,
    records: <><path d="M7 3h8l3 3v15H7z" /><path d="M15 3v4h4M10 12h5M10 16h5" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  };

  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showRegisteredNotice, setShowRegisteredNotice] = useState(Boolean(location.state?.registered));
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (location.state?.registered) navigate('/', { replace: true, state: {} });
  }, [location.state, navigate]);

  return (
    <div className="home-page mx-auto min-h-screen max-w-[1500px] overflow-hidden bg-[#faf8f1] text-[#4e555a] shadow-[0_0_40px_rgba(83,65,34,0.08)]">
      <Navbar />
      {showRegisteredNotice && <div className="relative z-10 border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-center"><p className="text-sm font-semibold text-emerald-800">Registration Successful</p><p className="text-sm text-emerald-700">Your account has been created successfully. Please log in to continue.</p><button type="button" aria-label="Dismiss" className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600" onClick={() => setShowRegisteredNotice(false)}>✕</button></div>}
      <main>
        <section className="hero-shell relative min-h-[390px] overflow-hidden border-b border-[#eadfce] sm:min-h-[440px]">
          <img src="/parish.jpg" alt="Holy Family Parish church" className="absolute inset-0 z-0 h-full w-full object-cover object-[70%_center] saturate-[1.1] sepia-[0.2] opacity-68" />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#faf8f1]/95 via-[#faf8f1]/75 via-45% to-[#faf8f1]/10" aria-hidden="true" />
          <div className="relative z-20 mx-auto flex min-h-[390px] max-w-7xl items-center px-4 py-12 sm:min-h-[440px] sm:px-6 lg:px-8">
            <div className="relative z-20 max-w-xl text-center lg:text-left"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#b18a45]">Welcome to </p><h1 className="brand-heading mx-auto mb-5 max-w-xl text-5xl leading-[0.98] text-[#273746] sm:text-6xl lg:mx-0 lg:text-7xl">Holy Family<span className="mt-5 text-[#b18a45]">Parish</span></h1><p className="mx-auto max-w-lg text-base font-medium leading-relaxed text-[#4e555a] lg:mx-0">A family united in faith, serving with love.</p><p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#7a7d7f] lg:mx-0">We are a parish family rooted in faith, growing in faith, and committed to serving one another in Christ's love.</p><div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start"><button type="button" onClick={() => setLoginOpen(true)} className="btn-gold px-6 py-3">Book a Reservation <span aria-hidden>→</span></button></div></div>
          </div>
        </section>
        <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:px-6"><div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[#e4dacb] bg-white/95 shadow-[0_14px_30px_rgba(83,65,34,0.12)] backdrop-blur-sm sm:grid-cols-4">{QUICK_ACTIONS.map((action, index) => <div key={action.label} className={`p-4 text-center sm:p-5 ${index % 2 === 0 ? 'border-r border-[#eee6d9] sm:border-r' : 'sm:border-r'} ${index < 2 ? 'border-b border-[#eee6d9] sm:border-b-0' : ''} ${index === 3 ? 'sm:border-r-0' : ''}`}><span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-[#d7b57a] text-[#b18a45]"><QuickActionIcon type={action.icon} /></span><span className="mt-2 block text-xs font-semibold text-[#273746]">{action.label}</span><span className="mt-1 block text-[10px] leading-relaxed text-[#8a8d8e]">{action.detail}</span></div>)}</div></section>
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="relative overflow-hidden rounded-2xl border border-[#d8cbb7] bg-[#273746] shadow-[0_18px_40px_rgba(39,55,70,0.16)]">
            <img src="/sacraments.png" alt="Faith, service, and community" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1d3040]/95 via-[#1d3040]/82 via-55% to-[#1d3040]/10" aria-hidden="true" />
            <div className="relative z-10 mx-auto flex min-h-[250px] max-w-7xl flex-col justify-center px-6 py-10 sm:min-h-[280px] sm:px-10 sm:py-12 lg:px-12">
              <div className="max-w-2xl">
                <h2 className="font-display text-3xl leading-[1.15] text-white sm:text-4xl">Faith. Service. Community.</h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/85 sm:mt-5 sm:text-base sm:leading-7">A Catholic community committed to serving God and helping people grow through prayer, the sacraments, and pastoral care.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} from="/reservations" />
    </div>
  );
}
