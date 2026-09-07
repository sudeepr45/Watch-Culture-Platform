import { createContext } from 'react'

export interface RouterContextType {
  pathname: string
  navigate: (to: string) => void
}

export const RouterContext = createContext<RouterContextType>({
  pathname: '/',
  navigate: () => {},
})
