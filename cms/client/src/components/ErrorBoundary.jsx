import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('CMS UI error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="card mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">页面出错了</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          通常是数据格式异常或接口暂时不可用。刷新后如果仍然出现，请查看浏览器控制台与 CMS API 日志。
        </p>
        <pre className="mt-4 max-h-32 w-full overflow-auto rounded-lg bg-slate-50 p-3 text-left text-xs text-red-600">
          {String(this.state.error?.message || this.state.error)}
        </pre>
        <button type="button" className="btn btn-primary btn-md mt-6" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4" />
          刷新页面
        </button>
      </div>
    )
  }
}

export default ErrorBoundary
