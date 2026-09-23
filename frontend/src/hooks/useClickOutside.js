import { useEffect, useRef } from 'react';

export default function useClickOutside(onOutside, active = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    function handler(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutside(event);
      }
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [active, onOutside]);

  return ref;
}