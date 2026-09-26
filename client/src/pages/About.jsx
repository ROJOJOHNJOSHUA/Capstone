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

const organizationImages = {
  priest: '/diocese.png',
  ppc: ['/person.png', '/person.png'],
  secretary: ['/person.png', '/person.png'],
  parish: ['/person.png', '/person.png', '/person.png', '/person.png', '/person.png', '/person.png', '/person.png', '/person.png', '/person.png', '/person.png'],
  pfc: ['/person.png', '/person.png', '/person.png', '/person.png', '/person.png', '/person.png', '/person.png'],
};

const withOrganizationProfiles = (members, images) => members.map((member, index) => ({
  name: member.name,
  image: images[index],
}));

const organizationMembers = {
  priest: { name: 'REV. FR. ARNEL D. AYO', image: organizationImages.priest, position: 'Priest' },
  ppc: [
    { name: 'Jaime Marchan', image: organizationImages.ppc[0], position: 'Vice Chairman' },
    { name: 'Jaice Marbida', image: organizationImages.ppc[1], position: 'Secretary' },
  ],
  secretary: [
    { name: 'Desiree Lindio', image: organizationImages.secretary[0] },
    { name: 'Emalyn Guamos', image: organizationImages.secretary[1] },
  ],
  parish: [
    { name: 'Mr & Mrs. Ric Pedrosa', image: organizationImages.parish[0], position: 'Family & Human Life' },
    { name: 'Divinia Maquiñana', image: organizationImages.parish[1], position: 'Laity' },
    { name: 'Aira Valladolid', image: organizationImages.parish[2], position: 'Youth' },
    { name: 'Virgie Casulla', image: organizationImages.parish[3], position: 'Worship' },
    { name: 'Ning Rubis', image: organizationImages.parish[4], position: 'Worship' },
    { name: 'Nancy Coterte', image: organizationImages.parish[5], position: 'Education' },
    { name: 'Bernie Obcigan', image: organizationImages.parish[6], position: 'Service' },
    { name: 'Juan Lubinno Jr.', image: organizationImages.parish[7], position: 'Temporality' },
    { name: 'Lovely Martin Junelyn', image: organizationImages.parish[8], position: 'Media For Evangelizaton' },
     ],
  pfc: [
    { name: 'Joy Azul', image: organizationImages.pfc[0], position: 'Chairman' },
    { name: 'Meena Endaya', image: organizationImages.pfc[1], position: 'Secretary' },
    { name: 'Julieta Mansanes', image: organizationImages.pfc[2], position: 'Treasurer' },
    { name: 'Ma. Angela Pesebre', image: organizationImages.pfc[3], position: 'Auditor' },
    { name: 'Anthony Fortuno', image: organizationImages.pfc[4], position: 'Member' },
    { name: 'Noeme Ibo', image: organizationImages.pfc[5], position: 'Member' },
    { name: 'Yuette Barrameda', image: organizationImages.pfc[6], position: 'Member' },
  ],
};

function OrganizationProfile({ member, position, emphasis = false, compact = false }) {
  return (
    <article className={`relative z-10 flex h-[104px] w-[88px] shrink-0 flex-col items-center overflow-hidden rounded-lg border bg-white p-1.5 text-center shadow-[0_4px_12px_rgba(83,65,34,0.07)] ${emphasis ? 'border-[#d7b57a]' : 'border-[#e6ddcf]'}`}>
      <img src={member.image || '/diocese.png'} alt={member.name} className="h-12 w-12 shrink-0 rounded-md object-contain" />
      <p className="mt-1 h-8 line-clamp-4 text-[7px] font-bold uppercase leading-tight tracking-[0.03em] text-[#273746]">{member.name}</p>
      <p className="mt-auto pt-1.5 text-[7px] font-semibold uppercase leading-tight tracking-[0.06em] text-[#b18a45]">{position}</p>
    </article>
  );
}

