export default function BrandIcon({ size = 16, fill = false, className = '', alt = '' }) {
  return (
    <img
      src="/logo.jpg"
      alt={alt}
      width={fill ? undefined : size}
      height={fill ? undefined : size}
      className={`${fill ? 'brand-icon-fill' : 'brand-icon'}${className ? ` ${className}` : ''}`}
      loading="lazy"
    />
  );
}