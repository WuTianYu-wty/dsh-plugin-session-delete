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
    let batchFilterWorkspace = 'all';
    const batchListeners = new Set();

    function setBatchModalState(open, filterWs = 'all') {
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

    // Helper: Prune deleted session IDs from Client's reactive stores
    function pruneClientSessions(ctx, deletedIds) {
      if (!deletedIds || deletedIds.length === 0) return;
      const idSet = new Set(deletedIds);

      // A. Prune from sessions service
      try {
        const sessionsService = ctx.get('sessions');
        if (sessionsService) {
          for (const id of deletedIds) {
            try {
              sessionsService.handleSessionRemoved?.(id);
            } catch (e) {}
          }
          if (sessionsService.list?.getSnapshot && sessionsService.list?.set) {
            const snapshot = sessionsService.list.getSnapshot();
            const nextIds = (snapshot.ids || []).filter((id) => !idSet.has(id));
            const nextById = { ...(snapshot.byId || {}) };
            for (const id of deletedIds) {
              delete nextById[id];
            }
            sessionsService.list.set({
              ...snapshot,
              ids: nextIds,
              byId: nextById,
            });
          }
          try {
            sessionsService.refresh?.();
          } catch (e) {}
        }
      } catch (e) {
        console.warn('[session-delete] Prune sessions store failed:', e);
      }

      // B. Prune from workspaces service
      try {
        const workspacesService = ctx.get('workspaces');
        if (workspacesService?.list?.getSnapshot && workspacesService?.list?.set) {
          const wsSnapshot = workspacesService.list.getSnapshot();
          const nextItems = (wsSnapshot.items || []).map((ws) => ({
            ...ws,
            sessionIds: (ws.sessionIds || []).filter((id) => !idSet.has(id)),
          }));
          const nextArchived = (wsSnapshot.archivedSessionIds || []).filter((id) => !idSet.has(id));
          const nextPinned = (wsSnapshot.pinnedSessionIds || []).filter((id) => !idSet.has(id));
          workspacesService.list.set({
            ...wsSnapshot,
            items: nextItems,
            archivedSessionIds: nextArchived,
            pinnedSessionIds: nextPinned,
          });
        }
      } catch (e) {
        console.warn('[session-delete] Prune workspaces store failed:', e);
      }

      // C. If active session was deleted, start fresh session
      try {
        const sessionsService = ctx.get('sessions');
        const uiWorkspace = ctx.get('uiWorkspace');
        const listSnapshot = sessionsService?.list?.getSnapshot?.();
        if (listSnapshot && uiWorkspace) {
          const mainSession = Object.values(listSnapshot.byId || {}).find(
            (s) => (s?.retainedBy?.mainView ?? 0) > 0
          );
          if (mainSession && idSet.has(mainSession.id)) {
            uiWorkspace.startSession?.();
          }
        }
      } catch (e) {
        console.warn('[session-delete] Switch active session failed:', e);
      }
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

    // High quality CSS Stylesheet matching DeepSeek Harness dark theme tokens
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
        color: var(--dsw-alias-label-primary, #e2e8f0);
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
        color: var(--dsw-alias-label-secondary, #94a3b8);
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
        padding: 0 10px;
        border: none;
        background: transparent;
        border-radius: var(--dsw-radius-sm, 6px);
        color: var(--dsw-alias-label-secondary, #94a3b8);
        font-size: 13px;
        cursor: pointer;
        transition: background 0.12s ease, color 0.12s ease;
      }
      .dsh-footer-batch-btn:hover {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.08));
        color: var(--dsw-alias-label-primary, #f8fafc);
      }

      .dsh-del-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.72);
        backdrop-filter: blur(6px);
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
        background: var(--dsw-alias-bg-layer-1, #18181b);
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.1));
        border-radius: 12px;
        width: 440px;
        max-width: calc(100vw - 32px);
        padding: 24px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
        color: var(--dsw-alias-label-primary, #f8fafc);
        font-family: inherit;
        animation: dshDelZoomIn 0.15s ease-out;
      }

      .dsh-batch-modal-card {
        box-sizing: border-box;
        background: var(--dsw-alias-bg-layer-1, #18181b);
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.1));
        border-radius: 14px;
        width: 620px;
        max-width: calc(100vw - 32px);
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        padding: 24px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
        color: var(--dsw-alias-label-primary, #f8fafc);
        font-family: inherit;
        animation: dshDelZoomIn 0.15s ease-out;
      }

      @keyframes dshDelZoomIn {
        from { transform: scale(0.97); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      .dsh-del-modal-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 600;
        color: var(--dsw-alias-label-primary, #f8fafc);
        margin-bottom: 6px;
      }
      .dsh-del-icon-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        flex-shrink: 0;
      }

      .dsh-batch-modal-subtitle {
        font-size: 12px;
        color: var(--dsw-alias-label-secondary, #94a3b8);
        margin-bottom: 16px;
        line-height: 18px;
      }

      /* Workspace Segmented Tabs */
      .dsh-batch-tabs {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--dsw-alias-bg-base, #0f0f12);
        padding: 3px;
        border-radius: 8px;
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
        margin-bottom: 12px;
        overflow-x: auto;
      }
      .dsh-batch-tab {
        box-sizing: border-box;
        border: none;
        background: transparent;
        color: var(--dsw-alias-label-secondary, #94a3b8);
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s ease;
      }
      .dsh-batch-tab:hover {
        color: var(--dsw-alias-label-primary, #f8fafc);
      }
      .dsh-batch-tab.active {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.12));
        color: #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      /* Filter & Search Bar */
      .dsh-batch-filter-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }

      .dsh-batch-search-input {
        box-sizing: border-box;
        flex: 1;
        height: 34px;
        background: var(--dsw-alias-bg-base, #0f0f12);
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        padding: 0 12px;
        font-size: 13px;
        color: var(--dsw-alias-label-primary, #f8fafc);
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .dsh-batch-search-input:focus {
        border-color: var(--dsw-alias-brand-primary, #3b82f6);
        box-shadow: 0 0 0 1px var(--dsw-alias-brand-primary, #3b82f6);
      }

      .dsh-batch-action-btn {
        box-sizing: border-box;
        height: 34px;
        padding: 0 12px;
        background: var(--dsw-alias-bg-base, #0f0f12);
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        color: var(--dsw-alias-label-primary, #cbd5e1);
        cursor: pointer;
        transition: all 0.12s ease;
        white-space: nowrap;
      }
      .dsh-batch-action-btn:hover:not(:disabled) {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.08));
        color: #ffffff;
      }
      .dsh-batch-action-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* Session List Container */
      .dsh-batch-list {
        box-sizing: border-box;
        flex: 1;
        min-height: 200px;
        max-height: 380px;
        overflow-y: auto;
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
        border-radius: 10px;
        background: var(--dsw-alias-bg-base, #0f0f12);
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .dsh-batch-list::-webkit-scrollbar {
        width: 6px;
      }
      .dsh-batch-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.18);
        border-radius: 3px;
      }

      .dsh-batch-item {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        user-select: none;
        transition: all 0.12s ease;
        border: 1px solid transparent;
      }
      .dsh-batch-item:hover {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.05));
      }
      .dsh-batch-item.selected {
        background: rgba(239, 68, 68, 0.09);
        border-color: rgba(239, 68, 68, 0.25);
      }

      .dsh-batch-item input[type="checkbox"] {
        cursor: pointer;
        width: 16px;
        height: 16px;
        accent-color: var(--dsw-alias-state-error-primary, #ef4444);
        flex-shrink: 0;
      }

      .dsh-batch-item-ws {
        font-size: 11px;
        padding: 2px 7px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.08);
        color: var(--dsw-alias-label-secondary, #94a3b8);
        flex-shrink: 0;
        font-weight: 500;
      }
      .dsh-batch-item-ws.ungrouped {
        background: rgba(245, 158, 11, 0.15);
        color: var(--dsw-alias-state-warn-primary, #f59e0b);
      }
      .dsh-batch-item-ws.archived {
        background: rgba(148, 163, 184, 0.15);
        color: #94a3b8;
      }

      .dsh-batch-item-title {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
        color: var(--dsw-alias-label-primary, #f1f5f9);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dsh-batch-item-time {
        font-size: 11px;
        color: var(--dsw-alias-label-secondary, #64748b);
        flex-shrink: 0;
      }

      .dsh-batch-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        color: var(--dsw-alias-label-secondary, #64748b);
        font-size: 13px;
        padding: 40px;
      }

      /* Target Card in Single Delete */
      .dsh-del-single-target-card {
        box-sizing: border-box;
        margin: 14px 0;
        padding: 12px 14px;
        border-radius: 8px;
        background: var(--dsw-alias-bg-base, #0f0f12);
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
        font-size: 13px;
        font-weight: 500;
        color: var(--dsw-alias-label-primary, #f8fafc);
        word-break: break-all;
      }

      .dsh-del-modal-warning {
        color: var(--dsw-alias-state-error-primary, #ef4444);
        font-size: 12px;
        line-height: 18px;
        margin-top: 10px;
      }

      .dsh-del-modal-error {
        margin-top: 12px;
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
        font-weight: 500;
        color: var(--dsw-alias-label-secondary, #94a3b8);
      }

      .dsh-del-btn-cancel {
        box-sizing: border-box;
        height: 34px;
        padding: 0 16px;
        border-radius: 8px;
        border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.15));
        background: transparent;
        color: var(--dsw-alias-label-primary, #f1f5f9);
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
        height: 34px;
        padding: 0 18px;
        border-radius: 8px;
        border: 1px solid var(--dsw-alias-state-error-primary, #ef4444);
        background: var(--dsw-alias-state-error-primary, #ef4444);
        color: #ffffff;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.12s ease, transform 0.1s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .dsh-del-btn-confirm:hover:not(:disabled) {
        opacity: 0.92;
        transform: translateY(-1px);
      }
      .dsh-del-btn-confirm:active:not(:disabled) {
        transform: translateY(0);
      }

      .dsh-del-btn-cancel:disabled,
      .dsh-del-btn-confirm:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .dsh-inline-confirm-badge {
        font-size: 12px;
        font-weight: 500;
        color: #ef4444;
        margin-right: 6px;
        animation: dshDelFadeIn 0.15s ease-out;
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
            React.createElement('span', null, isChinese() ? '批量管理与删除...' : 'Batch Manage & Delete...')
          );
        }

        // 3. Session row hover quick delete button
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
          const label = isChinese() ? '批量管理' : 'Batch Manage';

          return React.createElement(
            'button',
            {
              type: 'button',
              className: 'dsh-footer-batch-btn',
              title: isChinese() ? '批量管理与删除会话' : 'Batch Manage Conversations',
              'aria-label': isChinese() ? '批量管理与删除会话' : 'Batch Manage Conversations',
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
            const sessionId = target.sessionId;
            try {
              const res = await fetch('/api/delete-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
              });
              const data = await res.json();
              if (!res.ok || data.error) {
                throw new Error(data.error || (isChinese() ? '删除失败' : 'Deletion failed'));
              }

              // Prune from in-memory stores and switch active session if needed
              pruneClientSessions(ctx, [sessionId]);

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
                React.createElement(
                  'span',
                  { className: 'dsh-del-icon-badge' },
                  React.createElement(TrashIcon, { size: 16 })
                ),
                React.createElement('span', null, isChinese() ? '彻底删除对话' : 'Delete Conversation')
              ),
              React.createElement(
                'div',
                { style: { fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' } },
                isChinese()
                  ? '确定要彻底删除该会话记录吗？'
                  : 'Are you sure you want to permanently delete this conversation?'
              ),
              React.createElement(
                'div',
                { className: 'dsh-del-single-target-card' },
                `“${titleText}”`
              ),
              React.createElement(
                'div',
                { className: 'dsh-del-modal-warning' },
                isChinese()
                  ? '⚠️ 此操作将永久抹除该对话的所有聊天记录及磁盘文件，无法恢复。'
                  : '⚠️ This will permanently remove all messages and disk files for this session.'
              ),
              error && React.createElement('div', { className: 'dsh-del-modal-error' }, error),
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
                    : (isChinese() ? '彻底删除' : 'Delete')
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
          const [activeTab, setActiveTab] = React.useState('all');
          const [deleting, setDeleting] = React.useState(false);
          const [confirming, setConfirming] = React.useState(false);
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
              setConfirming(false);
            }
          }, [modalState.open]);

          React.useEffect(() => {
            if (!modalState.open) return;
            const handleKeyDown = (e) => {
              if (e.key === 'Escape' && !deleting) {
                if (confirming) setConfirming(false);
                else setBatchModalState(false);
              }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
          }, [modalState.open, deleting, confirming]);

          if (!modalState.open) return null;

          const workspaces = workspacesSnapshot.items || [];
          const archivedSet = new Set(workspacesSnapshot.archivedSessionIds || []);

          // Build all session items
          const allSessionItems = (sessionsSnapshot.ids || []).map((id) => {
            const summary = sessionsSnapshot.byId?.[id];
            const title = summary?.displayTitle || summary?.title || (isChinese() ? '无标题会话' : 'Untitled');
            const updatedAt = summary?.updatedAt || 0;
            const ws = workspaces.find((w) => w.sessionIds && w.sessionIds.includes(id));
            const isUngrouped = !ws;
            const wsName = ws ? (ws.title || ws.path) : (isChinese() ? '未分组' : 'Ungrouped');
            const wsId = ws ? ws.workspaceId : 'ungrouped';
            const isArchived = archivedSet.has(id);
            return {
              id,
              title,
              updatedAt,
              workspaceName: wsName,
              workspaceId: wsId,
              isUngrouped,
              isArchived,
            };
          });

          // Counts for tabs
          const tabCounts = {
            all: allSessionItems.length,
            ungrouped: allSessionItems.filter((i) => i.isUngrouped).length,
          };
          for (const ws of workspaces) {
            tabCounts[ws.workspaceId] = allSessionItems.filter((i) => i.workspaceId === ws.workspaceId).length;
          }

          // Filter by active tab & search query
          const filteredItems = allSessionItems.filter((item) => {
            if (activeTab !== 'all') {
              if (activeTab === 'ungrouped' && !item.isUngrouped) return false;
              if (activeTab !== 'ungrouped' && item.workspaceId !== activeTab) return false;
            }
            if (searchQuery.trim()) {
              const q = searchQuery.trim().toLowerCase();
              return item.title.toLowerCase().includes(q) || item.workspaceName.toLowerCase().includes(q);
            }
            return true;
          });

          const handleToggle = (id) => {
            if (deleting) return;
            setConfirming(false);
            setSelectedSet((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          };

          const handleSelectAll = () => {
            if (deleting) return;
            setConfirming(false);
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

          // Two-phase inline confirmation execution (no browser window.confirm!)
          const handleBatchDeleteClick = async () => {
            if (deleting || selectedSet.size === 0) return;

            // Phase 1: show inline confirmation if not yet confirming
            if (!confirming) {
              setConfirming(true);
              return;
            }

            // Phase 2: actually execute deletion
            setDeleting(true);
            setError(null);
            const sessionIds = Array.from(selectedSet);

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

              // Prune from in-memory stores and switch active session if needed
              pruneClientSessions(ctx, sessionIds);

              setDeleting(false);
              setConfirming(false);
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
              // Header
              React.createElement(
                'div',
                { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' } },
                React.createElement(
                  'div',
                  null,
                  React.createElement(
                    'div',
                    { className: 'dsh-del-modal-title' },
                    React.createElement(
                      'span',
                      { className: 'dsh-del-icon-badge' },
                      React.createElement(TrashIcon, { size: 16 })
                    ),
                    React.createElement('span', null, isChinese() ? '批量管理与删除对话' : 'Batch Manage & Delete')
                  ),
                  React.createElement(
                    'div',
                    { className: 'dsh-batch-modal-subtitle' },
                    isChinese()
                      ? '勾选需要清理的会话记录。选中的记录将被物理彻底删除，无法恢复。'
                      : 'Select conversations to permanently delete from workspaces and disk.'
                  )
                ),
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    style: {
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px',
                      borderRadius: '6px',
                    },
                    disabled: deleting,
                    onClick: () => setBatchModalState(false),
                  },
                  '✕'
                )
              ),
              // Workspace Tabs Segmented Control
              React.createElement(
                'div',
                { className: 'dsh-batch-tabs' },
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    className: `dsh-batch-tab ${activeTab === 'all' ? 'active' : ''}`,
                    onClick: () => {
                      setActiveTab('all');
                      setConfirming(false);
                    },
                  },
                  `${isChinese() ? '全部' : 'All'} (${tabCounts.all})`
                ),
                workspaces.map((ws) =>
                  React.createElement(
                    'button',
                    {
                      key: ws.workspaceId,
                      type: 'button',
                      className: `dsh-batch-tab ${activeTab === ws.workspaceId ? 'active' : ''}`,
                      onClick: () => {
                        setActiveTab(ws.workspaceId);
                        setConfirming(false);
                      },
                    },
                    `${ws.title || ws.path} (${tabCounts[ws.workspaceId] || 0})`
                  )
                ),
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    className: `dsh-batch-tab ${activeTab === 'ungrouped' ? 'active' : ''}`,
                    onClick: () => {
                      setActiveTab('ungrouped');
                      setConfirming(false);
                    },
                  },
                  `${isChinese() ? '未分组' : 'Ungrouped'} (${tabCounts.ungrouped})`
                )
              ),
              // Search & Select Controls
              React.createElement(
                'div',
                { className: 'dsh-batch-filter-bar' },
                React.createElement('input', {
                  type: 'text',
                  className: 'dsh-batch-search-input',
                  placeholder: isChinese() ? '按标题或工作区搜索...' : 'Search by title or workspace...',
                  value: searchQuery,
                  disabled: deleting,
                  onChange: (e) => {
                    setSearchQuery(e.target.value);
                    setConfirming(false);
                  },
                }),
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-batch-action-btn',
                    disabled: deleting || filteredItems.length === 0,
                    onClick: handleSelectAll,
                  },
                  allFilteredSelected ? (isChinese() ? '取消全选' : 'Deselect All') : (isChinese() ? '全选当前' : 'Select All')
                ),
                selectedSet.size > 0 &&
                  React.createElement(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-batch-action-btn',
                      disabled: deleting,
                      onClick: () => {
                        setSelectedSet(new Set());
                        setConfirming(false);
                      },
                    },
                    isChinese() ? '清空' : 'Clear'
                  )
              ),
              // Scrollable Session List
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
                          {
                            className: `dsh-batch-item-ws ${item.isUngrouped ? 'ungrouped' : ''} ${
                              item.isArchived ? 'archived' : ''
                            }`,
                          },
                          item.isArchived ? `${item.workspaceName} (已归档)` : item.workspaceName
                        ),
                        React.createElement('span', { className: 'dsh-batch-item-title' }, item.title),
                        React.createElement('span', { className: 'dsh-batch-item-time' }, formatTime(item.updatedAt))
                      );
                    })
              ),
              error && React.createElement('div', { className: 'dsh-del-modal-error' }, error),
              // Footer Toolbar
              React.createElement(
                'div',
                { className: 'dsh-del-modal-footer' },
                React.createElement(
                  'div',
                  { className: 'dsh-batch-summary' },
                  isChinese()
                    ? `已选择 ${selectedSet.size} / 共 ${allSessionItems.length} 个对话`
                    : `Selected ${selectedSet.size} of ${allSessionItems.length} sessions`
                ),
                confirming &&
                  React.createElement(
                    'span',
                    { className: 'dsh-inline-confirm-badge' },
                    isChinese() ? `⚠️ 确定删除选中的 ${selectedSet.size} 个对话？` : `⚠️ Confirm deletion?`
                  ),
                confirming &&
                  React.createElement(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-del-btn-cancel',
                      disabled: deleting,
                      onClick: () => setConfirming(false),
                    },
                    isChinese() ? '返回' : 'Back'
                  ),
                !confirming &&
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
                    onClick: handleBatchDeleteClick,
                  },
                  deleting
                    ? (isChinese() ? '正在彻底删除…' : 'Deleting…')
                    : confirming
                    ? (isChinese() ? `确认彻底删除 (${selectedSet.size})` : `Confirm Delete (${selectedSet.size})`)
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
