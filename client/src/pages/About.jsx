import { useState } from 'react';
import Footer from '../components/footer/Footer';
import Navbar from '../components/navbar/Navbar';
import Modal from '../components/forms/Modal';
import { PARISH_LOCATION } from '../utils/constants';

const schedule = [['Monday', '6:00 AM'], ['Tuesday', 'Closed'], ['Wednesday', '6:00 AM'], ['Thursday', '6:00 AM'], ['Friday', '6:00 AM'], ['Saturday', '6:00 AM'], ['Sunday', '6:00 AM / 8:00 AM']];
const infoCards = [
  ['Parish History', 'Learn about our journey and heritage.', '⌂'],
  ['Our Leadership', 'Meet our parish priest and pastoral leaders.', '✦'],
  ['Donation', 'Our parish accepts donations to support our ministries and services.', '♥'],
];

const leadershipTimeline = [
  { name: 'REV. FR. ARNEL D. AYO', location: 'Albay', tenure: 'Jan 3, 2020 - Present', image: '/diocese.png' },
  { name: 'REV. FR. ROWAN E. GRAMONTE', location: 'Sorsogon', tenure: 'Feb 1, 2016 - Jan 3, 2020', image: '/diocese.png' },
  { name: 'REV. MSGR. REYNALDO A. MABUTE', location: 'Samar', tenure: 'July 1, 2013 - Jan 31, 2016', image: '/diocese.png' },
  { name: 'REV. FR. EFREN P. BANTOG, SOLT', location: 'Daraga, Albay', tenure: 'June 15, 2011 - June 30, 2013', image: '/diocese.png' },
  { name: 'REV. FR. HENRY B. BERCASIO, SOLT', location: 'Bacacay, Albay', tenure: 'May 31, 2009 - June 15, 2011', image: '/diocese.png' },
  { name: 'REV. FR. JOSE NESTOR A. BERANGO, JR. SOLT', location: 'Bacacay, Albay', tenure: 'June 4, 2005 - May 31, 2009', image: '/diocese.png' },
  { name: 'REV. FR. REYNALDO B. CLUTARIO, JR. SOLT', location: 'Tiwi, Albay', tenure: 'May 5, 2002 - May 31, 2005', image: '/diocese.png' },
  { name: 'REV. FR. GIL D. SALIGUMBA, SOLT', location: 'Legazpi City', tenure: 'Jan 15, 1997 - May 5, 2002', image: '/diocese.png' },
  { name: 'REV. FR. WILFREDO ALVARADO, SOLT', location: 'Legazpi City', tenure: 'July 11, 1994 - Jan 15, 1997', image: '/diocese.png' },
  { name: 'REV. FR. FRANKLIN H. SAN JUAN', location: 'Masbate', tenure: 'July 16, 1987 - July 11, 1994', image: '/diocese.png' },
  { name: 'REV. FR. ALFREDO CANTONJOS', location: 'San Jacinto, Masbate', tenure: 'Nov 5, 1981 - July 16, 1987', image: '/diocese.png' },
  { name: 'REV. FR. BENJAMIN VILCHEZ', location: 'Catanduanes', tenure: 'Dec 28, 1977 - Nov 5, 1981', image: '/diocese.png' },
  { name: 'REV. FR. DOMINADOR PEREZ', location: 'Sorsogon', tenure: 'July 10, 1969 - Dec 25, 1977', image: '/diocese.png' },
  { name: 'REV. FR. GREGORIO TRIUMFANTE', location: 'Catanduanes', tenure: 'Nov 19, 1968 - July 10, 1969', image: '/diocese.png' },
  { name: 'REV. FR. VICENTE RAMOS', location: 'Masbate', tenure: 'Nov 19, 1966 - Nov 19, 1968', image: '/diocese.png' },
  { name: 'REV. FR. JOSE JACOBO', location: 'Naga, Camarines Sur', tenure: 'June 29, 1959 - July 15, 1966', image: '/diocese.png' },
  { name: 'REV. FR. FRANCISCO HERMIDA', location: 'Magallanes, Sorsogon', tenure: 'May 20, 1954 - June 29, 1959', image: '/diocese.png' },
  { name: 'REV. FR. BRIGIDO GARCILLANOSA', location: 'Bombom, Camarines Sur', tenure: 'Oct 18, 1941 - May 20, 1954', image: '/diocese.png' },
  { name: 'MSGR. PEDRO LANUZA', location: 'Iriga, Camarines Sur', tenure: 'July 30, 1938 - Oct 18, 1941', image: '/diocese.png' },
  { name: 'REV. FR. FELIMON CASTELLAR', location: 'Tabaco, Albay', tenure: 'April 3, 1938 - July 30, 1938', image: '/diocese.png' },
  { name: 'REV. FR. RAFAEL QUIMPO', location: 'Naga, Camarines Sur', tenure: 'March 2, 1936 - April 3, 1938', image: '/diocese.png' },
  { name: 'REV. FR. MARIONO CALINOG', location: 'Camarines Sur', tenure: 'Sept 23, 1920 - March 2, 1936', image: '/diocese.png' },
  { name: 'REV. FR. SIPLICIO DIÑO', location: 'Bulusan, Sorsogon', tenure: 'May 14, 1916 - Sept 23, 1920', image: '/diocese.png' },
];

