/**
 * React Performance Monitoring Hook
 * Detects and logs unnecessary re-renders, heavy renders, etc.
 */

import { useEffect, useRef } from 'react'

export const useReactPerformance = (componentName, deps = []) => {
  const renderCountRef = useRef(0)
  const prevDepsRef = useRef(deps)
  const renderStartTimeRef = useRef(0)

  useEffect(() => {
    renderCountRef.current += 1
    renderStartTimeRef.current = performance.now()
  })

  useEffect(() => {
    const renderTime = performance.now() - renderStartTimeRef.current

    // Log heavy renders (>16ms = over 1 frame at 60fps)
    if (renderTime > 16) {
      console.warn(
        `[Performance] ${componentName} heavy render: ${renderTime.toFixed(2)}ms`,
        { renderCount: renderCountRef.current }
      )
    }

    // Check for dependency changes
    const depsChanged = prevDepsRef.current.some((dep, index) => {
      return dep !== deps[index]
    })

    if (depsChanged && renderCountRef.current > 1) {
      console.log(
        `[Performance] ${componentName} re-render #${renderCountRef.current}`,
        {
          prevDeps: prevDepsRef.current,
          newDeps: deps,
          renderTime: `${renderTime.toFixed(2)}ms`
        }
      )
    }

    prevDepsRef.current = deps
  })

  return {
    renderCount: renderCountRef.current,
    logRender: () => {
      const renderTime = performance.now() - renderStartTimeRef.current
      console.log(
        `[Performance] ${componentName} manual render check:`,
        {
          renderCount: renderCountRef.current,
          renderTime: `${renderTime.toFixed(2)}ms`
        }
      )
    }
  }
}

/**
 * Memo comparison untuk detect unnecessary re-renders
 */
export const useWhyDidYouUpdate = (name, props) => {
  const previousProps = useRef()

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      const changedProps = {}

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          }
        }
      })

      if (Object.keys(changedProps).length) {
        console.log('[WhyDidYouUpdate]', name, changedProps)
      }
    }

    previousProps.current = props
  })
}

