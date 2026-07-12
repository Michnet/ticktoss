export default function DualColorHeading({ title, subTitle, description }) {
  return (
    <div>
      <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
        {title}{' '}
        {subTitle && <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
          {subTitle}
        </span>}
      </h2>
      {description && <p className="text-[var(--tt-muted)] line-clamp-2 leading-tight text-[0.875rem] mt-1">
        {description}
      </p>}
    </div>
  );
}
