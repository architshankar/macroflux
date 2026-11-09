import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Dumbbell,
  Sparkles,
  Users,
  ClipboardList,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  UserPlus,
  ListPlus,
  ImagePlus,
  Info,
  Save,
  LayoutGrid,
  Image as ImageIcon,
  Upload,
  KeyRound,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  AdminGym,
  AdminGymUpdatePayload,
  EquipmentCategory,
  EquipmentModel,
  Amenity,
  AmenityIcon,
  GymEquipment,
  GymAmenity,
  GymTrainerAffiliation,
  GymAdminRow,
  GymPlan,
  GymPlanAssignment,
  GymGalleryPhoto,
  AdminTrainer,
  EquipmentTypesByCategory,
  EquipmentTypeCategory,
  GymEquipmentType,
  updateGymAdmin,
  uploadGymPhoto,
  listGymGallery,
  addGymGalleryPhoto,
  deleteGymGalleryPhoto,
  listEquipmentCategories,
  createEquipmentCategory,
  listEquipmentModels,
  createEquipmentModel,
  listAmenityCatalog,
  createAmenityCatalog,
  updateAmenityCatalog,
  listAmenityIcons,
  createAmenityIcon,
  uploadAmenityIconPhoto,
  listGymEquipment,
  attachGymEquipment,
  updateGymEquipment,
  detachGymEquipment,
  listGymAmenities,
  attachGymAmenity,
  detachGymAmenity,
  listGymTrainers,
  affiliateGymTrainer,
  setGymTrainerStatus,
  getAllTrainers,
  listGymPlans,
  deleteGymPlan,
  setGymPlanEnabled,
  listGymPlanAssignments,
  assignGymPlan,
  unassignGymPlan,
  listGymAdmins,
  addGymAdmin,
  removeGymAdmin,
  createGymManagerAccount,
  getUsers,
  listEquipmentTypesCatalog,
  listGymEquipmentTypes,
  attachGymEquipmentType,
  detachGymEquipmentType,
} from '../adminService';
import { UserAccount } from '../types';
import { GymPlanEditor } from './GymPlanEditor';
import { GymMembersTab, UserPicker, copyToClipboard } from './GymMembersTab';
import { uploadToCloudinary, isCloudinaryConfigured } from '../cloudinaryClient';

interface GymDetailPanelProps {
  gym: AdminGym;
  onBack: () => void;
  showToast: (msg: string) => void;
}

const card = 'bg-[#141414] border border-[#252525] rounded-xl p-6 space-y-4';
const th = 'px-4 py-3';
const td = 'px-4 py-3';
const inputCls = 'w-full bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-2.5 rounded-lg text-white outline-none text-xs font-mono';

type DetailTab = 'info' | 'equipment' | 'types' | 'amenities' | 'trainers' | 'plans' | 'members' | 'admins';

