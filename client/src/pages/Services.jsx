import { Link } from 'react-router-dom';
import { useState } from 'react';
import Footer from '../components/footer/Footer';
import LoginModal from '../components/forms/LoginModal';
import Navbar from '../components/navbar/Navbar';
import { CORE_FEATURE_CARDS, SERVICE_CARDS, SERVICE_REQUIREMENTS } from '../utils/constants';

const APPOINTMENT_CARD = {
  name: 'Appointments',
  description: 'Meet with the parish staff for your concerns.',
  image: '/Appointment.jpg',
  requirements: SERVICE_REQUIREMENTS.Appointments,
};

const getRequirementItems = (service) => {
  const raw = service.requirements || SERVICE_REQUIREMENTS[service.name] || '';
  return raw
    .split(/[;,]/)
    .map((item) => item.replace(/\s*:\s*$/, '').trim())
    .filter(Boolean);
};

export default function Services() {
  const services = [...SERVICE_CARDS, APPOINTMENT_CARD].map((service) => ({
    ...service,
    requirements: service.requirements || SERVICE_REQUIREMENTS[service.name] || '',
  }));
  const [flippedServices, setFlippedServices] = useState({});
  const [loginOpen, setLoginOpen] = useState(false);

  const toggleService = (serviceName) => {
    setFlippedServices((current) => ({ ...current, [serviceName]: !current[serviceName] }));
  };

  return (
    <div className="min-h-screen bg-[#faf8f1] text-[#4e555a]">
      <Navbar />
      <main>
        <h1 className="mt-5 px-4 text-center font-display text-xl font-bold uppercase tracking-[0.1em] text-[#b18a45] sm:ml-8 sm:px-0 sm:text-left">Services we offer here!</h1>
        <section className="mx-auto max-w-7xl px-4 pb-9 pt-2 sm:px-6 md:pb-14 md:pt-4 lg:px-8">
          <div className="mobile-scroll-snap hide-scrollbar flex gap-5 pb-2">
            {services.map((service) => (
              <article
                key={service.name}
                role="button"
                tabIndex="0"
                aria-label={`${flippedServices[service.name] ? 'Show image for' : 'Show description for'} ${service.name}`}
                aria-pressed={Boolean(flippedServices[service.name])}
                onClick={() => toggleService(service.name)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleService(service.name);
                  }
                }}
                className="group aspect-[0.88] w-[calc((100%-1.25rem)/2)] max-w-[280px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#e5dccf] bg-[#fcfbf8] text-left shadow-[0_8px_22px_rgba(83,65,34,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(83,65,34,0.12)] focus:outline-none focus:ring-2 focus:ring-[#b18a45]/50 sm:aspect-square"
              >
                <div className="group/flip relative block h-full w-full overflow-hidden bg-[#efe4d1] text-left [perspective:1000px]"
                >
                  <span className={`relative block h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flippedServices[service.name] ? '[transform:rotateY(180deg)]' : ''}`}>
                    <span className="absolute inset-0 block bg-[#fcfbf8] [backface-visibility:hidden]"><img src={service.image} alt={service.name} className="h-[78%] w-full object-cover transition duration-500 group-hover/flip:scale-105" loading="lazy" /><span className="flex h-[22%] items-center px-3 font-display text-base leading-tight text-[#273746] sm:px-5 sm:text-lg">{service.name}</span></span>
                    <span className="absolute inset-0 flex overflow-y-auto [transform:rotateY(180deg)] [backface-visibility:hidden] flex-col justify-start bg-[#f5ede0] px-3 py-3 text-left sm:px-5 sm:py-4"><span className="font-display text-base leading-tight text-[#273746] sm:text-lg">{service.name}</span><span className="mt-2 text-[11px] leading-relaxed text-[#7a7d7f] sm:text-xs">{service.description}</span><span className="mt-3 border-t border-[#d9c9a3] pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b18a45]">Requirements</span><ul className="mt-2 space-y-1 pr-1 text-[10px] leading-relaxed text-[#5f6368] sm:text-[11px]">
                      {getRequirementItems(service).map((item) => (
                        <li key={item} className="flex items-start gap-1.5">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b18a45]" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul></span>
                  </span>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="btn-gold inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm"
            >
              Make Reservation <span aria-hidden>→</span>
            </button>
          </div>
        </section>
      </main>
      <Footer />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} from="/reservations" />
    </div>
  );
}
