# React Lazy Load Component

A modern, performant React lazy loading component that uses the IntersectionObserver API for optimal performance.

## Features

- 🚀 **High Performance**: Uses IntersectionObserver API instead of manual scroll listeners
- ⚛️ **Modern React**: Built with hooks and functional components
- 🎯 **TypeScript Support**: Full type definitions included
- 🔄 **Suspense Integration**: Works seamlessly with React.lazy()
- 📱 **SSR Compatible**: Safe for server-side rendering
- 🔧 **Backward Compatible**: Drop-in replacement for the old version
- 🎨 **Flexible API**: Enhanced props for better control
- 🧹 **Memory Efficient**: Automatic cleanup prevents memory leaks

## Installation

```bash
npm install react-lazyload
# or
yarn add react-lazyload
```

## Basic Usage

```jsx
import LazyLoad from 'react-lazyload';

function MyComponent() {
  return (
    <LazyLoad height={200}>
      <img src="heavy-image.jpg" alt="Heavy" />
    </LazyLoad>
  );
}
```

## Advanced Usage

### With Custom Placeholder

```jsx
<LazyLoad
  height={200}
  placeholder={<div>Loading...</div>}
>
  <HeavyComponent />
</LazyLoad>
```

### With React.lazy() and Suspense

```jsx
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

<LazyLoad
  height={200}
  fallback={<div>Loading component...</div>}
>
  <LazyComponent />
</LazyLoad>
```

### With Callbacks

```jsx
<LazyLoad
  height={200}
  onVisible={() => console.log('Component became visible')}
  onInvisible={() => console.log('Component went out of view')}
>
  <MyComponent />
</LazyLoad>
```

### With Custom Threshold

```jsx
<LazyLoad
  height={200}
  threshold={0.5} // Trigger when 50% visible
  offset="100px" // Start loading 100px before entering viewport
>
  <MyComponent />
</LazyLoad>
```

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | **Required.** The content to lazy load |
| `placeholder` | `ReactNode` | - | Custom placeholder while loading |
| `height` | `number \| string` | `200` | Height of placeholder |
| `offset` | `number \| string \| [number\|string, number\|string]` | `0` | Margin around viewport to trigger loading |
| `once` | `boolean` | `false` | Load only once, don't unload when out of view |
| `threshold` | `number \| number[]` | `0` | IntersectionObserver threshold(s) |
| `scrollContainer` | `string \| HTMLElement` | - | Custom scroll container selector/element |
| `className` | `string` | `''` | Additional CSS class |
| `classNamePrefix` | `string` | `'lazyload'` | CSS class prefix |
| `style` | `CSSProperties` | - | Inline styles |
| `fallback` | `ReactNode` | - | Suspense fallback for lazy components |
| `onVisible` | `() => void` | - | Callback when component becomes visible |
| `onInvisible` | `() => void` | - | Callback when component goes out of view |

### Backward Compatibility Props

These props are kept for compatibility with the old version but are no longer needed:

- `overflow` - Handled automatically by IntersectionObserver
- `resize` - No longer needed
- `scroll` - Always enabled with IntersectionObserver
- `throttle` - Replaced by IntersectionObserver's native throttling
- `debounce` - Replaced by IntersectionObserver's native throttling
- `unmountIfInvisible` - Use `once` prop instead

## Decorator Usage

```jsx
import { lazyload } from 'react-lazyload';

const LazyComponent = lazyload({
  height: 200,
  once: true
})(MyComponent);

// Usage
<LazyComponent />
```

## TypeScript Support

```tsx
import LazyLoad, { LazyLoadProps } from 'react-lazyload';

const MyComponent: React.FC = () => {
  return (
    <LazyLoad
      height={200}
      onVisible={() => console.log('Visible!')}
    >
      <div>Content</div>
    </LazyLoad>
  );
};
```

## Migration from v1

The new version is designed to be a drop-in replacement. Most existing code will work without changes:

```jsx
// Old way (still works)
<LazyLoad height={200} once>
  <HeavyComponent />
</LazyLoad>

// New enhanced way
<LazyLoad
  height={200}
  once
  threshold={0.1}
  onVisible={() => trackAnalytics()}
>
  <HeavyComponent />
</LazyLoad>
```

## Performance Benefits

- **IntersectionObserver API**: More efficient than manual scroll listeners
- **No Global State**: Each component manages its own observer
- **Automatic Cleanup**: Prevents memory leaks
- **Passive Observation**: Better battery life on mobile devices
- **Reduced Bundle Size**: Smaller footprint than the old implementation

## Browser Support

IntersectionObserver is supported in all modern browsers. For older browsers, consider using a polyfill:

```jsx
import 'intersection-observer';
```

## Testing

```bash
npm test
```

The component includes comprehensive tests with mocked IntersectionObserver for reliable testing.

## Contributing

Contributions are welcome! Please ensure all tests pass and add tests for new features.