export function GymDetailPanel({ gym, onBack, showToast }: GymDetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>('info');
  const [gymState, setGymState] = useState<AdminGym>(gym);

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'equipment', label: 'Equipment', icon: Dumbbell },
    { id: 'types', label: 'Equipment Types', icon: LayoutGrid },
    { id: 'amenities', label: 'Amenities', icon: Sparkles },
    { id: 'trainers', label: 'Trainers', icon: Users },
    { id: 'plans', label: 'Plans', icon: ClipboardList },
    { id: 'members', label: 'Members & Code', icon: KeyRound },
    { id: 'admins', label: 'Admins', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to gyms
        </button>
      </div>

      <div
        className="relative rounded-xl overflow-hidden border border-[#252525] bg-cover bg-center"
        style={gymState.photo_url ? { backgroundImage: `url(${gymState.photo_url})` } : undefined}
      >
        <div className={`p-6 ${gymState.photo_url ? 'bg-black/60 backdrop-blur-[1px]' : 'bg-[#141414]'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-display font-semibold text-2xl tracking-tight text-white">{gymState.name}</h1>
              <p className="text-[#CBCBCB] text-xs sm:text-sm mt-1">
                {gymState.city ? `${gymState.city} — ` : ''}
                {gymState.address}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${gymState.tier === 'paid' ? 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                {gymState.tier} tier
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-zinc-800 text-zinc-300 border-zinc-700">{gymState.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border border-zinc-800 rounded-lg p-1 overflow-x-auto bg-[#0D0D0D] w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded font-mono text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 whitespace-nowrap ${
              tab === t.id ? 'bg-[#CCFF00] text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && <InfoTab gym={gymState} onUpdated={setGymState} showToast={showToast} />}
      {tab === 'equipment' && <EquipmentTab gymId={gymState.id} showToast={showToast} />}
      {tab === 'types' && <EquipmentTypesTab gymId={gymState.id} showToast={showToast} />}
      {tab === 'amenities' && <AmenitiesTab gymId={gymState.id} showToast={showToast} />}
      {tab === 'trainers' && <TrainersTab gymId={gymState.id} showToast={showToast} />}
      {tab === 'plans' && <PlansTab gymId={gymState.id} showToast={showToast} />}
      {tab === 'members' && (
        <GymMembersTab
          gym={gymState}
          showToast={showToast}
          onGymPatched={(patch) => setGymState((g) => ({ ...g, ...patch }))}
          onGoToPlans={() => setTab('plans')}
        />
      )}
      {tab === 'admins' && <AdminsTab gymId={gymState.id} showToast={showToast} />}
    </div>
  );
}

// =====================================================================
// INFO — edit gym fields + photo (PATCH /admin/gyms/{id}, POST .../photo)
// =====================================================================
function InfoTab({ gym, onUpdated, showToast }: { gym: AdminGym; onUpdated: (g: AdminGym) => void; showToast: (msg: string) => void }) {
  const [form, setForm] = useState({
    name: gym.name,
    description: gym.description || '',
    address: gym.address,
    city: gym.city || '',
    phone: gym.phone || '',
    lat: gym.lat != null ? String(gym.lat) : '',
    lng: gym.lng != null ? String(gym.lng) : '',
    walkthrough_video_url: gym.walkthrough_video_url || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: AdminGymUpdatePayload = {
        name: form.name,
        description: form.description || null,
        address: form.address,
        city: form.city || null,
        phone: form.phone || null,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        walkthrough_video_url: form.walkthrough_video_url || null,
      };
      const updated = await updateGymAdmin(gym.id, payload);
      onUpdated(updated);
      showToast('Gym details updated');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error updating gym');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    setIsUploadingPhoto(true);
    try {
      const { url } = await uploadGymPhoto(gym.id, photoFile);
      onUpdated({ ...gym, photo_url: url });
      setPhotoFile(null);
      showToast('Gym photo updated');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error uploading photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">Gym Photo</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div
            className="w-full sm:w-48 h-32 rounded-lg bg-zinc-900 border border-zinc-800 bg-cover bg-center shrink-0 flex items-center justify-center"
            style={gym.photo_url ? { backgroundImage: `url(${gym.photo_url})` } : undefined}
          >
            {!gym.photo_url && <span className="text-zinc-600 text-[10px] font-mono">No photo yet</span>}
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="w-full bg-[#0D0D0D] border border-zinc-800 rounded-lg p-2 text-white text-xs font-mono file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zinc-800 file:text-zinc-300 file:text-xs"
            />
            <button
              onClick={handleUploadPhoto}
              disabled={!photoFile || isUploadingPhoto}
              className="py-2 px-4 bg-[#CCFF00] text-black font-display font-bold rounded-lg uppercase text-xs tracking-wider flex items-center gap-1.5 disabled:opacity-50"
            >
              <ImagePlus className="w-3.5 h-3.5" /> {isUploadingPhoto ? 'Uploading...' : gym.photo_url ? 'Replace Photo' : 'Upload Photo'}
            </button>
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">Gym Details</h3>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input required placeholder="Name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required placeholder="Address" className={`${inputCls} sm:col-span-2`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input placeholder="City" className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input placeholder="Phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Latitude" type="number" step="any" className={inputCls} value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          <input placeholder="Longitude" type="number" step="any" className={inputCls} value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
          <input placeholder="Description" className={`${inputCls} sm:col-span-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input
            placeholder="Walkthrough video URL (YouTube, unlisted)"
            className={`${inputCls} sm:col-span-3`}
            value={form.walkthrough_video_url}
            onChange={(e) => setForm({ ...form, walkthrough_video_url: e.target.value })}
          />
          <button type="submit" disabled={isSaving} className="py-2.5 bg-[#CCFF00] text-black font-display font-bold rounded-lg uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>

      <GalleryTab gymId={gym.id} showToast={showToast} />
    </div>
  );
}

