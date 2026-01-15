import { useState } from 'react';

export const ProfileSettings = () => {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    specialties: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const commonSpecialties = [
    'Auto Detailing',
    'Ceramic Coating',
    'Paint Correction',
    'Window Tinting',
    'PPF Installation',
    'Interior Cleaning',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const toggleSpecialty = (specialty: string) => {
    setProfile({
      ...profile,
      specialties: profile.specialties.includes(specialty)
        ? profile.specialties.filter(s => s !== specialty)
        : [...profile.specialties, specialty],
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/employee/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('user_id') || '',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setMessage('Profile saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error saving profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
          <input
            type="text"
            name="first_name"
            value={profile.first_name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            placeholder="John"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
          <input
            type="text"
            name="last_name"
            value={profile.last_name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            placeholder="Doe"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
        <input
          type="email"
          name="email"
          value={profile.email}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
        <input
          type="tel"
          name="phone"
          value={profile.phone}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
        <textarea
          name="bio"
          value={profile.bio}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Specialties</label>
        <div className="grid grid-cols-2 gap-3">
          {commonSpecialties.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => toggleSpecialty(specialty)}
              className={`px-4 py-2 rounded border text-sm font-medium transition ${
                profile.specialties.includes(specialty)
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded text-sm ${message.includes('success') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
};
