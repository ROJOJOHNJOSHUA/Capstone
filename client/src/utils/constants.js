export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const SERVICE_TYPES = [
  'Marriage',
  'Funeral',
  'Baptism',
  'Mass Intention',
  'Private Mass',
];

export const SERVICE_COLORS = {
  Baptism: '#b18a45',
  Marriage: '#d7b57a',
  Funeral: '#71835d',
  'Mass Intention': '#c97d70',
  'Private Mass': '#40566b',
  Appointments: '#8b6b3e',
  Appointment: '#8b6b3e',
};

// Admin can replace image URLs below to customize landing page service cards.
export const SERVICE_CARDS = [
  {
    name: 'Marriage',
    image: '/Marriage.png',
    description: 'Celebrate a sacramental union in a solemn and prayerful parish setting.',
  },
  {
    name: 'Funeral',
    image: '/Funeral.png',
    description: 'Book a respectful liturgical service for final commendation and prayer.',
  },
  {
    name: 'Baptism',
    image: '/Baptism.png',
    description: 'Welcome children into the faith through scheduled parish baptism rites.',
  },
  {
    name: 'Mass Intention',
    image: '/MassIntention.png',
    description: 'Offer prayer intentions during Mass for thanksgiving or special petitions.',
  },
  {
    name: 'Private Mass',
    image: '/PrivateMass.png',
    description: 'Request a private Mass for family milestones and meaningful occasions.',
  },
];

// Admin can replace image URLs below to customize landing page core feature cards.
export const CORE_FEATURE_CARDS = [
  {
    name: 'Register & Login',
    image:
      'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80',
    description: 'Secure account access for parishioners and staff with streamlined authentication.',
  },
  {
    name: 'Reservations',
    image:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
    description: 'Reserve parish services online using schedule-aware and availability-based booking.',
  },
  {
    name: 'Appointments',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    description: 'Coordinate office visits and pastoral meetings with organized time management.',
  },
  {
    name: 'Centralized Records',
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    description: 'Maintain a reliable and searchable digital archive for sacramental records.',
  },
];

export const SERVICE_LABELS = {
  Marriage: 'Wedding',
  Funeral: 'Funeral',
  Baptism: 'Baptism',
  'Mass Intention': 'Mass Intention',
  'Private Mass': 'Private Mass',
};

/** Holy Family Parish — single venue availability for parishioner reservations */
export const SERVICE_SCHEDULE = {
  Baptism: 'Wednesday and Saturday only — 10:00 AM only',
  Marriage: 'Except Tuesday and Sunday — 9:00 AM and 2:00 PM only',
  Funeral: 'Except Tuesday and Sunday — 9:00 AM and 2:00 PM only',
  'Private Mass': 'Monday and Wednesday-Saturday, 8:00 AM-12:00 PM or 1:00 PM-4:00 PM',
  'Mass Intention':
    'Monday 6:00 AM; Tuesday closed; Wednesday 6:00 AM; Thursday 6:00 AM; Friday 6:00 AM; Saturday 6:00 AM; Sunday 6:00 AM and 8:00 AM',
};

export const SERVICE_REQUIREMENTS = {
  Marriage: 'Marriage License, CENOMAR, Baptismal Certificate, Confirmation Certificate, Marriage Certificate of Sponsor, Pre-Cana Seminar Certificate',
  Funeral: 'Death Certificate, Burial Permit, Endorsement Form, and any cemetery/niche form required by the service choice',
  Baptism: 'Birth Certificate, Baptismal Certificate of Sponsor, and Permit of Home Church (optional only if not a resident of Putiao, Pilar)',
  'Mass Intention': 'Payment receipt / proof of payment',
  'Private Mass': 'Valid ID and service purpose / location details',
  Appointments: 'Bring your concern or request, and a valid ID if needed',
};

export const STATUSES = ['Pending', 'Under Review', 'Approved', 'Paid', 'Rejected', 'Completed', 'Cancelled'];
export const APPOINTMENT_STATUSES = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Completed', 'Cancelled'];

export const PARISH_LOCATION = {
  name: 'Holy Family Parish',
  address: 'Putiao, Pilar, Sorsogon, Philippines',
};

export const STATUS_BADGE = {
  Pending: 'badge-pending',
  'Under Review': 'badge-pending',
  Approved: 'badge-approved',
  Paid: 'badge-approved',
  Rejected: 'badge-rejected',
  Completed: 'badge-completed',
  Cancelled: 'badge-rejected',
};
