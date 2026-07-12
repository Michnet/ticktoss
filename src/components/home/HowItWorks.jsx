'use client';

export default function HowItWorks() {
  const steps = [
    {
      icon: '🏷️',
      step: '01',
      title: 'Vendors Post Deals',
      desc: 'Every listing must have an original price, a discounted sale price, and a sale end date. No clock = no listing.',
      color: '#FF4D00',
    },
    {
      icon: '⚡',
      step: '02',
      title: 'Urgency Score Ranks',
      desc: 'Products are ranked live by discount %, time remaining, and stock level. Most urgent floats to the top.',
      color: '#FFB800',
    },
    {
      icon: '🕐',
      step: '03',
      title: 'You Book Before Time\'s Up',
      desc: 'Click Book Now, pick quantity and your delivery address. Stock decrements instantly — first come, first served.',
      color: '#9B6BFF',
    },
    {
      icon: '📞',
      step: '04',
      title: 'Vendor Calls You',
      desc: 'The vendor gets a live notification, calls to confirm, and arranges cash-on-delivery or pickup.',
      color: '#00E87A',
    },
  ];

  return (
    <section className="pb-14">
      <div className="tt-container tt-container-padding">
        <div className="text-center mb-8">
          <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
            How{' '}
            <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
              TickToss
            </span>{' '}
            Works
          </h2>
          <p className="text-[var(--tt-muted)] text-[0.875rem] mt-[0.35rem]">
            Four steps from listing to delivery — all timed by a clock
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 relative">
          {steps.map((s, i) => (
            <div
              key={s.step}
              className="tt-card p-6 relative overflow-hidden"
            >
              {/* Bg number */}
              <div
                className="absolute -right-[5px] -bottom-[10px] font-['Syne',sans-serif] font-black text-[4.5rem] leading-none pointer-events-none select-none"
                style={{ color: `${s.color}10` }}
              >
                {s.step}
              </div>

              {/* Accent line */}
              <div
                className="w-[32px] h-[3px] rounded-full mb-4"
                style={{ background: s.color }}
              />

              <div className="text-[2rem] mb-3">{s.icon}</div>

              <h3 className="font-['Syne',sans-serif] font-bold text-[0.95rem] mb-2 text-[var(--tt-text)]">
                {s.title}
              </h3>
              <p className="text-[0.82rem] text-[var(--tt-muted)] leading-[1.55]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
