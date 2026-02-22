import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roadmapApi } from '../api/roadmaps';
import type { RoadmapResponse, ContentResponse } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Play,
  Lock,
  CheckCircle2,
  Clock,
  BookOpen,
  Sparkles,
  X,
  AlertTriangle,
} from 'lucide-react';

const topicStatusIcon: Record<string, React.ReactNode> = {
  LOCKED: <Lock size={12} className="text-text-muted" />,
  AVAILABLE: <Play size={12} className="text-accent-blue" />,
  IN_PROGRESS: <Clock size={12} className="text-accent-orange" />,
  COMPLETED: <CheckCircle2 size={12} className="text-accent-green" />,
};

const topicStatusColor: Record<string, string> = {
  LOCKED: 'border-border-primary text-text-muted',
  AVAILABLE: 'border-accent-blue/30 text-accent-blue',
  IN_PROGRESS: 'border-accent-orange/30 text-accent-orange',
  COMPLETED: 'border-accent-green/30 text-accent-green',
};

export default function RoadmapDetail() {
  const { id } = useParams<{ id: string }>();
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentResponse | null>(null);
  const [generatingContent, setGeneratingContent] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadRoadmap();
  }, [id]);

  const loadRoadmap = async () => {
    try {
      const res = await roadmapApi.getById(id!);
      if (res.data.success) setRoadmap(res.data.data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      const res = await roadmapApi.start(id!);
      if (res.data.success) setRoadmap(res.data.data);
    } catch {
      // silently handle
    }
  };

  const handleGenerateContent = async (topicId: string, status: string) => {
    if (status === 'LOCKED') {
      setContentError('This topic is locked. Complete previous topics first or start the roadmap.');
      setSelectedTopic(topicId);
      setContent(null);
      return;
    }

    setGeneratingContent(topicId);
    setSelectedTopic(topicId);
    setContentError(null);
    try {
      const res = await roadmapApi.generateContent(topicId, 'THEORY');
      if (res.data.success) {
        setContent(res.data.data);
      } else {
        setContentError(res.data.message || 'Failed to generate content.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to generate content. The topic may be locked or unavailable.';
      setContentError(msg);
      setContent(null);
    } finally {
      setGeneratingContent(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Loader2 size={14} className="spinner" />
          loading roadmap...
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-text-muted">roadmap not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col fade-in">
      {/* Breadcrumb header */}
      <div className="px-10 py-5 border-b border-border-primary bg-bg-secondary shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <Link to="/roadmaps" className="text-text-muted hover:text-accent-blue transition-colors flex items-center gap-1">
            <ChevronLeft size={10} />
            roadmaps
          </Link>
          <ChevronRight size={10} className="text-text-muted" />
          <span className="text-text-primary">{roadmap.title}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Roadmap info + Topics */}
        <div className={`${content ? 'w-1/2' : 'w-full max-w-4xl mx-auto'} overflow-y-auto p-10 transition-all`}>
          {/* Roadmap header */}
          <div className="mb-8">
            <h1 className="text-lg font-semibold text-text-bright">{roadmap.title}</h1>
            {roadmap.description && (
              <p className="text-xs text-text-secondary mt-1">{roadmap.description}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-[12px] text-text-muted">
              <span className={`px-1.5 py-0.5 uppercase tracking-wider border rounded ${roadmap.status === 'ACTIVE'
                  ? 'bg-accent-dim-green text-accent-green border-accent-green/30'
                  : 'bg-bg-active text-text-muted border-border-secondary'
                }`}>
                {roadmap.status.toLowerCase()}
              </span>
              <span>{roadmap.totalTopics || 0} topics</span>
              <span>{roadmap.difficulty}</span>
              {roadmap.estimatedHours > 0 && <span>~{roadmap.estimatedHours}h</span>}
              {roadmap.estimatedWeeks > 0 && <span>{roadmap.estimatedWeeks} weeks</span>}
            </div>

            {/* Progress bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-bg-active rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-green rounded-full transition-all"
                  style={{ width: `${roadmap.progressPercentage || 0}%` }}
                />
              </div>
              <span className="text-xs text-text-secondary">
                {Math.round(roadmap.progressPercentage || 0)}%
              </span>
            </div>

            {roadmap.status === 'DRAFT' && (
              <button
                onClick={handleStart}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 text-xs bg-accent-dim-green border border-accent-green/30 rounded text-accent-green hover:bg-accent-green/20 transition-colors cursor-pointer"
              >
                <Play size={12} />
                start roadmap
              </button>
            )}

            {roadmap.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {roadmap.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-[12px] bg-bg-active border border-border-secondary rounded text-accent-cyan">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Topics list */}
          <div className="border border-border-primary rounded bg-bg-secondary">
            <div className="px-5 py-3 border-b border-border-primary flex items-center gap-2">
              <BookOpen size={14} className="text-accent-cyan" />
              <span className="text-sm font-medium">topics</span>
              <span className="text-[12px] text-text-muted ml-auto">
                {roadmap.completedTopics || 0}/{roadmap.totalTopics || 0} completed
              </span>
            </div>

            {roadmap.topics && roadmap.topics.length > 0 ? (
              <div className="divide-y divide-border-primary">
                {roadmap.topics
                  .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                  .map((topic, idx) => (
                    <div
                      key={topic.id}
                      className={`flex items-center gap-4 px-5 py-4 transition-colors group ${
                        topic.status === 'LOCKED'
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-bg-hover cursor-pointer'
                      } ${selectedTopic === topic.id ? 'bg-bg-hover border-l-2 border-accent-blue' : ''}`}
                      onClick={() => handleGenerateContent(topic.id, topic.status)}
                    >
                      {/* Sequence number */}
                      <span className={`w-7 h-7 flex items-center justify-center rounded text-[12px] border ${topicStatusColor[topic.status] || topicStatusColor.LOCKED}`}>
                        {idx + 1}
                      </span>

                      {/* Topic info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {topicStatusIcon[topic.status]}
                          <span className="text-sm text-text-primary group-hover:text-accent-blue transition-colors truncate">
                            {topic.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[12px] text-text-muted">
                          <span>{topic.status.toLowerCase().replace('_', ' ')}</span>
                          {topic.estimatedMinutes > 0 && <span>{topic.estimatedMinutes} min</span>}
                        </div>
                      </div>

                      {/* Generate button */}
                      {generatingContent === topic.id ? (
                        <Loader2 size={12} className="spinner text-accent-blue" />
                      ) : (
                        <Sparkles size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-text-muted">
                no topics generated
              </div>
            )}
          </div>
        </div>

        {/* Right: Content viewer / Error panel */}
        {(content || contentError) && (
          <div className="w-1/2 border-l border-border-primary overflow-y-auto bg-bg-secondary fade-in">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-primary sticky top-0 bg-bg-secondary z-10">
              <div className="flex items-center gap-2">
                {contentError ? (
                  <>
                    <AlertTriangle size={14} className="text-accent-orange" />
                    <span className="text-sm font-medium text-text-primary">cannot load content</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-accent-purple" />
                    <span className="text-sm font-medium text-text-primary">{content!.title}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {content?.aiGenerated && (
                  <span className="text-[11px] px-2 py-0.5 bg-accent-dim-blue border border-accent-blue/30 rounded text-accent-blue">
                    AI generated
                  </span>
                )}
                <button
                  onClick={() => { setContent(null); setContentError(null); setSelectedTopic(null); }}
                  className="text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {contentError ? (
              <div className="p-8">
                <div className="flex items-start gap-3 px-4 py-4 bg-accent-dim-orange border border-accent-orange/30 rounded">
                  <Lock size={16} className="text-accent-orange shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-accent-orange font-medium mb-1">topic unavailable</p>
                    <p className="text-xs text-text-secondary leading-relaxed">{contentError}</p>
                    {roadmap?.status === 'DRAFT' && (
                      <button
                        onClick={handleStart}
                        className="mt-3 flex items-center gap-2 px-3 py-1.5 text-xs bg-accent-dim-green border border-accent-green/30 rounded text-accent-green hover:bg-accent-green/20 transition-colors cursor-pointer"
                      >
                        <Play size={12} />
                        start roadmap first
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content!.markdownContent || 'No content available.'}
                </ReactMarkdown>

                {content!.keyPoints && content!.keyPoints.length > 0 && (
                  <div className="mt-8 border border-border-primary rounded p-5 bg-bg-primary">
                    <h4 className="text-sm font-semibold text-accent-green mb-3">key takeaways</h4>
                    <ul className="space-y-2">
                      {content!.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                          <ChevronRight size={10} className="text-accent-green mt-0.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
