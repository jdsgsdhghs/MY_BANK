import { InputHTMLAttributes, useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

/* Champ mot de passe avec bascule afficher/masquer.
   Le bouton n'est pas dans l'ordre de tabulation pour ne pas gêner la saisie. */
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
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}
