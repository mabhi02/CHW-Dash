/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
      './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          tremor: {
            brand: {
              faint: '#0B1229',
              muted: '#172554',
              subtle: '#1e40af',
              DEFAULT: '#3b82f6',
              emphasis: '#60a5fa',
              inverted: '#ffffff',
            },
            background: {
              muted: '#131A2B',
              subtle: '#1f2937',
              DEFAULT: '#111827',
              emphasis: '#374151',
            },
            border: {
              DEFAULT: '#1f2937',
            },
            ring: {
              DEFAULT: '#1f2937',
            },
            content: {
              subtle: '#4b5563',
              DEFAULT: '#6b7280',
              emphasis: '#e5e7eb',
              strong: '#f9fafb',
              inverted: '#000000',
            },
          },
        },
        boxShadow: {
          'tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          'tremor-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          'tremor-dropdown': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
        borderRadius: {
          'tremor-small': '0.375rem',
          'tremor-default': '0.5rem',
          'tremor-full': '9999px',
        },
        fontSize: {
          'tremor-label': '0.75rem',
          'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
          'tremor-title': ['1.125rem', { lineHeight: '1.75rem' }],
          'tremor-metric': ['1.875rem', { lineHeight: '2.25rem' }],
        },
      },
    },
    safelist: [
      {
        pattern:
          /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
        variants: ['hover', 'ui-selected'],
      },
      {
        pattern:
          /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
        variants: ['hover', 'ui-selected'],
      },
      {
        pattern:
          /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
        variants: ['hover', 'ui-selected'],
      },
      {
        pattern:
          /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      },
      {
        pattern:
          /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      },
      {
        pattern:
          /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      },
    ],
    plugins: [],
  };