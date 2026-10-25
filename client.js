window.__ModuleLoader__.load({
  id: '@local/session-delete',
  factory(require) {
    const React = require('react');

    // Observable store for delete confirmation modal target
    let currentTarget = null;
    const listeners = new Set();

    function setDeleteTarget(target) {
      currentTarget = target;
      for (const listener of listeners) {
        try {
          listener(currentTarget);
        } catch (e) {
          console.error('[session-delete] listener error:', e);
        }
      }
    }

    function useDeleteTarget() {
      const [target, setTarget] = React.useState(currentTarget);
      React.useEffect(() => {
        listeners.add(setTarget);
        return () => listeners.delete(setTarget);
      }, []);
      return target;
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
        margin-bottom: 12px;
      }
      .dsh-del-modal-title svg {
        color: var(--dsw-alias-state-error-primary, #ef4444);
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
        justify-content: flex-end;
        gap: 10px;
        margin-top: 24px;
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
      inject: ['slots', 'uiWorkspace', 'sessions'],
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

        // 1. Session "..." menu item
        function DeleteMenuItem(props) {
          const { sessionId, displayTitle, useMenuOpenState } = props;
          const menuOpenTuple = useMenuOpenState ? useMenuOpenState() : null;
          const setMenuOpen = menuOpenTuple ? menuOpenTuple[1] : null;

          const handleClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (typeof setMenuOpen === 'function') {
              setMenuOpen(false);
            }
            setDeleteTarget({ sessionId, displayTitle });
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

        // 2. Session row hover action button
        function DeleteRowAction(props) {
          const { sessionId, displayTitle } = props;

          const handleClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            setDeleteTarget({ sessionId, displayTitle });
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

        // 3. Delete confirmation modal in shell.overlay
        function DeleteConfirmModal() {
          const target = useDeleteTarget();
          const [deleting, setDeleting] = React.useState(false);
          const [error, setError] = React.useState(null);

          React.useEffect(() => {
            if (!target) return;
            const handleKeyDown = (e) => {
              if (e.key === 'Escape' && !deleting) {
                setDeleteTarget(null);
              }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
          }, [target, deleting]);

          if (!target) return null;

          const handleClose = () => {
            if (deleting) return;
            setError(null);
            setDeleteTarget(null);
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
              setDeleteTarget(null);
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

        // Register into slots
        ctx.slots.inject('sidebar.workspaces.session.menu.item', () =>
          ctx.slots.register(
            {
              name: 'sidebar.workspaces.session.menu.item',
              id: 'session-delete',
              order: 480,
            },
            DeleteMenuItem
          )
        );

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

        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            {
              name: 'shell.overlay',
              id: 'session-delete-confirm-modal',
            },
            DeleteConfirmModal
          )
        );
      },
    };
  },
});
