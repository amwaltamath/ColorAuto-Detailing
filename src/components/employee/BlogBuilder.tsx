import React, { useMemo, useState } from 'react';

type BlogCategory = 'detailing' | 'ppf' | 'ceramic-coating' | 'window-tint' | 'color-ppf';

interface CreatePostResponse {
  ok?: boolean;
  slug?: string;
  postPath?: string;
  postId?: string;
  imagePaths?: string[];
  storage?: 'supabase' | 'filesystem';
  error?: string;
}

const CATEGORY_OPTIONS: Array<{ value: BlogCategory; label: string }> = [
  { value: 'detailing', label: 'Detailing' },
  { value: 'ppf', label: 'Paint Protection Film (PPF)' },
  { value: 'ceramic-coating', label: 'Ceramic Coating' },
  { value: 'window-tint', label: 'Window Tint' },
  { value: 'color-ppf', label: 'Color PPF' },
];

const toTitle = (category: BlogCategory) => category.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

export const BlogBuilder: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Grand Junction, CO');
  const [author, setAuthor] = useState('ColorAuto Team');
  const [category, setCategory] = useState<BlogCategory>('ppf');
  const [featured, setFeatured] = useState(false);
  const [projectSummary, setProjectSummary] = useState('');
  const [servicesPerformed, setServicesPerformed] = useState('');
  const [duration, setDuration] = useState('2 days');
  const [materialHighlight, setMaterialHighlight] = useState('XPEL Ultimate+ PPF');
  const [ctaLabel, setCtaLabel] = useState('paint protection film services');
  const [ctaHref, setCtaHref] = useState('/services/paint-protection-film');
  const [phoneNumber, setPhoneNumber] = useState('970-628-1505');
  const [imageAltPrefix, setImageAltPrefix] = useState('Project photo');
  const [photos, setPhotos] = useState<File[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<null | { slug: string; destination: string; imageCount: number }>(null);

  const canSubmit = useMemo(() => {
    return Boolean(title.trim() && description.trim() && projectSummary.trim() && servicesPerformed.trim() && photos.length > 0);
  }, [title, description, projectSummary, servicesPerformed, photos]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    setPhotos(incoming);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setProjectSummary('');
    setServicesPerformed('');
    setFeatured(false);
    setPhotos([]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess(null);

    if (!canSubmit) {
      setError('Please complete all required fields and add at least one photo.');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('location', location.trim());
      formData.append('author', author.trim());
      formData.append('category', category);
      formData.append('featured', String(featured));
      formData.append('projectSummary', projectSummary.trim());
      formData.append('servicesPerformed', servicesPerformed.trim());
      formData.append('duration', duration.trim());
      formData.append('materialHighlight', materialHighlight.trim());
      formData.append('ctaLabel', ctaLabel.trim());
      formData.append('ctaHref', ctaHref.trim());
      formData.append('phoneNumber', phoneNumber.trim());
      formData.append('imageAltPrefix', imageAltPrefix.trim());

      photos.forEach((file) => {
        formData.append('photos', file, file.name);
      });

      const response = await fetch('/api/employee/blog-builder', {
        method: 'POST',
        body: formData,
      });

      const payload = (await response.json()) as CreatePostResponse;
      if (!response.ok || !payload.ok || !payload.slug) {
        throw new Error(payload.error || 'Failed to create blog post');
      }

      const destination = payload.storage === 'supabase'
        ? `Supabase row ${payload.postId || '(created)'}`
        : payload.postPath || 'src/content/blog';

      setSuccess({
        slug: payload.slug,
        destination,
        imageCount: Array.isArray(payload.imagePaths) ? payload.imagePaths.length : photos.length,
      });

      resetForm();
    } catch (submitError: any) {
      setError(submitError?.message || 'Could not create blog post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        Creates a new project post using your existing template and uploads photos to managed storage.
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Post Title *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="2026 Tesla Model Y Full Front PPF Protection"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Category *</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BlogCategory)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Description *</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Short SEO description for the card and page meta."
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Project Summary *</span>
            <textarea
              value={projectSummary}
              onChange={(e) => setProjectSummary(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="How the project started and what the customer wanted."
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Services Performed *</span>
            <textarea
              value={servicesPerformed}
              onChange={(e) => setServicesPerformed(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="One service per line (example: Full front bumper wrap)."
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Duration</span>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Material/Product Highlight</span>
            <input
              value={materialHighlight}
              onChange={(e) => setMaterialHighlight(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Author</span>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Location</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">CTA Label</span>
            <input
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">CTA Link</span>
            <input
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="/services/paint-protection-film"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Phone Number</span>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Image Alt Prefix</span>
            <input
              value={imageAltPrefix}
              onChange={(e) => setImageAltPrefix(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Tesla Model Y PPF photo"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Project Photos *</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              onChange={handlePhotoChange}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              First image becomes the featured cover image. Uploaded files: {photos.length}
            </p>
          </label>

          <label className="inline-flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Mark as featured on project pages</span>
          </label>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Blog post created successfully.
            <div className="mt-1 text-xs text-emerald-900">
              Slug: {success.slug} | Saved to: {success.destination} | Photos saved: {success.imageCount}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">Template Preview</p>
          <p className="mt-1">This post will be generated in your existing case study layout with:</p>
          <ul className="mt-2 list-disc pl-5 text-xs leading-6 text-gray-600">
            <li>Frontmatter for title, description, category, featured, author, location, and cover image</li>
            <li>Project summary intro</li>
            <li>Service bullet list</li>
            <li>Process and results section</li>
            <li>Project gallery block with uploaded photos</li>
            <li>CTA links and phone line</li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">Current category: {toTitle(category)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? 'Creating Post...' : 'Create Blog Post'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};
