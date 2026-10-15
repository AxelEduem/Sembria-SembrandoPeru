function CumpleanosStyles() {
  return (
    <style>{`
      @keyframes cumpleanos-card-enter {
        from { opacity: 0; transform: translateY(14px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes birthday-flame {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-2px) scale(1.08); }
      }

      @keyframes birthday-cake-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }

      @keyframes birthday-celebration {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-4px) rotate(-1deg); }
        75% { transform: translateY(-4px) rotate(1deg); }
      }

      @keyframes birthday-confetti {
        0% { opacity: 0; transform: translateY(8px) scale(0.7) rotate(0deg); }
        40% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-22px) scale(1.1) rotate(80deg); }
      }

      .birthday-flame { animation: birthday-flame 1.1s ease-in-out infinite; transform-origin: center bottom; }
      .birthday-cake { animation: birthday-cake-float 4s ease-in-out infinite; }
      .birthday-cake-celebration { animation: birthday-celebration 2.5s ease-in-out infinite; }
      .birthday-confetti { animation: birthday-confetti 1.8s ease-out infinite; }
      .birthday-confetti-delay { animation-delay: 0.4s; }
      .birthday-confetti-delay-2 { animation-delay: 0.8s; }

      @media print {
        @page {
          size: A4 landscape;
          margin: 6mm;
        }

        html,
        body {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Al imprimir, el calendario se clona dentro de un portal
           (#cumpleanos-print-portal) que se inserta como hijo directo
           de <body>. Ocultamos TODOS los demás hijos directos de body
           (topbar, sidebar, perfil, el resto de la app) sin importar
           su estructura interna, y centramos el portal con flexbox,
           que es fiable tanto horizontal como verticalmente. */
        body.cumpleanos-printing > *:not(#cumpleanos-print-portal) {
          display: none !important;
        }

        #cumpleanos-print-portal {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .cumpleanos-print-area {
          display: block !important;
          width: calc(100% - 8mm) !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #fff !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .cumpleanos-print-hidden,
        .cumpleanos-screen-calendar-header {
          display: none !important;
        }

        .cumpleanos-print-header {
          display: grid !important;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          width: 100% !important;
          height: 27mm !important;
          min-height: 27mm !important;
          max-height: 27mm !important;
          padding: 2.5mm 7mm !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          border-bottom: 1.2px solid #e11d48 !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .cumpleanos-print-logo-wrap {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          width: 100% !important;
          height: 100% !important;
        }

        .cumpleanos-print-logo-system-wrap {
          justify-content: flex-end !important;
        }

        .cumpleanos-print-logo {
          display: block !important;
          width: auto !important;
          height: 17mm !important;
          max-width: 50mm !important;
          object-fit: contain !important;
        }

        .cumpleanos-print-logo-system {
          height: 16mm !important;
          max-width: 45mm !important;
        }

        .cumpleanos-print-heading {
          display: block !important;
          text-align: center !important;
          white-space: nowrap !important;
        }

        .cumpleanos-print-kicker {
          display: block !important;
          margin: 0 0 1mm !important;
          padding: 0 !important;
          font-size: 7pt !important;
          line-height: 1 !important;
          font-weight: 700 !important;
          letter-spacing: 0.12em !important;
          text-transform: uppercase !important;
          color: #64748b !important;
        }

        .cumpleanos-print-heading h1 {
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 15pt !important;
          line-height: 1.1 !important;
          font-weight: 800 !important;
          color: #0f172a !important;
        }

        .cumpleanos-print-month {
          display: block !important;
          margin: 1mm 0 0 !important;
          padding: 0 !important;
          font-size: 9pt !important;
          line-height: 1 !important;
          font-weight: 700 !important;
          color: #e11d48 !important;
          text-transform: uppercase !important;
        }

        .cumpleanos-calendar-weekdays {
          display: grid !important;
          grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          width: 100% !important;
          height: 7mm !important;
          min-height: 7mm !important;
          max-height: 7mm !important;
          margin: 0 !important;
          padding: 0 !important;
          border-bottom: 1px solid #cbd5e1 !important;
          box-sizing: border-box !important;
        }

        .cumpleanos-calendar-weekdays > div {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          height: 7mm !important;
          min-height: 7mm !important;
          max-height: 7mm !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          border-right: 1px solid #e2e8f0 !important;
          font-size: 6.5pt !important;
          line-height: 1 !important;
          font-weight: 800 !important;
          color: #475569 !important;
          background: #f8fafc !important;
        }

        .cumpleanos-calendar-weekdays > div:last-child {
          border-right: 0 !important;
        }

        .cumpleanos-calendar-weeks {
          display: block !important;
          width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }

        .cumpleanos-calendar-week {
          display: grid !important;
          grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          width: 100% !important;
          height: 25mm !important;
          min-height: 25mm !important;
          max-height: 25mm !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }

        .cumpleanos-calendar-day {
          display: block !important;
          width: 100% !important;
          height: 25mm !important;
          min-height: 25mm !important;
          max-height: 25mm !important;
          margin: 0 !important;
          padding: 1.3mm !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          border-right: 1px solid #e2e8f0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background: #fff !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .cumpleanos-calendar-week .cumpleanos-calendar-day:last-child {
          border-right: 0 !important;
        }

        .cumpleanos-calendar-day > div:first-child {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          width: 100% !important;
          height: 5mm !important;
          min-height: 5mm !important;
          max-height: 5mm !important;
          margin: 0 0 0.8mm !important;
          padding: 0 !important;
          box-sizing: border-box !important;
        }

        .cumpleanos-day-number {
          display: flex !important;
          visibility: visible !important;
          align-items: center !important;
          justify-content: center !important;
          width: 5mm !important;
          height: 5mm !important;
          min-width: 5mm !important;
          max-width: 5mm !important;
          font-size: 7pt !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          opacity: 1 !important;
          position: relative !important;
          z-index: 1 !important;
          color: #0f172a !important;
          background: transparent !important;
        }

        /* El círculo rosado de "hoy" conserva su fondo y texto blanco */
        .cumpleanos-day-number.cumpleanos-day-number-today {
          color: #ffffff !important;
          background: #e11d48 !important;
        }

        /* Ocultar el contador de cumpleaños por día */
        .cumpleanos-day-count {
          display: none !important;
        }

        .cumpleanos-day-birthdays {
          display: flex !important;
          flex-direction: column !important;
          gap: 0.6mm !important;
          width: 100% !important;
          max-height: 17.5mm !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }

        .cumpleanos-calendar-item {
          display: flex !important;
          align-items: flex-start !important;
          width: 100% !important;
          min-height: 4mm !important;
          max-height: 7.5mm !important;
          margin: 0 !important;
          padding: 0.7mm 1mm !important;
          box-sizing: border-box !important;
          border-radius: 1mm !important;
          font-size: 5.8pt !important;
          line-height: 1.12 !important;
          color: #be123c !important;
          background: #fff1f2 !important;
          overflow: hidden !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        /* Ocultar el ícono de pastel en los items del calendario */
        .cumpleanos-calendar-item svg {
          display: none !important;
        }

        .cumpleanos-print-name {
          display: -webkit-box !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          white-space: normal !important;
          text-overflow: clip !important;
          overflow-wrap: anywhere !important;
          word-break: normal !important;
          -webkit-box-orient: vertical !important;
          -webkit-line-clamp: 2 !important;
          line-clamp: 2 !important;
          line-height: 1.12 !important;
        }

        .birthday-cake,
        .birthday-flame,
        .birthday-cake-celebration,
        .birthday-confetti {
          animation: none !important;
        }
      }
    `}</style>
  );
}

export default CumpleanosStyles;
