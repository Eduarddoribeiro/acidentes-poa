import type { ReactNode } from 'react'
import { cx } from '../lib/classNames'
import styles from './Notice.module.css'

interface Props {
  title: string
  tone?: 'neutral' | 'error'
  children: ReactNode
}

/** Message in place of content: empty results or a failed load. Errors are announced right away. */
export function Notice({ title, tone = 'neutral', children }: Props) {
  return (
    <div className={cx(styles.notice, tone === 'error' && styles.error)} role={tone === 'error' ? 'alert' : 'status'}>
      <h3>{title}</h3>
      {children}
    </div>
  )
}
