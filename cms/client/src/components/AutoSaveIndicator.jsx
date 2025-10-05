import React from 'react';
import { Save, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { AUTO_SAVE_STATUS, getAutoSaveStatusText, getAutoSaveStatusClass } from '../hooks/useAutoSave';

/**
 * 自动保存状态指示器组件
 * @param {Object} props
 * @param {string} props.status 自动保存状态
 * @param {Date} props.lastSaved 最后保存时间
 * @param {Function} props.onForceSave 手动保存回调
 * @param {boolean} props.showForceButton 是否显示手动保存按钮
 * @param {string} props.className 额外的CSS类名
 */
const AutoSaveIndicator = ({
  status,
  lastSaved,
  onForceSave,
  showForceButton = true,
  className = ''
}) => {
  const statusText = getAutoSaveStatusText(status, lastSaved);
  const statusClass = getAutoSaveStatusClass(status);
  
  // 获取状态图标
  const getStatusIcon = () => {
    switch (status) {
      case AUTO_SAVE_STATUS.PENDING:
        return <Clock className="w-4 h-4" />;
      case AUTO_SAVE_STATUS.SAVING:
        return <Loader className="w-4 h-4 animate-spin" />;
      case AUTO_SAVE_STATUS.SAVED:
        return <CheckCircle className="w-4 h-4" />;
      case AUTO_SAVE_STATUS.ERROR:
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Save className="w-4 h-4" />;
    }
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* 状态指示器 */}
      <div className={`flex items-center space-x-1 text-sm ${statusClass}`}>
        {getStatusIcon()}
        <span>{statusText}</span>
      </div>
      
      {/* 手动保存按钮 */}
      {showForceButton && onForceSave && (
        <button
          type="button"
          onClick={onForceSave}
          disabled={status === AUTO_SAVE_STATUS.SAVING}
          className={`
            flex items-center space-x-1 px-2 py-1 text-xs rounded border
            ${status === AUTO_SAVE_STATUS.SAVING 
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-800'
            }
          `}
          title="立即保存"
        >
          <Save className="w-3 h-3" />
          <span>保存</span>
        </button>
      )}
    </div>
  );
};

export default AutoSaveIndicator;
