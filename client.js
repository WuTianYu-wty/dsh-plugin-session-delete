window.__ModuleLoader__.load({
  id: '@local/session-delete',
  factory(require) {
    const React = require('react');

    // 1. Single delete modal target store
    let currentSingleTarget = null;
    const singleListeners = new Set();

    function setSingleTarget(target) {
      currentSingleTarget = target;
      for (const listener of singleListeners) {
        try {
          listener(currentSingleTarget);
        } catch (e) {
          console.error('[session-delete] listener error:', e);
        }
      }
    }

    function useSingleTarget() {
      const [target, setTarget] = React.useState(currentSingleTarget);
      React.useEffect(() => {
        singleListeners.add(setTarget);
        return () => singleListeners.delete(setTarget);
      }, []);
      return target;
    }

    // 2. Batch delete modal open state store
    let isBatchModalOpen = false;
    let batchFilterWorkspace = ''; // default: all
    const batchListeners = new Set();

    function setBatchModalState(open, filterWs = '') {
      isBatchModalOpen = !!open;
      if (filterWs) batchFilterWorkspace = filterWs;
      for (const listener of batchListeners) {
        try {
          listener({ open: isBatchModalOpen, filterWorkspace: batchFilterWorkspace });
        } catch (e) {
          console.error('[session-delete] batch listener error:', e);
        }
      }
    }

    function useBatchModalState() {
      const [state, setState] = React.useState({
        open: isBatchModalOpen,
        filterWorkspace: batchFilterWorkspace,
      });
      React.useEffect(() => {
        batchListeners.add(setState);
        return () => batchListeners.delete(setState);
      }, []);
      return state;
    }

    // Modern Trash Icon SVG component
    function TrashIcon(props) {
      const size = props.size || 14;
      return React.createElement(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.25',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 },
          'aria-hidden': 'true',
        },
        React.createElement('path', { d: 'M2.5 4h11' }),
        React.createElement('path', { d: 'M5.5 4V2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4' }),
        React.createElement('path', { d: 'M13 4v9.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5V4' }),
        React.createElement('path', { d: 'M6.5 7v4.5' }),
        React.createElement('path', { d: 'M9.5 7v4.5' })
      );
    }

    // Checklist Icon SVG component
    function CheckListIcon(props) {
      const size = props.size || 14;
      return React.createElement(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.25',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 },
          'aria-hidden': 'true',
        },
        React.createElement('path', { d: 'M2 4h2M2 8h2M2 12h2' }),
        React.createElement('path', { d: 'M6.5 4h7.5M6.5 8h7.5M6.5 12h7.5' })
      );
    }

    function formatTime(timestamp) {
      if (!timestamp) return '';
      const now = Date.now();
      const diffSec = Math.floor((now - timestamp) / 1000);
      if (diffSec < 60) return '刚刚';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}分钟前`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}小时前`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}天前`;
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // Stylesheet text using theme tokens
    const STYLES = `
      .dsh-del-menu-item {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        height: 32px;
        padding: 0 10px;
        border: none;
        background: transparent;
        border-radius: var(--dsw-radius-sm, 6px);
        color: var(--dsw-alias-state-error-primary, #ef4444);
        font-size: 13px;
        line-height: 20px;
        cursor: pointer;
        text-align: left;
        user-select: none;
        transition: background 0.12s ease;
      }
      .dsh-del-menu-item:hover,
      .dsh-del-menu-item:focus-visible {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.08));
        outline: none;
      }
      .dsh-del-menu-item.batch {
        color: var(--dsw-alias-label-primary, #ddd);
      }
      .dsh-del-menu-item.batch:hover {
        color: var(--dsw-alias-state-warn-primary, #f59e0b);
      }
      .dsh-del-menu-item span {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dsh-del-row-btn {
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: none;
        background: transparent;
        border-radius: var(--dsw-radius-sm, 4px);
        color: var(--dsw-alias-label-secondary, #999);
        cursor: pointer;
        transition: background 0.12s ease, color 0.12s ease;
      }
      .dsh-del-row-btn:hover {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.1));
        color: var(--dsw-alias-state-error-primary, #ef4444);
      }

      .dsh-footer-batch-btn {
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 32px;
        padding: 0 8px;
        border: none;
        background: transparent;
        border-radius: var(--dsw-radius-sm, 6px);
        color: var(--dsw-alias-label-secondary, #999);
        font-size: 13px;
        cursor: pointer;
        transition: background 0.12s ease, color 0.12s ease;
      }
      .dsh-footer-batch-btn:hover {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.08));
        color: var(--dsw-alias-state-error-primary, #ef4444);
      }

      .dsh-del-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: dshDelFadeIn 0.15s ease-out;
      }
      @keyframes dshDelFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .dsh-del-modal-card {
        box-sizing: border-box;
        background: var(--dsw-alias-bg-layer-1, #1e1e20);
        border: 1px solid var(--dsw-alias-border-l1, #333338);
        border-radius: var(--dsw-radius-lg, 12px);
        width: 420px;
        max-width: calc(100vw - 32px);
        padding: 24px;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5);
        color: var(--dsw-alias-label-primary, #f0f0f2);
        font-family: inherit;
        animation: dshDelZoomIn 0.15s ease-out;
      }

      .dsh-batch-modal-card {
        box-sizing: border-box;
        background: var(--dsw-alias-bg-layer-1, #1e1e20);
        border: 1px solid var(--dsw-alias-border-l1, #333338);
        border-radius: var(--dsw-radius-lg, 12px);
        width: 580px;
        max-width: calc(100vw - 32px);
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        padding: 24px;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.55);
        color: var(--dsw-alias-label-primary, #f0f0f2);
        font-family: inherit;
        animation: dshDelZoomIn 0.15s ease-out;
      }

      @keyframes dshDelZoomIn {
        from { transform: scale(0.96); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      .dsh-del-modal-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 600;
        color: var(--dsw-alias-label-primary, #fff);
        margin-bottom: 8px;
      }
      .dsh-del-modal-title svg {
        color: var(--dsw-alias-state-error-primary, #ef4444);
      }

      .dsh-batch-modal-subtitle {
        font-size: 12px;
        color: var(--dsw-alias-label-secondary, #999);
        margin-bottom: 16px;
        line-height: 18px;
      }

      .dsh-batch-filter-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }

      .dsh-batch-search-input {
        box-sizing: border-box;
        flex: 1;
        min-width: 140px;
        height: 32px;
        background: var(--dsw-alias-bg-base, #141416);
        border: 1px solid var(--dsw-alias-border-l1, #333338);
        border-radius: 6px;
        padding: 0 10px;
        font-size: 13px;
        color: var(--dsw-alias-label-primary, #eee);
        outline: none;
        transition: border-color 0.15s ease;
      }
      .dsh-batch-search-input:focus {
        border-color: var(--dsw-alias-brand-primary, #3b82f6);
      }

      .dsh-batch-ws-select {
        box-sizing: border-box;
        height: 32px;
        background: var(--dsw-alias-bg-base, #141416);
        border: 1px solid var(--dsw-alias-border-l1, #333338);
        border-radius: 6px;
        padding: 0 8px;
        font-size: 12px;
        color: var(--dsw-alias-label-primary, #eee);
        outline: none;
        cursor: pointer;
      }

      .dsh-batch-select-all-btn {
        box-sizing: border-box;
        height: 32px;
        padding: 0 10px;
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.08));
        border: 1px solid var(--dsw-alias-border-l1, #333338);
        border-radius: 6px;
        font-size: 12px;
        color: var(--dsw-alias-label-primary, #eee);
        cursor: pointer;
        transition: background 0.12s ease;
        white-space: nowrap;
      }
      .dsh-batch-select-all-btn:hover {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.14));
      }

      .dsh-batch-list {
        box-sizing: border-box;
        flex: 1;
        min-height: 180px;
        max-height: 360px;
        overflow-y: auto;
        border: 1px solid var(--dsw-alias-border-l1, #333338);
        border-radius: 8px;
        background: var(--dsw-alias-bg-base, #141416);
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .dsh-batch-list::-webkit-scrollbar {
        width: 6px;
      }
      .dsh-batch-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 3px;
      }

      .dsh-batch-item {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        user-select: none;
        transition: background 0.12s ease;
      }
      .dsh-batch-item:hover {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.06));
      }
      .dsh-batch-item.selected {
        background: rgba(239, 68, 68, 0.08);
      }

      .dsh-batch-item input[type="checkbox"] {
        cursor: pointer;
        width: 15px;
        height: 15px;
        accent-color: var(--dsw-alias-state-error-primary, #ef4444);
        flex-shrink: 0;
      }

      .dsh-batch-item-ws {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.08);
        color: var(--dsw-alias-label-secondary, #999);
        flex-shrink: 0;
      }
      .dsh-batch-item-ws.archived {
        background: rgba(245, 158, 11, 0.15);
        color: var(--dsw-alias-state-warn-primary, #f59e0b);
      }

      .dsh-batch-item-title {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
        color: var(--dsw-alias-label-primary, #eee);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dsh-batch-item-time {
        font-size: 11px;
        color: var(--dsw-alias-label-secondary, #777);
        flex-shrink: 0;
      }

      .dsh-batch-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        color: var(--dsw-alias-label-secondary, #777);
        font-size: 13px;
        padding: 30px;
      }

      .dsh-del-modal-body {
        font-size: 13px;
        line-height: 20px;
        color: var(--dsw-alias-label-secondary, #a0a0a5);
      }

      .dsh-del-modal-target {
        font-weight: 500;
        color: var(--dsw-alias-label-primary, #fff);
        margin: 6px 0;
        word-break: break-all;
      }

      .dsh-del-modal-warning {
        color: var(--dsw-alias-state-error-primary, #ef4444);
        font-size: 12px;
        margin-top: 8px;
        line-height: 18px;
      }

      .dsh-del-modal-error {
        margin-top: 10px;
        padding: 8px 12px;
        border-radius: 6px;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid var(--dsw-alias-state-error-primary, #ef4444);
        color: var(--dsw-alias-state-error-primary, #ef4444);
        font-size: 12px;
      }

      .dsh-del-modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }

      .dsh-del-modal-footer .dsh-batch-summary {
        margin-right: auto;
        font-size: 13px;
        color: var(--dsw-alias-label-secondary, #aaa);
      }

      .dsh-del-btn-cancel {
        box-sizing: border-box;
        padding: 6px 16px;
        border-radius: var(--dsw-radius-md, 6px);
        border: 1px solid var(--dsw-alias-border-l2, #3e3e44);
        background: transparent;
        color: var(--dsw-alias-label-primary, #eee);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.12s ease;
      }
      .dsh-del-btn-cancel:hover:not(:disabled) {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.08));
      }

      .dsh-del-btn-confirm {
        box-sizing: border-box;
        padding: 6px 16px;
        border-radius: var(--dsw-radius-md, 6px);
        border: 1px solid var(--dsw-alias-state-error-primary, #ef4444);
        background: var(--dsw-alias-state-error-primary, #ef4444);
        color: #ffffff;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.12s ease;
      }
      .dsh-del-btn-confirm:hover:not(:disabled) {
        opacity: 0.9;
      }

      .dsh-del-btn-cancel:disabled,
      .dsh-del-btn-confirm:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;

    return {
      inject: ['slots', 'uiWorkspace', 'sessions', 'workspaces'],
      apply(ctx) {
        // Inject styles
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-plugin', '@local/session-delete');
        styleEl.textContent = STYLES;
        document.head.appendChild(styleEl);

        ctx.effect(() => () => {
          styleEl.remove();
        });

        const isChinese = () => {
          try {
            const loc = ctx.get('locale')?.getLocale?.()?.id;
            if (loc) return loc.startsWith('zh');
          } catch (e) {}
          return (navigator.language || '').startsWith('zh');
        };

        // 1. Session "..." menu: Single Delete Item
        function SingleDeleteMenuItem(props) {
          const { sessionId, displayTitle, useMenuOpenState } = props;
          const menuOpenTuple = useMenuOpenState ? useMenuOpenState() : null;
          const setMenuOpen = menuOpenTuple ? menuOpenTuple[1] : null;

          const handleClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (typeof setMenuOpen === 'function') {
              setMenuOpen(false);
            }
            setSingleTarget({ sessionId, displayTitle });
          };

          return React.createElement(
            'button',
            {
              type: 'button',
              role: 'menuitem',
              className: 'dsh-del-menu-item',
              onClick: handleClick,
            },
            React.createElement(TrashIcon, { size: 14 }),
            React.createElement('span', null, isChinese() ? '删除会话' : 'Delete Session')
          );
        }

        // 2. Session "..." menu: Batch Delete Item
        function BatchDeleteMenuItem(props) {
          const { useMenuOpenState } = props;
          const menuOpenTuple = useMenuOpenState ? useMenuOpenState() : null;
          const setMenuOpen = menuOpenTuple ? menuOpenTuple[1] : null;

          const handleClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (typeof setMenuOpen === 'function') {
              setMenuOpen(false);
            }
            setBatchModalState(true);
          };

          return React.createElement(
            'button',
            {
              type: 'button',
              role: 'menuitem',
              className: 'dsh-del-menu-item batch',
              onClick: handleClick,
            },
            React.createElement(CheckListIcon, { size: 14 }),
            React.createElement('span', null, isChinese() ? '批量删除...' : 'Batch Delete...')
          );
        }

        // 3. Session row hover action button (quick single delete)
        function DeleteRowAction(props) {
          const { sessionId, displayTitle } = props;

          const handleClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            setSingleTarget({ sessionId, displayTitle });
          };

          const label = isChinese() ? '删除会话' : 'Delete Session';

          return React.createElement(
            'button',
            {
              type: 'button',
              className: 'dsh-del-row-btn',
              title: label,
              'aria-label': label,
              onClick: handleClick,
            },
            React.createElement(TrashIcon, { size: 14 })
          );
        }

        // 4. Sidebar footer action button
        function SidebarFooterBatchButton(props) {
          const { wide } = props;
          const label = isChinese() ? '批量删除' : 'Batch Delete';

          return React.createElement(
            'button',
            {
              type: 'button',
              className: 'dsh-footer-batch-btn',
              title: isChinese() ? '批量删除会话' : 'Batch Delete Sessions',
              'aria-label': isChinese() ? '批量删除会话' : 'Batch Delete Sessions',
              onClick: () => {
                setBatchModalState(true);
              },
            },
            React.createElement(TrashIcon, { size: 15 }),
            wide ? React.createElement('span', null, label) : null
          );
        }

        // 5. Single Delete Modal in shell.overlay
        function SingleDeleteConfirmModal() {
          const target = useSingleTarget();
          const [deleting, setDeleting] = React.useState(false);
          const [error, setError] = React.useState(null);

          React.useEffect(() => {
            if (!target) return;
            const handleKeyDown = (e) => {
              if (e.key === 'Escape' && !deleting) {
                setSingleTarget(null);
              }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
          }, [target, deleting]);

          if (!target) return null;

          const handleClose = () => {
            if (deleting) return;
            setError(null);
            setSingleTarget(null);
          };

          const handleConfirm = async () => {
            if (deleting) return;
            setDeleting(true);
            setError(null);
            try {
              const res = await fetch('/api/delete-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: target.sessionId }),
              });
              const data = await res.json();
              if (!res.ok || data.error) {
                throw new Error(data.error || (isChinese() ? '删除失败' : 'Deletion failed'));
              }

              // Check if deleted session was the currently active one
              try {
                const sessions = ctx.get('sessions');
                const uiWorkspace = ctx.get('uiWorkspace');
                const listSnapshot = sessions?.list?.getSnapshot?.();
                if (listSnapshot && uiWorkspace) {
                  const mainSession = Object.values(listSnapshot.byId || {}).find(
                    (s) => (s?.retainedBy?.mainView ?? 0) > 0
                  );
                  if (mainSession && mainSession.id === target.sessionId) {
                    uiWorkspace.startSession?.();
                  }
                }
              } catch (e) {
                console.warn('[session-delete] Failed to switch active session:', e);
              }

              setDeleting(false);
              setSingleTarget(null);
            } catch (err) {
              setDeleting(false);
              setError(err instanceof Error ? err.message : String(err));
            }
          };

          const titleText = target.displayTitle || (isChinese() ? '无标题会话' : 'Untitled Session');

          return React.createElement(
            'div',
            {
              className: 'dsh-del-modal-overlay',
              onClick: (e) => {
                if (e.target === e.currentTarget) handleClose();
              },
            },
            React.createElement(
              'div',
              {
                className: 'dsh-del-modal-card',
                role: 'dialog',
                'aria-modal': 'true',
              },
              React.createElement(
                'div',
                { className: 'dsh-del-modal-title' },
                React.createElement(TrashIcon, { size: 18 }),
                React.createElement('span', null, isChinese() ? '删除会话' : 'Delete Session')
              ),
              React.createElement(
                'div',
                { className: 'dsh-del-modal-body' },
                React.createElement(
                  'p',
                  { style: { margin: '0 0 8px 0' } },
                  isChinese()
                    ? '确定要彻底删除以下会话吗？'
                    : 'Are you sure you want to permanently delete this session?'
                ),
                React.createElement(
                  'div',
                  { className: 'dsh-del-modal-target' },
                  `“${titleText}”`
                ),
                React.createElement(
                  'div',
                  { className: 'dsh-del-modal-warning' },
                  isChinese()
                    ? '⚠️ 此操作将永久删除该会话的所有聊天历史和记录，无法恢复。'
                    : '⚠️ This will permanently delete all chat history for this session. This action cannot be undone.'
                ),
                error && React.createElement('div', { className: 'dsh-del-modal-error' }, error)
              ),
              React.createElement(
                'div',
                { className: 'dsh-del-modal-footer' },
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-del-btn-cancel',
                    disabled: deleting,
                    onClick: handleClose,
                  },
                  isChinese() ? '取消' : 'Cancel'
                ),
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-del-btn-confirm',
                    disabled: deleting,
                    onClick: handleConfirm,
                  },
                  deleting
                    ? (isChinese() ? '正在删除…' : 'Deleting…')
                    : (isChinese() ? '彻底删除' : 'Delete Permanently')
                )
              )
            )
          );
        }

        // 6. Batch Delete Modal in shell.overlay
        function BatchDeleteModal() {
          const modalState = useBatchModalState();
          const [selectedSet, setSelectedSet] = React.useState(new Set());
          const [searchQuery, setSearchQuery] = React.useState('');
          const [filterWorkspace, setFilterWorkspace] = React.useState('all');
          const [deleting, setDeleting] = React.useState(false);
          const [error, setError] = React.useState(null);

          const sessionsService = ctx.get('sessions');
          const workspacesService = ctx.get('workspaces');

          const [sessionsSnapshot, setSessionsSnapshot] = React.useState(() =>
            sessionsService?.list?.getSnapshot?.() || { ids: [], byId: {} }
          );
          const [workspacesSnapshot, setWorkspacesSnapshot] = React.useState(() =>
            workspacesService?.list?.getSnapshot?.() || { items: [], archivedSessionIds: [] }
          );

          React.useEffect(() => {
            if (!sessionsService?.list?.subscribe) return;
            return sessionsService.list.subscribe(() => {
              setSessionsSnapshot(sessionsService.list.getSnapshot());
            });
          }, [sessionsService]);

          React.useEffect(() => {
            if (!workspacesService?.list?.subscribe) return;
            return workspacesService.list.subscribe(() => {
              setWorkspacesSnapshot(workspacesService.list.getSnapshot());
            });
          }, [workspacesService]);

          React.useEffect(() => {
            if (!modalState.open) {
              setSelectedSet(new Set());
              setSearchQuery('');
              setError(null);
              setDeleting(false);
            }
          }, [modalState.open]);

          React.useEffect(() => {
            if (!modalState.open) return;
            const handleKeyDown = (e) => {
              if (e.key === 'Escape' && !deleting) {
                setBatchModalState(false);
              }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
          }, [modalState.open, deleting]);

          if (!modalState.open) return null;

          const workspaces = workspacesSnapshot.items || [];
          const archivedSet = new Set(workspacesSnapshot.archivedSessionIds || []);

          // Build session items list
          const allSessionItems = (sessionsSnapshot.ids || []).map((id) => {
            const summary = sessionsSnapshot.byId?.[id];
            const title = summary?.displayTitle || summary?.title || (isChinese() ? '无标题会话' : 'Untitled');
            const updatedAt = summary?.updatedAt || 0;
            const ws = workspaces.find((w) => w.sessionIds && w.sessionIds.includes(id));
            const wsName = ws ? (ws.title || ws.path) : (isChinese() ? '未分组' : 'Ungrouped');
            const wsId = ws ? ws.workspaceId : 'ungrouped';
            const isArchived = archivedSet.has(id);
            return {
              id,
              title,
              updatedAt,
              workspaceName: wsName,
              workspaceId: wsId,
              isArchived,
            };
          });

          // Filter by workspace & search query
          const filteredItems = allSessionItems.filter((item) => {
            if (filterWorkspace !== 'all' && item.workspaceId !== filterWorkspace) {
              return false;
            }
            if (searchQuery.trim()) {
              const q = searchQuery.trim().toLowerCase();
              return item.title.toLowerCase().includes(q) || item.workspaceName.toLowerCase().includes(q);
            }
            return true;
          });

          const handleToggle = (id) => {
            if (deleting) return;
            setSelectedSet((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          };

          const handleSelectAll = () => {
            if (deleting) return;
            const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((it) => selectedSet.has(it.id));
            if (allFilteredSelected) {
              // Deselect all filtered
              setSelectedSet((prev) => {
                const next = new Set(prev);
                for (const it of filteredItems) next.delete(it.id);
                return next;
              });
            } else {
              // Select all filtered
              setSelectedSet((prev) => {
                const next = new Set(prev);
                for (const it of filteredItems) next.add(it.id);
                return next;
              });
            }
          };

          const handleBatchConfirm = async () => {
            if (deleting || selectedSet.size === 0) return;
            const count = selectedSet.size;
            const sessionIds = Array.from(selectedSet);

            const promptText = isChinese()
              ? `确定要彻底删除选中的 ${count} 个会话吗？此操作将永久抹除所有聊天历史，无法恢复！`
              : `Are you sure you want to permanently delete the ${count} selected sessions? This cannot be undone!`;

            if (!window.confirm(promptText)) return;

            setDeleting(true);
            setError(null);

            try {
              const res = await fetch('/api/delete-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionIds }),
              });
              const data = await res.json();
              if (!res.ok || data.error) {
                throw new Error(data.error || (isChinese() ? '批量删除失败' : 'Batch delete failed'));
              }

              // Check if current active session was among the deleted ones
              try {
                const listSnapshot = sessionsService?.list?.getSnapshot?.();
                const uiWorkspace = ctx.get('uiWorkspace');
                if (listSnapshot && uiWorkspace) {
                  const mainSession = Object.values(listSnapshot.byId || {}).find(
                    (s) => (s?.retainedBy?.mainView ?? 0) > 0
                  );
                  if (mainSession && selectedSet.has(mainSession.id)) {
                    uiWorkspace.startSession?.();
                  }
                }
              } catch (e) {
                console.warn('[session-delete] switch active session error:', e);
              }

              setDeleting(false);
              setBatchModalState(false);
            } catch (err) {
              setDeleting(false);
              setError(err instanceof Error ? err.message : String(err));
            }
          };

          const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((it) => selectedSet.has(it.id));

          return React.createElement(
            'div',
            {
              className: 'dsh-del-modal-overlay',
              onClick: (e) => {
                if (e.target === e.currentTarget && !deleting) setBatchModalState(false);
              },
            },
            React.createElement(
              'div',
              {
                className: 'dsh-batch-modal-card',
                role: 'dialog',
                'aria-modal': 'true',
              },
              React.createElement(
                'div',
                { className: 'dsh-del-modal-title' },
                React.createElement(TrashIcon, { size: 18 }),
                React.createElement('span', null, isChinese() ? '批量删除会话' : 'Batch Delete Conversations')
              ),
              React.createElement(
                'div',
                { className: 'dsh-batch-modal-subtitle' },
                isChinese()
                  ? '勾选需要删除的会话记录。选中的记录将被彻底从工作区与磁盘中抹除，无法恢复。'
                  : 'Select the conversation records you want to delete. Selected items will be permanently erased.'
              ),
              // Filter bar
              React.createElement(
                'div',
                { className: 'dsh-batch-filter-bar' },
                React.createElement(
                  'select',
                  {
                    className: 'dsh-batch-ws-select',
                    value: filterWorkspace,
                    disabled: deleting,
                    onChange: (e) => setFilterWorkspace(e.target.value),
                  },
                  React.createElement('option', { value: 'all' }, isChinese() ? '全部工作区' : 'All Workspaces'),
                  workspaces.map((ws) =>
                    React.createElement('option', { key: ws.workspaceId, value: ws.workspaceId }, ws.title || ws.path)
                  ),
                  React.createElement('option', { value: 'ungrouped' }, isChinese() ? '未分组' : 'Ungrouped')
                ),
                React.createElement('input', {
                  type: 'text',
                  className: 'dsh-batch-search-input',
                  placeholder: isChinese() ? '搜索会话标题...' : 'Search conversation title...',
                  value: searchQuery,
                  disabled: deleting,
                  onChange: (e) => setSearchQuery(e.target.value),
                }),
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-batch-select-all-btn',
                    disabled: deleting || filteredItems.length === 0,
                    onClick: handleSelectAll,
                  },
                  allFilteredSelected ? (isChinese() ? '取消全选' : 'Deselect All') : (isChinese() ? '全选' : 'Select All')
                )
              ),
              // Session items list
              React.createElement(
                'div',
                { className: 'dsh-batch-list' },
                filteredItems.length === 0
                  ? React.createElement(
                      'div',
                      { className: 'dsh-batch-empty' },
                      isChinese() ? '没有匹配的会话记录' : 'No matching sessions found'
                    )
                  : filteredItems.map((item) => {
                      const isSelected = selectedSet.has(item.id);
                      return React.createElement(
                        'div',
                        {
                          key: item.id,
                          className: `dsh-batch-item ${isSelected ? 'selected' : ''}`,
                          onClick: () => handleToggle(item.id),
                        },
                        React.createElement('input', {
                          type: 'checkbox',
                          checked: isSelected,
                          disabled: deleting,
                          onChange: () => handleToggle(item.id),
                          onClick: (e) => e.stopPropagation(),
                        }),
                        React.createElement(
                          'span',
                          { className: `dsh-batch-item-ws ${item.isArchived ? 'archived' : ''}` },
                          item.isArchived ? `${item.workspaceName} (已归档)` : item.workspaceName
                        ),
                        React.createElement('span', { className: 'dsh-batch-item-title' }, item.title),
                        React.createElement('span', { className: 'dsh-batch-item-time' }, formatTime(item.updatedAt))
                      );
                    })
              ),
              error && React.createElement('div', { className: 'dsh-del-modal-error' }, error),
              // Footer
              React.createElement(
                'div',
                { className: 'dsh-del-modal-footer' },
                React.createElement(
                  'div',
                  { className: 'dsh-batch-summary' },
                  isChinese()
                    ? `已选 ${selectedSet.size} / 共 ${allSessionItems.length} 个会话`
                    : `Selected ${selectedSet.size} of ${allSessionItems.length} sessions`
                ),
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-del-btn-cancel',
                    disabled: deleting,
                    onClick: () => setBatchModalState(false),
                  },
                  isChinese() ? '取消' : 'Cancel'
                ),
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-del-btn-confirm',
                    disabled: deleting || selectedSet.size === 0,
                    onClick: handleBatchConfirm,
                  },
                  deleting
                    ? (isChinese() ? '正在删除…' : 'Deleting…')
                    : isChinese()
                    ? `彻底删除选中项 (${selectedSet.size})`
                    : `Delete Selected (${selectedSet.size})`
                )
              )
            )
          );
        }

        // Register into slots
        // A. Single delete item in "..." menu (order: 480)
        ctx.slots.inject('sidebar.workspaces.session.menu.item', () =>
          ctx.slots.register(
            {
              name: 'sidebar.workspaces.session.menu.item',
              id: 'session-delete',
              order: 480,
            },
            SingleDeleteMenuItem
          )
        );

        // B. Batch delete item in "..." menu (order: 485)
        ctx.slots.inject('sidebar.workspaces.session.menu.item', () =>
          ctx.slots.register(
            {
              name: 'sidebar.workspaces.session.menu.item',
              id: 'session-batch-delete',
              order: 485,
            },
            BatchDeleteMenuItem
          )
        );

        // C. Hover quick button on each session row (order: 300)
        ctx.slots.inject('sidebar.workspaces.session.row.action', () =>
          ctx.slots.register(
            {
              name: 'sidebar.workspaces.session.row.action',
              id: 'session-delete',
              order: 300,
            },
            DeleteRowAction
          )
        );

        // D. Sidebar footer action (order: 200, next to settings)
        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register(
            {
              name: 'sidebar.footer.action',
              id: 'session-batch-delete-btn',
              order: 200,
            },
            SidebarFooterBatchButton
          )
        );

        // E. Single Delete Confirm Modal in shell.overlay
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            {
              name: 'shell.overlay',
              id: 'session-delete-confirm-modal',
            },
            SingleDeleteConfirmModal
          )
        );

        // F. Batch Delete Modal in shell.overlay
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            {
              name: 'shell.overlay',
              id: 'session-batch-delete-modal',
            },
            BatchDeleteModal
          )
        );
      },
    };
  },
});
