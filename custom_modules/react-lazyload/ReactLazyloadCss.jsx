import React from 'react';
import PropTypes from 'prop-types';

/**
 * CSS-Only Lazy Load Component
 * Uses content-visibility: auto for automatic lazy rendering by the browser
 * SEO-friendly: content renders on server, browser handles lazy rendering
 */
function ReactLazyloadCss({
  children,
  className = '',
  classNamePrefix = 'lazyload-css',
  height,
  style = {},
  ...otherProps
}) {

  // CSS properties for lazy loading
  const lazyStyle = {
    contentVisibility: 'auto',
    containIntrinsicSize: height ? `${height}px` : '200px',
    contain: 'layout style paint',
    ...style
  };

  return (
    <div
      className={`${classNamePrefix}-wrapper ${className}`}
      style={lazyStyle}
      {...otherProps}
    >
      {children}
    </div>
  );
}

ReactLazyloadCss.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  classNamePrefix: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  style: PropTypes.object
};

// Named export for consistency with other lazyload components
export { ReactLazyloadCss as LazyLoadCss };
export default ReactLazyloadCss;
