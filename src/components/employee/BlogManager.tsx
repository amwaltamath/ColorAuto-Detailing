import React, { useEffect, useMemo, useState } from 'react';

type BlogCategory = 'detailing' | 'ppf' | 'ceramic-coating' | 'window-tint' | 'color-ppf';

interface BlogGalleryItem {
  src: string;
  alt: string;
}

interface BlogPostRecord {
  slug: string;
  title: string;
  description: string;
  publish_date: string;
  image: string;
  image_alt: string;
  category: BlogCategory;
  featured: boolean;
  author: string;
  location: string;
  project_summary: string;
  services_performed: string[];
  duration: string;
  material_highlight: string;
  cta_label: string;
  cta_href: string;
  phone_number: string;
  gallery: BlogGalleryItem[];
  body_markdown?: string | null;
}

interface BlogPostApiResponse {
  ok: boolean;
  posts?: BlogPostRecord[];
  post?: BlogPostRecord;
  error?: string;
}

interface EditorState {
  slug: string;
  title: string;
  description: string;
  publishDate: string;
  category: BlogCategory;
  featured: boolean;
  author: string;
  location: string;
  projectSummary: string;
  servicesPerformed: string;
  duration: string;
  materialHighlight: string;
  ctaLabel: string;
  ctaHref: string;
  phoneNumber: string;
}

const CATEGORY_OPTIONS: Array<{ value: BlogCategory; label: string }> = [
  { value: 'detailing', label: 'Detailing' },
  { value: 'ppf', label: 'Paint Protection Film' },
  { value: 'ceramic-coating', label: 'Ceramic Coating' },
  { value: 'window-tint', label: 'Window Tint' },
  { value: 'color-ppf', label: 'Color PPF' },
];

