export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  const el = target instanceof HTMLElement ? target : null
  if (!el) return false

  if (el.isContentEditable) return true

  const tag = el.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true

  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type
    if (type === 'button' || type === 'submit' || type === 'checkbox' || type === 'radio' || type === 'file') {
      return false
    }
    return true
  }

  const role = el.getAttribute('role')
  if (role === 'textbox' || role === 'combobox' || role === 'searchbox') return true

  if (el.closest('[contenteditable="true"]')) return true

  return false
}

export function isScrollAtBottom(el: HTMLElement, threshold = 8): boolean {
  return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
}
