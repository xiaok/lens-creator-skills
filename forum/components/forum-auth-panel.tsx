"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets, type ConnectedWallet } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { fetchManagedAccounts, publishThread, registerLensAccount } from "../lib/lens-browser";
import { privyAppId } from "../lib/config";
import type { ForumNode } from "../lib/types";

type Props = {
  nodes: ForumNode[];
};

type ManagedAccount = Awaited<ReturnType<typeof fetchManagedAccounts>>[number];

export function ForumAuthPanel({ nodes }: Props) {
  if (!privyAppId) {
    return (
      <div className="sidebar-panel">
        <div className="sidebar-title">⚙️ 需要配置</div>
        <div className="sidebar-content">
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
            请设置 NEXT_PUBLIC_PRIVY_APP_ID
          </p>
        </div>
      </div>
    );
  }

  return <ForumAuthPanelInner nodes={nodes} />;
}

function ForumAuthPanelInner({ nodes }: Props) {
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
  const [selectedNode, setSelectedNode] = useState(nodes[0]?.slug ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoloadedWallet, setAutoloadedWallet] = useState<string | null>(null);

  const activeWallet = useMemo<ConnectedWallet | null>(() => {
    return wallets[0] ?? null;
  }, [wallets]);

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

  async function handleConnect() {
    setError(null);
    setMessage(null);
    login();
  }

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
      const createdAccount = nextAccounts[0]?.account?.address;
      if (createdAccount) {
        setSelectedAccount(createdAccount);
      }
      setMessage("Lens account created. You can post in any node now.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create Lens account.");
    } finally {
      setRegistering(false);
    }
  }

  async function handlePublish() {
    if (!activeWallet) {
      setError("Connect a wallet first.");
      return;
    }
    if (!selectedAccount) {
      setError("Create or select a Lens account first.");
      return;
    }
    const node = nodes.find((item) => item.slug === selectedNode);
    if (!node) {
      setError("Choose a node before posting.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Enter both a thread title and body.");
      return;
    }

    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      const txHash = await publishThread({
        wallet: activeWallet,
        node,
        accountAddress: selectedAccount,
        title: title.trim(),
        content: content.trim(),
      });
      setTitle("");
      setContent("");
      setMessage(`发布成功！`);
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to publish thread.";
      setError(message.includes("Not all rules satisfied") ? "需要先加入节点小组，请重试。" : message);
    } finally {
      setPublishing(false);
    }
  }

  if (!ready) {
    return (
      <div className="sidebar-panel">
        <div className="sidebar-title">⚙️ 加载中</div>
        <div className="sidebar-content">
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>正在初始化...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="sidebar-panel">
        <div className="sidebar-title">⚔️ 登录 / 注册</div>
        <div className="sidebar-content">
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-secondary)" }}>
            登录后可以发帖和回复
          </p>
          <button className="btn btn-primary" onClick={handleConnect} style={{ width: "100%" }}>
            邮箱或钱包登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-panel">
      <div className="sidebar-title">⚔️ 社区账号</div>
      <div className="sidebar-content">
        <div style={{ marginBottom: 12, fontSize: 13 }}>
          <span style={{ color: "var(--text-secondary)" }}>{user?.email?.address || activeWallet?.address?.slice(0, 8) + "..."}</span>
        </div>

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
            <button className="btn btn-primary" disabled={registering} onClick={handleRegister} style={{ width: "100%" }}>
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
              <label>发布节点</label>
              <select onChange={(event) => setSelectedNode(event.target.value)} value={selectedNode}>
                {nodes.map((node) => (
                  <option key={node.slug} value={node.slug}>
                    {node.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>标题</label>
              <input
                onChange={(event) => setTitle(event.target.value)}
                placeholder="标题"
                value={title}
              />
            </div>
            <div className="form-group">
              <label>内容</label>
              <textarea
                onChange={(event) => setContent(event.target.value)}
                placeholder="分享你的想法..."
                rows={4}
                value={content}
                style={{ resize: "vertical" }}
              />
            </div>
            <button className="btn btn-primary" disabled={publishing} onClick={handlePublish} style={{ width: "100%" }}>
              {publishing ? "发布中..." : "发布主题"}
            </button>
          </div>
        )}

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            className="btn btn-secondary"
            disabled={!activeWallet || loadingAccounts}
            onClick={() => activeWallet && refreshAccounts(activeWallet)}
            style={{ padding: "6px 12px", fontSize: 12 }}
          >
            {loadingAccounts ? "刷新..." : "刷新账号"}
          </button>
          <button className="btn btn-secondary" onClick={logout} style={{ padding: "6px 12px", fontSize: 12 }}>
            登出
          </button>
        </div>

        {message ? <p className="status-ok" style={{ marginTop: 12 }}>{message}</p> : null}
        {error ? <p className="status-error" style={{ marginTop: 12 }}>{error}</p> : null}
      </div>
    </div>
  );
}
