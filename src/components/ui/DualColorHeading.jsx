export default function DualColorHeading({ title, subTitle, description, size=20 }) {
  let style = {}, descStyle = {};
  if (size){
    style.fontSize = `${size}px`;
    descStyle.fontSize = `${(size*0.6).toFixed(0)}px`;
  }
  return (
    <div>
      <h2 className={`font-extrabold text-[${size}px]`} style={style}>
        {title}{' '}
        {subTitle && <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
          {subTitle}
        </span>}
      </h2>
      {description && <p style={descStyle} className={`text-[var(--tt-muted)] line-clamp-2 leading-tight  mt-1`}>
        {description}
      </p>}
    </div>
  );
}
