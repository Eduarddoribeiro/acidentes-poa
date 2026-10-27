import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cx } from '../lib/classNames'
import styles from './Button.module.css'
import { Icon, type IconName } from './Icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(styles.button, variant === 'secondary' && styles.secondary, className)}
      {...props}
    />
  )
})

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName
  label: string
}

/** Square button with an icon only; `label` is its accessible name. */
export function IconButton({ icon, label, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button type={type} className={cx(styles.iconButton, className)} aria-label={label} {...props}>
      <Icon name={icon} />
    </button>
  )
}
