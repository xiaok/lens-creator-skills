"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets, type ConnectedWallet } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { fetchManagedAccounts, publishReply, registerLensAccount } from "../lib/lens-browser";
import { privyAppId } from "../lib/config";
import type { ForumNode, ForumThread } from "../lib/types";

type Props = {
  node: ForumNode;
  thread: ForumThread;
};

type ManagedAccount = Awaited<ReturnType<typeof fetchManagedAccounts>>[number];

export function ThreadReplyPanel({ node, thread }: Props) {
  if (!privyAppId) {
    return (
      <div className="panel">
        <div className="panel-header">
          <span>发表评论</span>
        </div>
        <div className="panel-content" style={{ padding: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            请配置 NEXT_PUBLIC_PRIVY_APP_ID
          </p>
        </div>
      </div>
    );
  }

  return <ThreadReplyPanelInner node={node} thread={thread} />;
}

function ThreadReplyPanelInner({ node, thread }: Props) {
  const router = useRouter();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoloadedWallet, setAutoloadedWallet] = useState<string | null>(null);

  const activeWallet = useMemo<ConnectedWallet | null>(() => {
    return wallets[0] ?? null;
  }, [wallets]);

  async function refreshAccounts(wallet: ConnectedWallet) {
    setLoadingAccounts(true);
    setError(null);
    try {
      const nextAccounts = await fetchManagedAccounts(wallet.address);
      setAccounts([...nextAccounts]);
      if (nextAccounts[0]?.account?.address) {
        setSelectedAccount((current) => current || nextAccounts[0].account.address);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load Lens accounts.");
    } finally {
      setLoadingAccounts(false);
    }
  }

  useEffect(() => {
    if (!authenticated) {
      setAccounts([]);
      setSelectedAccount("");
      setAutoloadedWallet(null);
      return;
    }

    if (!activeWallet || loadingAccounts) {
      return;
    }

    if (autoloadedWallet === activeWallet.address) {
      return;
    }

    setAutoloadedWallet(activeWallet.address);
    void refreshAccounts(activeWallet);
  }, [activeWallet, authenticated, autoloadedWallet, loadingAccounts]);

  async function handleRegister() {
    if (!activeWallet) {
      setError("Connect a wallet first.");
      return;
    }
    if (!username.trim() || !displayName.trim()) {
      setError("Enter both a username and a display name.");
      return;
    }

    setRegistering(true);
    setError(null);
    setMessage(null);
    try {
      const nextAccounts = await registerLensAccount({
        wallet: activeWallet,
        localName: username.trim(),
        displayName: displayName.trim(),
      });
      setAccounts([...nextAccounts]);
      if (nextAccounts[0]?.account?.address) {
        setSelectedAccount(nextAccounts[0].account.address);
      }
      setMessage("账号创建成功！现在可以回复了");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create Lens account.");
    } finally {
      setRegistering(false);
    }
  }

  async function handleReply() {
    if (!activeWallet) {
      setError("Connect a wallet first.");
      return;
    }
    if (!selectedAccount) {
      setError("Create or select a Lens account first.");
      return;
    }
    if (!content.trim()) {
      setError("Write a reply before posting.");
      return;
    }

    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      const txHash = await publishReply({
        wallet: activeWallet,
        node,
        accountAddress: selectedAccount,
        threadId: thread.id,
        threadTitle: thread.title,
        content: content.trim(),
      });
      setContent("");
      setMessage("回复成功！");
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to publish reply.";
      setError(
        message.includes("Not all rules satisfied")
          ? "需要先加入节点小组，请重试。"
          : message,
      );
    } finally {
      setPublishing(false);
    }
  }

  if (!ready) {
    return (
      <div className="panel">
        <div className="panel-header">
          <span>发表评论</span>
        </div>
        <div className="panel-content" style={{ padding: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>正在加载...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="panel">
        <div className="panel-header">
          <span>发表评论</span>
        </div>
        <div className="panel-content" style={{ padding: 16 }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)" }}>
            登录后可以参与讨论
          </p>
          <button className="btn btn-primary" onClick={login}>
            邮箱或钱包登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span>发表评论</span>
        <span style={{ fontWeight: 400, color: "var(--text-secondary)", fontSize: 12 }}>
          {user?.email?.address || activeWallet?.address?.slice(0, 10) + "..."}
        </span>
      </div>
      <div className="panel-content" style={{ padding: 16 }}>
        {accounts.length === 0 ? (
          <div>
            <div className="form-group">
              <label>用户名</label>
              <input
                onChange={(event) => setUsername(event.target.value)}
                placeholder="forumname"
                value={username}
              />
            </div>
            <div className="form-group">
              <label>显示名称</label>
              <input
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="你的名字"
                value={displayName}
              />
            </div>
            <button className="btn btn-primary" disabled={registering} onClick={handleRegister}>
              {registering ? "创建中..." : "创建账号"}
            </button>
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label>选择账号</label>
              <select onChange={(event) => setSelectedAccount(event.target.value)} value={selectedAccount}>
                {accounts.map((entry) => (
                  <option key={entry.account.address} value={entry.account.address}>
                    {entry.account.username?.value || entry.account.address.slice(0, 10) + "..."}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>回复内容</label>
              <textarea
                onChange={(event) => setContent(event.target.value)}
                placeholder="写下你的回复..."
                rows={4}
                value={content}
                style={{ resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" disabled={publishing} onClick={handleReply}>
                {publishing ? "发布中..." : "发布回复"}
              </button>
              <button className="btn btn-secondary" onClick={logout}>
                登出
              </button>
            </div>
          </div>
        )}

        {message ? <p className="status-ok" style={{ marginTop: 12 }}>{message}</p> : null}
        {error ? <p className="status-error" style={{ marginTop: 12 }}>{error}</p> : null}
      </div>
    </div>
  );
}
