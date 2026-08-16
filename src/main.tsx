import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { MarvelHubRoute } from './components/MarvelHubRoute'
import { MobileMenu } from './components/MobileMenu'
import { MobileTabBar } from './components/MobileTabBar'
import { NotificationCenter } from './components/NotificationCenter'
import { PostAddEditorBridge } from './components/PostAddEditorBridge'
import { ReleasesRoute } from './components/ReleasesRoute'
import { StatusIconPolish } from './components/StatusIconPolish'
import { UpcomingHomeRail } from './components/UpcomingHomeRail'
import './styles.css'
import './data-state.css'
import './discover.css'
import './power-ui.css'
import './mobile-nav-fix.css'
import './app-shell-enhancements.css'
import './mobile-polish.css'
import './rich-media.css'
import './marvel.css'
import './compact-editor.css'
import './mobile-ux-v2.css'
import './mobile-ux-v3.css'
import './upcoming-home.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <MobileMenu />
    <MobileTabBar />
    <NotificationCenter />
    <ReleasesRoute />
    <MarvelHubRoute />
    <StatusIconPolish />
    <UpcomingHomeRail />
    <PostAddEditorBridge />
  </StrictMode>,
)
