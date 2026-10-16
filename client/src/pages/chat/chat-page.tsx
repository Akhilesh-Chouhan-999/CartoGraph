import {
  AlertCircle,
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
  Waypoints,
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
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const current = await analysisService.get(analysisId);
      const [owner, sourceFiles]: [Project, FileRecord[]] = await Promise.all([
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
        <div className="chat-header-main">
          <span className="eyebrow">
            <span className="eyebrow-dot" /> GROUNDED REPOSITORY ASSISTANT
          </span>
          <h1>AI codebase chat</h1>
          <p className="chat-header-desc">
            Ask questions about verified files and architectural dependencies in{' '}
            <strong>
              {project?.owner}/{project?.repository}
            </strong>
            .
          </p>
        </div>
        <div
          className="verified-pill"
          title="Answers are verified against the deterministic AST graph"
        >
          <Sparkles size={14} className="verified-sparkle" aria-hidden="true" />
          <span>Graph-verified context</span>
        </div>
      </header>

      <div className="chat-layout">
        <aside className="chat-context panel" aria-label="Analysis context">
          <div className="context-header">
            <span className="eyebrow">ANALYSIS CONTEXT</span>
            <h2 className="context-repo-name" title={project?.repository}>
              {project?.repository ?? 'Repository'}
            </h2>
            {project?.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="context-repo-url text-link"
                title="View repository on GitHub"
              >
                <span>{project.githubUrl.replace(/^https?:\/\//, '')}</span>
                <ArrowRight size={12} className="rotate-up-right" />
              </a>
            )}
          </div>

          <div className="context-metrics-group">
            <div className="context-metric">
              <FileCode2 size={16} className="context-metric-icon" aria-hidden="true" />
              <div>
                <strong>{analysis?.fileCount.toLocaleString() ?? 0}</strong>
                <span>analyzed files</span>
              </div>
            </div>
            <div className="context-metric">
              <GitBranchIcon />
              <div>
                <strong>{analysis?.dependencyCount.toLocaleString() ?? 0}</strong>
                <span>verified edges</span>
              </div>
            </div>
          </div>

          <div className="context-commit">
            <small>EXACT COMMIT</small>
            <div className="context-commit-sha">
              <code>{analysis?.commitSha ? analysis.commitSha.slice(0, 10) : '—'}</code>
            </div>
          </div>

          <Link
            to={`/analyses/${analysisId}/graph`}
            className="button button-outline button-small full-width context-graph-btn"
          >
            <Waypoints size={15} aria-hidden="true" />
            <span>Open dependency graph</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>

          <div className="context-note">
            <Sparkles size={16} className="context-note-icon" aria-hidden="true" />
            <div className="context-note-text">
              <strong>Deterministic Grounding</strong>
              <p>
                Answers are generated from repository AST tools. The assistant cannot invent
                unverified dependency edges.
              </p>
            </div>
          </div>
        </aside>

        <section className="chat-conversation panel" aria-label="Conversation">
          <div className="conversation-header">
            <div className="assistant-identity">
              <div className="assistant-avatar" aria-hidden="true">
                <Bot size={18} />
              </div>
              <div className="assistant-info">
                <strong>CartoGraph Assistant</strong>
                <span className="assistant-status">
                  <span className="status-dot-active" aria-hidden="true" /> Grounded in analysis
                </span>
              </div>
            </div>

            <div className="conversation-actions">
              {sessionId && (
                <button
                  type="button"
                  className="icon-button delete-chat-btn"
                  aria-label="Delete conversation"
                  title="Delete conversation"
                  onClick={() => void deleteConversation()}
                  disabled={deletingSession || sending}
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                type="button"
                className="button button-outline button-small new-chat-btn"
                onClick={() => void startConversation()}
                disabled={creatingSession || sending}
              >
                <Plus size={15} aria-hidden="true" />
                <span>New chat</span>
              </button>
            </div>
          </div>

          <div className="message-list" role="log" aria-live="polite">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <div className="welcome-orb" aria-hidden="true">
                  <Bot size={28} />
                </div>
                <h2>Explore your codebase</h2>
                <p>
                  Ask questions about architectural patterns, import flow, critical file
                  dependencies, or change impact.
                </p>
                <div className="suggestion-section">
                  <span className="suggestion-label">Suggested prompts</span>
                  <div className="suggestion-list">
                    {suggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion}
                        className="suggestion-pill"
                        onClick={() => setDraft(suggestion)}
                      >
                        <span className="suggestion-text">{suggestion}</span>
                        <ArrowRight size={14} className="suggestion-arrow" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.key}
                  className={`chat-message message-${message.role}`}
                  aria-label={`${message.role === 'assistant' ? 'Assistant' : 'User'} message`}
                >
                  <span className="message-avatar" aria-hidden="true">
                    {message.role === 'assistant' ? <Bot size={16} /> : <UserRound size={16} />}
                  </span>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-author">
                        {message.role === 'assistant' ? 'CartoGraph' : 'You'}
                      </span>
                    </div>
                    <div className="message-body">
                      <p>{message.content}</p>
                    </div>

                    {message.citations.length > 0 && (
                      <div className="citation-list">
                        <div className="citation-header">
                          <Sparkles size={13} aria-hidden="true" />
                          <span>VERIFIED SOURCES ({message.citations.length})</span>
                        </div>
                        {message.citations.map((citation, index) => {
                          const file = fileByPath.get(citation.path);
                          return (
                            <div className="citation-row" key={`${citation.path}-${index}`}>
                              <div className="citation-target">
                                <FileCode2 size={14} className="citation-icon" aria-hidden="true" />
                                {file ? (
                                  <Link
                                    className="citation-file"
                                    to={`/analyses/${analysisId}/files/${file._id}`}
                                    title={`View details for ${citation.path}`}
                                  >
                                    <code>{citation.path}</code>
                                    {citation.line && (
                                      <span className="citation-line">:{citation.line}</span>
                                    )}
                                  </Link>
                                ) : (
                                  <span className="citation-unlinked">
                                    <code>{citation.path}</code>
                                  </span>
                                )}
                              </div>
                              {file && (
                                <div className="citation-actions">
                                  <Link
                                    to={`/analyses/${analysisId}/graph?fileId=${file._id}`}
                                    className="citation-action-link"
                                    title="Highlight in dependency graph"
                                  >
                                    Graph
                                  </Link>
                                  <Link
                                    to={`/analyses/${analysisId}/path?source=${file._id}`}
                                    className="citation-action-link"
                                    title="Find paths starting from this file"
                                  >
                                    Path
                                  </Link>
                                  <Link
                                    to={`/analyses/${analysisId}/files/${file._id}/blast-radius`}
                                    className="citation-action-link"
                                    title="View blast radius and affected files"
                                  >
                                    Impact
                                  </Link>
                                </div>
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
              <div className="assistant-thinking" role="status" aria-live="polite">
                <span className="assistant-avatar" aria-hidden="true">
                  <Bot size={16} />
                </span>
                <div className="thinking-bubble">
                  <LoaderCircle size={15} className="spin text-brand" aria-hidden="true" />
                  <span>Checking verified repository context…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="chat-error-banner" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
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
              placeholder="Ask about this repository’s architecture, imports, or file dependencies…"
              maxLength={4000}
              rows={2}
            />
            <div className="chat-input-bottom">
              <span className="composer-shortcuts">
                <CornerDownLeft size={13} aria-hidden="true" />
                <span>Enter to send · Shift + Enter for a new line</span>
              </span>
              <button
                type="submit"
                className="button button-primary button-small send-btn"
                disabled={sending || !draft.trim()}
              >
                {sending ? (
                  <>
                    <LoaderCircle size={14} className="spin" aria-hidden="true" />
                    <span>Thinking…</span>
                  </>
                ) : (
                  <>
                    <span>Send message</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </>
                )}
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
