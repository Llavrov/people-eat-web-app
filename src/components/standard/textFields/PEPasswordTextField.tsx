import { useState, type ReactElement } from 'react';
import { isEmail } from '../../../utils/isEmail';
import PEHideButton from '../hideButton/PEHideButton';
import { type PEPasswordTextFieldProps } from './PEPasswordTextFieldProps';
import PETextField from './PETextField';

export default function PEPasswordTextField({
    password,
    onChange,
    placeholder,
    disabled,
    style,
    className,
}: PEPasswordTextFieldProps): ReactElement {
    const [passwordHidden, setPasswordHidden] = useState(true);

    return (
        <PETextField
            value={password}
            onChange={onChange}
            validationRule={isEmail}
            placeholder={placeholder}
            disabled={disabled}
            type={passwordHidden ? 'password' : 'text'}
            startContent={undefined}
            endContent={<PEHideButton className="opacity-50" onCheckedChange={(): void => setPasswordHidden(!passwordHidden)} />}
            style={style}
            className={className}
        />
    );
}
