import { readdir, rm, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const inject = ['webServer', 'workspaceRegistry'];

export function apply(ctx) {
  const unregister = ctx.webServer.register({
    kind: 'exact',
    path: '/api/delete-session',
    handler: async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
      }

      let body = '';
      try {
        for await (const chunk of req) {
          body += chunk;
        }

        const payload = JSON.parse(body);
        const sessionId = payload.sessionId;

        if (!sessionId || typeof sessionId !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing or invalid sessionId' }));
          return;
        }

        ctx.logger?.info?.(`[session-delete] Request received to delete session: ${sessionId}`);

        // 1. Stop any running activity for this session
        try {
          await ctx.parallel('workspace/session-stop', { sessionId });
        } catch (e) {
          ctx.logger?.warn?.(`[session-delete] Stopping session ${sessionId} activity failed: ${String(e)}`);
        }

        // 2. Cancel active agent if running
        try {
          const agents = ctx.get('agents');
          const agent = agents?.get?.(sessionId);
          if (agent && typeof agent.cancel === 'function') {
            agent.cancel({ kind: 'user' });
          }
        } catch (e) {
          ctx.logger?.warn?.(`[session-delete] Cancelling agent ${sessionId} failed: ${String(e)}`);
        }

        // 3. Detach from all workspaces
        try {
          const registry = ctx.workspaceRegistry;
          if (registry && typeof registry.list === 'function') {
            const workspaces = registry.list();
            for (const ws of workspaces) {
              if (ws.sessionIds && ws.sessionIds.includes(sessionId)) {
                await ws.detachSession(sessionId);
                ctx.logger?.info?.(`[session-delete] Detached ${sessionId} from workspace ${ws.title || ws.id}`);
              }
            }
          }
        } catch (e) {
          ctx.logger?.warn?.(`[session-delete] Detach from workspaces failed: ${String(e)}`);
        }

        // 4. Remove from archived / pinned sets
        try {
          const registry = ctx.workspaceRegistry;
          if (registry) {
            if (registry.archivedSessionIds?.includes(sessionId)) {
              await registry.unarchiveSession(sessionId);
            }
            if (registry.pinnedSessionIds?.includes(sessionId)) {
              await registry.unpinSession(sessionId);
            }
          }
        } catch (e) {
          ctx.logger?.warn?.(`[session-delete] Unarchive/unpin failed: ${String(e)}`);
        }

        // 5. Clean up in-memory registry caches
        try {
          const registry = ctx.workspaceRegistry;
          if (registry) {
            registry.headers?.delete?.(sessionId);
            registry.sessionPaths?.delete?.(sessionId);
            registry.missingSessionPaths?.delete?.(sessionId);
            registry.invalidSessionPaths?.delete?.(sessionId);
          }
        } catch (e) {}

        // 6. Clean up in-memory sessions store if present
        try {
          const sessions = ctx.get('sessions');
          if (sessions?.store?.has?.(sessionId)) {
            sessions.store.delete(sessionId);
          }
        } catch (e) {}

        // 7. Delete physical session directory on disk
        const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh');

        try {
          const sessionsRoot = join(dshHome, 'sessions');
          if (existsSync(sessionsRoot)) {
            const projectDirs = await readdir(sessionsRoot, { withFileTypes: true });
            for (const dir of projectDirs) {
              if (dir.isDirectory()) {
                const targetDir = join(sessionsRoot, dir.name, sessionId);
                if (existsSync(targetDir)) {
                  await rm(targetDir, { recursive: true, force: true });
                  ctx.logger?.info?.(`[session-delete] Removed session directory: ${targetDir}`);
                }
              }
            }
          }
        } catch (e) {
          ctx.logger?.warn?.(`[session-delete] Deleting session dir on disk failed: ${String(e)}`);
        }

        // 8. Delete session projection cache
        try {
          const projCacheFile = join(dshHome, 'storages', 'session_projcache', 'sessions', `${sessionId}.json`);
          if (existsSync(projCacheFile)) {
            await rm(projCacheFile, { force: true });
            ctx.logger?.info?.(`[session-delete] Removed projection cache: ${projCacheFile}`);
          }
        } catch (e) {}

        // 9. Extra safety check for workspace.json
        try {
          const workspaceJsonPath = join(dshHome, 'storages', 'workspace.json');
          if (existsSync(workspaceJsonPath)) {
            const raw = await readFile(workspaceJsonPath, 'utf8');
            const data = JSON.parse(raw);
            let changed = false;

            if (data.global?.archivedSessionIds?.includes(sessionId)) {
              data.global.archivedSessionIds = data.global.archivedSessionIds.filter(id => id !== sessionId);
              changed = true;
            }
            if (data.global?.pinnedSessionIds?.includes(sessionId)) {
              data.global.pinnedSessionIds = data.global.pinnedSessionIds.filter(id => id !== sessionId);
              changed = true;
            }
            if (data.tables?.workspaces) {
              for (const ws of Object.values(data.tables.workspaces)) {
                if (ws.sessionIds?.includes(sessionId)) {
                  ws.sessionIds = ws.sessionIds.filter(id => id !== sessionId);
                  changed = true;
                }
              }
            }

            if (changed) {
              await writeFile(workspaceJsonPath, JSON.stringify(data, null, 2), 'utf8');
            }
          }
        } catch (e) {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, sessionId }));
      } catch (err) {
        ctx.logger?.error?.(`[session-delete] Error during deletion:`, err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
      }
    }
  });

  return unregister;
}
