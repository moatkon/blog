import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import Posts from './pages/Posts'
import PostEditor from './pages/PostEditor'
import Notes from './pages/Notes'
import NoteEditor from './pages/NoteEditor'
import Tags from './pages/Tags'
import TagEditor from './pages/TagEditor'
import Assets from './pages/Assets'

function App() {
  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/posts/new" element={<PostEditor />} />
        <Route path="/posts/edit" element={<PostEditor />} />
        <Route path="/posts/edit/*" element={<PostEditor />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/new" element={<NoteEditor />} />
        <Route path="/notes/edit" element={<NoteEditor />} />
        <Route path="/notes/edit/*" element={<NoteEditor />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/tags/new" element={<TagEditor />} />
        <Route path="/tags/edit" element={<TagEditor />} />
        <Route path="/tags/edit/:id" element={<TagEditor />} />
        <Route path="/assets" element={<Assets />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  )
}

export default App
