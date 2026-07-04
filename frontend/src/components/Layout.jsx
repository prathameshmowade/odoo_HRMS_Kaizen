import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { motion } from 'framer-motion'

export default function Layout({ children, title }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="page-wrapper" style={{ flex: 1 }}>
        <Topbar title={title} />
        <motion.main
          className="page-content"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
