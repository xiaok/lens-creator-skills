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
      <section className="panel auth-panel">
        <h2>Reply requires auth setup</h2>
        <p>
          To enable wallet + email login, create a Privy app and put its app id into
          <code> NEXT_PUBLIC_PRIVY_APP_ID</code>.
        </p>
      </section>
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
      setMessage("Lens account created. You can reply now.");
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
      setMessage(`Reply submitted. Transaction hash: ${txHash}`);
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to publish reply.";
      setError(
        message.includes("Not all rules satisfied")
          ? "This node requires group membership before replying. The app now auto-joins on reply; please try once more if your first attempt raced membership indexing."
          : message,
      );
    } finally {
      setPublishing(false);
    }
  }

  if (!ready) {
    return (
      <section className="panel auth-panel">
        <h2>Loading auth</h2>
        <p>Initializing Privy and wallet state...</p>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section className="panel auth-panel">
        <h2>Reply to this thread</h2>
        <p>Use email or wallet login to reply with a Lens account.</p>
        <button className="action-button" onClick={login} type="button">
          Continue with email or wallet
        </button>
      </section>
    );
  }

  return (
    <section className="panel auth-panel">
      <div className="auth-header">
        <div>
          <h2>Reply to this thread</h2>
          <p>{user?.email?.address || activeWallet?.address || "Authenticated"}</p>
        </div>
        <button className="secondary-button" onClick={logout} type="button">
          Log out
        </button>
      </div>

      <div className="action-row">
        <button
          className="secondary-button"
          disabled={!activeWallet || loadingAccounts}
          onClick={() => activeWallet && refreshAccounts(activeWallet)}
          type="button"
        >
          {loadingAccounts ? "Refreshing..." : "Load Lens accounts"}
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="stack">
          <h3>Create your Lens forum account</h3>
          <label>
            Username
            <input onChange={(event) => setUsername(event.target.value)} placeholder="forumname" value={username} />
          </label>
          <label>
            Display name
            <input
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Forum User"
              value={displayName}
            />
          </label>
          <button className="action-button" disabled={registering} onClick={handleRegister} type="button">
            {registering ? "Creating Lens account..." : "Create Lens account"}
          </button>
        </div>
      ) : (
        <div className="stack">
          <label>
            Lens account
            <select onChange={(event) => setSelectedAccount(event.target.value)} value={selectedAccount}>
              {accounts.map((entry) => (
                <option key={entry.account.address} value={entry.account.address}>
                  {entry.account.username?.value || entry.account.address}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reply
            <textarea
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write your reply."
              rows={6}
              value={content}
            />
          </label>
          <button className="action-button" disabled={publishing} onClick={handleReply} type="button">
            {publishing ? "Posting reply..." : "Post reply"}
          </button>
        </div>
      )}

      {message ? <p className="status-ok">{message}</p> : null}
      {error ? <p className="status-error">{error}</p> : null}
    </section>
  );
}