// =====================================================================
// GALLERY — Cloudinary-hosted photos (spec §12a). Backend never sees the
// file: browser uploads to Cloudinary via an unsigned preset, then we relay
// {image_url, cloudinary_public_id} to POST /admin/gyms/{id}/gallery.
// =====================================================================
function GalleryTab({ gymId, showToast }: { gymId: string; showToast: (msg: string) => void }) {
  const [photos, setPhotos] = useState<GymGalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const ph = await listGymGallery(gymId);
      setPhotos(ph.sort((a, b) => a.position - b.position));
    } catch (err) {
      console.error(err);
      showToast('Error loading gallery');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  const handleUpload = async (files: FileList) => {
    if (!isCloudinaryConfigured()) {
      showToast('Cloudinary is not configured yet — set VITE_CLOUDINARY_UPLOAD_PRESET in .env.local');
      return;
    }
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { secure_url, public_id } = await uploadToCloudinary(file);
        const photo = await addGymGalleryPhoto(gymId, { image_url: secure_url, cloudinary_public_id: public_id });
        setPhotos((prev) => [...prev, photo]);
      }
      showToast('Gallery photo(s) uploaded');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error uploading gallery photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photo: GymGalleryPhoto) => {
    try {
      await deleteGymGalleryPhoto(gymId, photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      showToast('Gallery photo removed');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error removing gallery photo');
    }
  };

  return (
    <div className={card}>
      <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3 flex items-center gap-2">
        <ImageIcon className="w-4 h-4" /> Gallery
      </h3>
      {!isCloudinaryConfigured() && (
        <p className="text-amber-400/80 text-[11px] font-mono bg-amber-400/10 border border-amber-400/20 rounded-lg p-2.5">
          Cloudinary upload preset not configured — set VITE_CLOUDINARY_UPLOAD_PRESET in .env.local
          (create an unsigned preset in the Cloudinary dashboard first).
        </p>
      )}
      {isLoading ? (
        <p className="text-zinc-500 text-xs font-mono">Loading...</p>
      ) : photos.length === 0 ? (
        <p className="text-zinc-500 text-xs font-mono py-1">No gallery photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 group">
              <img src={p.image_url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(p)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-zinc-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-[#CCFF00] hover:text-[#CCFF00] cursor-pointer w-fit">
        <Upload className="w-3.5 h-3.5" /> {isUploading ? 'Uploading...' : 'Upload photos'}
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          disabled={isUploading}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) handleUpload(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}

// =====================================================================
// EQUIPMENT
// =====================================================================
function EquipmentTab({ gymId, showToast }: { gymId: string; showToast: (msg: string) => void }) {
  const [gymEquipment, setGymEquipment] = useState<GymEquipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newModel, setNewModel] = useState({ brand: '', model_name: '', photo_url: '' });
  const [editingQty, setEditingQty] = useState<{ id: string; value: string } | null>(null);

  const loadCore = async () => {
    setIsLoading(true);
    try {
      const [ge, cats] = await Promise.all([listGymEquipment(gymId), listEquipmentCategories()]);
      setGymEquipment(ge);
      setCategories(cats);
    } catch (err) {
      console.error(err);
      showToast('Error loading equipment');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  const searchModels = async () => {
    try {
      const results = await listEquipmentModels(modelSearch || undefined, selectedCategoryId || undefined);
      setModels(results);
    } catch (err) {
      console.error(err);
      showToast('Error searching equipment models');
    }
  };

  useEffect(() => {
    searchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createEquipmentCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, cat]);
      setSelectedCategoryId(cat.id);
      setNewCategoryName('');
      showToast(`Category "${cat.name}" created`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error creating category');
    }
  };

  const handleAttachExisting = async (model: EquipmentModel) => {
    try {
      await attachGymEquipment(gymId, { equipment_model_id: model.id });
      showToast(`Attached "${model.brand} ${model.model_name}" to this gym`);
      loadCore();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error attaching equipment');
    }
  };

  const handleCreateAndAttachModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      showToast('Pick or create a category first');
      return;
    }
    if (!newModel.brand.trim() || !newModel.model_name.trim()) return;
    try {
      const model = await createEquipmentModel({
        category_id: selectedCategoryId,
        brand: newModel.brand,
        model_name: newModel.model_name,
        photo_url: newModel.photo_url || null,
      });
      await attachGymEquipment(gymId, { equipment_model_id: model.id });
      showToast(`Created and attached "${model.brand} ${model.model_name}"`);
      setNewModel({ brand: '', model_name: '', photo_url: '' });
      searchModels();
      loadCore();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error creating equipment model');
    }
  };

  const handleSaveQty = async (gymEquipmentId: string) => {
    if (!editingQty) return;
    try {
      const qty = editingQty.value === '' ? null : parseInt(editingQty.value, 10);
      await updateGymEquipment(gymId, gymEquipmentId, { quantity: qty });
      showToast('Quantity updated');
      setEditingQty(null);
      loadCore();
    } catch (err) {
      console.error(err);
      showToast('Error updating quantity');
    }
  };

  const handleDetach = async (ge: GymEquipment) => {
    if (!window.confirm(`Remove "${ge.equipment_model.brand} ${ge.equipment_model.model_name}" from this gym?`)) return;
    try {
      await detachGymEquipment(gymId, ge.id);
      showToast('Equipment removed from gym');
      loadCore();
    } catch (err) {
      console.error(err);
      showToast('Error removing equipment');
    }
  };

  const attachedModelIds = new Set(gymEquipment.map((ge) => ge.equipment_model.id));

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Attach Equipment (search-or-create, reusable across gyms)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[#9A9A9A] text-[10px] uppercase block mb-1">Category</label>
            <select className={inputCls} value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[#9A9A9A] text-[10px] uppercase block mb-1">New category name</label>
              <input className={inputCls} placeholder="e.g. Hack Squat" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            </div>
            <button type="button" onClick={handleCreateCategory} className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-[#CCFF00] hover:text-[#CCFF00]">
              Add category
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search existing models by brand/name..."
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchModels())}
              className="w-full pl-9 pr-4 py-2 bg-[#0D0D0D] border border-[#252525] focus:border-[#CCFF00] rounded-lg text-xs font-mono outline-none text-white"
            />
          </div>
          <button type="button" onClick={searchModels} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-zinc-700">
            Search
          </button>
        </div>

        {models.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {models.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-[#0D0D0D] border border-zinc-800 rounded-lg p-3 text-xs font-mono">
                <div>
                  <div className="text-white font-semibold">{m.brand} {m.model_name}</div>
                  <div className="text-zinc-500 text-[10px]">{m.category_name}</div>
                </div>
                <button
                  onClick={() => handleAttachExisting(m)}
                  disabled={attachedModelIds.has(m.id)}
                  className="px-2.5 py-1 rounded bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/20 disabled:opacity-30 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> {attachedModelIds.has(m.id) ? 'Attached' : 'Attach'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-zinc-900 pt-4">
          <h4 className="text-zinc-500 text-[10px] uppercase tracking-wider mb-3">Or create a new brand/model</h4>
          <form onSubmit={handleCreateAndAttachModel} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input required placeholder="Brand" className={inputCls} value={newModel.brand} onChange={(e) => setNewModel({ ...newModel, brand: e.target.value })} />
            <input required placeholder="Model name" className={inputCls} value={newModel.model_name} onChange={(e) => setNewModel({ ...newModel, model_name: e.target.value })} />
            <input placeholder="Photo URL (optional)" className={inputCls} value={newModel.photo_url} onChange={(e) => setNewModel({ ...newModel, photo_url: e.target.value })} />
            <button type="submit" className="py-2.5 bg-[#CCFF00] text-black font-display font-bold rounded-lg uppercase text-xs tracking-wider flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Create & Attach
            </button>
          </form>
        </div>
      </div>

      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          This Gym's Equipment ({gymEquipment.length})
        </h3>
        {isLoading ? (
          <p className="text-zinc-500 text-xs font-mono">Loading...</p>
        ) : gymEquipment.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono py-2">No equipment attached yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
              <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
                <tr>
                  <th className={th}>Model</th>
                  <th className={th}>Category</th>
                  <th className={th}>Quantity</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {gymEquipment.map((ge) => (
                  <tr key={ge.id} className="hover:bg-[#1A1A1A]">
                    <td className={`${td} text-white font-sans font-semibold`}>{ge.equipment_model.brand} {ge.equipment_model.model_name}</td>
                    <td className={td}>{ge.equipment_model.category_name}</td>
                    <td className={td}>
                      {editingQty?.id === ge.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-16 bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] rounded px-2 py-1 text-white outline-none"
                            value={editingQty.value}
                            onChange={(e) => setEditingQty({ id: ge.id, value: e.target.value })}
                          />
                          <button onClick={() => handleSaveQty(ge.id)} className="text-emerald-400 hover:text-emerald-300">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingQty(null)} className="text-zinc-500 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setEditingQty({ id: ge.id, value: ge.quantity != null ? String(ge.quantity) : '' })} className="flex items-center gap-1.5 hover:text-[#CCFF00]">
                          {ge.quantity ?? '—'} <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                    <td className={`${td} text-right`}>
                      <button onClick={() => handleDetach(ge)} className="p-1 px-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 inline-flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" /> Detach
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// EQUIPMENT TYPES — EQUIPMENT_TYPES_MODULE_SPEC.md §4
// Fixed/seeded catalog (plates/dumbbells/accessories), no admin CRUD on the
// catalog itself — just a per-gym multi-select, one attach/detach call per
// toggle, mirroring how AmenitiesTab above does attach/detach.
// =====================================================================
const EQUIPMENT_TYPE_CATEGORIES: { id: EquipmentTypeCategory; label: string }[] = [
  { id: 'plates', label: 'Plates' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'accessories', label: 'Accessories' },
];

function EquipmentTypesTab({ gymId, showToast }: { gymId: string; showToast: (msg: string) => void }) {
  const [catalog, setCatalog] = useState<EquipmentTypesByCategory>({ plates: [], dumbbells: [], accessories: [] });
  const [selections, setSelections] = useState<GymEquipmentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [cat, gymTypes] = await Promise.all([listEquipmentTypesCatalog(), listGymEquipmentTypes(gymId)]);
      setCatalog(cat);
      setSelections(gymTypes);
    } catch (err) {
      console.error(err);
      showToast('Error loading equipment types');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  const selectionByTypeId = new Map(selections.map((s) => [s.equipment_type.id, s]));

  const handleToggle = async (typeId: string, typeName: string) => {
    const existing = selectionByTypeId.get(typeId);
    setPendingId(typeId);
    try {
      if (existing) {
        await detachGymEquipmentType(gymId, existing.id);
        showToast(`Removed "${typeName}"`);
      } else {
        await attachGymEquipmentType(gymId, typeId);
        showToast(`Added "${typeName}"`);
      }
      load();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error updating equipment type');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Equipment Types — quick multi-select tags (separate from the brand/model Equipment catalog)
        </h3>
        <p className="text-zinc-500 text-[11px]">
          A category's carousel is hidden on the gym's page entirely if nothing is selected here — no need to
          "clear" a category, just leave it untouched.
        </p>

        {isLoading ? (
          <p className="text-zinc-500 text-xs font-mono">Loading...</p>
        ) : (
          <div className="space-y-6">
            {EQUIPMENT_TYPE_CATEGORIES.map(({ id: categoryId, label }) => {
              const items = catalog[categoryId] || [];
              return (
                <div key={categoryId}>
                  <h4 className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2">
                    {label} ({items.filter((t) => selectionByTypeId.has(t.id)).length}/{items.length} selected)
                  </h4>
                  {items.length === 0 ? (
                    <p className="text-zinc-600 text-[10px] font-mono">No catalog entries for this category.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {items.map((t) => {
                        const isSelected = selectionByTypeId.has(t.id);
                        const isPending = pendingId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            disabled={isPending}
                            onClick={() => handleToggle(t.id, t.name)}
                            className={`relative rounded-lg overflow-hidden border text-left transition-all disabled:opacity-50 ${
                              isSelected ? 'border-[#CCFF00] ring-1 ring-[#CCFF00]/40' : 'border-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            <div
                              className="aspect-square bg-zinc-900 bg-cover bg-center"
                              style={{ backgroundImage: `url(${t.image_url})` }}
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-[#CCFF00] text-black rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                            <div className="p-1.5 bg-[#0D0D0D]">
                              <div className="text-[9px] font-mono text-zinc-300 leading-tight line-clamp-2">{t.name}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// AMENITIES
// =====================================================================
function AmenityIconThumb({ icon, size = 'sm' }: { icon: AmenityIcon | null | undefined; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-10 h-10' : 'w-4 h-4';
  if (icon?.image_url) {
    return <img src={icon.image_url} alt={icon.name} className={`${dim} rounded object-cover shrink-0 bg-zinc-900`} />;
  }
  return (
    <div className={`${dim} rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0`}>
      <ImageIcon className={size === 'md' ? 'w-4 h-4 text-zinc-600' : 'w-2.5 h-2.5 text-zinc-600'} />
    </div>
  );
}

function AmenitiesTab({ gymId, showToast }: { gymId: string; showToast: (msg: string) => void }) {
  const [gymAmenities, setGymAmenities] = useState<GymAmenity[]>([]);
  const [catalog, setCatalog] = useState<Amenity[]>([]);
  const [icons, setIcons] = useState<AmenityIcon[]>([]);
  const [search, setSearch] = useState('');
  const [newAmenityName, setNewAmenityName] = useState('');
  const [newAmenityIconId, setNewAmenityIconId] = useState('');
  const [newIconName, setNewIconName] = useState('');
  const [uploadingIconId, setUploadingIconId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const [ga, cat, ic] = await Promise.all([
        listGymAmenities(gymId),
        listAmenityCatalog(search || undefined),
        listAmenityIcons(),
      ]);
      setGymAmenities(ga);
      setCatalog(cat);
      setIcons(ic);
    } catch (err) {
      console.error(err);
      showToast('Error loading amenities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const handleCreate = async () => {
    if (!newAmenityName.trim()) return;
    try {
      const amenity = await createAmenityCatalog(newAmenityName.trim(), newAmenityIconId || undefined);
      setCatalog((prev) => [...prev, amenity]);
      setNewAmenityName('');
      setNewAmenityIconId('');
      showToast(`Amenity "${amenity.name}" created`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error creating amenity');
    }
  };

  const handleAttach = async (amenity: Amenity) => {
    try {
      await attachGymAmenity(gymId, amenity.id);
      showToast(`Attached "${amenity.name}"`);
      load();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error attaching amenity');
    }
  };

  const handleDetach = async (ga: GymAmenity) => {
    try {
      await detachGymAmenity(gymId, ga.id);
      showToast(`Removed "${ga.amenity.name}"`);
      load();
    } catch (err) {
      console.error(err);
      showToast('Error removing amenity');
    }
  };

  const handleChangeAmenityIcon = async (amenity: Amenity, iconId: string) => {
    try {
      const updated = await updateAmenityCatalog(amenity.id, { icon_id: iconId || null });
      setCatalog((prev) => prev.map((a) => (a.id === amenity.id ? updated : a)));
      showToast(`Icon updated for "${amenity.name}"`);
      load();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error updating amenity icon');
    }
  };

  const handleCreateIcon = async () => {
    if (!newIconName.trim()) return;
    try {
      const icon = await createAmenityIcon(newIconName.trim());
      setIcons((prev) => [...prev, icon]);
      setNewIconName('');
      showToast(`Icon "${icon.name}" created — now upload its image`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error creating icon');
    }
  };

  const handleUploadIconPhoto = async (iconId: string, file: File) => {
    setUploadingIconId(iconId);
    try {
      const { url } = await uploadAmenityIconPhoto(iconId, file);
      setIcons((prev) => prev.map((i) => (i.id === iconId ? { ...i, image_url: url } : i)));
      showToast('Icon image updated');
      load();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error uploading icon image');
    } finally {
      setUploadingIconId(null);
    }
  };

  const attachedIds = new Set(gymAmenities.map((ga) => ga.amenity.id));

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Icon Library (shared across all amenities)
        </h3>
        {icons.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono py-1">No icons yet — add one below.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {icons.map((icon) => (
              <div key={icon.id} className="flex items-center gap-2 bg-[#0D0D0D] border border-zinc-800 rounded-lg p-2">
                <AmenityIconThumb icon={icon} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-mono truncate">{icon.name}</div>
                  <label className="text-[10px] font-mono text-zinc-500 hover:text-[#CCFF00] cursor-pointer">
                    {uploadingIconId === icon.id ? 'Uploading...' : icon.image_url ? 'Replace image' : 'Upload image'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      className="hidden"
                      disabled={uploadingIconId === icon.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadIconPhoto(icon.id, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input placeholder="New icon name" className={inputCls} value={newIconName} onChange={(e) => setNewIconName(e.target.value)} />
          <button type="button" onClick={handleCreateIcon} className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-[#CCFF00] hover:text-[#CCFF00] shrink-0">
            Add icon
          </button>
        </div>
      </div>

      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Attach Amenity (search-or-create)
        </h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search amenities (e.g. Boxing, Zumba, Steam Bath)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0D0D0D] border border-[#252525] focus:border-[#CCFF00] rounded-lg text-xs font-mono outline-none text-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-zinc-700">
            Search
          </button>
        </form>

        <div className="flex gap-2">
          <input placeholder="New amenity name" className={inputCls} value={newAmenityName} onChange={(e) => setNewAmenityName(e.target.value)} />
          <select
            value={newAmenityIconId}
            onChange={(e) => setNewAmenityIconId(e.target.value)}
            className="bg-[#0D0D0D] border border-zinc-800 focus:border-[#CCFF00] p-2.5 rounded-lg text-white outline-none text-xs font-mono shrink-0"
          >
            <option value="">No icon</option>
            {icons.map((icon) => (
              <option key={icon.id} value={icon.id}>{icon.name}</option>
            ))}
          </select>
          <button type="button" onClick={handleCreate} className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-[#CCFF00] hover:text-[#CCFF00] shrink-0">
            Add new
          </button>
        </div>

        {catalog.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {catalog.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-mono bg-[#0D0D0D] border border-zinc-800 text-zinc-300"
              >
                <AmenityIconThumb icon={a.icon} />
                <button
                  onClick={() => handleAttach(a)}
                  disabled={attachedIds.has(a.id)}
                  className="hover:text-[#CCFF00] disabled:opacity-30 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {a.name}
                </button>
                <select
                  value={a.icon?.id || ''}
                  onChange={(e) => handleChangeAmenityIcon(a, e.target.value)}
                  title="Change icon"
                  className="bg-transparent text-[10px] text-zinc-500 outline-none max-w-[70px]"
                >
                  <option value="">No icon</option>
                  {icons.map((icon) => (
                    <option key={icon.id} value={icon.id}>{icon.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          This Gym's Amenities ({gymAmenities.length})
        </h3>
        {isLoading ? (
          <p className="text-zinc-500 text-xs font-mono">Loading...</p>
        ) : gymAmenities.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono py-2">No amenities attached yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {gymAmenities.map((ga) => (
              <div key={ga.id} className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-mono bg-[#0D0D0D] border border-zinc-800 text-white">
                <AmenityIconThumb icon={ga.amenity.icon} />
                {ga.amenity.name}
                <button onClick={() => handleDetach(ga)} className="text-zinc-500 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// TRAINERS
// =====================================================================
function TrainersTab({ gymId, showToast }: { gymId: string; showToast: (msg: string) => void }) {
  const [affiliations, setAffiliations] = useState<GymTrainerAffiliation[]>([]);
  const [verifiedTrainers, setVerifiedTrainers] = useState<AdminTrainer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const [active, inactive, trainers] = await Promise.all([
        listGymTrainers(gymId, 'active'),
        listGymTrainers(gymId, 'inactive'),
        getAllTrainers(),
      ]);
      setAffiliations([...active, ...inactive]);
      setVerifiedTrainers(trainers.filter((t) => t.is_verified));
    } catch (err) {
      console.error(err);
      showToast('Error loading trainers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  const affiliatedIds = new Set(affiliations.map((a) => a.trainer.id));
  const candidates = verifiedTrainers.filter(
    (t) => !affiliatedIds.has(t.id) && (t.full_name || t.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAffiliate = async (trainerId: string, name: string) => {
    try {
      await affiliateGymTrainer(gymId, trainerId);
      showToast(`Affiliated "${name}" with this gym`);
      load();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error affiliating trainer');
    }
  };

  const handleToggleStatus = async (a: GymTrainerAffiliation) => {
    try {
      const next = a.status === 'active' ? 'inactive' : 'active';
      await setGymTrainerStatus(gymId, a.id, next);
      showToast(`"${a.trainer.full_name || 'Trainer'}" is now ${next}`);
      load();
    } catch (err) {
      console.error(err);
      showToast('Error updating trainer status');
    }
  };

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Affiliate a Verified Trainer
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search verified trainers by name/email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0D0D0D] border border-[#252525] focus:border-[#CCFF00] rounded-lg text-xs font-mono outline-none text-white"
          />
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {candidates.length === 0 ? (
            <p className="text-zinc-500 text-xs font-mono py-2">
              {search ? 'No matching verified trainers.' : 'No verified trainers available to affiliate.'}
            </p>
          ) : (
            candidates.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-[#0D0D0D] border border-zinc-800 rounded-lg p-3 text-xs font-mono">
                <div>
                  <div className="text-white font-semibold">{t.full_name || 'Unknown'}</div>
                  <div className="text-zinc-500 text-[10px]">{t.email}</div>
                </div>
                <button onClick={() => handleAffiliate(t.id, t.full_name || t.email || 'trainer')} className="px-2.5 py-1 rounded bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/20 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Affiliate
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Affiliated Trainers ({affiliations.length})
        </h3>
        {isLoading ? (
          <p className="text-zinc-500 text-xs font-mono">Loading...</p>
        ) : affiliations.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono py-2">No trainers affiliated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
              <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
                <tr>
                  <th className={th}>Trainer</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {affiliations.map((a) => (
                  <tr key={a.id} className="hover:bg-[#1A1A1A]">
                    <td className={`${td} text-white font-sans font-semibold`}>{a.trainer.full_name || a.trainer.id}</td>
                    <td className={td}>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${a.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className={`${td} text-right`}>
                      <button onClick={() => handleToggleStatus(a)} className="p-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] text-[#9A9A9A] hover:text-[#CCFF00]">
                        {a.status === 'active' ? 'Set Inactive' : 'Set Active'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// PLANS
// =====================================================================
function PlansTab({ gymId, showToast }: { gymId: string; showToast: (msg: string) => void }) {
  const [plans, setPlans] = useState<GymPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editorPlan, setEditorPlan] = useState<GymPlan | 'new' | null>(null);
  const [assignmentsPlan, setAssignmentsPlan] = useState<GymPlan | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await listGymPlans(gymId);
      setPlans(data);
    } catch (err) {
      console.error(err);
      showToast('Error loading gym plans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

  const handleToggleEnabled = async (plan: GymPlan) => {
    const enable = plan.is_enabled === false;
    if (
      !enable &&
      !window.confirm(
        `Disable "${plan.title}"? Members (assigned and gym-code members) stop seeing it and can't start its workouts. ` +
          'Nothing is deleted — enable it again any time to restore access.'
      )
    )
      return;
    setTogglingPlanId(plan.id);
    try {
      const updated = await setGymPlanEnabled(gymId, plan.id, enable);
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
      showToast(enable ? `"${plan.title}" enabled — visible to members again` : `"${plan.title}" disabled — hidden from members`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error updating plan');
    } finally {
      setTogglingPlanId(null);
    }
  };

  const handleDelete = async (plan: GymPlan) => {
    if (!window.confirm(`Delete plan "${plan.title}"? This removes its whole tree and any assignments.`)) return;
    try {
      await deleteGymPlan(gymId, plan.id);
      showToast(`Deleted "${plan.title}"`);
      load();
    } catch (err) {
      console.error(err);
      showToast('Error deleting plan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-mono tracking-wider text-white uppercase">Gym Plans ({plans.length})</h3>
        <button onClick={() => setEditorPlan('new')} className="py-2 px-4 bg-[#CCFF00] text-black font-display font-bold rounded-lg uppercase text-xs tracking-wider flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Plan
        </button>
      </div>

      <div className={card}>
        {isLoading ? (
          <p className="text-zinc-500 text-xs font-mono">Loading...</p>
        ) : plans.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono py-2">No plans built for this gym yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-[#9A9A9A]">
              <thead className="bg-[#0A0A0A] text-white border-b border-[#202020] uppercase font-bold text-[10px] tracking-widest">
                <tr>
                  <th className={th}>Title</th>
                  <th className={th}>Type</th>
                  <th className={th}>Weeks</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {plans.map((p) => (
                  <tr key={p.id} className={`hover:bg-[#1A1A1A] ${p.is_enabled === false ? 'opacity-60' : ''}`}>
                    <td className={`${td} text-white font-sans font-semibold`}>{p.title}</td>
                    <td className={td}>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${p.type === 'general' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                        {p.type === 'general' ? 'General' : 'User-specific'}
                      </span>
                    </td>
                    <td className={td}>{p.total_weeks ?? p.weeks.length}</td>
                    <td className={td}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={p.is_enabled !== false}
                        aria-label={`${p.is_enabled === false ? 'Enable' : 'Disable'} ${p.title}`}
                        onClick={() => handleToggleEnabled(p)}
                        disabled={togglingPlanId === p.id}
                        title={p.is_enabled === false ? 'Hidden from members — click to enable' : 'Visible to members — click to disable'}
                        className="flex items-center gap-2 disabled:opacity-50"
                      >
                        <span className={`relative w-8 h-[18px] rounded-full transition-colors ${p.is_enabled !== false ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                          <span
                            className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-black transition-all ${p.is_enabled !== false ? 'left-[16px]' : 'left-0.5'}`}
                          />
                        </span>
                        <span className={`text-[9px] font-bold uppercase ${p.is_enabled !== false ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {togglingPlanId === p.id ? '...' : p.is_enabled !== false ? 'Enabled' : 'Disabled'}
                        </span>
                      </button>
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex gap-2">
                        <button onClick={() => setAssignmentsPlan(p)} className="p-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] text-[#9A9A9A] hover:text-[#CCFF00] flex items-center gap-1.5">
                          <ListPlus className="w-3.5 h-3.5" /> Assignments
                        </button>
                        <button onClick={() => setEditorPlan(p)} className="p-1 px-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] text-[#9A9A9A] hover:text-[#CCFF00]">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p)} className="p-1 px-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editorPlan && (
        <GymPlanEditor
          gymId={gymId}
          plan={editorPlan === 'new' ? null : editorPlan}
          onClose={() => setEditorPlan(null)}
          onSaved={() => {
            setEditorPlan(null);
            load();
          }}
          showToast={showToast}
        />
      )}

      {assignmentsPlan && (
        <PlanAssignmentsModal gymId={gymId} plan={assignmentsPlan} onClose={() => setAssignmentsPlan(null)} showToast={showToast} />
      )}
    </div>
  );
}

function PlanAssignmentsModal({
  gymId,
  plan,
  onClose,
  showToast,
}: {
  gymId: string;
  plan: GymPlan;
  onClose: () => void;
  showToast: (msg: string) => void;
}) {
  const [assignments, setAssignments] = useState<GymPlanAssignment[]>([]);
  const [members, setMembers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const [a, m] = await Promise.all([listGymPlanAssignments(gymId, plan.id), getUsers(0, 100)]);
      setAssignments(a);
      setMembers(m.users);
    } catch (err) {
      console.error(err);
      showToast('Error loading assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignedIds = new Set(assignments.map((a) => a.user_id));
  const memberById = (id: string) => members.find((m) => m.id === id);

  const handleAssign = async (userId: string, name: string) => {
    try {
      await assignGymPlan(gymId, plan.id, userId);
      showToast(`Assigned "${plan.title}" to ${name}`);
      load();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error assigning plan');
    }
  };

  const handleUnassign = async (assignment: GymPlanAssignment) => {
    try {
      await unassignGymPlan(gymId, plan.id, assignment.id);
      showToast('Assignment removed');
      load();
    } catch (err) {
      console.error(err);
      showToast('Error removing assignment');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-[#141414] border-2 border-[#252525] rounded-xl p-6 sm:p-8 w-full max-w-lg relative max-h-[85vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-display font-bold text-lg text-white mb-1">Assignments — {plan.title}</h3>
        <p className="text-zinc-500 font-mono text-[10px] uppercase mb-6 tracking-wider">
          {plan.type === 'general' ? 'General plan — any number of members' : 'User-specific plan'}
        </p>

        <div className="mb-6">
          <UserPicker
            users={members}
            excludeIds={assignedIds}
            onPick={(m) => handleAssign(m.id, m.name)}
            actionLabel="Assign"
            placeholder="Search members by name/email to assign..."
          />
        </div>

        <h4 className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2 border-t border-zinc-900 pt-4">
          Current assignments ({assignments.length})
        </h4>
        {isLoading ? (
          <p className="text-zinc-500 text-xs font-mono">Loading...</p>
        ) : assignments.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono">No members assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => {
              const member = memberById(a.user_id);
              return (
                <div key={a.id} className="flex items-center justify-between bg-[#0D0D0D] border border-zinc-800 rounded-lg p-2.5 text-xs font-mono">
                  <div className="text-white">{member ? `${member.name} (${member.email})` : a.user_id}</div>
                  <button onClick={() => handleUnassign(a)} className="text-zinc-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// ADMINS
// =====================================================================
function generatePassword(length = 12): string {
  // No look-alike characters (0/O, 1/l/I) — managers often read these off a screen.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

const emptyManagerForm = { full_name: '', email: '', password: '', role: 'owner' as 'owner' | 'staff' };

function AdminsTab({ gymId, showToast }: { gymId: string; showToast: (msg: string) => void }) {
  const [admins, setAdmins] = useState<GymAdminRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<'owner' | 'staff'>('owner');

  const [managerForm, setManagerForm] = useState(emptyManagerForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  // Shown once after creation so the super admin can hand the credentials over.
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [credsCopied, setCredsCopied] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      setAdmins(await listGymAdmins(gymId));
    } catch (err) {
      console.error(err);
      showToast('Error loading gym admins');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (managerForm.password.length < 8) {
      setCreateError('Password must be at least 8 characters');
      return;
    }
    setIsCreating(true);
    try {
      const row = await createGymManagerAccount(gymId, {
        email: managerForm.email.trim(),
        password: managerForm.password,
        full_name: managerForm.full_name.trim() || null,
        role: managerForm.role,
      });
      setCreatedCredentials({ email: row.email || managerForm.email.trim().toLowerCase(), password: managerForm.password });
      setCredsCopied(false);
      setManagerForm(emptyManagerForm);
      setShowPassword(false);
      showToast('Manager account created');
      load();
    } catch (err: any) {
      console.error(err);
      // 409 = email already registered; 422 = validation. Keep the form filled so it can be fixed.
      setCreateError(err.message || 'Error creating manager account');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdCredentials) return;
    const text = `Gym manager login\nURL: ${window.location.origin}/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    if (await copyToClipboard(text)) setCredsCopied(true);
    else showToast('Could not copy — select the details and copy them manually');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;
    try {
      await addGymAdmin(gymId, { user_id: newUserId.trim(), role: newRole });
      showToast('Gym admin added');
      setNewUserId('');
      load();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error adding gym admin');
    }
  };

  const handleRemove = async (row: GymAdminRow) => {
    const who = row.full_name || row.email || 'this gym admin';
    if (!window.confirm(`Remove ${who} as an admin of this gym? Their login stays, but they lose access to this gym.`)) return;
    try {
      await removeGymAdmin(gymId, row.user_id);
      showToast('Gym admin removed');
      load();
    } catch (err) {
      console.error(err);
      showToast('Error removing gym admin');
    }
  };

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Create manager account
        </h3>
        <p className="text-zinc-500 text-[11px] leading-relaxed">
          Creates a new login for this gym's manager. They sign in at <span className="text-zinc-300 font-mono">/login</span>{' '}
          and see this gym's member code and member counts (read-only).
        </p>

        {createdCredentials && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 space-y-2">
            <div className="text-emerald-400 text-[11px] font-mono uppercase tracking-wider font-bold">
              Account created — share these details with the manager
            </div>
            <div className="font-mono text-xs text-white space-y-0.5 select-all">
              <div>
                <span className="text-zinc-500">Login: </span>
                {window.location.origin}/login
              </div>
              <div>
                <span className="text-zinc-500">Email: </span>
                {createdCredentials.email}
              </div>
              <div>
                <span className="text-zinc-500">Password: </span>
                {createdCredentials.password}
              </div>
            </div>
            <p className="text-zinc-500 text-[10px] font-mono">The password won't be shown again after you dismiss this.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-[#CCFF00] hover:text-[#CCFF00] flex items-center gap-1.5"
              >
                {credsCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {credsCopied ? 'Copied' : 'Copy details'}
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400 hover:border-zinc-600"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {createError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2.5 rounded-lg font-mono">{createError}</div>
        )}

        <form onSubmit={handleCreateAccount} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            placeholder="Full name"
            className={inputCls}
            value={managerForm.full_name}
            onChange={(e) => setManagerForm({ ...managerForm, full_name: e.target.value })}
            maxLength={120}
          />
          <input
            required
            type="email"
            autoComplete="off"
            placeholder="Email (their login ID)"
            className={inputCls}
            value={managerForm.email}
            onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                required
                minLength={8}
                maxLength={72}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Password (min 8 characters)"
                className={`${inputCls} pr-9`}
                value={managerForm.password}
                onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setManagerForm({ ...managerForm, password: generatePassword() });
                setShowPassword(true);
              }}
              className="px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 hover:border-[#CCFF00] hover:text-[#CCFF00] shrink-0"
            >
              Generate
            </button>
          </div>
          <select
            className={inputCls}
            value={managerForm.role}
            onChange={(e) => setManagerForm({ ...managerForm, role: e.target.value as 'owner' | 'staff' })}
          >
            <option value="owner">Owner</option>
            <option value="staff">Staff</option>
          </select>
          <button
            type="submit"
            disabled={isCreating}
            className="sm:col-span-2 py-2.5 bg-[#CCFF00] text-black font-display font-bold rounded-lg uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" /> {isCreating ? 'Creating...' : 'Create manager account'}
          </button>
        </form>
      </div>

      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Or link an existing account by User ID
        </h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input required placeholder="User ID" className={inputCls} value={newUserId} onChange={(e) => setNewUserId(e.target.value)} />
          <select className={`${inputCls} sm:w-40`} value={newRole} onChange={(e) => setNewRole(e.target.value as 'owner' | 'staff')}>
            <option value="owner">Owner</option>
            <option value="staff">Staff</option>
          </select>
          <button type="submit" className="py-2.5 px-4 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-[#CCFF00] hover:text-[#CCFF00] font-mono rounded-lg text-xs flex items-center justify-center gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Link
          </button>
        </form>
      </div>

      <div className={card}>
        <h3 className="text-sm font-mono tracking-wider text-white uppercase border-b border-zinc-900 pb-3">
          Gym Admins ({admins.length})
        </h3>
        {isLoading ? (
          <p className="text-zinc-500 text-xs font-mono">Loading...</p>
        ) : admins.length === 0 ? (
          <p className="text-zinc-500 text-xs font-mono py-2">No gym admins yet — the super admin manages this gym directly.</p>
        ) : (
          <div className="space-y-2">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-[#0D0D0D] border border-zinc-800 rounded-lg p-3 text-xs font-mono gap-3">
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate">{a.full_name || a.email || a.user_id}</div>
                  <div className="text-zinc-500 text-[10px] truncate">
                    <span className="uppercase">{a.role}</span>
                    {a.email && (a.full_name ? ` · ${a.email}` : '')}
                    {!a.email && a.full_name ? ` · ${a.user_id}` : ''}
                  </div>
                </div>
                <button onClick={() => handleRemove(a)} title="Remove gym admin" className="text-zinc-500 hover:text-red-400 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