function OrganizationGroup({ members, position, columns = 2, connected = false }) {
  const topConnected = connected === 'top';

  return (
    <div className={`relative grid gap-1 ${columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-4' : columns === 5 ? 'grid-cols-5' : 'grid-cols-3'}`}>
      {connected && <div className={`absolute z-0 h-px bg-[#d7b57a] ${columns === 5 ? 'left-11 right-11' : 'left-12 right-12'} ${topConnected ? 'top-0' : 'top-1/2'}`} aria-hidden="true" />}
      {members.map((member) => (
        <div key={member.name} className={topConnected ? 'relative pt-2' : ''}>
          {topConnected && <span className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-[#d7b57a]" aria-hidden="true" />}
          <OrganizationProfile member={member} position={member.position || position} compact={columns === 5} />
        </div>
      ))}
    </div>
  );
}

function ParishRows() {
  const firstRow = organizationMembers.parish.slice(0, 5);
  const secondRow = organizationMembers.parish.slice(5, 10);

  return (
    <div className="relative z-10 mt-8 bg-white px-2 text-center">
      <OrganizationGroup members={firstRow} position="Parish Member" columns={5} connected="top" />
      <div className="grid h-5 grid-cols-5 gap-1" aria-hidden="true">
        {firstRow.map((member, index) => (
          <span key={member.name}  />
        ))}
      </div>
      <div className="flex justify-center">
        <OrganizationGroup members={secondRow} position="Parish Member" columns={4} connected="top" />
      </div>
    </div>
  );
}

function FinanceCouncilMembers() {
  const firstMembers = organizationMembers.pfc.slice(0, 4);
  const finalMembers = organizationMembers.pfc.slice(4, 7);

  return (
    <div className="flex flex-col items-center">
      {firstMembers.map((member, index) => (
        <div key={member.name} className="flex flex-col items-center">
          <OrganizationProfile member={member} position={member.position} />
          {index < firstMembers.length - 1 && <span className="h-4 w-px bg-[#d7b57a]" aria-hidden="true" />}
        </div>
      ))}
      <span className="h-4 w-px bg-[#d7b57a]" aria-hidden="true" />
      <OrganizationGroup members={finalMembers} position="PFC Member" columns={3} connected="top" />
    </div>
  );
}

function OrganizationTree() {
  return (
    <div className="-mt-12 overflow-x-auto pb-3">
      <div className="mx-auto min-w-[1000px] px-4">
        <div className="flex flex-col items-center">
          <OrganizationProfile member={organizationMembers.priest} position={organizationMembers.priest.position} emphasis />
          <div className="h-4 w-px bg-[#d7b57a]" aria-hidden="true" />
          <div className="relative grid w-full grid-cols-[minmax(240px,1fr)_460px_minmax(300px,1fr)] gap-4 pt-4">
            <div className="absolute left-[14%] right-[14%] top-0 h-px bg-[#d7b57a]" aria-hidden="true" />

            <div className="relative flex w-full justify-center">
              <div className="absolute left-1/2 -top-4 h-[68px] w-px -translate-x-1/2 bg-[#d7b57a]" aria-hidden="true" />
              <p className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap bg-white px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#b18a45]">Parish Pastoral Council</p>
              <div className="w-fit pt-4 text-center">
                  <div className="mx-auto flex w-fit flex-col items-center">
                    <OrganizationProfile member={organizationMembers.ppc[0]} position={organizationMembers.ppc[0].position} />
                    <span className="h-4 w-px bg-[#d7b57a]" aria-hidden="true" />
                    <OrganizationProfile member={organizationMembers.ppc[1]} position={organizationMembers.ppc[1].position} />
                  </div>
              </div>
            </div>

            <div className="relative flex flex-col items-center">
              <div className="absolute bottom-[104px] left-1/2 -top-4 w-px -translate-x-1/2 bg-[#d7b57a]" aria-hidden="true" />
              <div className="relative z-10 w-full pl-[50%] pt-4">
                <div className="relative ml-3 flex items-center gap-2">
                  <div className="absolute right-full top-1/2 h-px w-3 bg-[#d7b57a]" aria-hidden="true" />
                  <div className="flex flex-col items-center">
                    <OrganizationProfile member={organizationMembers.secretary[0]} position="Secretary" />
                    <span className="h-4 w-px bg-[#d7b57a]" aria-hidden="true" />
                    <OrganizationProfile member={organizationMembers.secretary[1]} position="Secretary" />
                  </div>
                </div>
              </div>
              <ParishRows />
            </div>

            <div className="relative flex w-full justify-center">
              <div className="absolute left-1/2 -top-4 h-[68px] w-px -translate-x-1/2 bg-[#d7b57a]" aria-hidden="true" />
              <p className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap bg-white px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#b18a45]">Parish Finance Council</p>
              <div className="pt-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <FinanceCouncilMembers />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [leadershipOpen, setLeadershipOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf8f1] text-[#4e555a]">
      <Navbar />
      <main>
        <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 md:py-3 lg:px-8">
          <div className="mt-3">
            <article className="min-h-[170px] w-full rounded-xl border border-[#e6ddcf] bg-white p-6 text-center shadow-sm sm:p-10">
              <section className="mt-8 pt-7" aria-labelledby="organization-title">
                 <OrganizationTree />
              </section>
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
        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto bg-[#fbf8ef] px-4 py-5 text-[#4c4a42] sm:px-8 sm:py-7">
          <header className="border-b border-[#d9c8a7] pb-4 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#a17a35]">Holy Family Parish History</p>
            <h3 className="mt-1 font-display text-2xl text-[#273746]">Putiao, Pilar, Sorsogon</h3>
          </header>
          <article className="mt-6 flow-root text-sm leading-7 text-[#6e7274]">
            <img src="/History.png" alt="Holy Family Parish history illustration" className="mx-auto mb-5 h-auto max-h-[28rem] w-full rounded-sm border border-[#dfd2b9] bg-[#f3eddf] object-contain p-2 shadow-[0_8px_20px_rgba(83,65,34,0.08)] md:float-left md:mr-6 md:w-[38%]" />
            <div className="space-y-3">
              <p className="indent-5">Somewhere between the provinces of Sorsogon and Albay lies a thick forest. A small number of inhabitants built their homes along the river bank where a number of wild monkeys, pigs and birds of all kinds were found, crocodiles, and fishes dwelt on a deep and wide river. The river was the gateway to the barrio deck yard also known as "DURUNGAN" which was frequented by merchants on board of the "PARAWS" or big sailboats.
</p>
              <p className="indent-5">Merchants from Daraga and Albay, and as far as Visayan provinces came over to barter their fine buri mats, sugar products, porcelain jars, and other commodities including dried fish and abaca products such as sinamay and slippers. Durúngan three big prominent buildings owned by Spanish mestizo while a few scattered houses of inhabitants made of nipa and wood were built far apart because of its hilly terrain. The inhabitants has a place of worship, an "ERMITA" where they gathered together to worship. A priest from the town proper of Pilar came over to celebrate masses and other church rites However, it has been a struggle for priests to come due to inaccessibility, hence, it took them several hours before they could reach the place.
</p>
              <p className="indent-5">As the population grew, people of Durungan decided to have a patron saint so they could celebrate their fiesta and they chose Sto. Cristo de Burgos, They ordered the sculptured image in Daraga. The image was welcomed by the inhabitants with a band bamboo "BANDA of instruments called MANAGUETE", While the band was playing and the people were leaping from one big stone to another crossing a brook, a big bird kept hovering over their heads and chirping "Tiao... Tiao". A mestizo then shouted, "Let's call this place "PUTIAO". Thus, Putiao came to be and from then Sto. Cristo de Burgos became its patron saint whose feast day was celebrated every May 31.
</p>
              <p className="indent-5">As the population grew in number, they began clamoring for a priest to stay permanently in Putiao. Such clamor was brought about by the difficulty of availing the services of the priest from the town proper of Pilar due to the distance especially in cases when one died, the surviving family had to take the corpse to Pilar for burial.

</p>
              <p className="indent-5">Such clamor was intensified when the wife of Don Paulino Marifosque died in 1912. The people joining the funeral boarded a "BANQUERNA" brought the cadaver to Pilar where it took them more than three days to reach the Poblacion. To their utmost disappointment, the priest was not available as he was celebrating mass in a barrio fiesta so they waited until the following day for the burial.
</p>
<p className="indent-5">This very incident incited the prominent people of Putiao to clamor for a priest of their own. The following year in 1913, they formed a "COMITE DE DIEZ" that made representation with the then Bishop of Nueva Caceres in Naga. The COMITE was composed of the following:

</p><br></br>
<div className="mx-auto max-w-lg space-y-1 text-left">
  <p className="grid grid-cols-[8rem_2rem_1fr]"><span>Presidente</span><span className="text-center">:</span><span className="ml-9">Don Paulino Marifosque</span></p>
  <p className="grid grid-cols-[8rem_2rem_1fr]"><span>Vice President</span><span className="text-center">:</span><span className="ml-9">Juan Alcazar</span></p>
  <p className="grid grid-cols-[8rem_2rem_1fr]"><span>Secretario</span><span className="text-center">:</span><span className="ml-9">Silvino Mercader</span></p>
  <p className="grid grid-cols-[8rem_2rem_1fr]"><span>Tesorero</span><span className="text-center">:</span><span className="ml-9">Maximo Lleno</span></p>
</div><br></br>
<div className="ml-auto max-w-lg pt-3t ml-10">
  <p className="mb-2">Consejales :</p>
  <p>Doña Catalina Fuentabella de Lumbes</p>
  <p>Miguel dela Torre</p>
  <p>Ruperto Alcazar</p>
  <p>Juan Perete</p>
  <p>David Marifosque</p>
  <p>Brigido Lleva</p>
</div><br></br>
<p className="indent-5">The audience with the Bishop was fruitful. The "Comite" was then required to produce parcels of land for the church building and a separate site for the cemetery. After three years, their dream came into reality through the generosity of some families. Mr. and Mrs. Eusebio Solomon donated the land where the existing church was built; Mrs. Eugenia Marchan donated the land which was used as the cemetery, and a certain Manalo donated the three hectares land planted with coconuts and rubber trees for the Parish's sustenance.
</p>
<p className="indent-5">On May 14, 1916, the parish of Putiao with Sto. Cristo de Burgos as patron saint, was organized by Rev. Fr. Simplicio Dino of Bulusan, Sorsogon, the first parish priest assigned. The parish jurisdictional territory covered as far as Anislag, Mayon and Villahermosa of Daraga, Albay; Cumadead, and Sogoy of Castilla; San Jose and Abucay of Pilar, Sorsogon. The church was then built with light materials.</p>
<p className="indent-5">After four years, Fr. Dino was succeeded by Rev. Fr. Mariano Calinog, who led the construction of the existing structure of the church with the support of the parishioners.

</p>
<p className="indent-5">An influential lady member of the "Comite de Diez", Dońa Catalina Fuentabella de Lumbes convinced the parishioners to change the patron saint from Sto Cristo de Burgos to HOLY FAMILY without any objection from the parishioners.

</p>
<p className="indent-5">It may be said that Putiao is full of people whose meticulous concern is for the upliftment of the parish. Noting the old cemetery was already congested, the family of the late Ex- Mayor & Mrs. Simeon de Hitta donated a new site to be used as cemetery.

</p>
<p className="indent-5">Today, the Parish is on its one hundred years celebrating its fruitful past and continuously moving forward in finding themselves in God and strengthening their faith. The communion of communities serve as its inspiration.

</p>
<p>Data furnished by : 
</p>
<p><b>
Mrs. Paz M. Antivola to Miss Celenia M. Inzon </b></p>
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
