export default function DualColorHeading({ title, subTitle, description, size=24 }) {
  return (
    <div>
      <h2 className={`font-extrabold text-[${size}px]`}>
        {title}{' '}
        {subTitle && <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
          {subTitle}
        </span>}
      </h2>
      {description && <p className={`text-[var(--tt-muted)] line-clamp-2 leading-tight text-[${(size*0.6).toFixed(0)}px] mt-1`}>
        {description}
      </p>}
    </div>
  );
}
