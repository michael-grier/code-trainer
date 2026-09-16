import { Navigate, useLocation } from 'react-router-dom'

// The curriculum map moved onto the dashboard. Keep old links working, and
// carry the query and hash across because the auth sheet reads the GitHub
// callback parameters from whichever page the callback lands on.
export function ProgressRedirect() {
  const { hash, search } = useLocation()

  return <Navigate replace to={{ pathname: '/', hash, search }} />
}
