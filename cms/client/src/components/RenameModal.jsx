import React, { useState } from 'react';
import { X } from 'lucide-react';

const RenameModal = ({ isOpen, onClose, onRename, currentPath, title, type }) => {
  const [newPath, setNewPath] = useState(currentPath || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onRename(newPath);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || '重命名失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">重命名{type === 'post' ? '文章' : '笔记'}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                当前路径/文件名
              </label>
              <div className="p-2 bg-gray-50 border border-gray-200 rounded-md font-mono text-sm break-all">
                {currentPath}
              </div>
            </div>
            
            <div>
              <label htmlFor="newPath" className="block text-sm font-medium text-gray-700 mb-1">
                新的路径/文件名
              </label>
              <input
                type="text"
                id="newPath"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="修改当前路径/文件名"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {type === 'post' 
                  ? '例如: 2024/01/01/index.md 或 2024/01/01/1.md' 
                  : '例如: 2024/01-01.md'}
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '重命名中...' : '重命名'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;