import { ButtonHTMLAttributes, ReactNode, useState } from 'react';
import './TouchableOpacity.css';

interface TouchableOpacityProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
  activeOpacity?: number;
  children: ReactNode;
}

export default function TouchableOpacity({
  variant = 'primary',
  activeOpacity = 0.6,
  children,
  className = '',
  style,
  ...rest
}: TouchableOpacityProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      className={`touchable touchable-${variant} ${className}`.trim()}
      style={{ ...style, opacity: pressed ? activeOpacity : 1 }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      {...rest}
    >
      {children}
    </button>
  );
}
