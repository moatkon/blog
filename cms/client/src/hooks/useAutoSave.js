import { useState, useEffect, useRef, useCallback } from 'react';

// 自动保存状态常量
export const AUTO_SAVE_STATUS = {
  IDLE: 'idle',           // 空闲
  PENDING: 'pending',     // 等待保存
  SAVING: 'saving',       // 保存中
  SUCCESS: 'success',     // 保存成功
  ERROR: 'error'          // 保存失败
};

/**
 * 获取自动保存状态文本
 */
export const getAutoSaveStatusText = (status, lastSaved, currentTime = new Date()) => {
  // 如果从未保存过，不显示任何文本
  if (!lastSaved) {
    if (status === AUTO_SAVE_STATUS.SAVING) {
      return '保存中...';
    }
    return '';
  }

  // 计算时间差（秒）
  const diffInSeconds = Math.floor((currentTime - new Date(lastSaved)) / 1000);

  switch (status) {
    case AUTO_SAVE_STATUS.SAVING:
      return '保存中...';
    case AUTO_SAVE_STATUS.SUCCESS:
      if (diffInSeconds < 5) {
        return '刚刚已保存';
      } else if (diffInSeconds < 60) {
        return `${diffInSeconds}秒前已保存`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}分钟前已保存`;
      } else {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}小时前已保存`;
      }
    case AUTO_SAVE_STATUS.ERROR:
      return '保存失败';
    case AUTO_SAVE_STATUS.PENDING:
      return '等待保存...';
    default:
      if (diffInSeconds < 60) {
        return `${diffInSeconds}秒前已保存`;
      }
      return '已保存';
  }
};

/**
 * 获取自动保存状态样式类
 */
export const getAutoSaveStatusClass = (status, lastSaved) => {
  // 如果从未保存过，使用灰色
  if (!lastSaved) {
    return 'bg-gray-50 text-gray-600 border-gray-200';
  }

  switch (status) {
    case AUTO_SAVE_STATUS.SAVING:
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case AUTO_SAVE_STATUS.SUCCESS:
      return 'bg-green-50 text-green-600 border-green-200';
    case AUTO_SAVE_STATUS.ERROR:
      return 'bg-red-50 text-red-600 border-red-200';
    case AUTO_SAVE_STATUS.PENDING:
      return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

/**
 * 自动保存 Hook
 * @param {Object} options
 * @param {Function} options.saveFunction - 保存函数
 * @param {*} options.data - 需要保存的数据
 * @param {number} options.delay - 延迟时间（毫秒）
 * @param {boolean} options.enabled - 是否启用自动保存
 * @param {Function} options.onSaveSuccess - 保存成功回调
 * @param {Function} options.onSaveError - 保存失败回调
 */
export const useAutoSave = ({
  saveFunction,
  data,
  delay = 2000,
  enabled = true,
  onSaveSuccess,
  onSaveError
}) => {
  const [status, setStatus] = useState(AUTO_SAVE_STATUS.IDLE);
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(data);
  const isSavingRef = useRef(false);

  // 保存函数
  const save = useCallback(async () => {
    if (isSavingRef.current) {
      console.log('已在保存中，跳过');
      return;
    }

    isSavingRef.current = true;
    setStatus(AUTO_SAVE_STATUS.SAVING);

    try {
      console.log('开始自动保存...');
      await saveFunction(data);
      
      const now = new Date();
      setLastSaved(now);
      setStatus(AUTO_SAVE_STATUS.SUCCESS);
      
      console.log('自动保存成功:', now.toISOString());
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      // 保存成功后，更新上次的数据引用
      previousDataRef.current = data;
    } catch (error) {
      console.error('自动保存失败:', error);
      setStatus(AUTO_SAVE_STATUS.ERROR);
      
      if (onSaveError) {
        onSaveError(error);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [data, saveFunction, onSaveSuccess, onSaveError]);

  // 监听数据变化，触发自动保存
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 检查数据是否真的改变了
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (!hasChanged) {
      return;
    }

    console.log('数据已改变，设置自动保存定时器');
    setStatus(AUTO_SAVE_STATUS.PENDING);

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, delay, save]);

  // 手动触发保存
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save();
  }, [save]);

  return {
    status,
    lastSaved,
    forceSave
  };
};