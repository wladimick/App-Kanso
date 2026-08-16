import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { MobileMenu } from './components/MobileMenu'
import { PostAddEditorBridge } from './components/PostAddEditorBridge'
import './styles.css'
import './data-state.css'
import './discover.css'
import './power-ui.css'
import './mobile-nav-fix.css'
import './app-shell-enhancements.css'
import './mobile-polish.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <MobileMenu />
    <PostAddEditorBridge />
  </StrictMode>,
)