export default function About() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [leadershipOpen, setLeadershipOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf8f1] text-[#4e555a]">
      <Navbar />
      <main>
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8 lg:px-8">
          <div className="mt-5">
            <article className="min-h-[170px] w-full rounded-xl border border-[#e6ddcf] bg-white p-6 text-center shadow-sm sm:p-10">
              <h2 className="mt-1 font-display text-2xl text-[#273746] sm:text-3xl">ABOUT US</h2>
              <p className="mt-4 w-full text-xs font-semibold uppercase leading-7 tracking-[0.16em] text-[#6e7274] sm:text-sm sm:leading-8">Holy Family Parish is a Catholic community dedicated to serving God and His people through faith, worship, service, and unity. We strive to create a welcoming spiritual home where individuals and families can grow closer to God.</p>
            </article>
          </div>
          <div className="mt-5 grid items-stretch gap-4 sm:grid-cols-2">
            <article className="min-h-[190px] rounded-xl border border-[#e6ddcf] bg-white p-6 text-center shadow-sm sm:p-8">
              <h2 className="mt-1 font-display text-xl text-[#273746] sm:text-2xl">MISSION</h2>
              <p className="mx-auto mt-3 max-w-xl text-xs font-semibold uppercase leading-7 tracking-[0.16em] text-[#6e7274] sm:text-sm sm:leading-8">Our mission is to spread the Gospel of Jesus Christ, strengthen the faith of our community, and serve others with compassion, love, and dedication.</p>
            </article>
            <article className="min-h-[190px] rounded-xl border border-[#e6ddcf] bg-white p-6 text-center shadow-sm sm:p-8">
              <h2 className="mt-1 font-display text-xl text-[#273746] sm:text-2xl">VISION</h2>
              <p className="mx-auto mt-3 max-w-xl text-xs font-semibold uppercase leading-7 tracking-[0.16em] text-[#6e7274] sm:text-sm sm:leading-8">We envision a united Catholic community where every person grows in faith, actively participates in parish life, and serves others with love and compassion.</p>
            </article>
          </div>
          <div className="mt-8 rounded-xl border border-[#e6ddcf] bg-white p-5 shadow-sm sm:p-7"><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b18a45]">Weekly liturgy</p><h2 className="mt-1 font-display text-2xl text-[#273746]">Parish Mass Schedule</h2><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">{schedule.map(([day, time]) => <div key={day} className={`rounded-lg border p-3 ${day === 'Sunday' ? 'border-[#b18a45] bg-[#d7b57a] text-[#273746]' : time === 'Closed' ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-[#e6ddcf] bg-[#faf8f1] text-[#273746]'}`}><p className="text-[9px] font-bold uppercase tracking-wider">{day}</p><p className="mt-2 text-xs font-bold">{time}</p></div>)}</div></div>

          <div className="mt-5 grid items-stretch gap-4 sm:grid-cols-2"><article className="min-h-[150px] rounded-xl border border-[#e6ddcf] bg-white p-5 shadow-sm sm:p-7"><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b18a45]">Parish location</p><h2 className="mt-1 font-display text-xl text-[#273746]">{PARISH_LOCATION.name}</h2><p className="mt-2 text-xs text-[#6e7274]">{PARISH_LOCATION.address}</p><a href="https://www.google.com/maps?q=Holy%20Family%20Parish%20Putiao%20Pilar%20Sorsogon" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-xs font-semibold text-[#a6813f]">Open in Google Maps →</a></article><article className="min-h-[150px] rounded-xl border border-[#e6ddcf] bg-white p-5 shadow-sm sm:p-7"><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b18a45]">Office hours</p><p className="mt-2 text-xs leading-relaxed text-[#6e7274]">Wednesday – Monday<br />8:00 AM – 5:00 PM<br /><span className="text-[#9a9c9d]">Closed Tuesdays</span></p></article></div>
        <div className="mt-4 grid items-stretch gap-3 sm:grid-cols-3">
          {infoCards.map(([title, detail, icon]) => (
            title === 'Parish History' || title === 'Our Leadership' || title === 'Donation' ? (
              <button
                key={title}
                type="button"
                onClick={() => {
                  if (title === 'Parish History') setHistoryOpen(true);
                  if (title === 'Our Leadership') setLeadershipOpen(true);
                  if (title === 'Donation') setDonationOpen(true);
                }}
                className="flex min-h-[150px] h-full w-full flex-col rounded-xl border border-[#e6ddcf] bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#d7b57a] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#b18a45]/40"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d7b57a] text-xs text-[#b18a45]">{icon}</span>
                <h2 className="mt-3 font-display text-base text-[#273746]">{title}</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-[#7a7d7f]">{detail}</p>
              </button>
            ) : (
              <article key={title} className="flex min-h-[150px] h-full flex-col rounded-xl border border-[#e6ddcf] bg-white px-4 py-4 shadow-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d7b57a] text-xs text-[#b18a45]">{icon}</span><h2 className="mt-3 font-display text-base text-[#273746]">{title}</h2><p className="mt-1 text-[11px] leading-relaxed text-[#7a7d7f]">{detail}</p></article>
            )
          ))}
          </div>
        </section>
      </main>
      <Footer />
      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title="Parish History" size="lg" backdropClassName="bg-[#14212b]/55">
        <div className="max-h-[calc(100dvh-10rem)] space-y-8 overflow-y-auto pr-1">
          <article className="space-y-4">
            <img src="/parish.jpg" alt="Holy Family Parish church" className="h-48 w-full rounded-xl object-cover sm:h-64" />
            <div className="space-y-3 text-sm leading-7 text-[#6e7274]">
              <p>Holy Family Parish is a Catholic community rooted in faith, worship, and service. Through the years, the parish has grown alongside the families it serves, offering a welcoming spiritual home for prayer, fellowship, and the celebration of the sacraments.</p>
              <p>Our story continues through the dedication of parishioners, pastoral leaders, and volunteers who work together to strengthen the community and share God&apos;s love with others.</p>
            </div>
          </article>
          <article className="space-y-4 border-t border-[#eee5d6] pt-8">
            <img src="/faith.png" alt="Parish community gathered in faith" className="h-48 w-full rounded-xl object-cover sm:h-64" />
            <div className="space-y-3 text-sm leading-7 text-[#6e7274]">
              <h4 className="font-display text-lg text-[#273746]">A Living Community</h4>
              <p>Beyond the walls of the church, our parish history is carried forward through shared prayer, acts of service, and the people who generously give their time and talents. Each generation adds to this continuing story of faith and community.</p>
            </div>
          </article>
        </div>
      </Modal>
      <Modal isOpen={leadershipOpen} onClose={() => setLeadershipOpen(false)} title="Our Leadership" size="lg" backdropClassName="bg-[#14212b]/55">
        <div className="max-h-[calc(100dvh-10rem)] space-y-3 overflow-y-auto pr-1">
          {leadershipTimeline.map((priest, index) => (
            <div
              key={`${priest.name}-${index}`}
              className="flex items-center gap-4 rounded-2xl border border-[#e6ddcf] bg-[#fffdf9] p-3 shadow-[0_8px_20px_rgba(83,65,34,0.05)] sm:p-4"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#e3d6bf] bg-[#f8f1e3] sm:h-20 sm:w-20">
                <img src={priest.image || '/diocese.png'} alt={priest.name} className="h-10 w-10 object-contain sm:h-12 sm:w-12" />
              </div>

              <div className="min-w-0 flex-1 text-left text-[#273746]">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] sm:text-sm">
                  {priest.name}
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#4d5860] sm:text-sm">{priest.location}</p>
                <p className="mt-1 text-[11px] font-medium text-[#4d5860] sm:text-sm">{priest.tenure}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
      <Modal isOpen={donationOpen} onClose={() => setDonationOpen(false)} title="Support Our Parish" size="md" backdropClassName="bg-[#14212b]/55">
        <div className="space-y-5 text-center">
          <p className="mb-2 text-left text-sm leading-7 text-[#6e7274]">You can send your donations to the church bank accounts listed below.</p>
          <div className="grid gap-3 text-left sm:grid-cols-2">
            <div className="flex min-h-[118px] flex-col justify-start rounded-[12px] bg-[#1a99f3] p-0 text-white shadow-[0_8px_16px_rgba(26,153,243,0.14)]">
              <div className="px-3 pt-2 text-[22px] font-black leading-[0.9] tracking-[-0.06em] text-white mt-2">GCash</div>

              <div className="px-3 pb-2 pt-1">
                <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/75">Account Name</div>
                <div className="text-[14px] font-bold leading-tight text-white">John Joshua Rojo</div>

                <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/75">Account Number</div>
                <div className="text-[14px] font-bold leading-tight tracking-[0.08em] text-white">09673941188</div>
              </div>
            </div>

            <div className="flex min-h-[118px] flex-col justify-start rounded-[12px] bg-[#8fe3a4] p-0 text-slate-900 shadow-[0_8px_16px_rgba(143,227,164,0.14)]">
              <div className="px-3 pt-2 text-[22px] font-black leading-[0.9] tracking-[-0.06em] text-slate-900 mt-2">LandBank</div>

              <div className="px-3 pb-2 pt-1">
                <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-800/75">Account Name</div>
                <div className="text-[14px] font-bold leading-tight text-slate-900">Holy Family Parish</div>

                <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-800/75">Account Number</div>
                <div className="text-[14px] font-bold leading-tight tracking-[0.08em] text-slate-900">09673941188</div>
              </div>
            </div>
          </div>
          <p className="text-xs leading-6 text-[#8a8d8f]">The parish's gratitude is heartfelt because of your support.</p>
        </div>
      </Modal>
    </div>
  );
}
