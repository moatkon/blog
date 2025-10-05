import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

// 自动保存状态枚举
export const AUTO_SAVE_STATUS = {
  IDLE: 'idle',           // 空闲状态
  PENDING: 'pending',     // 等待保存
  SAVING: 'saving',       // 保存中
  SAVED: 'saved',         // 已保存
  ERROR: 'error'          // 保存失败
};

/**
 * 自动保存Hook
 * @param {Object} options 配置选项
 * @param {Function} options.saveFunction 保存函数，返回Promise
 * @param {Object} options.data 要保存的数据
 * @param {number} options.delay 防抖延迟时间（毫秒），默认2000ms
 * @param {boolean} options.enabled 是否启用自动保存，默认true
 * @param {Function} options.onSaveSuccess 保存成功回调
 * @param {Function} options.onSaveError 保存失败回调
 * @param {boolean} options.showToast 是否显示toast提示，默认false
 * @returns {Object} { status, lastSaved, forceSave, isAutoSaving }
 */
export const useAutoSave = ({
  saveFunction,
  data,
  delay = 2000,
  enabled = true,
  onSaveSuccess,
  onSaveError,
  showToast = false
}) => {
  const [status, setStatus] = useState(AUTO_SAVE_STATUS.IDLE);
  const [lastSaved, setLastSaved] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  const timeoutRef = useRef(null);
  const lastDataRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // 清理定时器
  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  // 执行保存
  const performSave = useCallback(async (isManual = false) => {
    if (!saveFunction || !data) {
      return;
    }

    try {
      setStatus(AUTO_SAVE_STATUS.SAVING);
      setIsAutoSaving(!isManual);

      // 确保 SAVING 状态至少显示 1 秒，让用户能看到
      const [saveResult] = await Promise.all([
        saveFunction(data),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);

      if (isMountedRef.current) {
        const saveTime = new Date();
        console.log('useAutoSave: Save successful, setting lastSaved to:', saveTime);
        setStatus(AUTO_SAVE_STATUS.SAVED);
        setLastSaved(saveTime);
        lastDataRef.current = JSON.stringify(data);

        if (showToast && !isManual) {
          toast.success('自动保存成功', { duration: 2000 });
        }

        onSaveSuccess?.(data);

        // 5秒后重置状态为空闲，让用户有足够时间看到保存成功状态
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus(prevStatus =>
              prevStatus === AUTO_SAVE_STATUS.SAVED ? AUTO_SAVE_STATUS.IDLE : prevStatus
            );
          }
        }, 5000);
      }
    } catch (error) {
      // 如果是预期的跳过情况（如内容为空），不设置错误状态，但也不重复触发
      if (error.message.includes('内容为空时不自动保存')) {
        console.log('跳过自动保存：内容为空');
        if (isMountedRef.current) {
          setStatus(AUTO_SAVE_STATUS.IDLE);
          // 更新 lastDataRef 以避免重复触发
          lastDataRef.current = JSON.stringify(data);
        }
      } else {
        // 真正的错误
        console.error('Auto save failed:', error);

        if (isMountedRef.current) {
          setStatus(AUTO_SAVE_STATUS.ERROR);

          if (showToast) {
            toast.error('自动保存失败', { duration: 3000 });
          }

          onSaveError?.(error);

          // 5秒后重置状态为空闲，但只有在状态仍为ERROR时才重置
          setTimeout(() => {
            if (isMountedRef.current) {
              setStatus(prevStatus =>
                prevStatus === AUTO_SAVE_STATUS.ERROR ? AUTO_SAVE_STATUS.IDLE : prevStatus
              );
            }
          }, 5000);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsAutoSaving(false);
      }
    }
  }, [saveFunction, data, showToast, onSaveSuccess, onSaveError]);
  
  // 手动强制保存
  const forceSave = useCallback(() => {
    clearTimeout();
    performSave(true);
  }, [clearTimeout, performSave]);
  
  // 监听数据变化，触发自动保存
  useEffect(() => {
    if (!enabled || !data || !saveFunction) {
      return;
    }

    const currentDataString = JSON.stringify(data);

    // 检查数据是否真的发生了变化
    if (lastDataRef.current === currentDataString) {
      return;
    }

    // 如果是第一次设置数据，不触发自动保存
    if (lastDataRef.current === null) {
      lastDataRef.current = currentDataString;
      return;
    }

    // 清除之前的定时器并设置新的保存任务
    clearTimeout();
    setStatus(AUTO_SAVE_STATUS.PENDING);

    timeoutRef.current = window.setTimeout(() => {
      performSave(false);
    }, delay);

    return clearTimeout;
  }, [data, enabled, saveFunction, delay, clearTimeout, performSave]);
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearTimeout();
    };
  }, [clearTimeout]);
  
  return {
    status,
    lastSaved,
    forceSave,
    isAutoSaving
  };
};

/**
 * 获取自动保存状态的显示文本
 * @param {string} status 自动保存状态
 * @param {Date} lastSaved 最后保存时间
 * @returns {string} 显示文本
 */
export const getAutoSaveStatusText = (status, lastSaved, currentTime = new Date()) => {
  // 只显示上次保存时间，如果没有保存过就不显示任何内容
  if (lastSaved) {
    const now = currentTime || new Date();
    const diff = Math.floor((now - lastSaved) / 1000);
    if (diff < 60) {
      return `${diff}秒前`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}分钟前`;
    } else {
      return lastSaved.toLocaleTimeString();
    }
  }

  // 没有保存过，不显示任何内容
  return '';
};

/**
 * 获取自动保存状态的样式类名
 * @param {string} status 自动保存状态
 * @returns {string} 样式类名
 */
export const getAutoSaveStatusClass = (status, lastSaved) => {
  // 如果有保存时间，显示绿色（成功）
  if (lastSaved) {
    return 'text-green-700 border-green-200 bg-green-50';
  }

  // 保存中显示蓝色
  if (status === AUTO_SAVE_STATUS.SAVING) {
    return 'text-blue-700 border-blue-200 bg-blue-50';
  }

  // 默认灰色
  return 'text-gray-600 border-gray-200 bg-gray-50';
};
