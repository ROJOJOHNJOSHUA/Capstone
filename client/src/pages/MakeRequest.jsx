import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';

function IconDocument({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2.75h8L19.25 8v13.25H6z" />
      <path d="M13.75 3v5.25H19" />
      <path d="M9 12.5h6.5M9 16h6.5" />
    </svg>
  );
}

function IconCalendar({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10.5h17" />
      <path d="M8 14.5h2.5M13.5 14.5H16M8 17.5h2.5" />
    </svg>
  );
}

const REQUEST_CARDS = [
  {
    to: '/reservations?new=1',
    image: '/jesus.png',
    imageAlt: 'Parish church interior',
    Icon: IconDocument,
    title: 'Reservation',
    description: 'Request a parish service such as marriage, baptism, or other special reservation requests.',
    cta: 'Make Reservation',
  },
  {
    to: '/appointments?new=1',
    image: 'Appointment.png',
    imageAlt: 'Writing an appointment request',
    Icon: IconCalendar,
    title: 'Appointment',
    description: 'Schedule a meeting or appointment with the parish office for your concerns and requests.',
    cta: 'Make Appointment',
  },
];

export default function MakeRequest() {
  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid gap-6 md:grid-cols-2">
          {REQUEST_CARDS.map(({ to, image, imageAlt, Icon, title, description, cta }) => (
            <div
              key={title}
              className="group overflow-hidden rounded-[26px] border border-[#ece4d3] bg-[#fffdf8] shadow-[0_16px_30px_rgba(83,65,34,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(83,65,34,0.12)]"
            >
              <div className="relative h-44">
                <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden="true" />
              </div>
              <div className="relative p-6 pt-0">
                <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#fffdf8] bg-[#f5ead5] text-[#a6813f] shadow-md">
                  <Icon />
                </span>
                <h2 className="mt-4 font-display text-2xl text-[#2f2a22]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6b6152]">{description}</p>
                <Link
                  to={to}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#b18a45] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(177,138,69,0.28)] transition hover:-translate-y-0.5 hover:bg-[#967338]"
                >
                  {cta}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
