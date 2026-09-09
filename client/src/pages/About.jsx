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
        <div className="grid max-h-[calc(100dvh-10rem)] gap-6 overflow-y-auto pr-1 md:grid-cols-2 md:items-center">
          <div>
            <img src="/faith.png" alt="Holy Family Parish altar and pastoral ministry" className="h-64 w-full rounded-xl object-cover md:h-full md:min-h-[22rem]" />
          </div>
          <div className="space-y-4 text-sm leading-7 text-[#6e7274]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b18a45]">Pastoral leadership</p>
            <h4 className="font-display text-2xl text-[#273746]">Serving with faith and care</h4>
            <p>Our parish priest and pastoral leaders guide Holy Family Parish through prayer, worship, and compassionate service. They accompany families through important moments of faith and help nurture a welcoming community.</p>
            <p>Working together with parish ministries and volunteers, our leaders support the spiritual growth of every parishioner and keep the parish focused on faith, service, and community.</p>
          </div>
        </div>
      </Modal>
      <Modal isOpen={donationOpen} onClose={() => setDonationOpen(false)} title="Support Our Parish" size="md" backdropClassName="bg-[#14212b]/55">
        <div className="space-y-5 text-center">
          <p className="mb-2 text-left text-sm leading-7 text-[#6e7274]">You can send your donations to the church bank accounts listed below.</p>
          <div className="grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-xl border border-[#e6ddcf] bg-[#faf8f1] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b18a45]">BPI</p>
              <p className="mt-2 text-lg font-semibold tracking-wide text-[#273746]">09673941188<br></br><span className='text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b18a45]'>holy family parish</span> </p>
            </div>
            <div className="rounded-xl border border-[#e6ddcf] bg-[#faf8f1] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b18a45]">GCash</p>
              <p className="mt-2 text-lg font-semibold tracking-wide text-[#273746]">09673941188<br></br><span className='text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b18a45]'>John Joshua Rojo</span> </p>
            </div>
          </div>
          <p className="text-xs leading-6 text-[#8a8d8f]">The parish's gratitude is heartfelt because of your support.</p>
        </div>
      </Modal>
    </div>
  );
}