const emptyEditor = (post: BlogPostRecord | null): EditorState => ({
  slug: post?.slug || '',
  title: post?.title || '',
  description: post?.description || '',
  publishDate: post?.publish_date || new Date().toISOString().slice(0, 10),
  category: post?.category || 'ppf',
  featured: post?.featured || false,
  author: post?.author || 'ColorAuto Team',
  location: post?.location || 'Grand Junction, CO',
  projectSummary: post?.project_summary || '',
  servicesPerformed: (post?.services_performed || []).join('\n'),
  duration: post?.duration || '2 days',
  materialHighlight: post?.material_highlight || 'XPEL Ultimate+ PPF',
  ctaLabel: post?.cta_label || 'paint protection film services',
  ctaHref: post?.cta_href || '/services/paint-protection-film',
  phoneNumber: post?.phone_number || '970-628-1505',
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const BlogManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPostRecord | null>(null);
  const [editor, setEditor] = useState<EditorState>(emptyEditor(null));
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogPostRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return posts;
    return posts.filter((post) => {
      return [post.title, post.description, post.category, post.location, post.author, post.slug]
        .some((field) => field.toLowerCase().includes(term));
    });
  }, [posts, search]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/employee/blog-posts');
      const json = (await response.json()) as BlogPostApiResponse;
      if (!response.ok || !json.ok) {
        throw new Error(json.error || 'Unable to load blog posts');
      }
      setPosts(Array.isArray(json.posts) ? json.posts : []);
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Unable to load blog posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openEditor = (post: BlogPostRecord) => {
    setSelectedPost(post);
    setEditor(emptyEditor(post));
    setStatusMessage('');
  };

  const closeEditor = () => {
    setSelectedPost(null);
    setEditor(emptyEditor(null));
  };

  const savePost = async () => {
    if (!selectedPost) return;

    setSaving(true);
    setStatusMessage('');

    try {
      const response = await fetch('/api/employee/blog-posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: selectedPost.slug,
          title: editor.title,
          description: editor.description,
          publishDate: editor.publishDate,
          category: editor.category,
          featured: editor.featured,
          author: editor.author,
          location: editor.location,
          projectSummary: editor.projectSummary,
          servicesPerformed: editor.servicesPerformed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
          duration: editor.duration,
          materialHighlight: editor.materialHighlight,
          ctaLabel: editor.ctaLabel,
          ctaHref: editor.ctaHref,
          phoneNumber: editor.phoneNumber,
        }),
      });
      const json = (await response.json()) as BlogPostApiResponse;
      if (!response.ok || !json.ok || !json.post) {
        throw new Error(json.error || 'Unable to save post');
      }

      setPosts((prev) => prev.map((post) => (post.slug === selectedPost.slug ? json.post! : post)));
      setSelectedPost(json.post);
      setEditor(emptyEditor(json.post));
      setStatusMessage('Post updated.');
    } catch (saveError: any) {
      setStatusMessage(saveError?.message || 'Unable to save post');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (post: BlogPostRecord) => {
    try {
      const response = await fetch('/api/employee/blog-posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: post.slug, featured: !post.featured }),
      });
      const json = (await response.json()) as BlogPostApiResponse;
      if (!response.ok || !json.ok || !json.post) {
        throw new Error(json.error || 'Unable to update post');
      }
      setPosts((prev) => prev.map((item) => (item.slug === post.slug ? json.post! : item)));
      if (selectedPost?.slug === post.slug) {
        setSelectedPost(json.post);
        setEditor(emptyEditor(json.post));
      }
      setStatusMessage(`Marked as ${json.post.featured ? 'featured' : 'not featured'}.`);
    } catch (toggleError: any) {
      setStatusMessage(toggleError?.message || 'Unable to update featured status');
    }
  };

  const deletePost = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch(`/api/employee/blog-posts/${deleteTarget.slug}`, { method: 'DELETE' });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error || 'Unable to delete post');
      }
      setPosts((prev) => prev.filter((post) => post.slug !== deleteTarget.slug));
      if (selectedPost?.slug === deleteTarget.slug) {
        closeEditor();
      }
      setDeleteTarget(null);
      setStatusMessage('Post deleted.');
    } catch (deleteError: any) {
      setStatusMessage(deleteError?.message || 'Unable to delete post');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        Manage live blog posts from Supabase. You can edit the project story, toggle featured, or delete posts without rebuilding the site.
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <label className="block w-full md:max-w-md">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Search posts</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, slug, category, or location"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <button
          type="button"
          onClick={fetchPosts}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {statusMessage && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{statusMessage}</div>}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">Loading blog posts...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">No posts found.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <article key={post.slug} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                  <img src={post.image} alt={post.image_alt} className="w-full lg:w-36 h-32 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">{post.category.replace('-', ' ')}</span>
                      <span>{formatDate(post.publish_date)}</span>
                      <span>{post.location}</span>
                      {post.featured && <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">Featured</span>}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{post.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button type="button" onClick={() => openEditor(post)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                        Edit
                      </button>
                      <button type="button" onClick={() => toggleFeatured(post)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                        {post.featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(post)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">
                        Delete
                      </button>
                      <a href={`/work/${post.slug}`} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                        View
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sticky top-4 h-fit">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">Edit Post</h3>
              {selectedPost && <span className="text-xs text-gray-500">{selectedPost.slug}</span>}
            </div>

            {selectedPost ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Title</span>
                    <input value={editor.title} onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Description</span>
                    <textarea value={editor.description} onChange={(e) => setEditor((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Project Summary</span>
                    <textarea value={editor.projectSummary} onChange={(e) => setEditor((prev) => ({ ...prev, projectSummary: e.target.value }))} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Services Performed</span>
                    <textarea value={editor.servicesPerformed} onChange={(e) => setEditor((prev) => ({ ...prev, servicesPerformed: e.target.value }))} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Publish Date</span>
                      <input type="date" value={editor.publishDate} onChange={(e) => setEditor((prev) => ({ ...prev, publishDate: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Category</span>
                      <select value={editor.category} onChange={(e) => setEditor((prev) => ({ ...prev, category: e.target.value as BlogCategory }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Author</span>
                      <input value={editor.author} onChange={(e) => setEditor((prev) => ({ ...prev, author: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Location</span>
                      <input value={editor.location} onChange={(e) => setEditor((prev) => ({ ...prev, location: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Duration</span>
                      <input value={editor.duration} onChange={(e) => setEditor((prev) => ({ ...prev, duration: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</span>
                      <input value={editor.phoneNumber} onChange={(e) => setEditor((prev) => ({ ...prev, phoneNumber: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">CTA Label</span>
                    <input value={editor.ctaLabel} onChange={(e) => setEditor((prev) => ({ ...prev, ctaLabel: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">CTA Link</span>
                    <input value={editor.ctaHref} onChange={(e) => setEditor((prev) => ({ ...prev, ctaHref: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Material Highlight</span>
                    <input value={editor.materialHighlight} onChange={(e) => setEditor((prev) => ({ ...prev, materialHighlight: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={editor.featured} onChange={(e) => setEditor((prev) => ({ ...prev, featured: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Featured on gallery pages</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="button" onClick={savePost} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={closeEditor} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a post to edit it.</p>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Delete post?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will remove <strong>{deleteTarget.title}</strong> and its uploaded images from Supabase Storage.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={deletePost} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
