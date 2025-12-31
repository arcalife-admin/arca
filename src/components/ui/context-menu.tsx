"use client"

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  separator?: boolean
}

interface ContextMenuProps {
  children: React.ReactNode
  contextMenuItems: ContextMenuItem[]
  disabled?: boolean
}

export function ContextMenu({ children, contextMenuItems, disabled = false }: ContextMenuProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const menuRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    setPosition({ x, y })
    setIsVisible(true)
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsVisible(false)
    }
  }

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick()
      setIsVisible(false)
    }
  }

  useEffect(() => {
    if (isVisible) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsVisible(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)

      // Adjust position if menu would go off screen
      if (menuRef.current) {
        const menuRect = menuRef.current.getBoundingClientRect()
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight

        let adjustedX = position.x
        let adjustedY = position.y

        if (position.x + menuRect.width > windowWidth) {
          adjustedX = windowWidth - menuRect.width - 10
        }

        if (position.y + menuRect.height > windowHeight) {
          adjustedY = windowHeight - menuRect.height - 10
        }

        if (adjustedX !== position.x || adjustedY !== position.y) {
          setPosition({ x: adjustedX, y: adjustedY })
        }
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isVisible, position])

  const ContextMenuPortal = () => {
    if (!isVisible) return null

    return createPortal(
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {contextMenuItems.map((item, index) => {
          if (item.separator) {
            return <div key={index} className="border-t border-gray-100 my-1" />
          }

          return (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {item.icon && (
                <span className="flex-shrink-0 text-gray-500">
                  {item.icon}
                </span>
              )}
              <span className="flex-1">{item.label}</span>
            </button>
          )
        })}
      </div>,
      document.body
    )
  }

  // Ensure we only have a single React element as child
  const child = React.isValidElement(children) ? children : <span>{children}</span>

  // Merge any existing onContextMenu from child
  const mergedChild = React.cloneElement(child as React.ReactElement<any>, {
    onContextMenu: (e: React.MouseEvent) => {
      if (child.props.onContextMenu) {
        child.props.onContextMenu(e)
      }
      handleContextMenu(e)
    },
    className: `${child.props.className || ''}`,
  })

  return (
    <>
      {mergedChild}
      <ContextMenuPortal />
    </>
  )
}
