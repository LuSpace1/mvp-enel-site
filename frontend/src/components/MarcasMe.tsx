interface MarcaMeProps {
  id: string
  size?: number
  className?: string
}

/**
 * Set de marcas propio para las herramientas ME. Parte de una geometría común
 * (trazo redondeado de 1.4) y un acento rosa que conecta con el corazón del
 * logo de ME Office. No hay logos oficiales disponibles en el proyecto.
 */
export function MarcaMe({ id, size = 36, className }: MarcaMeProps) {
  const base = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }

  switch (id) {
    case 'portal-me':
      return (
        <svg {...base}>
          <path d="M6.5 20V10a5.5 5.5 0 0 1 11 0v10" />
          <path d="M4.5 20h15" />
          <circle
            cx="14.5"
            cy="14"
            r="1.1"
            fill="currentColor"
            stroke="none"
            className="text-enel-pink"
          />
        </svg>
      )
    case 'tell-me':
      return (
        <svg {...base}>
          <path d="M20 12.4a7.4 7.4 0 0 1-7.4 7.4H9.2L5 22v-3.3A7.4 7.4 0 0 1 12.6 5 7.4 7.4 0 0 1 20 12.4Z" />
          <path
            d="M12.5 15.2c-1.9-1.15-3-2.35-3-3.55a1.85 1.85 0 0 1 3-1.25 1.85 1.85 0 0 1 3 1.25c0 1.2-1.1 2.4-3 3.55Z"
            stroke="currentColor"
            className="text-enel-pink"
          />
        </svg>
      )
    case 'me-learning':
      return (
        <svg {...base}>
          <path d="M12 6.75C10.1 5.3 7.9 4.5 5.5 4.5v14c2.4 0 4.6.8 6.5 2.25 1.9-1.45 4.1-2.25 6.5-2.25v-14c-2.4 0-4.6.8-6.5 2.25Z" />
          <path d="M12 6.75v14" />
          <path
            d="M15.5 6.2v6l1.75-1.4L19 12.2v-6"
            stroke="currentColor"
            className="text-enel-pink"
          />
        </svg>
      )
    case 'me-office':
      return (
        <svg {...base}>
          <rect x="4" y="4" width="7" height="7" rx="2" />
          <rect x="13" y="4" width="7" height="7" rx="2" />
          <rect x="4" y="13" width="16" height="7" rx="2" />
          <circle
            cx="8"
            cy="7.5"
            r="1.1"
            fill="currentColor"
            stroke="none"
            className="text-enel-pink"
          />
        </svg>
      )
    case 'next-move':
      return (
        <svg {...base}>
          <path d="M5 19 19 5" />
          <path d="M12 5h7v7" />
          <circle
            cx="5"
            cy="19"
            r="1.25"
            fill="currentColor"
            stroke="none"
            className="text-enel-pink"
          />
        </svg>
      )
    default:
      return (
        <svg {...base}>
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <path d="M8 12h8" />
        </svg>
      )
  }
}
