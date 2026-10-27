const base = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true
};

export const BurgerIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M4 11a8 6 0 0 1 16 0z" />
        <path d="M3 14.5h18" />
        <path d="M4 18h16" />
    </svg>
);

export const CartIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" />
        <circle cx="9" cy="19" r="1.2" />
        <circle cx="17" cy="19" r="1.2" />
    </svg>
);

export const ImageIcon = (props) => (
    <svg {...base} {...props}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m21 16-5-5-9 9" />
    </svg>
);

export const ClockIcon = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
    </svg>
);

export const FlameIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 1.6 1 2.6 2 3 .5-2.5.5-5.5.5-8z" />
    </svg>
);

export const CardIcon = (props) => (
    <svg {...base} {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h4" />
    </svg>
);

export const UserIcon = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
);

export const PinIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
        <circle cx="12" cy="9" r="2.5" />
    </svg>
);
