import { InputHTMLAttributes, useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

/* Password field with a show/hide toggle.
   The button is kept out of the tab order so it doesn't interrupt typing. */
export default function PasswordField({ label, id, ...rest }: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <div className="password-field">
        <input id={inputId} type={visible ? 'text' : 'password'} {...rest} />
        <button
          type="button"
          className="password-toggle"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}
