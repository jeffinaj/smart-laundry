import { useEffect, useState } from 'react'

export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setStoredValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(value) : value
      setValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [value, setStoredValue]
}

export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const execute = async () => {
    setStatus('pending')
    setData(null)
    setError(null)
    try {
      const response = await asyncFunction()
      setData(response.data)
      setStatus('success')
      return response.data
    } catch (error) {
      setError(error)
      setStatus('error')
    }
  }

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [])

  return { execute, status, data, error }
}
