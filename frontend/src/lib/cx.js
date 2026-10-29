// Joins class names, skipping empty ones: cx('a', isOn && 'b') -> 'a b'
export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}
