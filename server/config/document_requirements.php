<?php

/**
 * Document Requirements Configuration
 * 
 * Single source of truth for document requirements per reservation service type.
 * Future changes to document requirements should only require editing this file.
 * 
 * Structure:
 * - Service Type (key) => Array of required documents
 * - Each document has:
 *   - name: Human-readable display name
 *   - required: Boolean (true = mandatory, false = optional)
 *   - type: Unique identifier for database storage
 */

return [
    'Baptism' => [
        [
            'name' => 'Baptismal Certificate',
            'required' => true,
            'type' => 'baptismal_certificate',
        ],
        [
            'name' => 'Baptismal Certificate of Sponsor',
            'required' => true,
            'type' => 'sponsor_baptismal_certificate',
        ],
        [
            'name' => 'Birth Certificate',
            'required' => true,
            'type' => 'birth_certificate',
        ],
        [
            'name' => 'Permit of Home Church (Optional only if you are not a resident of Putiao, Pilar)',
            'required' => false,
            'type' => 'home_church_permit',
        ],
    ],

    'Marriage' => [
        [
            'name' => 'Marriage License',
            'required' => true,
            'type' => 'marriage_license',
        ],
        [
            'name' => 'CENOMAR',
            'required' => true,
            'type' => 'cenomar',
        ],
        [
            'name' => 'Baptismal Certificate',
            'required' => true,
            'type' => 'baptismal_certificate',
        ],
        [
            'name' => 'Confirmation Certificate',
            'required' => true,
            'type' => 'confirmation_certificate',
        ],
        [
            'name' => 'Marriage Certificate of Sponsor',
            'required' => true,
            'type' => 'marriage_certificate_of_sponsor',
        ],
        [
            'name' => 'Pre-Cana Seminar Certificate',
            'required' => true,
            'type' => 'pre_cana_certificate',
        ],
    ],

    'Funeral' => [
        [
            'name' => 'Death Certificate',
            'required' => true,
            'type' => 'death_certificate',
        ],
        [
            'name' => 'Burial Permit',
            'required' => true,
            'type' => 'funeral_permit',
        ],
        [
            'name' => 'Endorsement Form',
            'required' => true,
            'type' => 'endorsement_form',
        ],
        [
            'name' => 'Authority / Niche Form',
            'required' => false,
            'type' => 'authority_niche_form',
        ],
    ],

    'Mass Intention' => [
        [
            'name' => 'Payment Receipt / Proof of Payment',
            'required' => true,
            'type' => 'payment_receipt',
        ],
    ],

    'Private Mass' => [
        [
            'name' => 'Valid ID',
            'required' => true,
            'type' => 'valid_id',
        ],
    ],
];
