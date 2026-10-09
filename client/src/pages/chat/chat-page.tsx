import {
  ArrowRight,
  Bot,
  CornerDownLeft,
  FileCode2,
  GitBranch,
  LoaderCircle,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';

import { ErrorState, LoadingState } from '../../components/common/async-states.js';
import { analysisService } from '../../services/analyses/analysis.service.js';
import { chatService } from '../../services/chat/chat.service.js';
import { errorMessage } from '../../services/api/api-client.js';
import { fileService } from '../../services/files/file.service.js';
import type {
  Analysis,
  ChatCitation,
  ChatMessage,
  FileRecord,
  Project,
} from '../../types/domain.js';
import { projectService } from '../../services/projects/project.service.js';

interface UiMessage {
  key: string;
  role: 'user' | 'assistant';
  content: string;
  citations: ChatCitation[];
}

/**
 * Renders the chat page interface.
 */
export function ChatPage() {
  const { analysisId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const prompt = (location.state as { prompt?: string } | null)?.prompt ?? '';
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [sessionId, setSessionId] = useState(searchParams.get('sessionId') ?? '');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState(prompt);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const current = await analysisService.get(analysisId);
      const [owner, sourceFiles] = await Promise.all([
        projectService.get(current.projectId),
        fileService.list(analysisId),
      ]);
      if (!active) return;
      setAnalysis(current);
      setProject(owner);
      setFiles(sourceFiles);
      const currentSessionId = searchParams.get('sessionId');
      if (currentSessionId) {
        const [session, saved] = await Promise.all([
          chatService.getSession(currentSessionId),
          chatService.messages(currentSessionId),
        ]);
        if (!active) return;
        if (session.analysisId !== analysisId)
          throw new Error('This conversation belongs to a different analysis.');
        setSessionId(currentSessionId);
        setMessages(saved.map(toUiMessage));
      }
    })()
      .catch((caught: unknown) => {
        if (active) setError(errorMessage(caught));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [analysisId, searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  /**
   * Sends the composed question to the repository chat service.
   * @param event - The event value used by this operation.
   */
  async function send(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError('');
    setDraft('');
    try {
      const answer = await chatService.ask(analysisId, content, sessionId || undefined);
      setSessionId(answer.sessionId);
      const saved = await chatService.messages(answer.sessionId);
      setMessages(saved.map(toUiMessage));
    } catch (caught) {
      setDraft(content);
      setError(errorMessage(caught));
      if (sessionId) {
        const saved = await chatService.messages(sessionId).catch(() => null);
        if (saved) setMessages(saved.map(toUiMessage));
      }
    } finally {
      setSending(false);
    }
  }

  /**
   * Creates a new chat session for the active analysis.
   */
  async function startConversation() {
    if (!project || creatingSession) return;
    setCreatingSession(true);
    setError('');
    try {
      const session = await chatService.createSession(project._id, analysisId);
      setSessionId(session._id);
      setMessages([]);
      setDraft('');
      setSearchParams({ sessionId: session._id });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setCreatingSession(false);
    }
  }

  /**
   * Deletes the selected chat session and its messages.
   */
  async function deleteConversation() {
    if (!sessionId || !window.confirm('Delete this conversation and its saved messages?')) return;
    setDeletingSession(true);
    setError('');
    try {
      await chatService.removeSession(sessionId);
      setSessionId('');
      setMessages([]);
      setSearchParams({});
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setDeletingSession(false);
    }
  }

  if (loading) return <LoadingState label="Preparing repository context" />;
  if (error && !analysis) return <ErrorState message={error} />;
  const fileByPath = new Map(files.map((file) => [file.path, file]));
  const suggestions = [
    'Which files have the most dependents?',
    'How does a request flow through this codebase?',
    'What could be affected if I change a central service?',
  ];

  return (
    <div className="chat-page page-stack">
      <header className="chat-page-header">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" /> GROUNDED REPOSITORY ASSISTANT
          </span>
          <h1>AI codebase chat</h1>
          <p>
            Ask about verified files and dependency relationships in{' '}
            <strong>
              {project?.owner}/{project?.repository}
            </strong>
            .
          </p>
        </div>
        <span className="verified-pill">
          <Sparkles size={14} /> Graph-verified context
        </span>
      </header>
      <div className="chat-layout">
        <aside className="chat-context panel">
          <span className="eyebrow">ANALYSIS CONTEXT</span>
          <h2>{project?.repository ?? 'Repository'}</h2>
          <p>{project?.githubUrl}</p>
          <div className="context-metric">
            <FileCode2 size={16} />
            <span>{analysis?.fileCount.toLocaleString() ?? 0} analyzed files</span>
          </div>
          <div className="context-metric">
            <GitBranchIcon />
            <span>{analysis?.dependencyCount.toLocaleString() ?? 0} verified edges</span>
          </div>
          <div className="context-commit">
            <small>COMMIT</small>
            <code>{analysis?.commitSha.slice(0, 12)}</code>
          </div>
          <Link to={`/analyses/${analysisId}/graph`} className="text-link">
            Open dependency graph <ArrowRight size={14} />
          </Link>
          <div className="context-note">
            <Sparkles size={15} />
            <span>
              Answers are based on repository tools. The assistant cannot create dependency edges.
            </span>
          </div>
        </aside>
        <section className="chat-conversation panel">
          <div className="conversation-header">
            <div className="assistant-avatar">
              <Bot size={18} />
            </div>
            <div>
              <strong>CartoGraph assistant</strong>
              <span>Grounded in this analysis</span>
            </div>
            {sessionId && (
              <button
                className="icon-button"
                aria-label="Delete conversation"
                title="Delete conversation"
                onClick={() => void deleteConversation()}
                disabled={deletingSession || sending}
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              className="button button-outline button-small"
              onClick={() => void startConversation()}
              disabled={creatingSession || sending}
            >
              <Plus size={14} /> New chat
            </button>
          </div>
          <div className="message-list">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <span className="welcome-orb">
                  <Bot size={27} />
                </span>
                <h2>Explore your codebase</h2>
                <p>Ask a question about files, dependency paths, impact, or architecture.</p>
                <div className="suggestion-list">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion} onClick={() => setDraft(suggestion)}>
                      {suggestion}
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <article key={message.key} className={`chat-message message-${message.role}`}>
                  <span className="message-avatar">
                    {message.role === 'assistant' ? <Bot size={16} /> : <UserRound size={16} />}
                  </span>
                  <div className="message-content">
                    <span className="message-author">
                      {message.role === 'assistant' ? 'CartoGraph' : 'You'}
                    </span>
                    <p>{message.content}</p>
                    {message.citations.length > 0 && (
                      <div className="citation-list">
                        <small>VERIFIED SOURCES</small>
                        {message.citations.map((citation, index) => {
                          const file = fileByPath.get(citation.path);
                          return (
                            <div className="citation-row" key={`${citation.path}-${index}`}>
                              {file ? (
                                <>
                                  <Link
                                    className="citation-file"
                                    to={`/analyses/${analysisId}/files/${file._id}`}
                                  >
                                    <FileCode2 size={13} />
                                    <code>{citation.path}</code>
                                    {citation.line && <span>:{citation.line}</span>}
                                  </Link>
                                  <div className="citation-actions">
                                    <Link to={`/analyses/${analysisId}/graph?fileId=${file._id}`}>
                                      Graph
                                    </Link>
                                    <Link to={`/analyses/${analysisId}/path?source=${file._id}`}>
                                      Path
                                    </Link>
                                    <Link
                                      to={`/analyses/${analysisId}/files/${file._id}/blast-radius`}
                                    >
                                      Impact
                                    </Link>
                                  </div>
                                </>
                              ) : (
                                <span className="citation-unlinked">
                                  <FileCode2 size={13} />
                                  <code>{citation.path}</code>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
            {sending && (
              <div className="assistant-thinking">
                <span className="assistant-avatar">
                  <Bot size={17} />
                </span>
                <span>
                  <LoaderCircle size={15} className="spin" /> Checking verified repository context…
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {error && (
            <p className="chat-error" role="alert">
              {error}
            </p>
          )}
          <form className="chat-input-area" onSubmit={(event) => void send(event)}>
            <label className="sr-only" htmlFor="chat-message">
              Ask a repository question
            </label>
            <textarea
              id="chat-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask about this repository…"
              maxLength={4000}
              rows={2}
            />
            <div className="chat-input-bottom">
              <span>
                <CornerDownLeft size={13} /> Enter to send · Shift + Enter for a new line
              </span>
              <button
                className="button button-primary button-small"
                disabled={sending || !draft.trim()}
              >
                {sending ? 'Thinking…' : 'Send message'} <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

/**
 * Converts the supplied value to ui message.
 * @param message - The message content.
 */
function toUiMessage(message: ChatMessage): UiMessage {
  return {
    key: message._id,
    role: message.role,
    content: message.content,
    citations: message.citations ?? [],
  };
}

/**
 * Renders the git branch icon interface.
 */
function GitBranchIcon() {
  return <GitBranch size={16} />;
}
